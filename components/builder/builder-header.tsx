'use client';

import { ArrowLeft, Rocket, Link2, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import type { Quiz, QuizDraft } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/copy-to-clipboard';

interface BuilderHeaderProps {
  quiz: QuizDraft | Quiz;
  isPreview: boolean;
  onBack: () => void;
  onPublish: () => void;
  onUnpublish?: () => void;
  onShowPublishModal?: () => void;
  isPublishing: boolean;
}

export function BuilderHeader({
  quiz,
  isPreview,
  onBack,
  onPublish,
  onUnpublish,
  onShowPublishModal,
  isPublishing,
}: BuilderHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    if (!quiz.id) return;

    const quizUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/quiz/${quiz.id}`
      : '';

    if (!quizUrl) return;

    try {
      const copiedSuccessfully = await copyToClipboard(quizUrl);
      if (!copiedSuccessfully) throw new Error('Clipboard not supported');

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy quiz URL:', error);
    }
  };

  const handleBack = () => {
    onBack();
  };

  const statusBadge = quiz.isPublished ? (
    <Badge variant="published">Publicado</Badge>
  ) : (
    <Badge variant="draft">Rascunho</Badge>
  );

  return (
    <header className="bg-card/80 border-b border-border/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md shrink-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left side - Back button + Title with Badge above */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:w-auto sm:gap-2 sm:px-3 border border-border/60 bg-background/40 hover:bg-background/60 flex-shrink-0"
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">
                {isPreview ? 'Editor' : 'Voltar'}
              </span>
              <span className="sr-only sm:hidden">
                {isPreview ? 'Voltar ao editor' : 'Voltar ao dashboard'}
              </span>
            </Button>

            <div className="hidden sm:block h-8 w-px bg-border/60 flex-shrink-0" />

            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {statusBadge}
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">
                {quiz.title || 'Novo Quiz'}
              </h1>
            </div>
          </div>

          {/* Right side - Copy URL + Publish/Unpublish */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {quiz.isPublished && (
              <Button
                size="icon-text"
                variant="outline"
                onClick={handleCopyUrl}
                className="gap-2 h-9"
                title={copied ? 'URL copiada' : 'Copiar URL do quiz'}
              >
                {copied ? <Check size={16} /> : <Link2 size={16} />}
                <span className="text-sm font-semibold">copiar</span>
              </Button>
            )}

            {quiz.isPublished ? (
              <Button
                size="sm"
                variant="outline-destructive"
                onClick={onUnpublish}
                disabled={isPublishing}
                className="gap-2 h-9"
              >
                <EyeOff size={16} />
                <span className="hidden sm:inline">Despublicar</span>
              </Button>
            ) : (
              <Button
                size="icon-text"
                onClick={onPublish}
                disabled={isPublishing}
                className="gap-2"
              >
                <Rocket size={16} />
                {isPublishing ? 'Publicando...' : 'Publicar'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
