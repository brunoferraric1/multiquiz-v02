import type { ChatMessage, AIExtractionResult, QuizDraft, Question, Outcome } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'x-ai/grok-4.1-fast:free';
const EXTRACTION_MODEL =
  process.env.NEXT_PUBLIC_AI_EXTRACTION_MODEL || 'openai/gpt-4o-mini';
const PLACEHOLDER_KEYWORDS = ['string', 'texto', 'description', 'descricao', 'url', 'cta', 'imagem', 'image', 'link'];
const NULLISH_VALUES = new Set(['none', 'null', 'undefined', 'n/a', 'na']);
const INTERNAL_LEAK_PATTERNS = [
  /update_quiz/i,
  /set_cover_image/i,
  /set_outcome_image/i,
  /\btool[_ ]?call\b/i,
  /\bferramenta\s+(?:update_quiz|set_cover_image|set_outcome_image|leadgen)\b/i,
  /\bchamar a ferramenta\b/i,
  /\bleadgen\b/i,
  /\bcontexto do editor\b/i,
  /\bnota_privada\b/i,
  /\bo usuario pediu\b/i,
  /\bminha ultima resposta\b/i,
  /\bmelhor abordagem\b/i,
  /\bpreciso confirmar\b/i,
  /\bcontexto atual\b/i,
  /\bfluxo correto\b/i,
];

const stripInternalProcess = (text: string): string => {
  const lines = text.split('\n');
  const filtered = lines.filter((line) => {
    const normalized = line
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return !INTERNAL_LEAK_PATTERNS.some((pattern) => pattern.test(normalized));
  });
  return filtered.join('\n').trim();
};

/**
 * Sanitizes AI response to remove internal thoughts and repetitive loops
 */
function cleanAIResponse(text: string): string {
  if (!text) return '';

  // Remove <think>...</think> blocks (case insensitive, dotall)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Remove [NOTA_PRIVADA]...[/NOTA_PRIVADA] leakage
  cleaned = cleaned.replace(/\[NOTA_PRIVADA\][\s\S]*?\[\/NOTA_PRIVADA\]/gi, '').trim();

  // Remove any accidental code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '').trim();

  // Strip tool names, internal planning or implementation hints
  cleaned = stripInternalProcess(cleaned);

  // Detect and truncate repetitive loops
  // Split into lines
  const lines = cleaned.split('\n');
  const uniqueLines = new Set<string>();
  const outputLines: string[] = [];
  let repetitionCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      outputLines.push(line); // Preserve empty lines for formatting
      continue;
    }

    // specific check for the user confirmation loop bug
    if (trimmed.startsWith('O usuário confirmou') || trimmed.startsWith('User confirmed')) {
      if (uniqueLines.has(trimmed)) {
        continue; // Skip duplicates of confirmation status
      }
    }

    // General 3-peat check for exact line matches
    if (outputLines.length >= 2) {
      const last = outputLines[outputLines.length - 1].trim();
      const secondLast = outputLines[outputLines.length - 2].trim();
      if (trimmed === last && trimmed === secondLast) {
        continue; // Skip 3rd occurrence
      }
    }

    outputLines.push(line);
    uniqueLines.add(trimmed);
  }

  return outputLines.join('\n').trim();
}

/**
 * Generate a contextual fallback message based on what was actually changed
 */
function generateContextualResponse(
  extraction?: AIExtractionResult,
  coverPrompt?: string,
  outcomeImageRequests?: OutcomeImageRequest[]
): string {
  const changes: string[] = [];
  const suggestions: string[] = [];

  // Check for cover image change
  if (coverPrompt) {
    changes.push(`✅ Atualizei a capa do quiz com uma imagem de "${coverPrompt}"`);
  }

  // Check extraction changes
  if (extraction) {
    if (extraction.title) {
      changes.push(`✅ Título atualizado para: "${extraction.title}"`);
    }
    if (extraction.description) {
      changes.push(`✅ Descrição atualizada`);
    }
    if (extraction.ctaText) {
      changes.push(`✅ CTA atualizado para: "${extraction.ctaText}"`);
    }
    if (extraction.coverImageUrl) {
      changes.push(`✅ Imagem de capa atualizada`);
    }
    if (extraction.questions && extraction.questions.length > 0) {
      if (extraction.questions.length === 1) {
        changes.push(`✅ Pergunta adicionada/atualizada: "${extraction.questions[0].text}"`);
      } else {
        changes.push(`✅ ${extraction.questions.length} perguntas atualizadas`);
      }
    }
    if (extraction.outcomes && extraction.outcomes.length > 0) {
      if (extraction.outcomes.length === 1) {
        changes.push(`✅ Resultado atualizado: "${extraction.outcomes[0].title}"`);
      } else {
        changes.push(`✅ ${extraction.outcomes.length} resultados atualizados`);
      }
    }
  }

  if (!extraction?.outcomes || extraction.outcomes.length === 0) {
    suggestions.push('Quer ajustar mais algo ou já partimos para definir os resultados do quiz?');
  } else if (!extraction?.questions || extraction.questions.length === 0) {
    suggestions.push('Resultados prontos! Que tal agora definir as perguntas e opções?');
  } else {
    suggestions.push('O que mais você quer ajustar?');
  }

  if (outcomeImageRequests && outcomeImageRequests.length > 0) {
    const promptPreview =
      outcomeImageRequests[0].prompt.length > 60
        ? `${outcomeImageRequests[0].prompt.slice(0, 57)}...`
        : outcomeImageRequests[0].prompt;
    changes.push(`✅ Imagem para resultado solicitada (${promptPreview})`);
  }

  if (changes.length === 0) {
    return `Pronto! Fiz a alteração. ${suggestions[0]}`;
  }

  return `${changes.join('\n')}\n\n${suggestions[0]}`;
}

type OpenRouterMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const truncateForPrompt = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
};

