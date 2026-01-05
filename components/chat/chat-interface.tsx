'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Globe, Link2, RefreshCw, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { AIService, type OutcomeImageRequest } from '@/lib/services/ai-service';
import type {
  AIExtractionResult,
  QuizDraft,
  Question,
  Outcome,
  ManualChange,
  LoadingSections,
  AnswerOption,
} from '@/types';

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

/**
 * Detect if user message indicates a removal/deletion request
 */
const isRemovalRequest = (userMessage: string): boolean => {
  const normalized = normalizeText(userMessage);
  const removalKeywords = [
    'remova', 'remover', 'remove', 'delete', 'deletar', 'exclua', 'excluir',
    'tire', 'tirar', 'apagar', 'apague', 'elimine', 'eliminar',
    'nao quero', 'não quero', 'sem esse', 'sem essa', 'menos esse', 'menos essa',
    'so esses', 'só esses', 'so essas', 'só essas', 'apenas esses', 'apenas essas',
    'quero apenas', 'quero so', 'quero só', 'mantenha apenas', 'mantem apenas',
    'deixa so', 'deixa só', 'fica so', 'fica só'
  ];
  return removalKeywords.some((keyword) => normalized.includes(keyword));
};

/**
 * Detect if user is explicitly confirming outcomes/results
 */
const isOutcomeConfirmation = (userMessage: string): boolean => {
  const normalized = normalizeText(userMessage);
  // Keywords that indicate the user is specifically confirming outcomes
  const outcomeTerms = ['resultado', 'resultados', 'outcome', 'outcomes', 'opcao', 'opção', 'opcoes', 'opções'];
  const confirmationTerms = ['confirmo', 'aprovo', 'aprovado', 'perfeito', 'otimo', 'ótimo', 'esses', 'essas', 'gostei', 'adorei', 'ficou bom', 'pode seguir', 'vamos la', 'vamos lá'];

  const mentionsOutcome = outcomeTerms.some(term => normalized.includes(term));
  const hasConfirmation = confirmationTerms.some(term => normalized.includes(term));

  // Either explicitly mentions outcomes with confirmation, or just uses strong confirmation keywords
  return mentionsOutcome || hasConfirmation;
};

const isLeadGenPrompt = (assistantMessage: string): boolean => {
  const normalized = normalizeText(assistantMessage);
  const leadPromptKeywords = [
    'captar leads',
    'captacao de leads',
    'captura de leads',
    'lead capture',
    'coletar dados',
    'coletar informacoes',
    'informacoes dos participantes',
    'nome e email',
    'nome e e-mail',
    'nome e telefone',
    'antes de mostrar o resultado',
    'antes de mostrar os resultados',
    'etapa para coletar',
  ];
  const leadSignalTokens = [
    'lead',
    'leads',
    'captar',
    'captacao',
    'coletar',
    'dados',
    'email',
    'e-mail',
    'telefone',
    'nome',
  ];
  const promptTokens = [
    'gostaria',
    'quer',
    'deseja',
    'adicionar',
    'etapa',
    'antes de',
    'coletar',
    'captar',
  ];

  return (
    leadPromptKeywords.some((keyword) => normalized.includes(keyword)) ||
    (leadSignalTokens.some((token) => normalized.includes(token)) &&
      promptTokens.some((token) => normalized.includes(token)))
  );
};

const isLeadGenRejection = (userMessage: string): boolean => {
  const normalized = normalizeText(userMessage);
  const hasNegation = ['nao', 'sem', 'dispensa'].some((token) => normalized.includes(token));
  const hasLeadToken = ['lead', 'leads', 'captacao', 'captar', 'coletar', 'dados', 'email', 'e-mail', 'telefone', 'nome']
    .some((token) => normalized.includes(token));
  return hasNegation && hasLeadToken;
};

