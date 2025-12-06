'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { AIService, type OutcomeImageRequest } from '@/lib/services/ai-service';
import type { AIExtractionResult, QuizDraft, Question, Outcome, ManualChange } from '@/types';

const formatManualChangesInstruction = (changes: ManualChange[]): string | undefined => {
  if (!changes.length) return undefined;

  const bullets = changes
    .map((change) => {
      const entity = change.entityName ? ` (${change.entityName})` : '';
      const preview = change.valuePreview ? ` → "${change.valuePreview}"` : '';
      return `- ${change.label}${entity}${preview}`;
    })
    .join('\n');

  return [
    '[NOTA_PRIVADA]',
    'O usuário fez ajustes manuais no editor lateral. Reconheça essas mudanças de forma positiva antes de sugerir o próximo passo. Não mencione essa nota explicitamente, apenas use o contexto naturalmente.',
    bullets,
    '[/NOTA_PRIVADA]',
  ].join('\n');
};

const requeueManualChanges = (changes: ManualChange[]) => {
  if (!changes.length) return;
  useQuizBuilderStore.setState((state) => ({
    pendingManualChanges: [...changes, ...state.pendingManualChanges].slice(-5),
  }));
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const buildIntentHint = (message: string): string | undefined => {
  const normalized = normalizeText(message);
  const hasResults = /resultado|outcome/.test(normalized);
  const hasQuestions = /pergunta|questao|questão/.test(normalized);
  const hasCTA = /cta|call to action|botao|botão/.test(normalized);
  const hasIntro = /titulo|título|descricao|descrição|introducao|introdução/.test(normalized);
  const instructions: string[] = [];

  if (hasResults && hasCTA) {
    instructions.push('Prioridade: atualizar os CTAs dos resultados existentes exatamente como o usuário pediu. Se ele solicitou URLs vazias, deixe-as em branco e informe isso.');
  } else if (hasResults) {
    instructions.push('Prioridade: trabalhar nos resultados (títulos, descrições, CTAs ou imagens) antes de qualquer outro bloco.');
  }

  if (hasQuestions) {
    instructions.push('Se os resultados já estiverem definidos, avance para criar/ajustar perguntas alinhadas a eles, mantendo o formato padrão.');
  }

  if (hasCTA && !hasResults) {
    instructions.push('Foque nos CTAs solicitados (introdução ou botões) antes de falar de outros tópicos.');
  }

  if (!instructions.length) {
    return undefined;
  }

  if (!hasIntro) {
    instructions.push('Não volte para título ou descrição que já foram aprovados, a menos que o usuário peça explicitamente.');
  }

  return ['[NOTA_PRIVADA]', instructions.join(' '), '[/NOTA_PRIVADA]'].join('\n');
};

type ChatInterfaceProps = {
  userName?: string;
};

type MergeableEntity = Partial<Question> | Partial<Outcome>;

const mergeEntityCollections = <T extends MergeableEntity>(
  existing: T[] = [],
  incoming: T[]
): T[] => {
  if (!incoming.length) {
    return existing;
  }

  const merged = existing.map((entity) => ({ ...entity }));

  const findMatchIndex = (item: T) => {
    if (item.id) {
      const byId = merged.findIndex((entity) => entity.id === item.id);
      if (byId !== -1) {
        return byId;
      }
    }

    const matchableKeys: Array<'text' | 'title'> = ['text', 'title'];
    for (const key of matchableKeys) {
      const value = (item as Record<string, unknown>)[key];
      if (typeof value === 'string') {
        const byValue = merged.findIndex((entity) => (entity as Record<string, unknown>)[key] === value);
        if (byValue !== -1) {
          return byValue;
        }
      }
    }

    return -1;
  };

  incoming.forEach((item) => {
    const matchIndex = findMatchIndex(item);
    if (matchIndex >= 0) {
      merged[matchIndex] = { ...merged[matchIndex], ...item } as T;
    } else {
      merged.push({ ...item });
    }
  });

  return merged;
};

const applyExtractionResult = (
  baseQuiz: QuizDraft,
  extraction: AIExtractionResult,
  options?: { mergeExisting?: boolean }
): QuizDraft => {
  const { mergeExisting = false } = options || {};
  const nextQuiz: QuizDraft = { ...baseQuiz };

  if (extraction.title) nextQuiz.title = extraction.title;
  if (extraction.description) nextQuiz.description = extraction.description;
  if (extraction.coverImageUrl) nextQuiz.coverImageUrl = extraction.coverImageUrl;
  if (extraction.ctaText) nextQuiz.ctaText = extraction.ctaText;
  if (extraction.ctaUrl) nextQuiz.ctaUrl = extraction.ctaUrl;

  if (Array.isArray(extraction.questions)) {
    if (mergeExisting) {
      if (extraction.questions.length > 0) {
        nextQuiz.questions = mergeEntityCollections(nextQuiz.questions || [], extraction.questions);
      }
    } else {
      nextQuiz.questions = extraction.questions;
    }
  }

  if (Array.isArray(extraction.outcomes)) {
    // Strip imagePrompt before merging as it's not part of the Outcome type in the store
    const outcomesToMerge = extraction.outcomes.map(({ imagePrompt, ...rest }) => rest);

    if (mergeExisting) {
      if (outcomesToMerge.length > 0) {
        nextQuiz.outcomes = mergeEntityCollections(nextQuiz.outcomes || [], outcomesToMerge);
      }
    } else {
      nextQuiz.outcomes = outcomesToMerge;
    }
  }

  return nextQuiz;
};

export function ChatInterface({ userName }: ChatInterfaceProps) {
  const chatHistory = useQuizBuilderStore((state) => state.chatHistory);
  const addChatMessage = useQuizBuilderStore((state) => state.addChatMessage);
  const setExtracting = useQuizBuilderStore((state) => state.setExtracting);
  const setError = useQuizBuilderStore((state) => state.setError);
  const consumeManualChanges = useQuizBuilderStore((state) => state.consumeManualChanges);
  const hasSeenWelcomeMessage = useQuizBuilderStore((state) => state.hasSeenWelcomeMessage);
  const setHasSeenWelcomeMessage = useQuizBuilderStore((state) => state.setHasSeenWelcomeMessage);

  const quiz = useQuizBuilderStore((state) => state.quiz);
  const updateQuizField = useQuizBuilderStore((state) => state.updateQuizField);
  const updateOutcome = useQuizBuilderStore((state) => state.updateOutcome);
  const setQuiz = useQuizBuilderStore((state) => state.setQuiz);

  const [isLoading, setIsLoading] = useState(false);
  const [isCoverSuggesting, setIsCoverSuggesting] = useState(false);
  const [lastCoverPrompt, setLastCoverPrompt] = useState('');
  const [lastSuggestedCoverUrl, setLastSuggestedCoverUrl] = useState('');
  const aiService = useMemo(() => new AIService({ userName }), [userName]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasHydrated, setHasHydrated] = useState(
    useQuizBuilderStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (useQuizBuilderStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    const unsub = useQuizBuilderStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return () => {
      unsub?.();
    };
  }, []);

  // Request counter to implement "latest request wins" pattern for cover suggestions
  // This prevents flickering when multiple requests are made in quick succession
  const coverRequestIdRef = useRef(0);
  // Track if main flow already triggered a cover suggestion (to avoid duplicate from extraction)
  const coverSuggestionTriggeredRef = useRef(false);
  const outcomeImageRequestIdRef = useRef<Record<string, number>>({});
  const lastOutcomeImagePromptRef = useRef<Record<string, string>>({});
  const lastSuggestedOutcomeImageUrlRef = useRef<Record<string, string>>({});

  // Load conversation history into AI service when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      aiService.loadHistory(chatHistory);
    }
  }, [chatHistory, aiService]);

  // Send welcome message when chat becomes empty (new quiz or cleared chat)
  useEffect(() => {
    if (!hasHydrated || !quiz?.id) {
      return;
    }

    const rawName = (userName || '').trim();
    const fallbackName = rawName || 'Criador';
    const firstName = fallbackName.split(/\s+/)[0] || fallbackName;
    const WELCOME_MESSAGE = [
      `Olá, ${firstName}! Sou o seu Arquiteto de Quizzes. Vamos criar algo incrível para engajar sua audiência.`,
      '',
      'Para começar, me conta rapidinho:',
      '',
      '- Tema do quiz',
      '- Objetivo principal (ex: gerar leads, educar, segmentar)',
      '- Quem é a audiência (perfil + nível de maturidade no tema)',
    ].join('\n');

    const state = useQuizBuilderStore.getState();
    const currentHistory = state.chatHistory;
    const welcomeAlreadyQueued = currentHistory.some(
      (message) => message.content === WELCOME_MESSAGE
    );

    if (welcomeAlreadyQueued) {
      if (!state.hasSeenWelcomeMessage) {
        setHasSeenWelcomeMessage(true);
      }
      return;
    }

    const isEmptyChat = currentHistory.length === 0;
    const shouldShowWelcome = isEmptyChat && !state.hasSeenWelcomeMessage;

    if (shouldShowWelcome) {
      const welcomeMessage = {
        role: 'assistant' as const,
        content: WELCOME_MESSAGE,
        timestamp: Date.now(),
      };
      addChatMessage(welcomeMessage);
      setHasSeenWelcomeMessage(true);
    }
  }, [
    chatHistory.length,
    addChatMessage,
    hasHydrated,
    setHasSeenWelcomeMessage,
    quiz?.id,
    userName,
  ]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const isCoverComplaint = (message: string) => {
    const text = message.toLowerCase();
    const coverTerms = ['capa', 'cover', 'intro', 'introdução', 'introducao'];
    const actionTerms = [
      'mudar',
      'trocar',
      'change',
      'swap',
      'nova',
      'atualiza',
      'atualizar',
      'corrigir',
      'errada',
      'ruim',
      'sem relação',
      'off topic',
    ];
    const explicitPhrases = ['imagem da capa', 'foto da capa', 'imagem de capa', 'foto de capa'];
    const mentionsCover = coverTerms.some((term) => text.includes(term));
    const mentionsAction = actionTerms.some((term) => text.includes(term));
    const mentionsCoverImage = explicitPhrases.some((phrase) => text.includes(phrase));

    if (!mentionsCover && !mentionsCoverImage) return false;
    if (mentionsCoverImage) return true;
    return mentionsCover && (mentionsAction || text.includes('imagem') || text.includes('foto'));
  };

  const buildCoverPrompt = (rawPrompt?: string) => {
    const currentQuiz = useQuizBuilderStore.getState().quiz;
    const title = currentQuiz.title || '';
    const description = currentQuiz.description || '';

    // Combine available context - the AI translation endpoint will handle
    // converting this to optimal English Unsplash keywords
    const basePieces = [rawPrompt?.trim(), title, description].filter(Boolean) as string[];
    const base = basePieces.join(' ').trim();

    // Return just the base context - no more hardcoded category tags
    // The image-suggestion API now uses AI to translate to optimal search terms
    return base || 'abstract minimal background';
  };

  const maybeSuggestCover = async (
    prompt?: string,
    incomingCoverUrl?: string,
    options?: { force?: boolean }
  ) => {
    const effectivePrompt = buildCoverPrompt(prompt);
    console.log('[Cover] maybeSuggestCover called', { prompt: prompt?.slice(0, 30), force: options?.force });

    if (!effectivePrompt) {
      console.log('[Cover] Skipped: no effective prompt');
      return;
    }

    const latestQuiz = useQuizBuilderStore.getState().quiz;
    const currentCover = incomingCoverUrl || latestQuiz.coverImageUrl;
    const isAutoCover = Boolean(currentCover && (currentCover.includes('unsplash.com') || currentCover.includes('source.unsplash.com')));
    const coverIsSuggested = currentCover && currentCover === lastSuggestedCoverUrl;
    const promptChanged = effectivePrompt && effectivePrompt !== lastCoverPrompt;

    const hasManualCover = Boolean(currentCover && !isAutoCover && !coverIsSuggested);
    if (hasManualCover && !options?.force) {
      console.log('[Cover] Skipped: has manual cover', { currentCover: currentCover?.slice(0, 40) });
      return;
    }

    const alreadyUpToDate = Boolean(currentCover && !options?.force && coverIsSuggested && !promptChanged);
    if (alreadyUpToDate) {
      console.log('[Cover] Skipped: already up to date');
      return;
    }

    // Increment request ID - this request will only apply if it's still the latest when it completes
    coverRequestIdRef.current += 1;
    const thisRequestId = coverRequestIdRef.current;

    console.log('[Cover] Request started', { requestId: thisRequestId, prompt: effectivePrompt.slice(0, 50) });
    setIsCoverSuggesting(true);

    try {
      const response = await fetch('/api/image-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: effectivePrompt }),
      });

      console.log('[Cover] Response received', { ok: response.ok, status: response.status });

      if (!response.ok) {
        throw new Error(`Erro ao sugerir capa (${response.status})`);
      }

      const data = (await response.json()) as { url?: string };
      console.log('[Cover] Data parsed', { hasUrl: !!data?.url, url: data?.url?.slice(0, 50) });

      // "Latest request wins" - only apply if this is still the most recent request
      if (thisRequestId !== coverRequestIdRef.current) {
        console.log('[Cover] Discarded (superseded)', { thisRequestId, currentRequestId: coverRequestIdRef.current });
        return;
      }

      if (data?.url) {
        const currentQuiz = useQuizBuilderStore.getState().quiz;
        console.log('[Cover] Applying to quiz', { quizId: currentQuiz.id });
        setQuiz({ ...currentQuiz, coverImageUrl: data.url });
        setLastCoverPrompt(effectivePrompt);
        setLastSuggestedCoverUrl(data.url);
        console.log('[Cover] Applied successfully', { url: data.url.slice(0, 60) });
      } else {
        console.log('[Cover] No URL in response');
      }
    } catch (error) {
      console.error('[Cover] Error:', error);
    } finally {
      // Only clear the loading state if this is still the latest request
      if (thisRequestId === coverRequestIdRef.current) {
        setIsCoverSuggesting(false);
      }
    }
  };

  const maybeSuggestOutcomeImage = async (request: OutcomeImageRequest) => {
    const { outcomeId, prompt } = request;
    const nextRequestId = (outcomeImageRequestIdRef.current[outcomeId] || 0) + 1;
    outcomeImageRequestIdRef.current[outcomeId] = nextRequestId;

    try {
      const response = await fetch('/api/image-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao sugerir imagem (${response.status})`);
      }

      const data = (await response.json()) as { url?: string };

      if (!data?.url) {
        console.warn('[Outcome Image] sem URL na resposta', { outcomeId, prompt });
        return;
      }

      if (outcomeImageRequestIdRef.current[outcomeId] !== nextRequestId) {
        console.log('[Outcome Image] descartado (sobrescrito)', { outcomeId });
        return;
      }

      const latestQuiz = useQuizBuilderStore.getState().quiz;
      const outcomes = latestQuiz.outcomes || [];
      const hasOutcome = outcomes.some((outcome) => outcome.id === outcomeId);
      if (!hasOutcome) {
        console.warn('[Outcome Image] resultado não encontrado', outcomeId);
        return;
      }

      // Ensure we only accept absolute URLs; otherwise, discard to avoid broken relative paths
      const isAbsoluteUrl = /^https?:\/\//i.test(data.url);
      if (!isAbsoluteUrl) {
        console.warn('[Outcome Image] URL não é absoluta, ignorando', { outcomeId, url: data.url });
        return;
      }

      const updatedOutcomes = outcomes.map((outcome) =>
        outcome.id === outcomeId ? { ...outcome, imageUrl: data.url } : outcome
      );
      useQuizBuilderStore.setState((state) => ({
        quiz: {
          ...state.quiz,
          outcomes: updatedOutcomes,
        },
      }));
      lastOutcomeImagePromptRef.current[outcomeId] = prompt;
      lastSuggestedOutcomeImageUrlRef.current[outcomeId] = data.url;
      console.log('[Outcome Image] aplicado', { outcomeId, url: data.url });
    } catch (error) {
      console.error('[Outcome Image] erro', outcomeId, error);
    }
  };

  const processOutcomeImageRequests = (requests?: OutcomeImageRequest[]) => {
    if (!requests?.length) {
      return;
    }
    console.log('[Outcome Image] processing', { count: requests.length });
    requests.forEach((request) => {
      void maybeSuggestOutcomeImage(request);
    });
  };

  const shouldExtractQuizStructure = (userMessage: string, assistantResponse: string): boolean => {
    // Normalize strings once so keyword matching works with/without accents
    const normalizedUser = normalizeText(userMessage);
    const normalizedAssistant = normalizeText(assistantResponse);

    const confirmationKeywords = [
      'sim', 'confirmo', 'confirma', 'pode ir', 'pode usar', 'pode', 'usar',
      'perfeito', 'ok', 'okay', 'otimo', 'esta otimo', 'estou ok',
      'isso', 'exato', 'correto', 'certo', 'concordo', 'legal',
      'maravilha', 'beleza', 'show', 'top', 'segue', 'vamos', 'vai',
      'esses', 'essas', 'esse', 'essa', 'ficou bom', 'ficou otimo',
      'aprovo', 'aprovado', 'pode seguir', 'continua', 'proximo'
    ];

    const hasConfirmation = confirmationKeywords.some((keyword) =>
      normalizedUser.includes(keyword)
    );

    const assistantActionKeywords = [
      'vou atualizar', 'vou adicionar', 'adicionei', 'atualizei', 'criei', 'vamos aos',
      'ajustei', 'ajustamos', 'ajuste realizado', 'alterei', 'alteramos', 'editei',
      'modifiquei', 'modificamos', 'mudei', 'mudamos', 'corrigi', 'corrigimos',
      'reformulei', 'reescrevi', 'encurtei', 'simplifiquei', 'removi'
    ];

    const assistantIndicatesUpdate = assistantActionKeywords.some((keyword) =>
      normalizedAssistant.includes(keyword)
    );

    const editRequestKeywords = [
      'ajuste', 'ajustar', 'ajusta', 'ajustei', 'edite', 'editar', 'edita',
      'modifique', 'modificar', 'modifica', 'mude', 'mudar', 'muda', 'troque', 'trocar',
      'troca', 'altere', 'alterar', 'altera', 'reescreva', 'reescrever', 'reescreve',
      'encurte', 'encurtar', 'encurta', 'simplifique', 'simplificar', 'simplifica',
      'melhore', 'melhorar', 'melhora', 'corrija', 'corrigir', 'corrige', 'resuma',
      'resumir', 'reduza', 'reduzir', 'ajuste a pergunta', 'ajuste o resultado'
    ];

    const hasEditRequest = editRequestKeywords.some((keyword) =>
      normalizedUser.includes(keyword)
    );

    return hasConfirmation || assistantIndicatesUpdate || hasEditRequest;
  };

  const handleSendMessage = async (content: string) => {
    let manualChangesForMessage: ManualChange[] = [];
    // Add user message
    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    };
    addChatMessage(userMessage);

    try {
      setIsLoading(true);
      setError(null);

      manualChangesForMessage = consumeManualChanges();
      const manualChangesInstruction = formatManualChangesInstruction(manualChangesForMessage);
      const intentHint = buildIntentHint(content);
      const extraNotes = [manualChangesInstruction, intentHint].filter(Boolean).join('\n\n');
      const outboundContent = extraNotes ? `${content}\n\n${extraNotes}` : content;

      // Call AI service to get response + structured extraction in a single round-trip
      const currentQuizSnapshot = useQuizBuilderStore.getState().quiz;
      const {
        text: response,
        extraction,
        coverPrompt,
        outcomeImageRequests,
      } = await aiService.sendMessageWithExtraction(
        outboundContent,
        currentQuizSnapshot
      );

      // Add assistant response
      const assistantMessage = {
        role: 'assistant' as const,
        content: response,
        timestamp: Date.now(),
      };
      addChatMessage(assistantMessage);

      // Stop blocking the input once the assistant reply arrives
      setIsLoading(false);

      const forceCoverRefresh = isCoverComplaint(content);
      const combinedCoverPrompt = coverPrompt || extraction?.coverImagePrompt;
      // Apply extracted quiz updates immediately if present AND confirmed OR when user explicitly asks to change cover
      const shouldApplyExtraction =
        extraction && (shouldExtractQuizStructure(content, response) || forceCoverRefresh);

      // Reset flag at start of each message processing
      coverSuggestionTriggeredRef.current = false;

      console.log('[Flow] Message processed', {
        forceCoverRefresh,
        hasCoverPrompt: !!coverPrompt,
        hasExtraction: !!extraction,
        extractionKeys: extraction ? Object.keys(extraction) : [],
        shouldApplyExtraction,
        combinedCoverPrompt: combinedCoverPrompt?.slice(0, 30),
        manualChanges: manualChangesForMessage.length,
      });

      if (shouldApplyExtraction && extraction && Object.keys(extraction).length > 0) {
        console.log('[Flow] Taking extraction branch');
        const latestQuiz = useQuizBuilderStore.getState().quiz;
        const updatedQuiz = applyExtractionResult(latestQuiz, extraction, { mergeExisting: true });

        setQuiz(updatedQuiz);

        // Auto-suggest cover when title/description are confirmed
        // Priority: 1) AI-provided coverPrompt, 2) extraction.coverImagePrompt, 3) generate from title/desc
        const finalTitle = updatedQuiz.title || latestQuiz.title;
        const finalDescription = updatedQuiz.description || latestQuiz.description;
        const hasTitleOrDescription = finalTitle && finalTitle !== 'Meu Novo Quiz';

        const finalCoverPrompt = combinedCoverPrompt ||
          (forceCoverRefresh ? content : undefined) ||
          (hasTitleOrDescription ? `${finalTitle} ${finalDescription}`.trim() : undefined);

        console.log('[Flow] finalCoverPrompt for extraction branch:', finalCoverPrompt?.slice(0, 40));
        const coverPromptChanged = finalCoverPrompt && finalCoverPrompt !== lastCoverPrompt;
        const shouldForceCover =
          forceCoverRefresh ||
          Boolean(coverPrompt) ||
          Boolean(extraction.coverImagePrompt && extraction.coverImagePrompt !== lastCoverPrompt);

        if (finalCoverPrompt && (shouldForceCover || !latestQuiz.coverImageUrl)) {
          coverSuggestionTriggeredRef.current = true;
          void maybeSuggestCover(finalCoverPrompt, updatedQuiz.coverImageUrl, {
            force: shouldForceCover,
          });
        }

        // Process outcome image prompts from extraction
        if (extraction.outcomes?.length) {
          extraction.outcomes.forEach((outcome) => {
            if (outcome.imagePrompt && outcome.title) {
              // Find the ID in the updated quiz that matches this extraction outcome
              // (either by ID if preserved, or by title if new)
              const match = updatedQuiz.outcomes?.find(
                (o) => o.id === outcome.id || o.title === outcome.title
              );

              if (match?.id) {
                console.log('[Flow] Triggering outcome image suggestion from extraction', {
                  outcomeId: match.id,
                  prompt: outcome.imagePrompt,
                });
                // We don't wait for this
                void maybeSuggestOutcomeImage({
                  outcomeId: match.id,
                  prompt: outcome.imagePrompt,
                });
              }
            }
          });
        }
      } else {
        console.log('[Flow] Taking else branch (fallback)');

        // Handle cover image change first (if tool provided a prompt)
        if (combinedCoverPrompt || forceCoverRefresh) {
          console.log('[Flow] Calling maybeSuggestCover from else branch', {
            combinedCoverPrompt: combinedCoverPrompt?.slice(0, 30),
            forceCoverRefresh
          });
          coverSuggestionTriggeredRef.current = true;
          // User asked to fix the image even without confirmation flow
          void maybeSuggestCover(combinedCoverPrompt || content, quiz.coverImageUrl, {
            force: true,
          });
        }

        // Fallback extraction: only if we believe the user confirmed AND no tool action was taken
        // Skip extraction if coverPrompt was provided - the tool already handled the action
        const toolHandledAction = Boolean(coverPrompt);
        const shouldExtract = !toolHandledAction && shouldExtractQuizStructure(content, response);
        console.log('Should extract quiz structure (fallback)?', shouldExtract, 'User message:', content, 'Tool handled:', toolHandledAction);

        if (shouldExtract) {
          console.log('Triggering extraction fallback...');
          // Run extraction in the background to avoid blocking the chat UI
          void extractQuizStructure();
        }
      }

      if (outcomeImageRequests?.length) {
        void processOutcomeImageRequests(outcomeImageRequests);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      requeueManualChanges(manualChangesForMessage);
      setError(error instanceof Error ? error.message : 'Erro ao comunicar com a IA');
      setIsLoading(false);

      // Add error message to chat
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: Date.now(),
      };
      addChatMessage(errorMessage);
    }
  };

  const extractQuizStructure = async () => {
    try {
      setExtracting(true);

      const storeState = useQuizBuilderStore.getState();
      const latestQuiz = storeState.quiz;
      const updatedHistory = storeState.chatHistory;

      // Call extraction service
      const extracted = await aiService.extractQuizStructure(updatedHistory, latestQuiz);

      // Apply extracted changes if any
      if (Object.keys(extracted).length > 0) {
        const updatedQuiz = applyExtractionResult(latestQuiz, extracted, { mergeExisting: true });

        setQuiz(updatedQuiz);

        // Auto-suggest cover image when:
        // 1. Main flow hasn't already triggered it
        // 2. AI provided a coverImagePrompt (initial setup or explicit user request)
        // 3. OR there's no cover yet and we have title/description (initial setup)
        if (!coverSuggestionTriggeredRef.current) {
          const finalTitle = updatedQuiz.title || latestQuiz.title;
          const finalDescription = updatedQuiz.description || latestQuiz.description;
          const hasTitleOrDescription = finalTitle && finalTitle !== 'Meu Novo Quiz';
          const hasNoCoverYet = !latestQuiz.coverImageUrl;

          // Use AI-provided coverImagePrompt if available
          const coverPromptToUse = extracted.coverImagePrompt ||
            (hasNoCoverYet && hasTitleOrDescription ? `${finalTitle} ${finalDescription}`.trim() : undefined);

          // Only trigger if:
          // - AI explicitly provided a prompt (user asked or initial setup), OR
          // - No cover exists yet and we have context (initial setup)
          if (coverPromptToUse && (extracted.coverImagePrompt || hasNoCoverYet)) {
            console.log('[Extraction] Auto-triggering cover suggestion', {
              source: extracted.coverImagePrompt ? 'AI provided' : 'generated from title/desc (initial setup)',
              prompt: coverPromptToUse?.slice(0, 50),
              hasNoCoverYet,
            });
            void maybeSuggestCover(coverPromptToUse, updatedQuiz.coverImageUrl);
          }
        }

        // Process outcome image prompts from extraction (fallback flow)
        if (extracted.outcomes?.length) {
          extracted.outcomes.forEach((outcome) => {
            if (outcome.imagePrompt && outcome.title) {
              const match = updatedQuiz.outcomes?.find(
                (o) => o.id === outcome.id || o.title === outcome.title
              );
              if (match?.id) {
                console.log('[Extraction] Triggering outcome image suggestion', {
                  outcomeId: match.id,
                  prompt: outcome.imagePrompt,
                });
                void maybeSuggestOutcomeImage({
                  outcomeId: match.id,
                  prompt: outcome.imagePrompt,
                });
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error extracting quiz structure:', error);
      // Don't show error to user, this is a background operation
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg">
      {/* Header removed as requested */}

      {/* Messages List - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-medium mb-2">
              Comece uma conversa
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Descreva o quiz que você quer criar e a IA vai te ajudar a estruturá-lo
            </p>
          </div>
        ) : (
          <>
            {chatHistory.map((message, index) => (
              <ChatMessageComponent key={index} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="flex-shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder="Digite sua mensagem..."
        />
      </div>
    </div>
  );
}
