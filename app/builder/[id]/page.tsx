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
  const { data: quiz, isLoading, error, dataUpdatedAt } = useQuizQuery(id as string, user?.uid);
  const loadQuiz = useQuizBuilderStore((state) => state.loadQuiz);

  // Track timestamp of last loaded data to allow updates when fresh data arrives
  const loadedTimestampRef = useRef<number>(0);

  // On mount: invalidate cache to get fresh data
  useEffect(() => {
    if (id) {
      // Invalidate cache ONCE on entry to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['quiz', id] });
      // Reset loaded ref so we load the fresh data
      loadedTimestampRef.current = 0;
    }
  }, [id, queryClient]);

  useEffect(() => {
    // Only proceed if we have quiz data and it's newer than what we last loaded
    if (quiz && user && dataUpdatedAt > loadedTimestampRef.current) {
      // Check if user is the owner
      if (quiz.ownerId !== user.uid) {
        alert('Você não tem permissão para editar este quiz.');
        router.push('/dashboard');
        return;
      }
      // Load the quiz into the store
      console.log('[EditQuiz] Loading quiz update from Firestore. Timestamp:', dataUpdatedAt);
      loadQuiz(quiz);
      loadedTimestampRef.current = dataUpdatedAt;
    }
  }, [quiz, user, router, loadQuiz, dataUpdatedAt]);

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
