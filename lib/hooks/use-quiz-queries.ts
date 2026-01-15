'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuizService } from '@/lib/services/quiz-service';
import type { Quiz, QuizDraft } from '@/types';

export function useQuizQuery(quizId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => (quizId ? QuizService.getQuizById(quizId, userId) : null),
    enabled: !!quizId,
  });
}

export function useUserQuizzesQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['quizzes', userId],
    queryFn: () => (userId ? QuizService.getUserQuizzes(userId) : []),
    enabled: !!userId,
    staleTime: 0, // Always refetch to prevent stale image cache issues
    refetchOnMount: 'always', // Always refetch when component mounts
  });
}

export function useSaveQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quiz, userId }: { quiz: QuizDraft; userId: string }) =>
      QuizService.saveQuiz(quiz, userId),
    onSuccess: (quizId, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      queryClient.invalidateQueries({ queryKey: ['quizzes', variables.userId] });
    },
  });
}

export function useDeleteQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, userId }: { quizId: string; userId: string }) =>
      QuizService.deleteQuiz(quizId, userId),
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['quizzes', variables.userId] });
    },
  });
}

export function useTogglePublishMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, userId }: { quizId: string; userId: string }) =>
      QuizService.togglePublishQuiz(quizId, userId),
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quizzes', variables.userId] });
    },
  });
}
