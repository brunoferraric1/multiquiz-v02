import type { ChatMessage, AIExtractionResult, QuizDraft } from '@/types';

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

  // If no specific changes detected, return a generic but shorter message
  if (changes.length === 0) {
    return 'Pronto! Fiz a alteração. O que mais você quer ajustar?';
  }

  // Build the response with actual changes
  return `${changes.join('\n')}\n\nO que mais você quer ajustar?`;
}

type OpenRouterMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const SYSTEM_PROMPT = `Você é um Arquiteto de Quizzes especializado em criar quizzes engajantes e personalizados.

IMPORTANTE: Sempre responda em português brasileiro de forma amigável, conversacional e CONCISA.

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

export class AIService {
  private conversationHistory: OpenRouterMessage[] = [];

  constructor() {
    this.conversationHistory = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
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
          max_tokens: 800,
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

      const extracted = JSON.parse(jsonContent);
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

    return `Extract quiz structure from this Portuguese conversation about creating a quiz.

CURRENT QUIZ STATE:
${JSON.stringify(
  {
    title: currentQuiz.title,
    description: currentQuiz.description,
    questionsCount: currentQuiz.questions?.length || 0,
    outcomesCount: currentQuiz.outcomes?.length || 0,
    existingQuestionIds: currentQuiz.questions?.map((q) => q.id) || [],
    existingOutcomeIds: currentQuiz.outcomes?.map((o) => o.id) || [],
  },
  null,
  2
)}

CONVERSATION:
${conversationText}

EXTRACTION INSTRUCTIONS:
1. Look for confirmed quiz elements in the conversation:
   - Title and description (título e descrição)
   - Outcomes/Results (resultados) - these are the possible end results users can get
   - Questions (perguntas) with their options (opções)

2. When extracting outcomes:
   - Each outcome needs: title, description (can be empty string for now)
   - Look for phrases like "Ideias de títulos", "Resultados", outcome titles in quotes or lists
   - CTAs and URLs are optional

3. When extracting questions:
   - Each question needs: text, and multiple options
   - Each option needs to link to a targetOutcomeId

4. IMPORTANT: If the user confirmed outcomes but they're not in the current state (outcomesCount: 0),
   you MUST extract them from the conversation.

5. Preserve existing IDs when updating. Generate new UUIDs for new items.

6. Se houver contexto de título + descrição + objetivo + audiência + tom, gere "coverImagePrompt" curto (5-8 palavras, em português, evite rostos/pessoas se não forem pedidos explicitamente).

7. Se houver CTA sugerido na introdução, inclua "ctaText" e, se possível, "ctaUrl" (placeholder permitido) no JSON.

Extract and return the updated quiz structure.`;
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
    if (sanitizedTitle) result.title = sanitizedTitle;

    const sanitizedDescription = this.sanitizeOptionalString(extracted.description);
    if (sanitizedDescription) result.description = sanitizedDescription;

    const sanitizedCoverUrl = this.sanitizeOptionalString(extracted.coverImageUrl);
    if (sanitizedCoverUrl) result.coverImageUrl = sanitizedCoverUrl;

    const sanitizedCoverPrompt = this.sanitizeOptionalString(extracted.coverImagePrompt);
    if (sanitizedCoverPrompt) result.coverImagePrompt = sanitizedCoverPrompt;

    const sanitizedCtaText = this.sanitizeOptionalString(extracted.ctaText);
    if (sanitizedCtaText) result.ctaText = sanitizedCtaText;

    const sanitizedCtaUrl = this.sanitizeOptionalString(extracted.ctaUrl);
    if (sanitizedCtaUrl) result.ctaUrl = sanitizedCtaUrl;

    // Normalize questions
    if (Array.isArray(extracted.questions)) {
      result.questions = extracted.questions.map((q: any, idx: number) => {
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
      });
    }

    // Normalize outcomes
    if (Array.isArray(extracted.outcomes) && extracted.outcomes.length > 0) {
      result.outcomes = extracted.outcomes.map((o: any, idx: number) => {
        const existingOutcome = currentQuiz.outcomes?.[idx];
        return {
          id: o.id || existingOutcome?.id || crypto.randomUUID(),
          title: o.title || 'Resultado sem título',
          description: o.description || '',
          imageUrl: this.sanitizeOptionalString(o.imageUrl),
          ctaText: this.sanitizeOptionalString(o.ctaText),
          ctaUrl: this.sanitizeOptionalString(o.ctaUrl),
        };
      });
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
      { role: 'system' as const, content: SYSTEM_PROMPT },
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
    this.conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
  }
}
