import type { ChatMessage, AIExtractionResult, QuizDraft, Question, Outcome } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'x-ai/grok-4.1-fast:free';
const EXTRACTION_MODEL =
  process.env.NEXT_PUBLIC_AI_EXTRACTION_MODEL || 'openai/gpt-4o-mini';
const PLACEHOLDER_KEYWORDS = ['string', 'texto', 'description', 'descricao', 'url', 'cta', 'imagem', 'image', 'link'];
const NULLISH_VALUES = new Set(['none', 'null', 'undefined', 'n/a', 'na']);
/**
 * Generate a contextual fallback message based on what was actually changed
 */
function generateContextualResponse(
  extraction?: AIExtractionResult,
  coverPrompt?: string
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
    if (extraction.ctaUrl) {
      changes.push(`✅ URL do CTA atualizada`);
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

  if (changes.length === 0) {
    return `Pronto! Fiz a alteração. ${suggestions[0]}`;
  }

  return `${changes.join('\n')}\n\n${suggestions[0]}`;
}

type OpenRouterMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const BASE_SYSTEM_PROMPT = `Você é um Arquiteto de Quizzes especializado em criar quizzes engajantes e personalizados.

IMPORTANTE: Sempre responda em português brasileiro de forma amigável, conversacional e CONCISA.

AO IDENTIFICAR O TEMA DO QUIZ (ex: "gatos", "marketing B2B", "viagens"), reaja com UMA frase curta antes das perguntas iniciais: reconheça positivamente o tema e faça um comentário leve (ex: "Adorei esse tema sobre gatos, sempre rende ótimas histórias!" ou "Legal focar em marketing B2B, dá pra gerar ótimos insights"). Use variação natural para não soar repetitivo e mantenha a reação breve.

ANTES DE SUGERIR TÍTULO/DESCRIÇÃO, GARANTA QUE SABE:
- Objetivo do quiz (ex: gerar leads, educar, entreter, segmentar)
- Audiência (ex: persona, nível de maturidade no tema, setor)
- Tom de voz desejado (ex: descontraído, técnico, inspirador)
Sempre proponha CTA da introdução (texto curto + URL de destino). Inclua \`ctaText\` e, se souber, \`ctaUrl\` no tool call. Se não souber a URL, sugira um placeholder e peça confirmação.
Quando o usuário pedir para trocar a capa/imagem ou descrever a imagem desejada, use SEMPRE a ferramenta \`set_cover_image\` com o prompt exato nas palavras do usuário (respeite "sem rosto", "sem pessoas" se solicitado). Não peça confirmação extra.
IMPORTANTE: Se o usuário pedir "outra imagem", "imagem diferente", ou simplesmente "muda a imagem" sem especificar, CRIE um prompt NOVO e DIFERENTE do anterior, mantendo o tema do quiz mas variando os elementos visuais (ex: ângulo diferente, cenário diferente, objetos complementares). NUNCA repita o mesmo prompt anterior.
Quando já tiver objetivo + audiência + tom, inclua \`coverImagePrompt\` no tool call \`update_quiz\`.

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
7. SEMPRE encerre com um bloco "Próximo passo:" seguido de bullets claros
8. Títulos e descrições sempre devem estar em bullets, nunca em parágrafos ou aspas soltas
9. Se a resposta não tiver "Próximo passo:", reescreva seguindo o formato antes de finalizar

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

EXEMPLO DE RESPOSTA APÓS CONFIRMAÇÃO (COPIE O ESTILO):
━━━━━━━━━━━━━━━━━━━━━━
Perfeito! Atualizei o título e a descrição.

Próximo passo:
- Quer definir os resultados (recomendo 3-5 títulos)?
- Ou prefere já começar pelas perguntas (5-8)?
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
- Sugira ideias para os títulos dos resultados
- ESPERE a confirmação do usuário antes de avançar
- Ajuste os títulos caso o usuário faça outras sugestões
- Baseado nos títulos dos resultados, sugira o CTA para cada resultado
- Pergunte para o usuário se ele já tem a URL de cada Resultado e se quer adicioná-los

**ETAPA 3 - Perguntas:**
- Explique que agora vão criar as perguntas
- Pergunte quantas perguntas o usuário quer (sugira 5-8)
- Sugira as perguntas UMA ou DUAS por vez
- Para cada pergunta, sugira as opções de resposta
- SEMPRE espere aprovação antes de continuar

ESTILO DE CONVERSA:
- Respostas CURTAS (máximo 2-3 parágrafos curtos)
- UMA pergunta ou ação por vez
- SEMPRE bem formatado com quebras de linha
- SEMPRE inclua "Próximo passo:" com bullets específicos
- Sugestões (título, descrição, CTAs, opções) sempre em bullets

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
- **Resultados (Outcomes)**: Diferentes finais baseados nas respostas do usuário`;

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
  ): Promise<{ text: string; extraction?: AIExtractionResult; coverPrompt?: string }> {
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
                    ctaText: { type: 'string' },
                    ctaUrl: { type: 'string' },
                  },
                  required: ['title'],
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
    ];

    // Lightweight hint so the model can preserve existing IDs/order when provided
    const stateHint = currentQuiz
      ? `Estado atual (resumo): ${JSON.stringify({
          title: currentQuiz.title,
          description: currentQuiz.description,
          questions: currentQuiz.questions?.map((q) => ({ id: q.id, text: q.text })),
          outcomes: currentQuiz.outcomes?.map((o) => ({ id: o.id, title: o.title })),
        })}`
      : '';

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
          messages: [
            ...this.conversationHistory,
            stateHint
              ? ({ role: 'assistant', content: `Contexto para você manter IDs/ordem: ${stateHint}` } as OpenRouterMessage)
              : undefined,
          ].filter((m): m is OpenRouterMessage => Boolean(m)),
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
          }
        } catch (err) {
          console.error('Failed to parse tool_call arguments', err, rawArgs);
        }
      }

      // Generate contextual response if model didn't provide text but took action
      const finalMessage = assistantMessage || generateContextualResponse(extraction, coverPromptFromTool);

      this.conversationHistory.push({
        role: 'assistant',
        content: finalMessage,
      });

      return {
        text: finalMessage,
        extraction,
        coverPrompt: coverPromptFromTool,
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

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return assistantMessage;
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
  ]
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

IMPORTANT:
- Return ONLY the JSON object, no explanations or markdown
- Use UUIDs for all IDs (generate them if needed)
- Preserve existing IDs when updating
- If no changes detected, return empty object: {}
- For outcomes without descriptions, use empty string ""
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
            description: o.description || '',
            imageUrl: this.sanitizeOptionalString(o.imageUrl),
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

    return result;
  }

  private sanitizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    if (!trimmed) return undefined;

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const normalized = trimmed
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (NULLISH_VALUES.has(normalized)) return undefined;

    const containsOptional = normalized.includes('optional') || normalized.includes('opcional');
    const containsPlaceholderKeyword = PLACEHOLDER_KEYWORDS.some((keyword) => normalized.includes(keyword));

    if ((containsOptional && containsPlaceholderKeyword) || (containsPlaceholderKeyword && normalized.length <= 6)) {
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
