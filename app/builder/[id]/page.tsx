'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizQuery } from '@/lib/hooks/use-quiz-queries';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { ProtectedRoute } from '@/components/protected-route';
import BuilderContent from '../builder-content';

function EditQuizLoader() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: quiz, isLoading, error } = useQuizQuery(id as string, user?.uid);
  const loadQuiz = useQuizBuilderStore((state) => state.loadQuiz);

  useEffect(() => {
    // Only proceed if we have quiz data and user
    if (quiz && user) {
      // Check if user is the owner
      if (quiz.ownerId !== user.uid) {
        alert('Você não tem permissão para editar este quiz.');
        router.push('/dashboard');
        return;
      }
      // Load the quiz into the store
      loadQuiz(quiz);
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