const buildEditorContextSystemMessage = (currentQuiz: QuizDraft): string => {
  const outcomes = (currentQuiz.outcomes ?? []).filter(Boolean);
  const questions = (currentQuiz.questions ?? []).filter(Boolean);

  const title = truncateForPrompt(currentQuiz.title, 120) || 'não definido';
  const description = truncateForPrompt(currentQuiz.description, 200) || 'não definida';

  const outcomesLines =
    outcomes.length > 0
      ? outcomes
        .slice(0, 12)
        .map((outcome, index) => {
          const outcomeTitle = truncateForPrompt(outcome.title, 80) || `Resultado ${index + 1}`;
          return `- (${index + 1}) id=${outcome.id ?? 'sem-id'} | ${outcomeTitle}`;
        })
        .join('\n')
      : '- (nenhum resultado ainda)';

  const questionsLines =
    questions.length > 0
      ? questions
        .slice(0, 12)
        .map((question, index) => {
          const questionText = truncateForPrompt(question.text, 90) || `Pergunta ${index + 1}`;
          const optionsCount = Array.isArray(question.options) ? question.options.length : 0;
          return `- (${index + 1}) id=${question.id ?? 'sem-id'} | ${questionText} | opções=${optionsCount}`;
        })
        .join('\n')
      : '- (nenhuma pergunta ainda)';

  return `CONTEXTO DO EDITOR (NÃO MOSTRE AO USUÁRIO; isso é a fonte de verdade):
- Título: ${title}
- Descrição: ${description}
- Resultados existentes: ${outcomes.length}
${outcomesLines}
- Perguntas existentes: ${questions.length}
${questionsLines}

REGRAS DE CONSISTÊNCIA (CRÍTICO):
- Se já existem Resultados no contexto, NÃO proponha criar/definir Resultados novamente, a menos que o usuário peça explicitamente para mudar/criar.
- Se o usuário pedir para "adicionar opções" mantendo as perguntas, preserve as perguntas e apenas complete/crie as opções.
- Se NÃO existem Resultados (0) e o usuário pedir para criar perguntas/opções, NÃO crie Resultados automaticamente: explique que sugere definir os Resultados primeiro para poder linkar as opções; pergunte se ele quer que você sugira 3-5 Resultados agora (ou se ele já tem os Resultados em mente).`;
};

export type OutcomeImageRequest = {
  outcomeId: string;
  prompt: string;
};

