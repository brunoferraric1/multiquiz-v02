'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizService } from '@/lib/services/quiz-service';
import { QuizPlayer } from '@/components/quiz/quiz-player';
import type { Quiz } from '@/types';

export default function PublicQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[PublicQuiz] Loading quiz:', quizId);
        const loadedQuiz = await QuizService.getQuizById(quizId);
        console.log('[PublicQuiz] Loaded quiz:', {
          id: loadedQuiz?.id,
          title: loadedQuiz?.title,
          isPublished: loadedQuiz?.isPublished,
          questionCount: loadedQuiz?.questions?.length,
          outcomeCount: loadedQuiz?.outcomes?.length,
        });

        if (!loadedQuiz) {
          console.error('[PublicQuiz] Quiz not found');
          setError('Quiz não encontrado');
          return;
        }

        if (!loadedQuiz.isPublished) {
          console.error('[PublicQuiz] Quiz is not published:', loadedQuiz.isPublished);
          setError('Este quiz não está publicado');
          return;
        }

        console.log('[PublicQuiz] Quiz is valid and published, setting quiz state');

        setQuiz(loadedQuiz);

        // Increment view count
        await QuizService.incrementStat(quizId, 'views');
      } catch (err) {
        console.error('[PublicQuiz] Error loading quiz:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('[PublicQuiz] Error details:', errorMessage);
        setError(`Erro ao carregar quiz: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      void loadQuiz();
    }
  }, [quizId]);

  const handleExit = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Oops!</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <QuizPlayer quiz={quiz} mode="live" onExit={handleExit} />
    </div>
  );
}
