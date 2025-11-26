'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizQuery } from '@/lib/hooks/use-quiz-queries';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ProtectedRoute } from '@/components/protected-route';
import BuilderContent from '../builder-content';

function EditQuizLoader() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: quiz, isLoading, error } = useQuizQuery(id as string, user?.uid);
  const loadQuiz = useQuizBuilderStore((state) => state.loadQuiz);
  const reset = useQuizBuilderStore((state) => state.reset);
  
  // Track if we've already loaded this quiz to prevent infinite loops
  const loadedQuizIdRef = useRef<string | null>(null);

  // On mount: invalidate cache to get fresh data, reset store
  useEffect(() => {
    if (id) {
      console.log('[EditQuiz] Entering builder, invalidating cache for quiz:', id);
      // Invalidate cache ONCE on entry to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['quiz', id] });
      // Reset loaded ref so we load the fresh data
      loadedQuizIdRef.current = null;
      reset();
    }
  }, [id, queryClient, reset]);

  useEffect(() => {
    // Only proceed if we have quiz data, user, and haven't loaded this quiz yet
    if (quiz && user && loadedQuizIdRef.current !== quiz.id) {
      // Check if user is the owner
      if (quiz.ownerId !== user.uid) {
        alert('Você não tem permissão para editar este quiz.');
        router.push('/dashboard');
        return;
      }
      // Load the quiz into the store ONCE
      console.log('[EditQuiz] Loading quiz from Firestore:', quiz.id, 'coverImageUrl:', quiz.coverImageUrl?.slice(0, 50));
      loadQuiz(quiz);
      loadedQuizIdRef.current = quiz.id;
    }
  }, [quiz, user, router, loadQuiz]);

  // Handle error state separately
  useEffect(() => {
    if (error && !isLoading) {
      console.error('Error loading quiz:', error);
      alert('Erro ao carregar o quiz. Verifique se ele existe.');
      router.push('/dashboard');
    }
  }, [error, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return null; // Will redirect via useEffect
  }

  return <BuilderContent isEditMode={true} />;
}

export default function EditQuizPage() {
  return (
    <ProtectedRoute>
      <EditQuizLoader />
    </ProtectedRoute>
  );
}