const BASE_SYSTEM_PROMPT = `Você é um Arquiteto de Quizzes especializado em criar quizzes engajantes e personalizados.

IMPORTANTE: Sempre responda em português brasileiro de forma amigável, conversacional e CONCISA.
NUNCA mostre seu processo de pensamento, tags como <think> ou [NOTA_PRIVADA].
NUNCA repita a mesma frase múltiplas vezes na mesma resposta. Seja direto.

CHECKLIST ANTES DE ENVIAR:
- Se mencionar qualquer ferramenta (update_quiz, set_cover_image, set_outcome_image, leadGen) ou etapas internas, apague e reescreva em linguagem natural sem citar ferramentas.
- Não diga "preciso perguntar" ou "vou perguntar"; faça a pergunta direto, em 1 linha clara.

REGRA CRÍTICA - RESPEITE O ESTADO ATUAL DO EDITOR:
Quando existir contexto do quiz atual (título, resultados, perguntas), trate como fonte de verdade. NÃO redefina coisas já existentes a menos que o usuário peça explicitamente. Se o pedido for "adicione opções mantendo as perguntas", faça isso sem tentar replanejar resultados.

AO IDENTIFICAR O TEMA DO QUIZ (ex: "gatos", "marketing B2B", "viagens"), reaja com UMA frase curta antes das perguntas iniciais: reconheça positivamente o tema e faça um comentário leve (ex: "Adorei esse tema sobre gatos, sempre rende ótimas histórias!" ou "Legal focar em marketing B2B, dá pra gerar ótimos insights"). Use variação natural para não soar repetitivo e mantenha a reação breve.

ANTES DE SUGERIR TÍTULO/DESCRIÇÃO, GARANTA QUE SABE:
- Objetivo do quiz (ex: gerar leads, educar, entreter, segmentar)
- Audiência (ex: persona, nível de maturidade no tema, setor)
- Tom de voz desejado (ex: descontraído, técnico, inspirador)

REGRAS DE UX WRITING PARA CTAs (MUITO IMPORTANTE):
- CTAs devem ter NO MÁXIMO 2-4 palavras
- Use verbos de ação no imperativo ou primeira pessoa
- BOM: "Ver estilos", "Saiba mais", "Explorar", "Conhecer opções", "Ver catálogo", "Quero esse!"
- RUIM: "Quero saber mais sobre o Clássico & Elegante" (muito longo!)
- RUIM: "Clique aqui para conhecer mais sobre este estilo" (muito longo!)
- O CTA deve ser genérico e funcionar independente do título do resultado
- Exemplos por contexto:
  - Lead gen: "Ver mais", "Conhecer", "Explorar"
  - E-commerce: "Ver produtos", "Comprar agora", "Ver coleção"
  - Conteúdo: "Ler artigo", "Assistir vídeo", "Acessar guia"

Sempre proponha um texto para o CTA da introdução (botão que inicia o quiz). Inclua apenas \`ctaText\` no tool call.
Quando o usuário pedir para trocar a capa/imagem ou descrever a imagem desejada, use SEMPRE a ferramenta \`set_cover_image\` com o prompt exato nas palavras do usuário (respeite "sem rosto", "sem pessoas" se solicitado). Não peça confirmação extra.
IMPORTANTE: Se o usuário pedir "outra imagem", "imagem diferente", ou simplesmente "muda a imagem" sem especificar, CRIE um prompt NOVO e DIFERENTE do anterior, mantendo o tema do quiz mas variando os elementos visuais (ex: ângulo diferente, cenário diferente, objetos complementares). NUNCA repita o mesmo prompt anterior.
Quando já tiver objetivo + audiência + tom, inclua \`coverImagePrompt\` no tool call \`update_quiz\` somente se a capa ainda não existir ou se o usuário pedir explicitamente para trocar a imagem da capa.

Para as imagens dos Resultados (Outcomes), NÃO adicione nenhuma imagem proativamente. Espere o usuário pedir explicitamente que você sugira ou gere uma foto para um resultado específico (ex: "imagem para o resultado Final?" ou "pode sugerir uma foto para o resultado Romântico?"). Depois de receber a solicitação, confirme qual resultado ele quer ilustrar, pergunte quais elementos visuais imagina, e então use a ferramenta \`set_outcome_image\` com o \`outcomeId\` correto e um \`prompt\` de 5-10 palavras focado em objetos concretos que apareçam na foto. Evite termos abstratos (tema, conceito, estilo, quiz) e mantenha a atenção no que estaria literalmente dentro do quadro. Não chame essa ferramenta em nenhuma outra situação.

⚠️ REGRA CRÍTICA - NUNCA EXPONHA IMPLEMENTAÇÃO INTERNA:
NUNCA, EM HIPÓTESE ALGUMA, mostre ao usuário:
- Pensamentos internos como "Devo usar a ferramenta X" ou "O usuário quer Y então vou fazer Z"
- Nomes de ferramentas: update_quiz, set_cover_image, set_outcome_image, leadGen
- Sintaxe de código ou chamadas de API: default_api.update_quiz(...), leadGen={...}
- Raciocínio técnico: "Os campos devem ser name e phone", "O type será..."
- Estruturas de dados: {enabled: true, fields: [...]}

EXEMPLOS DO QUE NUNCA FAZER:
❌ "Devo usar a ferramenta update_quiz para configurar o leadGen"
❌ "A chamada será: default_api.update_quiz(leadGen={...})"
❌ "Os campos devem ser: name (obrigatório por padrão)"

EXEMPLOS CORRETOS:
✅ "Pronto! Configurei a captação de leads com os campos Nome e Telefone."
✅ "Feito! Agora o quiz vai pedir nome e telefone antes de mostrar o resultado."

Fale APENAS o resultado final de forma natural e conversacional.


REGRAS CRÍTICAS PARA coverImagePrompt:
- Use 5-10 palavras descrevendo OBJETOS VISUAIS CONCRETOS que aparecem na foto
- Pense: "O que literalmente estaria DENTRO desta foto?"
- BOM: "xícara café expresso grãos barista latte art mesa madeira"
- BOM: "convite casamento envelope lacre cera flores flat lay"
- RUIM: "tema café conceito ilustração estilo moderno" (muito abstrato)
- RUIM: "quiz casamento papelaria elegante" (meta-palavras)
- Evite: quiz, tema, conceito, ilustração, imagem, estilo, moderno, elegante
Se o usuário não forneceu esses pontos, faça as 2 perguntas abaixo em bullets ANTES de sugerir qualquer título/descrição:
- Qual é o objetivo principal do quiz?
- Quem é a audiência (perfil + nível de maturidade no tema)?
NÃO sugira título/descrição antes de receber objetivo e audiência.

SOBRE O TOOL CALL \`update_quiz\`:
- Só chame depois que o usuário confirmar explicitamente que gostou das sugestões ou pedir ajustes diretos ("troque X por Y") e você já tiver aplicado.
- Enquanto estiver apresentando perguntas, opções, resultados ou CTAs para validação, mantenha tudo APENAS na resposta textual: explique cada item, peça confirmação e NÃO envie o tool call.
- NUNCA inclua perguntas/opções/resultados no \`update_quiz\` se o usuário ainda estiver avaliando ou se você ainda não explicou as opções.
- Se o usuário disser que quer pensar ou revisar algo, aguarde a confirmação antes de atualizar a estrutura.

REGRA CRÍTICA - SEPARAÇÃO POR ETAPAS:
**ETAPA 1 (Introdução):** O tool call \`update_quiz\` pode incluir APENAS: title, description, ctaText, coverImagePrompt. NUNCA inclua outcomes, questions ou leadGen durante esta etapa.
**ETAPA 2 (Resultados):** Somente depois que o usuário confirmar título/descrição E pedir para definir resultados, você pode incluir outcomes no tool call. NUNCA inclua questions ou leadGen durante esta etapa.
**ETAPA 3 (Perguntas):** Somente depois que os resultados estiverem confirmados E o usuário pedir para criar perguntas, você pode incluir questions no tool call. NUNCA inclua leadGen durante esta etapa.
**ETAPA 4 (Captação de Leads):** Somente DEPOIS que as perguntas estiverem confirmadas E o usuário CONFIRMAR que quer coletar dados (leadGen), você pode incluir leadGen no tool call. SEMPRE pergunte antes de ativar.

SE VOCÊ INCLUIR outcomes, questions OU leadGen NO TOOL CALL ANTES DA ETAPA CORRETA, SERÁ CONSIDERADO UM ERRO GRAVE.

SE O USUÁRIO PEDIR PERGUNTAS/OPÇÕES MAS AINDA NÃO EXISTIREM RESULTADOS:
- NÃO crie Resultados automaticamente.
- Explique em 1-2 frases que você sugere definir Resultados primeiro para conseguir linkar as opções com cada Resultado.
- Pergunte se ele quer que você sugira 3-5 Resultados agora (ou se ele já tem os Resultados em mente).
Sugestão de texto (adapte ao tom, conciso):
"Pra eu criar perguntas com opções bem amarradas, sugiro a gente definir primeiro os Resultados do quiz (3-5). Quer que eu te proponha algumas opções de Resultados agora?"

FORMATAÇÃO É CRÍTICA! Siga estes exemplos EXATAMENTE:

EXEMPLO CORRETO DE FORMATAÇÃO (copie este estilo):
━━━━━━━━━━━━━━━━━━━━━━
Ótimo! Vamos às perguntas.

**Pergunta 1:** Qual estilo de casamento você imagina?

Opções:

- Clássico → Clássico e Elegante
- Romântico → Romântico Floral
- Moderno → Moderno Minimalista

Confirma ou ajusta?
━━━━━━━━━━━━━━━━━━━━━━

EXEMPLO INCORRETO (NUNCA faça assim):
━━━━━━━━━━━━━━━━━━━━━━
Ótimo! Vamos às perguntas. **Pergunta 1:** Qual estilo de casamento você imagina? Opções: Clássico → Clássico e Elegante, Romântico → Romântico Floral
━━━━━━━━━━━━━━━━━━━━━━

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:

1. Sempre deixe UMA linha em branco entre parágrafos
2. Sempre deixe UMA linha em branco ANTES de uma lista de bullets
3. Sempre deixe UMA linha em branco DEPOIS de uma lista de bullets
4. NUNCA coloque texto corrido - sempre separe em blocos
5. Use bullets (-) para todas as listas
6. Cada item da lista em sua própria linha
7. Títulos e descrições sempre devem estar em bullets, nunca em parágrafos ou aspas soltas
8. NUNCA exponha pensamentos internos como "preciso perguntar ao usuário", "vou verificar", "devo fazer X" - fale diretamente com o usuário

REGRAS PARA "PRÓXIMO PASSO" (MUITO IMPORTANTE):
- SOMENTE mostre "Próximo passo:" quando uma ETAPA COMPLETA for finalizada
- Durante ajustes dentro de uma etapa (ex: trocar imagem, ajustar título), NÃO mostre "Próximo passo"
- Quando mostrar, siga SEMPRE a ordem fixa: Intro → Resultados → Perguntas
- NUNCA ofereça pular etapas (ex: não ofereça "Perguntas" se ainda não definiu Resultados)

QUANDO USAR "PRÓXIMO PASSO":
- Após confirmar título + descrição + CTA → "Próximo passo: Vamos definir os resultados (3-5 opções)?" 
- Após confirmar todos os resultados → "Próximo passo: Vamos criar as perguntas (5-8)?"  
- Durante ajustes internos (trocar imagem, editar texto) → NÃO mostrar, apenas confirmar a ação

Template para perguntas (SIGA EXATAMENTE):

**Pergunta X:** [texto da pergunta]

Opções:

- [opção 1] → [resultado]
- [opção 2] → [resultado]
- [opção 3] → [resultado]

O que você acha?

Template para resultados (SIGA EXATAMENTE):

Títulos dos resultados:

- [Título 1] → [descrição curta]
- [Título 2] → [descrição curta]
- [Título 3] → [descrição curta]

O que você acha?

EXEMPLO DE RESPOSTA APÓS CONFIRMAÇÃO DA INTRODUÇÃO:
━━━━━━━━━━━━━━━━━━━━━━
Perfeito! Título, descrição e CTA confirmados.

Próximo passo:

- Vamos definir os resultados do quiz (recomendo 3-5 opções diferentes)?
━━━━━━━━━━━━━━━━━━━━━━

EXEMPLO DE RESPOSTA DURANTE AJUSTE (SEM PRÓXIMO PASSO):
━━━━━━━━━━━━━━━━━━━━━━
Sem problemas! Vamos trocar essa imagem.

Me diz: o que você imagina para a capa? Algo com flores, convites, um estilo mais minimalista?
━━━━━━━━━━━━━━━━━━━━━━

EXEMPLO DE PRIMEIRA PERGUNTA (SE FALTAR CONTEXTO):
━━━━━━━━━━━━━━━━━━━━━━
Bora criar um quiz incrível!

Preciso de dois pontos rápidos:

- Objetivo do quiz (ex: gerar leads, educar, entreter)
- Quem é a audiência (perfil + nível de maturidade no tema)?

Me conta que já sugiro título e descrição formatados.
━━━━━━━━━━━━━━━━━━━━━━

FLUXO DE CRIAÇÃO DO QUIZ (siga esta ordem):

**ETAPA 1 - Tema e Conceito:**
- Pergunte sobre o tema do quiz
- Sugira um título atrativo baseado no tema
- Crie uma descrição curta (1-2 frases)
- Peça confirmação do usuário antes de avançar

**ETAPA 2 - Resultados/Outcomes:**
- Explique que agora vão definir os possíveis resultados do quiz
- Pergunte quantos resultados diferentes o usuário quer (sugira 3-5)
- Sugira ideias para os títulos e descrições dos resultados
- ESPERE a confirmação do usuário antes de avançar
- Ajuste os títulos/descrições caso o usuário faça outras sugestões
- ANTES DE IR PARA PERGUNTAS: Pergunte se o usuário quer adicionar CTA (botão de ação) e URL para cada resultado
- Exemplo: "Cada resultado pode ter um botão com link. Você já tem URLs para direcionar quem receber cada resultado? Se não tiver, podemos pular."
- O CTA/URL é OPCIONAL, mas SEMPRE pergunte antes de prosseguir para as perguntas

**ETAPA 3 - Perguntas:**
- Explique que agora vão criar as perguntas
- Pergunte quantas perguntas o usuário quer (sugira 5-8)
- Sugira as perguntas UMA ou DUAS por vez
- Para cada pergunta, sugira as opções de resposta. IMPORTANTE: randomize a ordem das opções (não mapeie sempre a 1ª opção para o 1º resultado).
- SEMPRE espere aprovação antes de continuar

**ETAPA 4 - Captação de Leads (SEMPRE pergunte antes de finalizar):**
- Após confirmar todas as perguntas, pergunte se o usuário quer coletar dados antes de mostrar o resultado
- Exemplo: "Quer coletar informações dos participantes (como nome e email) antes de exibir o resultado?"
- Se sim: pergunte quais campos quer coletar (nome, email, telefone)
- QUANDO O USUÁRIO CONFIRMAR: FAÇA O TOOL CALL com leadGen para aplicar as configurações!
  - Inclua no update_quiz: leadGen: { enabled: true, title: "Quase lá!", description: "Deixe seus dados para ver seu resultado", fields: ["name", "email", "phone"] }
  - Use apenas os campos que o usuário pediu
- IMPORTANTE: Ao configurar leadGen, NÃO faça resumo do quiz inteiro. Apenas confirme: "Pronto! Captação de leads ativada com os campos X e Y."
- Se não quiser captação: tudo bem, pule para finalização
- É OPCIONAL mas SEMPRE pergunte

ORDEM OBRIGATÓRIA DO FLUXO:
1. Introdução (título, descrição, CTA)
2. Resultados (títulos, descrições, CTAs opcionais)
3. Perguntas (texto, opções)
4. Captação de Leads (opcional)
5. Finalização


ESTILO DE CONVERSA:
- Respostas CURTAS (máximo 2-3 parágrafos curtos)
- UMA pergunta ou ação por vez
- SEMPRE bem formatado com quebras de linha
- Sugestões (título, descrição, CTAs, opções) sempre em bullets
- NUNCA exponha raciocínio interno (ex: "preciso verificar", "vou perguntar", "devo fazer")

CONFIRMAÇÕES:

**Execute direto SEM pedir confirmação:**
- Comandos diretos: "troque X para Y", "mude X", "remova Z"
- Ajustes específicos do usuário

**Peça confirmação:**
- Ao sugerir novas ideias
- Antes de criar elementos novos

REGRAS GERAIS:
- NUNCA crie tudo de uma vez
- Mantenha conversação passo a passo
- Seja criativo mas SEMPRE bem formatado

Formato do Quiz:
- **Perguntas**: Cada pergunta tem múltiplas opções de resposta
- **Opções**: Cada opção aponta para um resultado específico (outcome)
- **Resultados (Outcomes)**: Diferentes finais baseados nas respostas do usuário
- **Variação**: A ordem das opções deve ser aleatória em relação aos resultados. Nunca siga um padrão óbvio (ex: Opção 1 -> Resultado A).`;

