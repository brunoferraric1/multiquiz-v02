'use client';

import { ArrowLeft, Rocket, Link2, Check, MoreVertical, EyeOff, Undo2, RefreshCw, LineChart, Globe } from 'lucide-react';
import { useState } from 'react';
import type { Quiz, QuizDraft, QuizSnapshot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/lib/hooks/use-auth';
import { useDeleteQuizMutation } from '@/lib/hooks/use-quiz-queries';
import { DeleteQuizDialog } from '@/components/dashboard/delete-quiz-dialog';
import { BuilderActionsDrawer } from './builder-actions-drawer';
import { UnsavedChangesDialog } from './unsaved-changes-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRouter } from 'next/navigation';

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
  const [publishedButtonHovered, setPublishedButtonHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [isUpdatingAndExiting, setIsUpdatingAndExiting] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const deleteQuizMutation = useDeleteQuizMutation();

  const handleDelete = async () => {
    if (!user || !quiz.id) return;

    try {
      await deleteQuizMutation.mutateAsync({ quizId: quiz.id, userId: user.uid });
      setShowDeleteDialog(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Erro ao excluir quiz. Tente novamente.');
    }
  };

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
      toast.success('Link copiado!', {
        description: 'O link público do quiz foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy quiz URL:', error);
      toast.error('Erro ao copiar', {
        description: 'Não foi possível copiar o link. Tente novamente.',
      });
    }
  };

  const handleBack = () => {
    // If published quiz with unpublished changes, show confirmation dialog
    if (quiz.isPublished && hasUnpublishedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    onBack();
  };

  const handleUpdateAndExit = async () => {
    if (!onPublishUpdate) {
      onBack();
      return;
    }
    setIsUpdatingAndExiting(true);
    try {
      await onPublishUpdate();
      setShowUnsavedDialog(false);
      onBack();
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setIsUpdatingAndExiting(false);
    }
  };

  const handleExitWithoutUpdating = () => {
    setShowUnsavedDialog(false);
    onBack();
  };

  // Status badge - desktop only shows Rascunho (Publicado shown via button)
  // Mobile shows both since actions are in the drawer
  const statusBadge = quiz.isPublished ? (
    <Badge variant="published" className="sm:hidden">Publicado</Badge>
  ) : (
    <Badge variant="draft">Rascunho</Badge>
  );

  // Determine primary action button (desktop only)
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
      // Published with changes - show Atualizar button (yellow to match notification)
      return (
        <Button
          size="icon-text"
          onClick={onPublishUpdate}
          disabled={isPublishing}
          className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
        >
          <RefreshCw size={16} />
          {isPublishing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      );
    }

    // Published with no changes - show Publicado button that reveals copy URL on hover
    return (
      <Button
        size="icon-text"
        variant="outline"
        onClick={handleCopyUrl}
        onMouseEnter={() => setPublishedButtonHovered(true)}
        onMouseLeave={() => setPublishedButtonHovered(false)}
        className={`gap-2 h-9 transition-all duration-200 ${copied
          ? 'text-green-600 border-green-500/50 bg-green-500/10'
          : publishedButtonHovered
            ? 'text-primary border-primary/50'
            : 'text-green-600 border-green-500/50 bg-green-500/10'
          }`}
        title={copied ? 'URL copiada' : 'Clique para copiar URL do quiz'}
      >
        {copied ? (
          <>
            <Check size={16} />
            <span className="text-sm font-semibold">Copiado!</span>
          </>
        ) : publishedButtonHovered ? (
          <>
            <Link2 size={16} />
            <span className="text-sm font-semibold">Copiar URL</span>
          </>
        ) : (
          <>
            <Globe size={16} />
            <span className="text-sm font-semibold">Publicado</span>
          </>
        )}
      </Button>
    );
  };

  return (
    <>
      <header className="bg-card/80 border-b border-border/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left side - Back button + Title with Badge */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:w-auto sm:gap-2 sm:px-3 border border-border/60 bg-background/40 flex-shrink-0"
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

              <div className="flex items-center gap-3 min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">
                  {quiz.title || 'Novo Quiz'}
                </h1>
                <div className="flex-shrink-0">
                  {statusBadge}
                </div>
              </div>
            </div>

            {/* Right side - Desktop: Full actions, Mobile: Just 3-dots */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Desktop actions - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">

                {renderPrimaryButton()}

                {/* Three-dot menu (desktop) */}
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
                  <PopoverContent align="end" className="w-56 p-1">
                    {quiz.isPublished ? (
                      <>
                        {/* Pending changes section */}
                        {hasUnpublishedChanges && (
                          <>
                            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                              <span>Alterações pendentes</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                onPublishUpdate?.();
                              }}
                              disabled={isPublishing}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                            >
                              <RefreshCw size={16} />
                              Publicar alterações
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                onDiscardChanges?.();
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <Undo2 size={16} />
                              Descartar alterações
                            </button>
                            <div className="h-px bg-border my-1" />
                          </>
                        )}

                        {/* Copy link */}
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyUrl();
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors ${copied ? 'text-green-600 dark:text-green-500' : ''}`}
                        >
                          {copied ? <Check size={16} /> : <Link2 size={16} />}
                          {copied ? 'Link copiado!' : 'Copiar link público'}
                        </button>

                        {/* Unpublish */}
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setShowUnpublishDialog(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-orange-500 hover:bg-orange-500/10 transition-colors"
                        >
                          <EyeOff size={16} />
                          Despublicar quiz
                        </button>

                        <div className="h-px bg-border my-1" />

                        {/* Reports */}
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            router.push(`/dashboard/reports/${quiz.id}`);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <LineChart size={16} />
                          Ver relatório
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setShowDeleteDialog(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Deletar quiz
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mobile: Only 3-dots button that opens bottom drawer */}
              <div className="relative sm:hidden">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 border border-border/60 bg-background/40"
                  onClick={() => setMobileDrawerOpen(true)}
                >
                  <MoreVertical size={16} />
                  <span className="sr-only">Menu de opções</span>
                </Button>
                {/* Yellow notification dot for unpublished changes */}
                {quiz.isPublished && hasUnpublishedChanges && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-500 animate-pulse border-2 border-card" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile actions drawer */}
      <BuilderActionsDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        quiz={quiz}
        onPublish={onPublish}
        onPublishUpdate={onPublishUpdate}
        onUnpublish={() => {
          setMobileDrawerOpen(false);
          setShowUnpublishDialog(true);
        }}
        onDiscardChanges={onDiscardChanges}
        onCopyLink={handleCopyUrl}
        onDelete={() => setShowDeleteDialog(true)}
        isPublishing={isPublishing}
        hasUnpublishedChanges={hasUnpublishedChanges}
        copied={copied}
      />

      {/* Delete confirmation dialog */}
      <DeleteQuizDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title={quiz.title || 'Novo Quiz'}
        isDeleting={deleteQuizMutation.isPending}
      />

      {/* Unsaved changes confirmation dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onUpdateAndExit={handleUpdateAndExit}
        onExitWithoutUpdating={handleExitWithoutUpdating}
        isUpdating={isUpdatingAndExiting}
      />

      {/* Unpublish confirmation dialog */}
      <ConfirmDialog
        open={showUnpublishDialog}
        onOpenChange={setShowUnpublishDialog}
        onConfirm={() => {
          setShowUnpublishDialog(false);
          onUnpublish?.();
        }}
        title="Despublicar quiz?"
        description="O quiz não estará mais acessível para novos participantes. Os dados de respostas anteriores serão mantidos."
        confirmText="Despublicar"
        confirmingText="Despublicando..."
        isConfirming={isPublishing}
        variant="warning"
      />
    </>
  );
}
