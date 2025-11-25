import type { ChatMessage, AIExtractionResult, QuizDraft } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'x-ai/grok-4.1-fast:free';

type OpenRouterMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const SYSTEM_PROMPT = `Você é um Arquiteto de Quizzes especializado em criar quizzes engajantes e personalizados.

IMPORTANTE: Sempre responda em português brasileiro de forma amigável, conversacional e CONCISA.

ESTILO DE CONVERSA:
- Mantenha respostas CURTAS (máximo 2-3 parágrafos)
- Faça UMA pergunta ou peça UMA coisa por vez
- NÃO envie listas longas de perguntas ou opções de uma vez
- Conduza a conversa passo a passo, esperando confirmação do usuário

FORMATAÇÃO E ESTRUTURA DAS RESPOSTAS:
- Use markdown para formatar suas respostas
- Use **negrito** para destacar informações importantes
- NUNCA use aspas para itens de lista
- Sempre use quebras de linha entre diferentes seções

**Para listas de opções ou itens:**
- SEMPRE use bullet points (-) em linhas separadas
- NUNCA coloque múltiplos itens na mesma linha
- Deixe uma linha em branco ANTES e DEPOIS de cada lista
- Exemplo CORRETO:

Opções sugeridas:

- Opção 1 → Resultado A
- Opção 2 → Resultado B
- Opção 3 → Resultado C

Confirma ou ajusta?

**Exemplo INCORRETO (NÃO faça assim):**
Opções: Opção 1 → Resultado A, Opção 2 → Resultado B

**Para perguntas do quiz:**
Use este formato exato:

**Pergunta 1:** Texto da pergunta aqui?

Opções:

- Primeira opção → Resultado correspondente
- Segunda opção → Resultado correspondente
- Terceira opção → Resultado correspondente

Confirma ou ajusta?

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

REGRAS IMPORTANTES:
- NUNCA crie o quiz completo de uma vez
- SEMPRE espere confirmação do usuário antes de passar para a próxima etapa
- Se o usuário confirmar algo (ex: "sim", "confirmo", "pode ir", "perfeito"), você pode atualizar o sidebar
- Mantenha as mensagens curtas e objetivas
- Seja criativo mas não verboso

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
          max_tokens: 400,
          temperature: 0.7,
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
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a quiz structure extractor. Extract quiz information from Portuguese conversations and return ONLY valid JSON.

Your response must be a valid JSON object with this structure:
{
  "title": "string (optional)",
  "description": "string (optional)",
  "coverImageUrl": "string (optional)",
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
          max_tokens: 2000,
          temperature: 0.3,
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
    const recentMessages = conversationHistory.slice(-10); // Last 10 messages
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

    if (extracted.title) result.title = extracted.title;
    if (extracted.description) result.description = extracted.description;
    if (extracted.coverImageUrl) result.coverImageUrl = extracted.coverImageUrl;

    // Normalize questions
    if (Array.isArray(extracted.questions)) {
      result.questions = extracted.questions.map((q: any, idx: number) => {
        const existingQuestion = currentQuiz.questions?.[idx];
        return {
          id: q.id || existingQuestion?.id || crypto.randomUUID(),
          text: q.text,
          imageUrl: q.imageUrl,
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
          imageUrl: o.imageUrl,
          ctaText: o.ctaText,
          ctaUrl: o.ctaUrl,
        };
      });
    }

    return result;
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