const buildSystemPrompt = (userName?: string) => {
  const trimmedName = userName?.trim();
  const nameGuideline = trimmedName
    ? `O usuário logado se chama ${trimmedName}. SUA PRIMEIRA resposta deve começar cumprimentando ${trimmedName} pelo nome; depois disso, volte a mencionar o nome apenas quando fizer sentido (aprox. a cada 3 ou 4 respostas) para manter o tom natural.`
    : 'Assim que descobrir o nome do usuário logado, cumprimente-o pelo nome logo na primeira resposta e depois repita com parcimônia (aprox. a cada 3 ou 4 respostas).';

  return `${nameGuideline}\n\n${BASE_SYSTEM_PROMPT}`;
};

export class AIService {
  private conversationHistory: OpenRouterMessage[] = [];
  private systemPrompt: string;

  constructor(options?: { userName?: string }) {
    this.systemPrompt = buildSystemPrompt(options?.userName);
    this.conversationHistory = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];
  }

  /**
   * Send a message and ask the model to also emit a structured quiz delta via tool call.
   * Returns both the assistant text and any extracted quiz structure (same shape as extractQuizStructure).
   */
  async sendMessageWithExtraction(
    message: string,
    currentQuiz?: QuizDraft
  ): Promise<{
    text: string;
    extraction?: AIExtractionResult;
    coverPrompt?: string;
    outcomeImageRequests?: OutcomeImageRequest[];
  }> {
    this.conversationHistory.push({
      role: 'user',
      content: message,
    });

    const tools = [
      {
        type: 'function',
        function: {
          name: 'update_quiz',
          description:
            'Extraia a estrutura confirmada do quiz (título, descrição, resultados e perguntas) em português. Só inclua itens confirmados ou claramente aceitos.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Título do quiz' },
              description: { type: 'string', description: 'Descrição do quiz' },
              coverImageUrl: { type: 'string', description: 'URL opcional da capa' },
              coverImagePrompt: {
                type: 'string',
                description:
                  'Descrição visual concreta para buscar foto de capa (5-10 palavras). Foque em OBJETOS VISUAIS que aparecem na foto (ex: "xícara de café grãos espresso barista"), NÃO em conceitos abstratos. Pode usar português ou inglês.',
              },
              ctaText: { type: 'string', description: 'Texto do CTA principal do quiz' },
              ctaUrl: { type: 'string', description: 'URL do CTA principal do quiz' },
              questions: {
                type: 'array',
                description: 'Perguntas confirmadas. Preserve ordem.',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'UUID da pergunta (use existente se fornecido)' },
                    text: { type: 'string' },
                    imageUrl: { type: 'string' },
                    options: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: 'UUID da opção (use existente se fornecido)' },
                          text: { type: 'string' },
                          targetOutcomeId: {
                            type: 'string',
                            description: 'UUID do resultado destino. Use existentes quando possível.',
                          },
                        },
                        required: ['text', 'targetOutcomeId'],
                      },
                    },
                  },
                  required: ['text', 'options'],
                },
              },
              outcomes: {
                type: 'array',
                description: 'Resultados confirmados. Preserve IDs existentes.',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'UUID do resultado (use existente se fornecido)' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    imageUrl: { type: 'string' },
                    imagePrompt: {
                      type: 'string',
                      description:
                        'Descrição visual para buscar foto no Unsplash (5-10 palavras). Use APENAS se quiser sugerir uma imagem automática.',
                    },
                    ctaText: { type: 'string' },
                    ctaUrl: { type: 'string' },
                  },
                  required: ['title'],
                },
              },
              leadGen: {
                type: 'object',
                description: 'Configuração de captação de leads. Use para coletar dados antes do resultado.',
                properties: {
                  enabled: { type: 'boolean', description: 'Ativar captação de leads' },
                  title: { type: 'string', description: 'Título do formulário (ex: "Quase lá!")' },
                  description: { type: 'string', description: 'Subtítulo/descrição do formulário (ex: "Deixe seus dados para ver o resultado")' },
                  fields: {
                    type: 'array',
                    description: 'Lista de campos a coletar: "name", "email", "phone". Exemplo: ["name", "email", "phone"]',
                    items: {
                      type: 'string',
                      enum: ['name', 'email', 'phone'],
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'set_cover_image',
          description:
            'Quando o usuário pedir para trocar a capa, forneça uma descrição VISUAL CONCRETA para buscar a foto. Sempre respeite restrições como "sem rosto" ou "sem pessoas".',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description:
                  'Descrição visual concreta (5-12 palavras) focando em OBJETOS que aparecem na foto. Ex: para quiz de café use "xícara de café expresso grãos barista latte art", NÃO "tema café conceito ilustração".',
              },
            },
            required: ['prompt'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'set_outcome_image',
          description:
            'Quando o usuário pedir uma imagem para um resultado específico, forneça uma descrição visual concreta para buscar essa foto.',
          parameters: {
            type: 'object',
            properties: {
              outcomeId: {
                type: 'string',
                description: 'UUID do resultado que deve receber a imagem.',
              },
              prompt: {
                type: 'string',
                description:
                  'Descrição visual concreta (5-12 palavras) focando em OBJETOS visuais que apareceriam na foto desse resultado. Evite abstrações.',
              },
            },
            required: ['outcomeId', 'prompt'],
          },
        },
      },
    ];

    try {
      const editorContext = currentQuiz ? buildEditorContextSystemMessage(currentQuiz) : '';
      const baseMessages = [...this.conversationHistory];
      if (editorContext) {
        // Insert right before the latest user message so the assistant treats the sidebar state as ground truth.
        const insertionIndex = Math.max(1, baseMessages.length - 1);
        baseMessages.splice(insertionIndex, 0, {
          role: 'system',
          content: editorContext,
        });
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'MultiQuiz v2',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: baseMessages,
          tools,
          tool_choice: 'auto',
          max_tokens: 1100,
          temperature: 0.45,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message || {};
      const assistantMessage = (choice.content || '').trim();

      let extraction: AIExtractionResult | undefined;
      let coverPromptFromTool: string | undefined;
      const outcomeImageRequests: OutcomeImageRequest[] = [];
      const toolCalls = choice.tool_calls ?? [];

      for (const call of toolCalls) {
        const toolName = call.function?.name;
        const rawArgs = call.function?.arguments;
        if (!toolName || !rawArgs) continue;

        try {
          const parsed = JSON.parse(rawArgs);
          if (toolName === 'update_quiz') {
            extraction = this.normalizeExtraction(parsed, currentQuiz || {});
            console.log('Tool extraction parsed:', extraction);
          } else if (toolName === 'set_cover_image') {
            coverPromptFromTool = typeof parsed.prompt === 'string' ? parsed.prompt : undefined;
            console.log('Cover prompt from tool:', coverPromptFromTool);
          } else if (toolName === 'set_outcome_image') {
            const outcomeId = typeof parsed.outcomeId === 'string' ? parsed.outcomeId : undefined;
            const prompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : undefined;
            if (outcomeId && prompt) {
              outcomeImageRequests.push({ outcomeId, prompt });
              console.log('Outcome image request parsed:', outcomeId, prompt);
            }
          }
        } catch (err) {
          console.error('Failed to parse tool_call arguments', err, rawArgs);
        }
      }

      const contextualResponse = (extraction || coverPromptFromTool || outcomeImageRequests.length)
        ? generateContextualResponse(extraction, coverPromptFromTool, outcomeImageRequests)
        : '';

      // Generate contextual response if model didn't provide text but took action
      let finalMessage = assistantMessage || contextualResponse;

      // Sanitize response to prevent repetition bugs
      finalMessage = cleanAIResponse(finalMessage);

      // Fallback in case sanitization removed everything
      if (!finalMessage) {
        finalMessage =
          cleanAIResponse(contextualResponse) ||
          'Tudo certo por aqui! Me diz qual o próximo ajuste que você quer fazer no quiz.';
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: finalMessage,
      });

      return {
        text: finalMessage,
        extraction,
        coverPrompt: coverPromptFromTool,
        outcomeImageRequests: outcomeImageRequests.length
          ? outcomeImageRequests
          : undefined,
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Falha ao comunicar com o assistente de IA');
    }
  }

  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(message: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: message,
    });

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'MultiQuiz v2',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: this.conversationHistory,
          max_tokens: 1100,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';
      const cleanedMessage =
        cleanAIResponse(assistantMessage) ||
        'Tudo certo por aqui! O que você quer ajustar no quiz agora?';

      this.conversationHistory.push({
        role: 'assistant',
        content: cleanedMessage,
      });

      return cleanedMessage;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Falha ao comunicar com o assistente de IA');
    }
  }

  /**
   * Extract quiz structure from conversation history
   * Uses a separate API call with structured extraction prompt
   */
  async extractQuizStructure(
    conversationHistory: ChatMessage[],
    currentQuiz: QuizDraft
  ): Promise<AIExtractionResult> {
    const extractionPrompt = this.buildExtractionPrompt(conversationHistory, currentQuiz);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'MultiQuiz v2 - Extraction',
        },
        body: JSON.stringify({
          model: EXTRACTION_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a quiz structure extractor. Extract quiz information from Portuguese conversations and return ONLY valid JSON.

Your response must be a valid JSON object with this structure:
{
  "title": "string (optional)",
  "description": "string (optional)",
  "coverImageUrl": "string (optional)",
  "coverImagePrompt": "string (optional)",
  "ctaText": "string (optional)",
  "ctaUrl": "string (optional)",
  "questions": [
    {
      "id": "uuid",
      "text": "string",
      "imageUrl": "string (optional)",
      "options": [
        {
          "id": "uuid",
          "text": "string",
          "targetOutcomeId": "uuid"
        }
      ]
    }
  ],
  "outcomes": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string (can be empty)",
      "imageUrl": "string (optional)",
      "ctaText": "string (optional)",
      "ctaUrl": "string (optional)"
    }
  ],
  "leadGen": {
    "enabled": "boolean (optional)",
    "title": "string (optional)",
    "description": "string (optional)",
    "fields": ["name", "email", "phone"] (array of strings, optional)
  }
}

