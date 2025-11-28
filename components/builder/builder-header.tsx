'use client';

import { ArrowLeft, Rocket, Link2, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import type { Quiz, QuizDraft } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

    try {
      await navigator.clipboard.writeText(quizUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <header className="bg-card border-b shrink-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
              {isPreview ? 'Editor' : 'Voltar'}
            </Button>
            <div className="border-l border-border h-6" />
            <h1 className="text-lg font-semibold truncate max-w-[8rem] sm:max-w-xs md:max-w-md lg:max-w-lg">
              {quiz.title || 'Novo Quiz'}
            </h1>
            {quiz.isPublished ? (
              <Badge variant="published">Publicado</Badge>
            ) : (
              <Badge variant="draft">Rascunho</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {quiz.isPublished ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="gap-2"
                  title="Copiar URL do quiz"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Link2 size={16} />
                      Copiar URL
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onUnpublish}
                  disabled={isPublishing}
                  className="gap-2"
                >
                  <EyeOff size={16} />
                  Despublicar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
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
