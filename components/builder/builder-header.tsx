'use client';

import { ArrowLeft, Rocket, Link2, Check, MoreVertical, EyeOff, Undo2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { Quiz, QuizDraft, QuizSnapshot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BuilderHeaderProps {
  quiz: QuizDraft | Quiz;
  isPreview: boolean;
  onBack: () => void;
  onPublish: () => void;
  onPublishUpdate?: () => void;
  onUnpublish?: () => void;
  onDiscardChanges?: () => void;
  isPublishing: boolean;
  hasUnpublishedChanges?: boolean;
  publishedVersion?: QuizSnapshot | null;
}

export function BuilderHeader({
  quiz,
  isPreview,
  onBack,
  onPublish,
  onPublishUpdate,
  onUnpublish,
  onDiscardChanges,
  isPublishing,
  hasUnpublishedChanges = false,
}: BuilderHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Status badge with pending changes indicator
  const statusBadge = quiz.isPublished ? (
    <Badge variant="published" className="gap-1.5">
      Publicado
      {hasUnpublishedChanges && (
        <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
      )}
    </Badge>
  ) : (
    <Badge variant="draft">Rascunho</Badge>
  );

  // Determine primary action button
  const renderPrimaryButton = () => {
    if (!quiz.isPublished) {
      // Draft quiz - show Publicar button
      return (
        <Button
          size="icon-text"
          onClick={onPublish}
          disabled={isPublishing}
          className="gap-2"
        >
          <Rocket size={16} />
          {isPublishing ? 'Publicando...' : 'Publicar'}
        </Button>
      );
    }

    if (hasUnpublishedChanges) {
      // Published with changes - show Atualizar button
      return (
        <Button
          size="icon-text"
          onClick={onPublishUpdate}
          disabled={isPublishing}
          className="gap-2"
        >
          <RefreshCw size={16} />
          {isPublishing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      );
    }

    // Published with no changes - show checkmark
    return (
      <Button
        size="icon-text"
        variant="outline"
        disabled
        className="gap-2 opacity-60"
      >
        <Check size={16} />
        Publicado
      </Button>
    );
  };

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

          {/* Right side - Copy URL + Primary action + Menu */}
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
                <span className="text-sm font-semibold hidden sm:inline">copiar</span>
              </Button>
            )}

            {renderPrimaryButton()}

            {/* Three-dot menu */}
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9"
                >
                  <MoreVertical size={16} />
                  <span className="sr-only">Menu de opções</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1">
                {quiz.isPublished ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onUnpublish?.();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <EyeOff size={16} />
                      Despublicar
                    </button>
                    {hasUnpublishedChanges && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDiscardChanges?.();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <Undo2 size={16} />
                        Descartar alterações
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      // TODO: Add delete quiz functionality
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Deletar quiz
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
}