EXAMPLE - If conversation mentions:
"Ideias de títulos:
- Expresso Audacioso
- Cappuccino Aconchegante"

Extract as:
{
  "outcomes": [
    {"id": "uuid1", "title": "Expresso Audacioso", "description": ""},
    {"id": "uuid2", "title": "Cappuccino Aconchegante", "description": ""}
  ]
}

EXAMPLE - If conversation mentions lead capture:
"Quero coletar nome, email e telefone antes de mostrar o resultado"

Extract as:
{
  "leadGen": {
    "enabled": true,
    "title": "Quase lá!",
    "description": "Deixe seus dados para ver o resultado",
    "fields": ["name", "email", "phone"]
  }
}

IMPORTANT:
- Return ONLY the JSON object, no explanations or markdown
- Use UUIDs for all IDs (generate them if needed)
- Preserve existing IDs when updating
- If no changes detected, return empty object: {}
- For outcomes without descriptions, use empty string ""
- For leadGen fields, use simple string array: ["name", "email", "phone"]
- Look carefully for outcome titles in quotes, bullets, or numbered lists`,
            },
            {
              role: 'user',
              content: extractionPrompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Extraction API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawContent = data.choices[0]?.message?.content || '{}';

      // Clean up markdown code blocks if present
      const jsonContent = rawContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      console.log('Extraction raw response:', rawContent);

      // Handle empty or invalid responses
      if (!jsonContent || jsonContent.trim().length < 2) {
        console.warn('Extraction returned empty or too short response');
        return {};
      }

      let extracted: any;
      try {
        extracted = JSON.parse(jsonContent);
      } catch (parseError) {
        console.warn('Primary extraction parse failed, attempting repair...', parseError);
        console.log('Original content to repair:', jsonContent);
        let repairedContent = repairJsonString(jsonContent);
        console.log('After initial repair:', repairedContent);
        let parsedSuccessfully = false;

        for (let attempt = 0; attempt < 5 && !parsedSuccessfully; attempt += 1) {
          try {
            extracted = JSON.parse(repairedContent);
            parsedSuccessfully = true;
          } catch (retryError) {
            console.log(`Repair attempt ${attempt + 1} failed, trying adjustments...`);

            // Try inserting comma from error position
            const adjusted = insertCommaFromError(repairedContent, retryError);
            if (adjusted && adjusted !== repairedContent) {
              repairedContent = adjusted;
              console.log('After comma insertion:', repairedContent);
              continue;
            }

            // Try running repair again (catches issues repair might have missed)
            const reRepaired = repairJsonString(repairedContent);
            if (reRepaired !== repairedContent) {
              repairedContent = reRepaired;
              console.log('After re-repair:', repairedContent);
              continue;
            }

            // Last resort: try to extract a valid JSON subset
            const lastValidJson = extractValidJsonSubset(repairedContent);
            if (lastValidJson && lastValidJson !== repairedContent) {
              repairedContent = lastValidJson;
              console.log('After extracting valid subset:', repairedContent);
              continue;
            }

            throw retryError;
          }
        }

        if (!parsedSuccessfully) {
          console.error('All repair attempts failed, returning empty result');
          return {};
        }
      }
      console.log('Extraction parsed JSON:', extracted);

      const normalized = this.normalizeExtraction(extracted, currentQuiz);
      console.log('Extraction normalized result:', normalized);

      return normalized;
    } catch (error) {
      console.error('Extraction Error:', error);
      return {}; // Return empty object on error
    }
  }

  /**
   * Build extraction prompt from conversation and current quiz state
   */
  private buildExtractionPrompt(
    conversationHistory: ChatMessage[],
    currentQuiz: QuizDraft
  ): string {
    const recentMessages = conversationHistory.slice(-6); // Keep context small for faster parsing
    const conversationText = recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `Extract ONLY THE CHANGES from this Portuguese conversation about a quiz.