const isLeadGenConfirmation = (userMessage: string, previousAssistantMessage?: string): boolean => {
  const normalized = normalizeText(userMessage);
  if (!normalized || isLeadGenRejection(userMessage)) {
    return false;
  }

  const explicitLeadRequests = [
    'captar leads',
    'captacao de leads',
    'captura de leads',
    'coletar leads',
    'coletar dados',
    'gerar leads',
    'ativar leads',
    'ativar lead',
    'habilitar leads',
    'habilitar lead',
    'adicionar formulario',
    'formulario de leads',
    'pedir nome',
    'pedir email',
    'pedir e-mail',
    'pedir telefone',
    'quero captar',
    'quero coletar',
    'quero leads',
    'quero lead',
  ];

  if (explicitLeadRequests.some((keyword) => normalized.includes(keyword))) {
    return true;
  }

  if (previousAssistantMessage && isLeadGenPrompt(previousAssistantMessage)) {
    const affirmationKeywords = [
      'sim',
      'pode',
      'pode sim',
      'quero',
      'quero sim',
      'ok',
      'okay',
      'claro',
      'perfeito',
      'otimo',
      'bora',
      'vamos',
      'segue',
      'manda',
      'pode seguir',
    ];

    return affirmationKeywords.some((keyword) => normalized.includes(keyword));
  }

  return false;
};

const detectActionRequest = (userMessage: string): { preview: boolean; publish: boolean } => {
  const normalized = normalizeText(userMessage);
  const hasNegation = ['nao', 'sem', 'dispensa'].some((token) => normalized.includes(token));
  const previewKeywords = [
    'preview',
    'previa',
    'previsualizar',
    'pre-visualizar',
    'pre visualizar',
    'visualizar quiz',
    'visualizar o quiz',
  ];
  const publishKeywords = [
    'publicar',
    'publique',
    'publicacao',
    'publica',
    'publish',
    'lancar',
    'colocar no ar',
    'coloca no ar',
  ];
  const mentionsQuiz = normalized.includes('quiz');
  const mentionsPreview = normalized.includes('preview') || normalized.includes('previa');
  const mentionsVisualizar = normalized.includes('visualizar') || normalized.includes('visualizacao');
  const mentionsVer = normalized.includes('ver');

  const previewRequested =
    previewKeywords.some((keyword) => normalized.includes(keyword)) ||
    (mentionsVisualizar && mentionsQuiz) ||
    (mentionsVer && (mentionsQuiz || mentionsPreview));
  const publishRequested = publishKeywords.some((keyword) => normalized.includes(keyword));

  if (hasNegation && (previewRequested || publishRequested)) {
    return { preview: false, publish: false };
  }

  return { preview: previewRequested, publish: publishRequested };
};

const isQuestionChangeRequest = (userMessage: string): boolean => {
  const normalized = normalizeText(userMessage);
  const questionTerms = ['pergunta', 'perguntas', 'questao', 'questoes', 'opcao', 'opcoes'];
  const changeTerms = [
    'ajuste', 'ajustar', 'ajusta', 'edite', 'editar', 'edita', 'mude', 'mudar', 'muda',
    'troque', 'trocar', 'troca', 'altere', 'alterar', 'altera', 'reescreva', 'reescrever',
    'adicione', 'adicionar', 'adiciona', 'inclua', 'incluir', 'inclui', 'remova', 'remover',
    'crie', 'criar', 'cria', 'gera', 'gerar', 'mais', 'nova', 'novas', 'substitua', 'substituir'
  ];

  const mentionsQuestion = questionTerms.some((term) => normalized.includes(term));
  const mentionsChange = changeTerms.some((term) => normalized.includes(term));

  return mentionsQuestion && mentionsChange;
};

const normalizeOption = (option?: Partial<AnswerOption>) => ({
  id: option?.id ?? null,
  text: option?.text ?? null,
  icon: option?.icon ?? null,
  targetOutcomeId: option?.targetOutcomeId ?? null,
});

const normalizeQuestion = (question?: Partial<Question>) => ({
  id: question?.id ?? null,
  text: question?.text ?? null,
  imageUrl: question?.imageUrl ?? null,
  allowMultiple: question?.allowMultiple ?? null,
  options: (question?.options || []).map(normalizeOption),
});

const normalizeOutcome = (outcome?: Partial<Outcome>) => ({
  id: outcome?.id ?? null,
  title: outcome?.title ?? null,
  description: outcome?.description ?? null,
  imageUrl: outcome?.imageUrl ?? null,
  ctaText: outcome?.ctaText ?? null,
  ctaUrl: outcome?.ctaUrl ?? null,
});

const normalizeLeadGen = (leadGen?: QuizDraft['leadGen']) => ({
  enabled: leadGen?.enabled ?? null,
  title: leadGen?.title ?? null,
  description: leadGen?.description ?? null,
  ctaText: leadGen?.ctaText ?? null,
  fields: leadGen?.fields ? [...leadGen.fields] : [],
});

