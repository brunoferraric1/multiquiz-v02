import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { QuizBuilderState, QuizDraft, ChatMessage, Question, Outcome, Quiz } from '@/types';

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

        setQuiz: (quiz) => set({ quiz }),

        updateQuizField: (field, value) =>
          set((state) => ({
            quiz: { ...state.quiz, [field]: value },
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
            },
            chatHistory: quiz.conversationHistory || [],
          }),
      }),
      {
        name: 'quiz-builder-storage',
        partialize: (state) => ({
          quiz: state.quiz,
          chatHistory: state.chatHistory,
        }),
      }
    ),
    { name: 'QuizBuilderStore' }
  )
);