CRITICAL: Return ONLY fields that were ADDED or MODIFIED in the conversation. Do NOT return unchanged data.

CURRENT QUIZ STATE (for reference - DO NOT repeat unchanged data):
- Title: ${currentQuiz.title || 'not set'}
- Description: ${currentQuiz.description || 'not set'}  
- Questions: ${currentQuiz.questions?.length || 0} existing
- Outcomes: ${currentQuiz.outcomes?.length || 0} existing

CONVERSATION:
${conversationText}

EXTRACTION RULES:
1. ONLY extract what was CHANGED or ADDED in this conversation
2. If user updated outcomes descriptions → return ONLY the outcomes array with updates
3. If user confirmed a new question → return ONLY that question in questions array
4. If nothing changed → return empty object {}
5. NEVER return the full quiz - only the delta/changes

WHEN EXTRACTING:
- Outcomes: Include id (use existing if updating), title, description, ctaText, ctaUrl
- Questions: Include id, text, options array (each option needs id, text, targetOutcomeId)
- Use existing IDs when updating, generate new UUIDs only for NEW items

EXISTING IDs (use these when updating existing items):
- Outcome IDs: ${JSON.stringify(currentQuiz.outcomes?.map((o) => ({ id: o.id, title: o.title })) || [])}
- Question IDs: ${JSON.stringify(currentQuiz.questions?.map((q) => ({ id: q.id, text: q.text?.slice(0, 30) })) || [])}

