'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type DragEvent } from 'react';
import {
  ArrowLeft,
  Eye,
  ImageIcon,
  Plus,
  Rocket,
  X,
  GripVertical,
  MessageSquare,
  PenSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import { cn, compressImage } from '@/lib/utils';
import type { Outcome, Question } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatInterface } from '@/components/chat/chat-interface';
import { BuilderHeader } from '@/components/builder/builder-header';
import { SaveIndicator } from '@/components/builder/save-indicator';
import { EditQuestionModal } from '@/components/builder/edit-question-modal';
import { PublishSuccessModal } from '@/components/builder/publish-success-modal';
import { Upload } from '@/components/ui/upload';
import { QuizPlayer } from '@/components/quiz/quiz-player';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type ActiveSheet =
  | { type: 'introduction' }
  | { type: 'outcome'; id: string };
type MobileViewMode = 'chat' | 'editor';

const fieldLabelClass = 'text-sm font-medium text-muted-foreground';

export default function BuilderContent({ isEditMode = false }: { isEditMode?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [outcomeFile, setOutcomeFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<MobileViewMode>('chat');
  void isEditMode;

  const { forceSave, cancelPendingSave } = useAutoSave({
    userId: user?.uid,
    enabled: true,
    debounceMs: 30000,
  });

  const quiz = useQuizBuilderStore((state) => state.quiz);
  const updateQuizField = useQuizBuilderStore((state) => state.updateQuizField);
  const addQuestion = useQuizBuilderStore((state) => state.addQuestion);
  const updateQuestion = useQuizBuilderStore((state) => state.updateQuestion);
  const addOutcome = useQuizBuilderStore((state) => state.addOutcome);
  const updateOutcome = useQuizBuilderStore((state) => state.updateOutcome);
  const reorderQuestions = useQuizBuilderStore((state) => state.reorderQuestions);

  const questions = quiz.questions ?? [];
  const outcomes = quiz.outcomes ?? [];
  const canReorderQuestions = questions.length > 1;
  const isDraggingQuestion = draggedQuestionIndex !== null;
  const shouldShowDropIndicator = (position: number) =>
    canReorderQuestions && isDraggingQuestion && dropIndicatorIndex === position;

  const editingQuestion = editingQuestionId
    ? questions.find((question) => question.id === editingQuestionId) ?? null
    : null;
  const activeOutcome =
    activeSheet?.type === 'outcome'
      ? outcomes.find((outcome) => outcome.id === activeSheet.id)
      : undefined;

  useEffect(() => {
    if (activeSheet?.type === 'outcome' && !activeOutcome) {
      setActiveSheet(null);
    }
  }, [activeSheet, activeOutcome]);

  useEffect(() => {
    if (!quiz.coverImageUrl) {
      setCoverFile(null);
    }
  }, [quiz.coverImageUrl]);

  useEffect(() => {
    if (!activeOutcome?.imageUrl) {
      setOutcomeFile(null);
    }
  }, [activeOutcome?.imageUrl, activeOutcome?.id]);

  const handleAddQuestion = () => {
    const newQuestion: Partial<Question> = {
      id: crypto.randomUUID(),
      text: '',
      options: [],
    };
    addQuestion(newQuestion);
    if (newQuestion.id) {
      setEditingQuestionId(newQuestion.id);
    }
  };

  const handleQuestionSave = (updatedQuestion: Partial<Question>) => {
    if (updatedQuestion.id) {
      updateQuestion(updatedQuestion.id, updatedQuestion);
    }
    setEditingQuestionId(null);
  };

  const handleAddOutcome = () => {
    const newOutcome: Partial<Outcome> = {
      id: crypto.randomUUID(),
      title: 'Novo resultado',
      description: '',
    };
    addOutcome(newOutcome);
    if (newOutcome.id) {
      setActiveSheet({ type: 'outcome', id: newOutcome.id });
    }
  };

  const handleCoverImageChange = async (file: File | null) => {
    setCoverFile(file);
    const persistCoverChange = async (value: string) => {
      updateQuizField('coverImageUrl', value);
      await forceSave();
    };

    if (!file) {
      await persistCoverChange('');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      await persistCoverChange(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing cover image:', error);
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        updateQuizField('coverImageUrl', reader.result as string);
        void forceSave();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOutcomeImageChange = async (file: File | null) => {
    setOutcomeFile(file);

    if (!activeOutcome?.id) return;
    const outcomeId = activeOutcome.id;

    if (!file) {
      updateOutcome(outcomeId, { imageUrl: '' });
      await forceSave();
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      updateOutcome(outcomeId, { imageUrl: compressedDataUrl });
      await forceSave();
    } catch (error) {
      console.error('Error compressing outcome image:', error);
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        updateOutcome(outcomeId, { imageUrl: reader.result as string });
        void forceSave();
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleOutcomeFieldChange = (field: keyof Outcome, value: string) => {
    if (!activeOutcome?.id) return;
    updateOutcome(activeOutcome.id, { [field]: value });
  };

  const resetQuestionDragState = () => {
    setDraggedQuestionIndex(null);
    setDropIndicatorIndex(null);
  };

  const handleQuestionDragStart = (event: DragEvent<HTMLButtonElement>, index: number) => {
    if (!canReorderQuestions) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    setDraggedQuestionIndex(index);
    setDropIndicatorIndex(index);
  };

  const handleQuestionDragOver = (event: DragEvent<HTMLButtonElement>, index: number) => {
    if (draggedQuestionIndex === null) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - bounds.top;
    const shouldPlaceBefore = offsetY < bounds.height / 2;
    const targetIndex = shouldPlaceBefore ? index : index + 1;
    setDropIndicatorIndex(targetIndex);
    event.dataTransfer.dropEffect = 'move';
  };

  const handleQuestionDrop = (event: DragEvent<HTMLButtonElement>) => {
    if (draggedQuestionIndex === null || dropIndicatorIndex === null) return;
    event.preventDefault();
    event.stopPropagation();
    reorderQuestions(draggedQuestionIndex, dropIndicatorIndex);
    resetQuestionDragState();
  };

  const handleQuestionDragEnd = () => {
    resetQuestionDragState();
  };

  const handleEndDropZoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (draggedQuestionIndex === null) return;
    event.preventDefault();
    setDropIndicatorIndex(questions.length);
    event.dataTransfer.dropEffect = 'move';
  };

  const handleEndDropZoneDrop = (event: DragEvent<HTMLDivElement>) => {
    if (draggedQuestionIndex === null) return;
    event.preventDefault();
    reorderQuestions(draggedQuestionIndex, questions.length);
    resetQuestionDragState();
  };

  const handleBack = async () => {
    if (!user) {
      router.push('/dashboard');
      return;
    }

    try {
      cancelPendingSave();
      await forceSave();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving quiz before leaving:', error);
      // Navigate anyway - data is likely already auto-saved
      router.push('/dashboard');
    }
  };

  const handlePublish = async () => {
    if (!user) return;

    try {
      setIsPublishing(true);
      cancelPendingSave();

      console.log('[Publish] Before update - isPublished:', quiz.isPublished);
      console.log('[Publish] Quiz has questions:', questions.length);
      console.log('[Publish] Quiz has outcomes:', outcomes.length);

      updateQuizField('isPublished', true);

      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const currentState = useQuizBuilderStore.getState().quiz;
      console.log('[Publish] After update - isPublished:', currentState.isPublished);

      await forceSave();

      console.log('[Publish] Save completed, showing modal');
      setShowPublishModal(true);
    } catch (error) {
      console.error('Error publishing quiz:', error);
      alert('Erro ao publicar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!user) return;

    try {
      setIsPublishing(true);
      cancelPendingSave();
      updateQuizField('isPublished', false);
      await forceSave();
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      alert('Erro ao despublicar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShowPublishModal = () => {
    setShowPublishModal(true);
  };

  const introDescription = quiz.description
    ? quiz.description
    : 'Conte mais sobre o que torna esse quiz especial.';
  const coverImagePreview = quiz.coverImageUrl ? quiz.coverImageUrl : undefined;

  const sheetOpen = Boolean(activeSheet);
  const mobileViewOptions: { id: MobileViewMode; label: string; icon: LucideIcon }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'editor', label: 'Editor', icon: PenSquare },
  ];

  const editorPanel = (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Estrutura do Quiz</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye size={16} />
            Visualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-10 overflow-y-auto min-h-0 p-6 pt-0">
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Introdução
          </div>
          <button
            type="button"
            onClick={() => setActiveSheet({ type: 'introduction' })}
            className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-border bg-primary/10 text-primary">
                {quiz.coverImageUrl ? (
                  <img
                    src={quiz.coverImageUrl}
                    alt="Capa do quiz"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {quiz.title || 'Meu Novo Quiz'}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {introDescription}
                </p>
              </div>
            </div>
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Perguntas ({questions.length})
            </span>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-primary transition hover:bg-primary/10"
              aria-label="Adicionar pergunta"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {questions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                Adicione a primeira pergunta do quiz
              </div>
            )}
            {questions.map((question, index) => {
              const isDragging = draggedQuestionIndex === index;

              return (
                <div key={question.id ?? index} className="space-y-2">
                  {shouldShowDropIndicator(index) && (
                    <div
                      className="h-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    draggable={canReorderQuestions}
                    aria-grabbed={isDragging}
                    onClick={() =>
                      question.id && setEditingQuestionId(question.id)
                    }
                    onDragStart={(event) => handleQuestionDragStart(event, index)}
                    onDragOver={(event) => handleQuestionDragOver(event, index)}
                    onDrop={handleQuestionDrop}
                    onDragEnd={handleQuestionDragEnd}
                    className={cn(
                      'group w-full rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      {
                        'opacity-60': isDragging,
                      }
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {question.text || 'Pergunta sem texto'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(question.options?.length ?? 0)} opções
                        </p>
                      </div>
                      {canReorderQuestions && (
                        <GripVertical
                          className="h-4 w-4 flex-shrink-0 text-muted-foreground/70 transition-opacity duration-200 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
            {canReorderQuestions && (
              <div
                onDragOver={handleEndDropZoneDragOver}
                onDrop={handleEndDropZoneDrop}
                onDragLeave={() => {
                  setDropIndicatorIndex((current) =>
                    current === questions.length ? null : current
                  );
                }}
                className={cn(
                  'my-2 h-0.5 rounded-full transition-colors',
                  shouldShowDropIndicator(questions.length)
                    ? 'bg-primary'
                    : 'bg-transparent'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Resultados ({outcomes.length})
            </span>
            <button
              type="button"
              onClick={handleAddOutcome}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-primary transition hover:bg-primary/10"
              aria-label="Adicionar resultado"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {outcomes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                Nenhum resultado definido
              </div>
            ) : (
              outcomes.map((outcome, index) => (
                <button
                  key={outcome.id ?? index}
                  type="button"
                  onClick={() =>
                    outcome.id && setActiveSheet({ type: 'outcome', id: outcome.id })
                  }
                  className="w-full rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {outcome.title || 'Resultado sem título'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {outcome.description || 'Sem descrição'}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
  return (
    <div className="fixed inset-0 flex flex-col">
      <div className={`h-full flex flex-col ${isPreviewOpen ? 'hidden' : ''}`}>
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <BuilderHeader
            quiz={quiz}
            isPreview={false}
            onBack={handleBack}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onShowPublishModal={handleShowPublishModal}
            isPublishing={isPublishing}
          />
        </div>

        {/* Mobile View Toggle - Fixed on mobile */}
        <div className="flex-shrink-0 flex justify-center lg:hidden px-4 py-3 bg-background">
          <div className="inline-flex gap-1 rounded-full border border-border bg-muted p-1">
            {mobileViewOptions.map((option) => {
              const Icon = option.icon;
              const isActive = mobileView === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMobileView(option.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-[var(--cursor-interactive)]',
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-hidden min-h-0">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
            {/* Grid Layout - Proper height constraints for scrolling */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8 h-full">
              <div className={cn(
                "h-full min-h-0 lg:col-span-3",
                mobileView === 'editor' && 'hidden lg:block'
              )}>
                <ChatInterface />
              </div>

              <div className={cn(
                "h-full min-h-0 lg:col-span-2",
                mobileView === 'chat' && 'hidden lg:block'
              )}>
                {editorPanel}
              </div>
            </div>
          </div>
        </main>

        <Sheet open={sheetOpen} onOpenChange={(open) => !open && setActiveSheet(null)}>
          <SheetContent className="max-w-lg">
            {activeSheet?.type === 'introduction' && (
              <>
                <SheetHeader>
                  <SheetTitle>Introdução</SheetTitle>
                  <SheetDescription>
                    Atualize o título e a descrição para deixar o quiz alinhado com sua proposta.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Título</p>
                    <Input
                      value={quiz.title ?? ''}
                      onChange={(event) => updateQuizField('title', event.target.value)}
                      placeholder="Título do seu quiz"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Descrição</p>
                    <Textarea
                      value={quiz.description ?? ''}
                      onChange={(event) => updateQuizField('description', event.target.value)}
                      placeholder="Descreva o que o participante vai viver"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Imagem principal</p>
                    <Upload
                      file={coverFile}
                      previewUrl={coverImagePreview}
                      onFileChange={handleCoverImageChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Texto do CTA</p>
                    <Input
                      value={quiz.ctaText ?? ''}
                      onChange={(event) => updateQuizField('ctaText', event.target.value)}
                      placeholder="Quer saber mais?"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>URL do CTA</p>
                    <Input
                      type="url"
                      value={quiz.ctaUrl ?? ''}
                      onChange={(event) => updateQuizField('ctaUrl', event.target.value)}
                      placeholder="https://seusite.com/cta"
                    />
                  </div>
                </div>
              </>
            )}

            {activeSheet?.type === 'outcome' && activeOutcome && (
              <>
                <SheetHeader>
                  <SheetTitle>Resultado</SheetTitle>
                  <SheetDescription>
                    Defina o título e a descrição desse resultado para mostrar o impacto que o participante teve.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Imagem do resultado</p>
                    <Upload
                      file={outcomeFile}
                      previewUrl={activeOutcome.imageUrl || undefined}
                      onFileChange={handleOutcomeImageChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Título</p>
                    <Input
                      value={activeOutcome.title ?? ''}
                      onChange={(event) => handleOutcomeFieldChange('title', event.target.value)}
                      placeholder="Título do resultado"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Descrição</p>
                    <Textarea
                      value={activeOutcome.description ?? ''}
                      onChange={(event) => handleOutcomeFieldChange('description', event.target.value)}
                      placeholder="Descreva esse resultado"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>Texto do CTA</p>
                    <Input
                      value={activeOutcome.ctaText ?? ''}
                      onChange={(event) => handleOutcomeFieldChange('ctaText', event.target.value)}
                      placeholder="Quer saber mais?"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className={fieldLabelClass}>URL do CTA</p>
                    <Input
                      type="url"
                      value={activeOutcome.ctaUrl ?? ''}
                      onChange={(event) => handleOutcomeFieldChange('ctaUrl', event.target.value)}
                      placeholder="https://seusite.com/cta"
                    />
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <EditQuestionModal
          open={editingQuestionId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingQuestionId(null);
            }
          }}
          question={editingQuestion}
          outcomes={outcomes}
          onSave={handleQuestionSave}
        />

        <PublishSuccessModal
          open={showPublishModal}
          onOpenChange={setShowPublishModal}
          quizId={quiz.id || ''}
        />
      </div>

      {isPreviewOpen && (
        <div className="absolute inset-0 z-10 flex">
          <div className="relative flex h-full w-full flex-col bg-background">
            <BuilderHeader
              quiz={quiz}
              isPreview={true}
              onBack={() => setIsPreviewOpen(false)}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onShowPublishModal={handleShowPublishModal}
              isPublishing={isPublishing}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-20 right-4 sm:right-6 lg:right-8 z-10 rounded-full bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background/80 hover:text-foreground"
              aria-label="Fechar pré-visualização"
            >
              <X size={20} />
            </Button>
            <main className="flex-1 bg-muted/40 overflow-auto">
              <QuizPlayer quiz={quiz} mode="preview" onExit={() => setIsPreviewOpen(false)} />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