const areQuestionArraysEquivalent = (
  baseQuestions?: Partial<Question>[],
  updatedQuestions?: Partial<Question>[]
): boolean => {
  const base = (baseQuestions || []).map(normalizeQuestion);
  const updated = (updatedQuestions || []).map(normalizeQuestion);
  return JSON.stringify(base) === JSON.stringify(updated);
};

const areOutcomeArraysEquivalent = (
  baseOutcomes?: Partial<Outcome>[],
  updatedOutcomes?: Partial<Outcome>[]
): boolean => {
  const base = (baseOutcomes || []).map(normalizeOutcome);
  const updated = (updatedOutcomes || []).map(normalizeOutcome);
  return JSON.stringify(base) === JSON.stringify(updated);
};

const areLeadGenEquivalent = (base?: QuizDraft['leadGen'], updated?: QuizDraft['leadGen']): boolean =>
  JSON.stringify(normalizeLeadGen(base)) === JSON.stringify(normalizeLeadGen(updated));

/**
 * Detects which sections were actually updated so loading highlights stay in sync.
 */
const detectAppliedSections = (baseQuiz: QuizDraft, updatedQuiz: QuizDraft): LoadingSections => {
  const introductionChanged =
    baseQuiz.title !== updatedQuiz.title ||
    baseQuiz.description !== updatedQuiz.description ||
    baseQuiz.coverImageUrl !== updatedQuiz.coverImageUrl ||
    baseQuiz.ctaText !== updatedQuiz.ctaText ||
    baseQuiz.ctaUrl !== updatedQuiz.ctaUrl;

  return {
    introduction: introductionChanged,
    questions: !areQuestionArraysEquivalent(baseQuiz.questions, updatedQuiz.questions),
    outcomes: !areOutcomeArraysEquivalent(baseQuiz.outcomes, updatedQuiz.outcomes),
    leadGen: !areLeadGenEquivalent(baseQuiz.leadGen, updatedQuiz.leadGen),
  };
};

type ChatInterfaceProps = {
  userName?: string;
  onOpenPreview?: () => void;
  onPublish?: () => void;
  onPublishUpdate?: () => void;
  isPublishing?: boolean;
  hasUnpublishedChanges?: boolean;
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

  // Helper to filter out undefined values so we don't overwrite existing data
  const filterUndefined = (obj: T): T => {
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        filtered[key] = value;
      }
    }
    return filtered as T;
  };

  incoming.forEach((item) => {
    const matchIndex = findMatchIndex(item);
    if (matchIndex >= 0) {
      // Only merge non-undefined values to preserve existing imageUrl, etc.
      const filteredItem = filterUndefined(item);
      const currentId = (merged[matchIndex] as { id?: string }).id;
      const incomingId = (filteredItem as { id?: string }).id;
      if (currentId && incomingId && currentId !== incomingId) {
        delete (filteredItem as { id?: string }).id;
      }
      merged[matchIndex] = { ...merged[matchIndex], ...filteredItem } as T;
    } else {
      merged.push({ ...item });
    }
  });

  return merged;
};