CRITICAL IMAGE RULE:
- NEVER invent, guess, or create placeholder URLs (like example.com, placeholder.com).
- ONLY include "imageUrl" if the user explicitly provided a real link in the chat.
- If you want to suggest an image for a Result/Outcome, use the "imagePrompt" field with a visual description (5-10 words) of what the image should look like.
- If no image URL was provided by the user, leave "imageUrl" empty and provide "imagePrompt" instead.

Return minimal JSON with ONLY the changes.`;
  }

  /**
   * Normalize extraction result to ensure UUIDs and consistency
   */
  private normalizeExtraction(
    extracted: any,
    currentQuiz: QuizDraft
  ): AIExtractionResult {
    const result: AIExtractionResult = {};

    const sanitizedTitle = this.sanitizeOptionalString(extracted.title);
    if (sanitizedTitle && sanitizedTitle !== currentQuiz.title) {
      result.title = sanitizedTitle;
    }

    const sanitizedDescription = this.sanitizeOptionalString(extracted.description);
    if (sanitizedDescription && sanitizedDescription !== currentQuiz.description) {
      result.description = sanitizedDescription;
    }

    const sanitizedCoverUrl = this.sanitizeOptionalString(extracted.coverImageUrl);
    if (sanitizedCoverUrl && sanitizedCoverUrl !== currentQuiz.coverImageUrl) {
      result.coverImageUrl = sanitizedCoverUrl;
    }

    const sanitizedCoverPrompt = this.sanitizeOptionalString(extracted.coverImagePrompt);
    if (sanitizedCoverPrompt) {
      result.coverImagePrompt = sanitizedCoverPrompt;
    }

    const sanitizedCtaText = this.sanitizeOptionalString(extracted.ctaText);
    if (sanitizedCtaText && sanitizedCtaText !== currentQuiz.ctaText) {
      result.ctaText = sanitizedCtaText;
    }

    const sanitizedCtaUrl = this.sanitizeOptionalString(extracted.ctaUrl);
    if (sanitizedCtaUrl && sanitizedCtaUrl !== currentQuiz.ctaUrl) {
      result.ctaUrl = sanitizedCtaUrl;
    }

    // Normalize questions
    if (Array.isArray(extracted.questions)) {
      const normalizedQuestions = extracted.questions
        .map((q: any, idx: number): Partial<Question> => {
          const existingQuestion = currentQuiz.questions?.[idx];
          return {
            id: q.id || existingQuestion?.id || crypto.randomUUID(),
            text: q.text,
            imageUrl: this.sanitizeOptionalString(q.imageUrl),
            options: (q.options || []).map((opt: any, optIdx: number) => {
              const existingOption = existingQuestion?.options?.[optIdx];
              return {
                id: opt.id || existingOption?.id || crypto.randomUUID(),
                text: opt.text,
                targetOutcomeId: opt.targetOutcomeId,
              };
            }),
          };
        })
        .filter((question: Partial<Question>): question is Partial<Question> => Boolean(question?.text));

      if (
        normalizedQuestions.length > 0 &&
        JSON.stringify(normalizedQuestions) !== JSON.stringify(currentQuiz.questions || [])
      ) {
        result.questions = normalizedQuestions;
      }
    }

    // Normalize outcomes
    if (Array.isArray(extracted.outcomes) && extracted.outcomes.length > 0) {
      const normalizedOutcomes = extracted.outcomes
        .map((o: any, idx: number): Partial<Outcome> => {
          const existingOutcome = currentQuiz.outcomes?.[idx];
          return {
            id: o.id || existingOutcome?.id || crypto.randomUUID(),
            title: o.title || 'Resultado sem título',
            // Use undefined instead of '' to preserve existing description during merge
            description: o.description || undefined,
            imageUrl: this.sanitizeOptionalString(o.imageUrl),
            // @ts-ignore - imagePrompt is transient but allowed by our updated AIExtractionResult type
            imagePrompt: this.sanitizeOptionalString(o.imagePrompt),
            ctaText: this.sanitizeOptionalString(o.ctaText),
            ctaUrl: this.sanitizeOptionalString(o.ctaUrl),
          };
        })
        .filter((outcome: Partial<Outcome>): outcome is Partial<Outcome> => Boolean(outcome?.title));

      if (
        normalizedOutcomes.length > 0 &&
        JSON.stringify(normalizedOutcomes) !== JSON.stringify(currentQuiz.outcomes || [])
      ) {
        result.outcomes = normalizedOutcomes;
      }
    }

    // Normalize leadGen
    if (extracted.leadGen && typeof extracted.leadGen === 'object') {
      const leadGen = extracted.leadGen;
      // Extract field types from either array of objects or array of strings
      let fields: ('name' | 'email' | 'phone')[] = [];
      if (Array.isArray(leadGen.fields)) {
        fields = leadGen.fields
          .map((f: any) => {
            // Support both { type: 'name' } and 'name' formats
            const fieldType = typeof f === 'string' ? f : f?.type;
            if (fieldType === 'name' || fieldType === 'email' || fieldType === 'phone') {
              return fieldType;
            }
            return null;
          })
          .filter((f: string | null): f is 'name' | 'email' | 'phone' => f !== null);
      }

      result.leadGen = {
        enabled: leadGen.enabled === true,
        title: leadGen.title || 'Quase lá!',
        description: leadGen.subtitle || leadGen.description || 'Deixe seus dados para ver o resultado',
        fields,
        ctaText: leadGen.ctaText || 'Ver meu resultado',
      };
      console.log('[AI] LeadGen extracted:', result.leadGen);
    }

    return result;
  }

  private sanitizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // Only allow real URLs (http/https) or data URLs used for local previews
    if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) {
      return trimmed;
    }

    const normalized = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (NULLISH_VALUES.has(normalized)) return undefined;

    const containsOptional = normalized.includes('optional') || normalized.includes('opcional');
    const containsPlaceholderKeyword = PLACEHOLDER_KEYWORDS.some((keyword) => normalized.includes(keyword));

    // Blocklist for known fake/placeholder domains often hallucinated by LLMs
    const isFakeDomain =
      normalized.includes('example.com') ||
      normalized.includes('mysite.com') ||
      normalized.includes('placeholder.com') ||
      normalized.includes('yourdomain.com') ||
      normalized.includes('image.com');

    if (
      (containsOptional && containsPlaceholderKeyword) ||
      (containsPlaceholderKeyword && normalized.length <= 6) ||
      isFakeDomain
    ) {
      return undefined;
    }

    return trimmed;
  }

  /**
   * Load conversation history (for resuming sessions)
   */
  loadHistory(messages: ChatMessage[]) {
    this.conversationHistory = [
      { role: 'system' as const, content: this.systemPrompt },
      ...messages.map((msg): OpenRouterMessage => ({
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      })),
    ];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [{ role: 'system', content: this.systemPrompt }];
  }

}

const repairJsonString = (json: string): string => {
  let repaired = '';
  let insideString = false;
  let prevChar = '';

  for (const char of json) {
    if (char === '"' && prevChar !== '\\') {
      insideString = !insideString;
    }

    if (insideString && char === '\n') {
      repaired += '\\n';
      prevChar = 'n';
      continue;
    }

    if (insideString && char === '\r') {
      repaired += '\\r';
      prevChar = 'r';
      continue;
    }

    repaired += char;
    prevChar = char;
  }

  if (insideString) {
    repaired += '"';
  }

  const balance = (text: string, openChar: string, closeChar: string) => {
    const openCount = text.split(openChar).length - 1;
    const closeCount = text.split(closeChar).length - 1;
    if (openCount > closeCount) {
      return text + closeChar.repeat(openCount - closeCount);
    }
    return text;
  };

  repaired = balance(repaired, '{', '}');
  repaired = balance(repaired, '[', ']');

  // Remove trailing commas before closing braces/brackets (run twice to catch nested cases)
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Remove orphan closing braces/brackets that appear after commas or other braces
  // Pattern: },} or }, } or },  } etc -> }
  repaired = repaired.replace(/}(\s*,?\s*)}(?=\s*[\],])/g, '}');
  // Pattern: ],] or ], ] etc -> ]
  repaired = repaired.replace(/](\s*,?\s*)](?=\s*[\],}])/g, ']');

  // Remove duplicate closing braces (no comma between)
  // Run multiple times to handle deeply nested issues
  for (let i = 0; i < 3; i++) {
    repaired = repaired.replace(/}(\s*)}/g, '}');
    repaired = repaired.replace(/](\s*)]/g, ']');
  }

  // Clean up any remaining },} patterns (with comma)
  repaired = repaired.replace(/},\s*}/g, '}');
  repaired = repaired.replace(/],\s*]/g, ']');

  // Fix pattern like: "value"},}] -> "value"}]
  repaired = repaired.replace(/"(\s*),?\s*}\s*,?\s*}/g, '"}');
  repaired = repaired.replace(/"(\s*),?\s*}\s*,?\s*]/g, '"}]');

  // Insert missing commas between object/array entries when closing and opening braces are adjacent
  repaired = repaired.replace(/}(?=\s*\{)/g, '},');
  repaired = repaired.replace(/](?=\s*\{)/g, '],');
  repaired = repaired.replace(/}(?=\s*\[)/g, '},');
  repaired = repaired.replace(/](?=\s*\[)/g, '],');

  return repaired;
};

/**
 * Try to extract a valid JSON subset from truncated content.
 * Looks for the last complete object/array and truncates there.
 */
const extractValidJsonSubset = (json: string): string | null => {
  // If it doesn't start with { or [, wrap it
  let content = json.trim();
  if (!content.startsWith('{') && !content.startsWith('[')) {
    return null;
  }

  // Try to find a point where we can cut and still have valid JSON
  // Work backwards from the end, trying to close at various points
  for (let i = content.length - 1; i > 10; i--) {
    const char = content[i];
    if (char === '}' || char === ']' || char === '"') {
      const candidate = content.slice(0, i + 1);
      // Try to balance and parse
      const repaired = repairJsonString(candidate);
      try {
        JSON.parse(repaired);
        return repaired;
      } catch {
        // Continue searching backwards
      }
    }
  }

  return null;
};

const insertCommaFromError = (json: string, error: unknown): string | null => {
  const message = error instanceof Error ? error.message : '';
  const match = /position\s+(\d+)/i.exec(message);
  if (!match) {
    return null;
  }

  let index = Number(match[1]);
  if (!Number.isFinite(index) || index <= 0 || index > json.length) {
    return null;
  }

  while (index > 0 && /\s/.test(json[index - 1])) {
    index -= 1;
  }

  if (index <= 0) {
    return null;
  }

  const charBefore = json[index - 1];
  if (!charBefore || charBefore === '[' || charBefore === '{' || charBefore === ',' || charBefore === ':') {
    return null;
  }

  return `${json.slice(0, index)},${json.slice(index)}`;
};
