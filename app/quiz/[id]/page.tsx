'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { QuizService } from '@/lib/services/quiz-service';
import { getThemeSettings, resolveThemeColors, resolveThemeLogo } from '@/lib/services/brand-kit-service';
import { BlocksQuizPlayer } from '@/components/quiz/blocks-quiz-player';
import type { BrandKitColors, Quiz } from '@/types';

export default function PublicQuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const isPreviewMode = searchParams.get('preview') === 'true';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [brandKitColors, setBrandKitColors] = useState<BrandKitColors | null>(null);
  const [brandKitLogoUrl, setBrandKitLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[PublicQuiz] Loading quiz:', quizId, { isPreviewMode });

        // For preview mode, load the draft version; for live, load published version
        const version = isPreviewMode ? 'draft' : 'published';
        const loadedQuiz = await QuizService.getQuizById(quizId, undefined, version);

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

        // Only check isPublished for live mode, not preview mode
        if (!isPreviewMode && !loadedQuiz.isPublished) {
          console.log('[PublicQuiz] Quiz not published (isPublished =', loadedQuiz.isPublished, ')');
          setError('Este quiz não está publicado');
          return;
        }

        console.log('[PublicQuiz] Quiz loaded successfully', { isPreviewMode, isPublished: loadedQuiz.isPublished });

        setQuiz(loadedQuiz);

        // Increment view count (only for live mode, not preview)
        if (!isPreviewMode) {
          await QuizService.incrementStat(quizId, 'views');
        }
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
  }, [quizId, isPreviewMode]);

  // Load user's theme settings
  useEffect(() => {
    if (!quiz?.ownerId) {
      setBrandKitColors(null);
      setBrandKitLogoUrl(null);
      return;
    }

    let isActive = true;
    getThemeSettings(quiz.ownerId)
      .then((settings) => {
        if (!isActive) return;
        // Always resolve colors (uses default preset if no settings)
        setBrandKitColors(resolveThemeColors(settings));
        setBrandKitLogoUrl(resolveThemeLogo(settings));
      })
      .catch((err) => {
        if (!isActive) return;
        console.error('[PublicQuiz] Error loading theme settings:', err);
        // On error, use default theme colors
        setBrandKitColors(resolveThemeColors(null));
        setBrandKitLogoUrl(null);
      });

    return () => {
      isActive = false;
    };
  }, [quiz?.ownerId]);

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
    <div className="min-h-screen flex flex-col bg-background">
      {isPreviewMode && (
        <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium">
          Modo Preview — Esta é uma pré-visualização do rascunho
        </div>
      )}
      <div className="flex-1 flex items-center justify-center">
        <BlocksQuizPlayer
          quiz={quiz}
          mode={isPreviewMode ? 'preview' : 'live'}
          onExit={handleExit}
          brandKitColors={brandKitColors}
          brandKitLogoUrl={brandKitLogoUrl}
        />
      </div>
    </div>
  );
}