const applyExtractionResult = (
  baseQuiz: QuizDraft,
  extraction: AIExtractionResult,
  options?: {
    mergeExisting?: boolean;
    isRemoval?: boolean;
    userConfirmedOutcomes?: boolean;
    userConfirmedLeadGen?: boolean;
    allowQuestionUpdates?: boolean;
  }
): QuizDraft => {
  const {
    mergeExisting = false,
    isRemoval = false,
    userConfirmedOutcomes = false,
    userConfirmedLeadGen = false,
    allowQuestionUpdates = false,
  } = options || {};
  const nextQuiz: QuizDraft = { ...baseQuiz };

  // Phase detection for workflow enforcement:
  // - Phase 1 (Intro): No confirmed title yet → only allow title/description/ctaText
  // - Phase 2 (Outcomes): Has title, no outcomes yet → allow outcomes, not questions
  // - Phase 3 (Questions): Has outcomes → allow questions
  const hasConfirmedIntro = Boolean(
    baseQuiz.title &&
    baseQuiz.title !== 'Meu Novo Quiz' &&
    baseQuiz.description
  );
  const hasConfirmedOutcomes = Boolean(
    baseQuiz.outcomes &&
    baseQuiz.outcomes.length > 0
  );
  const hasExistingQuestions = Boolean(
    baseQuiz.questions &&
    baseQuiz.questions.length > 0
  );

  // Always apply intro fields
  if (extraction.title) nextQuiz.title = extraction.title;
  if (extraction.description) nextQuiz.description = extraction.description;
  if (extraction.coverImageUrl) nextQuiz.coverImageUrl = extraction.coverImageUrl;
  if (extraction.ctaText) nextQuiz.ctaText = extraction.ctaText;
  if (extraction.ctaUrl) nextQuiz.ctaUrl = extraction.ctaUrl;

  // Only apply outcomes if intro is confirmed (Phase 2+)
  // Additional check: if outcomes don't exist yet, require explicit confirmation from user
  if (Array.isArray(extraction.outcomes) && extraction.outcomes.length > 0) {
    if (!hasConfirmedIntro) {
      console.log('[Phase Enforcement] Skipping outcomes - intro not confirmed yet', {
        currentTitle: baseQuiz.title,
        hasDescription: Boolean(baseQuiz.description),
        outcomesCount: extraction.outcomes.length,
      });
    } else if (!hasConfirmedOutcomes && !userConfirmedOutcomes) {
      // First time adding outcomes - require explicit user confirmation
      console.log('[Phase Enforcement] Skipping outcomes - first time adding, waiting for explicit confirmation', {
        hasExistingOutcomes: hasConfirmedOutcomes,
        userConfirmedOutcomes,
        incomingOutcomesCount: extraction.outcomes.length,
      });
    } else {
      // Strip imagePrompt before merging as it's not part of the Outcome type in the store
      const outcomesToApply = extraction.outcomes.map(({ imagePrompt, ...rest }) => rest);

      // Use replace (not merge) when user is requesting removal OR when explicitly replacing
      if (isRemoval || !mergeExisting) {
        console.log('[Outcomes] Replacing outcomes (removal or replace mode)', { count: outcomesToApply.length, isRemoval });
        nextQuiz.outcomes = outcomesToApply;
      } else {
        console.log('[Outcomes] Merging outcomes', { existing: nextQuiz.outcomes?.length, incoming: outcomesToApply.length });
        nextQuiz.outcomes = mergeEntityCollections(nextQuiz.outcomes || [], outcomesToApply);
      }
    }
  }

  // Only apply questions if outcomes are confirmed (Phase 3)
  if (Array.isArray(extraction.questions) && extraction.questions.length > 0) {
    if (!hasConfirmedOutcomes) {
      console.log('[Phase Enforcement] Skipping questions - outcomes not confirmed yet', {
        hasIntro: hasConfirmedIntro,
        outcomesCount: baseQuiz.outcomes?.length || 0,
        questionsCount: extraction.questions.length,
      });
    } else if (hasExistingQuestions && !allowQuestionUpdates) {
      console.log('[Phase Enforcement] Skipping questions - no update requested', {
        existingQuestions: baseQuiz.questions?.length || 0,
        incomingQuestions: extraction.questions.length,
      });
    } else {
      // Strip imagePrompt before merging as it's not part of the Question type in the store
      const questionsToMerge = extraction.questions.map(({ imagePrompt, ...rest }) => rest);

      if (mergeExisting) {
        if (questionsToMerge.length > 0) {
          nextQuiz.questions = mergeEntityCollections(nextQuiz.questions || [], questionsToMerge);
        }
      } else {
        nextQuiz.questions = questionsToMerge;
      }
    }
  }

  // Only apply leadGen if questions are confirmed (Phase 4)
  // LeadGen should ONLY be configured after all other sections are done
  const hasConfirmedQuestions = Boolean(
    baseQuiz.questions &&
    baseQuiz.questions.length > 0
  );

  if (extraction.leadGen) {
    if (!hasConfirmedQuestions) {
      console.log('[Phase Enforcement] Skipping leadGen - questions not confirmed yet', {
        hasIntro: hasConfirmedIntro,
        outcomesCount: baseQuiz.outcomes?.length || 0,
        questionsCount: baseQuiz.questions?.length || 0,
        leadGenEnabled: extraction.leadGen.enabled,
      });
    } else if (!userConfirmedLeadGen) {
      console.log('[Phase Enforcement] Skipping leadGen - user did not confirm', {
        hasConfirmedQuestions,
        leadGenEnabled: extraction.leadGen.enabled,
      });
    } else {
      console.log('[LeadGen] Applying extraction leadGen:', extraction.leadGen);
      nextQuiz.leadGen = {
        ...baseQuiz.leadGen,
        ...extraction.leadGen,
        // Ensure fields are definitely assigned if provided, not deep merged in a weird way
        fields: extraction.leadGen.fields || baseQuiz.leadGen?.fields || [],
        enabled: extraction.leadGen.enabled ?? baseQuiz.leadGen?.enabled ?? false,
      };
      console.log('[LeadGen] Result:', nextQuiz.leadGen);
    }
  }

  return nextQuiz;
};


