import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  QuizBuilderState,
  QuizDraft,
  ChatMessage,
  Question,
  Outcome,
  Quiz,
  ManualChange,
  QuizSnapshot,
  LoadingSections,
} from '@/types';

const quizFieldLabels: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  coverImageUrl: 'Imagem principal',
  ctaText: 'Texto do CTA',
  ctaUrl: 'URL do CTA',
};

const formatValuePreview = (field: string, value: unknown): string | undefined => {
  if (field.toLowerCase().includes('image')) {
    return 'Imagem atualizada';
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed;
};

const createManualChange = (params: {
  scope: ManualChange['scope'];
  field: string;
  value: unknown;
  entityId?: string;
  entityName?: string;
}): ManualChange | null => {
  const { scope, field, value, entityId, entityName } = params;
  const label =
    quizFieldLabels[field] ||
    (scope === 'question' ? `Pergunta • ${field}` : scope === 'outcome' ? `Resultado • ${field}` : field);
  const valuePreview = formatValuePreview(field, value);

  if (!valuePreview && field.toLowerCase().includes('image') === false) {
    // Skip tracking when there's nothing meaningful to show (e.g., undefined values)
    return null;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scope,
    field,
    label,
    valuePreview,
    entityId,
    entityName,
    timestamp: Date.now(),
  };
};

const pushManualChange = (changes: ManualChange[], change: ManualChange | null): ManualChange[] => {
  if (!change) return changes;
  const filtered = changes.filter(
    (item) => !(item.scope === change.scope && item.field === change.field && item.entityId === change.entityId)
  );
  const updated = [...filtered, change];
  const MAX_CHANGES = 5;
  return updated.slice(-MAX_CHANGES);
};

const initialQuizState: QuizDraft = {
  title: 'Meu Novo Quiz',
  description: '',
  coverImageUrl: '',
  ctaText: '',
  ctaUrl: '',
  questions: [],
  outcomes: [],
  primaryColor: '#4F46E5',
  isPublished: false,
  leadGen: {
    enabled: false,
    fields: [],
  },
};

export const useQuizBuilderStore = create<QuizBuilderState>()(
  devtools(
    persist(
      (set, get) => ({
        quiz: initialQuizState,
        chatHistory: [],
        isExtracting: false,
        isSaving: false,
        error: null,
        hasSeenWelcomeMessage: false,
        pendingManualChanges: [],
        publishedVersion: null,
        publishedAt: null,
        loadingSections: {
          introduction: false,
          questions: false,
          outcomes: false,
          leadGen: false,
        },

        setQuiz: (quiz) => set({ quiz }),

        updateQuizField: (field, value) =>
          set((state) => ({
            quiz: { ...state.quiz, [field]: value },
            pendingManualChanges: pushManualChange(
              state.pendingManualChanges,
              createManualChange({ scope: 'quiz', field: String(field), value })
            ),
          })),

        addQuestion: (question) =>
          set((state) => ({
            quiz: {
              ...state.quiz,
              questions: [...(state.quiz.questions || []), question],
            },
          })),

        updateQuestion: (id, updatedQuestion) =>
          set((state) => ({
            quiz: {
              ...state.quiz,
              questions: state.quiz.questions?.map((q) =>
                q.id === id ? { ...q, ...updatedQuestion } : q
              ),
            },
          })),

        deleteQuestion: (id) =>
          set((state) => ({
            quiz: {
              ...state.quiz,
              questions: state.quiz.questions?.filter((q) => q.id !== id),
            },
          })),

        moveQuestion: (id, direction) =>
          set((state) => {
            const questions = [...(state.quiz.questions || [])];
            const index = questions.findIndex((q) => q.id === id);
            if (index === -1) return state;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= questions.length) return state;

            [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];

            return {
              quiz: { ...state.quiz, questions },
            };
          }),

        reorderQuestions: (sourceIndex, destinationIndex) =>
          set((state) => {
            const questions = [...(state.quiz.questions || [])];
            if (
              sourceIndex < 0 ||
              destinationIndex < 0 ||
              sourceIndex >= questions.length ||
              destinationIndex > questions.length
            ) {
              return state;
            }

            const [movedQuestion] = questions.splice(sourceIndex, 1);
            const insertIndex = destinationIndex > sourceIndex ? destinationIndex - 1 : destinationIndex;
            questions.splice(insertIndex, 0, movedQuestion);

            return {
              quiz: { ...state.quiz, questions },
            };
          }),

        addOutcome: (outcome) =>
          set((state) => ({
            quiz: {
              ...state.quiz,
              outcomes: [...(state.quiz.outcomes || []), outcome],
            },
          })),

        updateOutcome: (id, updatedOutcome) =>
          set((state) => ({
            quiz: {
              ...state.quiz,
              outcomes: state.quiz.outcomes?.map((o) =>
                o.id === id ? { ...o, ...updatedOutcome } : o
              ),
            },
          })),

        deleteOutcome: (id) =>
          set((state) => ({
            quiz: {
              ...state.quiz,
              outcomes: state.quiz.outcomes?.filter((o) => o.id !== id),
            },
          })),

        addChatMessage: (message) =>
          set((state) => ({
            chatHistory: [...state.chatHistory, message],
          })),

        setChatHistory: (history) => set({ chatHistory: history }),

        setHasSeenWelcomeMessage: (value: boolean) => set({ hasSeenWelcomeMessage: value }),

        consumeManualChanges: () => {
          const changes = get().pendingManualChanges;
          set({ pendingManualChanges: [] });
          return changes;
        },

        setExtracting: (isExtracting) => set({ isExtracting }),

        setSaving: (isSaving) => set({ isSaving }),

        setError: (error) => set({ error }),

        reset: () =>
          set({
            quiz: initialQuizState,
            chatHistory: [],
            isExtracting: false,
            isSaving: false,
            error: null,
            hasSeenWelcomeMessage: false,
            pendingManualChanges: [],
            publishedVersion: null,
            publishedAt: null,
            loadingSections: {
              introduction: false,
              questions: false,
              outcomes: false,
              leadGen: false,
            },
          }),

        loadQuiz: (quiz: Quiz) =>
          set({
            quiz: {
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              coverImageUrl: quiz.coverImageUrl,
              ctaText: quiz.ctaText,
              ctaUrl: quiz.ctaUrl,
              primaryColor: quiz.primaryColor,
              questions: quiz.questions,
              outcomes: quiz.outcomes,
              isPublished: quiz.isPublished,
              createdAt: quiz.createdAt,
              updatedAt: quiz.updatedAt,
              stats: quiz.stats,
              ownerId: quiz.ownerId,
              leadGen: quiz.leadGen || {
                enabled: false,
                fields: [],
              },
            },
            chatHistory: quiz.conversationHistory || [],
            hasSeenWelcomeMessage: Boolean((quiz.conversationHistory || []).length),
            pendingManualChanges: [],
            publishedVersion: quiz.publishedVersion || null,
            publishedAt: quiz.publishedAt || null,
          }),

        setPublishedVersion: (version: QuizSnapshot | null, publishedAt: number | null) =>
          set({ publishedVersion: version, publishedAt }),

        loadPublishedVersion: () => {
          const { publishedVersion } = get();
          if (!publishedVersion) return;

          set((state) => ({
            quiz: {
              ...state.quiz,
              title: publishedVersion.title,
              description: publishedVersion.description,
              coverImageUrl: publishedVersion.coverImageUrl,
              ctaText: publishedVersion.ctaText,
              primaryColor: publishedVersion.primaryColor,
              questions: publishedVersion.questions as Partial<Question>[],
              outcomes: publishedVersion.outcomes as Partial<Outcome>[],
              leadGen: publishedVersion.leadGen,
            },
          }));
        },

        setLoadingSections: (sections: Partial<LoadingSections>) =>
          set((state) => ({
            loadingSections: { ...state.loadingSections, ...sections },
          })),

        clearLoadingSections: () =>
          set({
            loadingSections: {
              introduction: false,
              questions: false,
              outcomes: false,
              leadGen: false,
            },
          }),
      }),
      {
        name: 'quiz-builder-storage',
        partialize: (state) => ({
          quiz: state.quiz,
          chatHistory: state.chatHistory,
          hasSeenWelcomeMessage: state.hasSeenWelcomeMessage,
          pendingManualChanges: state.pendingManualChanges,
        }),
      }
    ),
    { name: 'QuizBuilderStore' }
  )
);