export function ChatInterface({
  userName,
  onOpenPreview,
  onPublish,
  onPublishUpdate,
  isPublishing = false,
  hasUnpublishedChanges = false,
}: ChatInterfaceProps) {
  const chatHistory = useQuizBuilderStore((state) => state.chatHistory);
  const addChatMessage = useQuizBuilderStore((state) => state.addChatMessage);
  const setExtracting = useQuizBuilderStore((state) => state.setExtracting);
  const setError = useQuizBuilderStore((state) => state.setError);
  const consumeManualChanges = useQuizBuilderStore((state) => state.consumeManualChanges);
  const hasSeenWelcomeMessage = useQuizBuilderStore((state) => state.hasSeenWelcomeMessage);
  const setHasSeenWelcomeMessage = useQuizBuilderStore((state) => state.setHasSeenWelcomeMessage);
  const setLoadingSections = useQuizBuilderStore((state) => state.setLoadingSections);
  const clearLoadingSections = useQuizBuilderStore((state) => state.clearLoadingSections);

  const quiz = useQuizBuilderStore((state) => state.quiz);
  const updateQuizField = useQuizBuilderStore((state) => state.updateQuizField);
  const updateOutcome = useQuizBuilderStore((state) => state.updateOutcome);
  const setQuiz = useQuizBuilderStore((state) => state.setQuiz);
  const isSaving = useQuizBuilderStore((state) => state.isSaving);

  const [isLoading, setIsLoading] = useState(false);
  const [isCoverSuggesting, setIsCoverSuggesting] = useState(false);
  const [actionRequest, setActionRequest] = useState<{ preview: boolean; publish: boolean } | null>(null);
  const [lastCoverPrompt, setLastCoverPrompt] = useState('');
  const [lastSuggestedCoverUrl, setLastSuggestedCoverUrl] = useState('');
  const [publishedButtonHovered, setPublishedButtonHovered] = useState(false);
  const [copiedPublishedUrl, setCopiedPublishedUrl] = useState(false);
  const aiService = useMemo(() => new AIService({ userName }), [userName]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Request counter to implement "latest request wins" pattern for cover suggestions
  // This prevents flickering when multiple requests are made in quick succession
  const coverRequestIdRef = useRef(0);
  // Track if main flow already triggered a cover suggestion (to avoid duplicate from extraction)
  const coverSuggestionTriggeredRef = useRef(false);
  const outcomeImageRequestIdRef = useRef<Record<string, number>>({});
  const lastOutcomeImagePromptRef = useRef<Record<string, string>>({});
  const lastSuggestedOutcomeImageUrlRef = useRef<Record<string, string>>({});

  const handleCopyPublishedUrl = async () => {
    if (!quiz?.id || !quiz?.isPublished) return;

    const quizUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/quiz/${quiz.id}`
      : '';

    if (!quizUrl) return;

    try {
      const copiedSuccessfully = await copyToClipboard(quizUrl);
      if (!copiedSuccessfully) throw new Error('Clipboard not supported');

      setCopiedPublishedUrl(true);
      toast.success('Link copiado!', {
        description: 'O link público do quiz foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopiedPublishedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy quiz URL:', error);
      toast.error('Erro ao copiar', {
        description: 'Não foi possível copiar o link. Tente novamente.',
      });
    }
  };

  const isQuizReadyForActions = useMemo(() => {
    if (!quiz) return false;

    const hasIntro = Boolean(
      quiz.title &&
      quiz.title !== 'Meu Novo Quiz' &&
      quiz.description?.trim()
    );

    const hasOutcomesReady = Boolean(
      quiz.outcomes &&
      quiz.outcomes.length > 0 &&
      quiz.outcomes.every(
        (outcome) => Boolean(outcome?.title?.trim() && outcome?.description?.trim())
      )
    );

    const hasQuestionsReady = Boolean(
      quiz.questions &&
      quiz.questions.length > 0 &&
      quiz.questions.every(
        (question) => Boolean(
          question?.text?.trim() &&
          Array.isArray(question.options) &&
          question.options.length > 0
        )
      )
    );

    const hasLeadDecision = quiz.leadGen?.enabled !== undefined;

    return hasIntro && hasOutcomesReady && hasQuestionsReady && hasLeadDecision;
  }, [quiz]);

  // Load conversation history into AI service when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      aiService.loadHistory(chatHistory);
    }
  }, [chatHistory, aiService]);

  // Send welcome message when chat becomes empty (new quiz or cleared chat)
  useEffect(() => {
    if (!quiz?.id) {
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

      const data = (await response.json()) as { imageUrl?: string; url?: string };
      // Handle both formats just in case
      const imageUrl = data.imageUrl || data.url;

      if (!imageUrl) {
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
      const isAbsoluteUrl = /^https?:\/\//i.test(imageUrl);
      if (!isAbsoluteUrl) {
        console.warn('[Outcome Image] URL inválida recebida', imageUrl);
        return;
      }

      updateOutcome(outcomeId, { imageUrl });
      lastOutcomeImagePromptRef.current[outcomeId] = prompt;
      lastSuggestedOutcomeImageUrlRef.current[outcomeId] = imageUrl;

    } catch (error) {
      console.error('Erro ao sugerir imagem de resultado:', error);
    }
  };

  const maybeSuggestQuestionImage = async (request: { questionId: string; prompt: string }) => {
    const { questionId, prompt } = request;

    try {
      const response = await fetch('/api/image-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Failed to fetch image suggestion');

      const data = (await response.json()) as { imageUrl?: string; url?: string };
      const imageUrl = data.imageUrl || data.url;

      if (imageUrl) {
        const title = useQuizBuilderStore.getState().quiz.title; // Just to trigger a specific store selector if needed, but we use getState() so it's fine.
        const currentQuestion = useQuizBuilderStore.getState().quiz.questions?.find(q => q.id === questionId);

        if (currentQuestion) {
          // Access store directly to update question
          useQuizBuilderStore.getState().updateQuestion(questionId, {
            text: currentQuestion.text || '', // text is required partial
            imageUrl: imageUrl
          });
        }
      }
    } catch (error) {
      console.error('Error getting question image suggestion:', error);
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
      'aprovo', 'aprovado', 'pode seguir', 'continua', 'proximo',
      'quero' // Added: "quero captar leads" should trigger
    ];

    const hasConfirmation = confirmationKeywords.some((keyword) =>
      normalizedUser.includes(keyword)
    );

    const assistantActionKeywords = [
      'vou atualizar', 'vou adicionar', 'adicionei', 'atualizei', 'criei', 'vamos aos',
      'ajustei', 'ajustamos', 'ajuste realizado', 'alterei', 'alteramos', 'editei',
      'modifiquei', 'modificamos', 'mudei', 'mudamos', 'corrigi', 'corrigimos',
      'reformulei', 'reescrevi', 'encurtei', 'simplifiquei', 'removi',
      'captacao de leads', 'lead', 'configurei', 'apliquei', 'aplicamos', 'aplicado', 'inclui', 'incluiu', 'incluimos', 'inseri', 'inserimos'
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
      'resumir', 'reduza', 'reduzir', 'ajuste a pergunta', 'ajuste o resultado',
      'adiciona', 'adicionar', 'adicione', 'inclua', 'incluir', 'inclui', 'coloque', 'colocar', 'coloca',
      'insira', 'inserir', 'insere', 'complete', 'completar', 'completa', 'preencha', 'preencher',
      'crie', 'criar', 'cria', 'gera', 'gerar'
    ];

    const hasEditRequest = editRequestKeywords.some((keyword) =>
      normalizedUser.includes(keyword)
    );

    // Action requests that should trigger tool calls
    const actionRequestKeywords = [
      'captar leads', 'captar lead', 'coletar leads', 'coletar dados',
      'ativar', 'habilitar', 'ative', 'habilite',
      'configurar leads', 'configurar captacao'
    ];

    const hasActionRequest = actionRequestKeywords.some((keyword) =>
      normalizedUser.includes(keyword)
    );

    return hasConfirmation || assistantIndicatesUpdate || hasEditRequest || hasActionRequest;
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
    const previousAssistantMessage = [...chatHistory]
      .reverse()
      .find((message) => message.role === 'assistant')?.content;
    const nextActionRequest = detectActionRequest(content);
    setActionRequest(
      nextActionRequest.preview || nextActionRequest.publish ? nextActionRequest : null
    );

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

        // Detect if this is a removal request or explicit outcome confirmation
        const userRequestedRemoval = isRemovalRequest(content);
        const userConfirmedOutcomes = isOutcomeConfirmation(content);
        const userConfirmedLeadGen = isLeadGenConfirmation(content, previousAssistantMessage);
        const userRequestedQuestionChanges = isQuestionChangeRequest(content);

        console.log('[Flow] Extraction options', {
          userRequestedRemoval,
          userConfirmedOutcomes,
          userConfirmedLeadGen,
          userRequestedQuestionChanges,
        });

        const updatedQuiz = applyExtractionResult(latestQuiz, extraction, {
          mergeExisting: !userRequestedRemoval, // Don't merge when removing
          isRemoval: userRequestedRemoval,
          userConfirmedOutcomes,
          userConfirmedLeadGen,
          allowQuestionUpdates: userRequestedQuestionChanges,
        });

        // Set loading state only for sections that actually changed
        const sectionsToUpdate = detectAppliedSections(latestQuiz, updatedQuiz);
        setLoadingSections(sectionsToUpdate);

        setQuiz(updatedQuiz);

        // Clear loading after a delay for visual feedback
        setTimeout(() => {
          clearLoadingSections();
        }, 1500);

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

              // Skip if the outcome already has an imageUrl set by the user
              if (match?.imageUrl) {
                console.log('[Flow] Skipping outcome image suggestion - already has image', {
                  outcomeId: match.id,
                  existingUrl: match.imageUrl?.slice(0, 40),
                });
                return;
              }

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

        // Process question image prompts from extraction
        if (extraction.questions?.length) {
          extraction.questions.forEach((question) => {
            if (question.imagePrompt && question.text) {
              const match = updatedQuiz.questions?.find(
                (q) => q.id === question.id || q.text === question.text
              );

              // Skip if the question already has an imageUrl set by the user
              if (match?.imageUrl) {
                console.log('[Flow] Skipping question image suggestion - already has image', {
                  questionId: match.id,
                  existingUrl: match.imageUrl?.slice(0, 40),
                });
                return;
              }

              if (match?.id) {
                console.log('[Flow] Triggering question image suggestion from extraction', {
                  questionId: match.id,
                  prompt: question.imagePrompt,
                });
                void maybeSuggestQuestionImage({
                  questionId: match.id,
                  prompt: question.imagePrompt,
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
        // Get the last user message from chat history for detection
        const lastUserMessage = updatedHistory.filter(m => m.role === 'user').pop()?.content || '';
        const userRequestedRemoval = isRemovalRequest(lastUserMessage);
        const userConfirmedOutcomes = isOutcomeConfirmation(lastUserMessage);
        const lastUserIndex = (() => {
          for (let i = updatedHistory.length - 1; i >= 0; i -= 1) {
            if (updatedHistory[i].role === 'user') {
              return i;
            }
          }
          return -1;
        })();
        const previousAssistantMessage = lastUserIndex > 0
          ? updatedHistory.slice(0, lastUserIndex).reverse().find((message) => message.role === 'assistant')?.content
          : undefined;
        const userConfirmedLeadGen = isLeadGenConfirmation(lastUserMessage, previousAssistantMessage);
        const userRequestedQuestionChanges = isQuestionChangeRequest(lastUserMessage);

        const updatedQuiz = applyExtractionResult(latestQuiz, extracted, {
          mergeExisting: !userRequestedRemoval,
          isRemoval: userRequestedRemoval,
          userConfirmedOutcomes,
          userConfirmedLeadGen,
          allowQuestionUpdates: userRequestedQuestionChanges,
        });

        // Set loading state only for sections that actually changed
        const sectionsToUpdate = detectAppliedSections(latestQuiz, updatedQuiz);
        setLoadingSections(sectionsToUpdate);

        setQuiz(updatedQuiz);

        // Clear loading after a delay for visual feedback
        setTimeout(() => {
          clearLoadingSections();
        }, 1500);

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

              // Skip if the outcome already has an imageUrl set by the user
              if (match?.imageUrl) {
                console.log('[Extraction] Skipping outcome image suggestion - already has image', {
                  outcomeId: match?.id,
                  existingUrl: match.imageUrl?.slice(0, 40),
                });
                return;
              }

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

        // Process question image prompts from extraction (fallback flow)
        if (extracted.questions?.length) {
          extracted.questions.forEach((question) => {
            if (question.imagePrompt && question.text) {
              const match = updatedQuiz.questions?.find(
                (q) => q.id === question.id || q.text === question.text
              );

              // Skip if the question already has an imageUrl set by the user
              if (match?.imageUrl) {
                console.log('[Extraction] Skipping question image suggestion - already has image', {
                  questionId: match?.id,
                  existingUrl: match.imageUrl?.slice(0, 40),
                });
                return;
              }

              if (match?.id) {
                console.log('[Extraction] Triggering question image suggestion', {
                  questionId: match.id,
                  prompt: question.imagePrompt,
                });
                void maybeSuggestQuestionImage({
                  questionId: match.id,
                  prompt: question.imagePrompt,
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

  const canPreview = typeof onOpenPreview === 'function';
  const canPublish = Boolean(!quiz?.isPublished && typeof onPublish === 'function');
  const canUpdateLive = Boolean(quiz?.isPublished && hasUnpublishedChanges && typeof onPublishUpdate === 'function');
  const requestedPreview = Boolean(actionRequest?.preview);
  const requestedPublish = Boolean(actionRequest?.publish);
  const showPreviewAction = canPreview && (isQuizReadyForActions || requestedPreview);
  const showPublishAction = canPublish && (isQuizReadyForActions || requestedPublish);
  const showUpdateAction = canUpdateLive && (isQuizReadyForActions || requestedPublish);
  const showPublishedAction = Boolean(
    quiz?.isPublished &&
    !hasUnpublishedChanges &&
    (isQuizReadyForActions || requestedPreview || requestedPublish)
  );
  const shouldShowActionRow = (showPreviewAction || showPublishAction || showUpdateAction || showPublishedAction);
  const actionBusy = isLoading || isPublishing || isSaving;

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
            {shouldShowActionRow && (
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-muted/50 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Quiz pronto! Escolha o próximo passo direto aqui.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quiz?.isPublished
                      ? hasUnpublishedChanges
                        ? 'Há alterações pendentes no quiz ao vivo. Visualize ou atualize direto pelo chat.'
                        : 'Quiz publicado sem pendências. Visualize rapidinho ou copie o link público.'
                      : 'Revise no preview ou publique quando estiver pronto.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {showPreviewAction && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onOpenPreview}
                      disabled={actionBusy}
                      className="flex-1 min-w-[160px] gap-2"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Pré-visualizar
                    </Button>
                  )}
                  {showPublishedAction && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyPublishedUrl}
                      onMouseEnter={() => setPublishedButtonHovered(true)}
                      onMouseLeave={() => setPublishedButtonHovered(false)}
                      disabled={actionBusy}
                      className={`flex-1 min-w-[160px] gap-2 transition-all duration-200 ${copiedPublishedUrl
                        ? 'text-green-600 border-green-500/50 bg-green-500/10'
                        : publishedButtonHovered
                          ? 'text-primary border-primary/50'
                          : 'text-green-600 border-green-500/50 bg-green-500/10'
                        }`}
                      title={copiedPublishedUrl ? 'URL copiada' : 'Clique para copiar URL do quiz'}
                    >
                      {copiedPublishedUrl ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Copiado!
                        </>
                      ) : publishedButtonHovered ? (
                        <>
                          <Link2 className="h-4 w-4" aria-hidden="true" />
                          Copiar URL
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4" aria-hidden="true" />
                          Publicado
                        </>
                      )}
                    </Button>
                  )}
                  {showPublishAction && (
                    <Button
                      type="button"
                      onClick={onPublish}
                      disabled={actionBusy}
                      className="flex-1 min-w-[160px] gap-2"
                    >
                      <Rocket className="h-4 w-4" aria-hidden="true" />
                      {isPublishing ? 'Publicando...' : 'Publicar'}
                    </Button>
                  )}
                  {showUpdateAction && (
                    <Button
                      type="button"
                      onClick={onPublishUpdate}
                      disabled={actionBusy}
                      className="flex-1 min-w-[180px] gap-2"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      {isPublishing ? 'Atualizando...' : 'Atualizar quiz ao vivo'}
                    </Button>
                  )}
                </div>
              </div>
            )}
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
