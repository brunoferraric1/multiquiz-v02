'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
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
  Contact as ContactIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
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
import { DrawerFooter } from '@/components/builder/drawer-footer';
import { Upload } from '@/components/ui/upload';
import { LoadingCard } from '@/components/ui/loading-card';
import { LeadGenSheet } from '@/components/builder/lead-gen-sheet';
import { QuizPlayer } from '@/components/quiz/quiz-player';
import { QuizService } from '@/lib/services/quiz-service';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ActiveSheet =
  | { type: 'introduction' }
  | { type: 'outcome'; id: string }
  | { type: 'lead-gen' };
type MobileViewMode = 'chat' | 'editor';

const fieldLabelClass = 'text-sm font-medium text-muted-foreground';

// UUID v4 generator with crypto.randomUUID fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function BuilderContent({ isEditMode = false }: { isEditMode?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const searchParams = useSearchParams();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [outcomeFile, setOutcomeFile] = useState<File | null>(null);

  // Initialize from URL param if present
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => {
    return searchParams.get('mode') === 'preview';
  });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<MobileViewMode>('chat');
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);

  // Draft state for Introduction
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftCtaText, setDraftCtaText] = useState('');
  const [draftCoverImageUrl, setDraftCoverImageUrl] = useState('');

  // Draft state for Outcome
  const [draftOutcomeTitle, setDraftOutcomeTitle] = useState('');
  const [draftOutcomeDescription, setDraftOutcomeDescription] = useState('');
  const [draftOutcomeCtaText, setDraftOutcomeCtaText] = useState('');
  const [draftOutcomeCtaUrl, setDraftOutcomeCtaUrl] = useState('');
  const [draftOutcomeImageUrl, setDraftOutcomeImageUrl] = useState('');

  void isEditMode;

  const { forceSave, cancelPendingSave } = useAutoSave({
    userId: user?.uid,
    enabled: true,
    debounceMs: 30000,
  });

  const resolvedUserName = useMemo(() => {
    const fromDisplayName = user?.displayName?.trim();
    const fromEmail = user?.email ? user.email.split('@')[0]?.trim() : '';
    const base = fromDisplayName || fromEmail || '';
    if (!base) return 'Criador';

    const cleaned = base.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'Criador';

    const firstName = cleaned.split(' ')[0] || cleaned;
    const normalizedFirstName = firstName.charAt(0).toLocaleUpperCase('pt-BR') + firstName.slice(1);
    return normalizedFirstName;
  }, [user?.displayName, user?.email]);

  const quiz = useQuizBuilderStore((state) => state.quiz);
  const updateQuizField = useQuizBuilderStore((state) => state.updateQuizField);
  const addQuestion = useQuizBuilderStore((state) => state.addQuestion);
  const updateQuestion = useQuizBuilderStore((state) => state.updateQuestion);
  const addOutcome = useQuizBuilderStore((state) => state.addOutcome);
  const updateOutcome = useQuizBuilderStore((state) => state.updateOutcome);
  const reorderQuestions = useQuizBuilderStore((state) => state.reorderQuestions);
  const publishedVersion = useQuizBuilderStore((state) => state.publishedVersion);
  const setPublishedVersion = useQuizBuilderStore((state) => state.setPublishedVersion);
  const loadPublishedVersion = useQuizBuilderStore((state) => state.loadPublishedVersion);
  const loadingSections = useQuizBuilderStore((state) => state.loadingSections);

  // Refs for sidebar sections (for auto-scroll)
  const introductionRef = useRef<HTMLElement>(null);
  const questionsRef = useRef<HTMLElement>(null);
  const outcomesRef = useRef<HTMLElement>(null);
  const leadGenRef = useRef<HTMLElement>(null);

  // Auto-scroll to loading sections
  useEffect(() => {
    // Find the first section that is loading and scroll to it
    let targetRef: React.RefObject<HTMLElement | null> | null = null;

    if (loadingSections.introduction) {
      targetRef = introductionRef;
    } else if (loadingSections.outcomes) {
      targetRef = outcomesRef;
    } else if (loadingSections.questions) {
      targetRef = questionsRef;
    } else if (loadingSections.leadGen) {
      targetRef = leadGenRef;
    }

    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loadingSections]);

  // Compute hasUnpublishedChanges
  // Explicitly depend on stringified questions/outcomes to detect nested changes
  const questionsJson = useMemo(() => JSON.stringify(quiz.questions), [quiz.questions]);
  const outcomesJson = useMemo(() => JSON.stringify(quiz.outcomes), [quiz.outcomes]);

  const hasUnpublishedChanges = useMemo(() => {
    if (!quiz.isPublished) return false;

    // For legacy quizzes published before draft/live separation,
    // publishedVersion will be null. Show indicator so user can push initial snapshot.
    if (!publishedVersion) return true;

    // Build current snapshot with same shape as what we compare against
    const currentSnapshot = {
      title: quiz.title,
      description: quiz.description,
      coverImageUrl: quiz.coverImageUrl,
      ctaText: quiz.ctaText,
      primaryColor: quiz.primaryColor,
      questions: quiz.questions,
      outcomes: quiz.outcomes,
      leadGen: quiz.leadGen,
    };

    // Build a comparable version of publishedVersion with leadGen included
    // This handles legacy published versions that don't have leadGen
    const comparablePublishedVersion = {
      ...publishedVersion,
      leadGen: publishedVersion.leadGen, // will be undefined for legacy
    };

    // For comparison, normalize both: if one has undefined leadGen and other has default, treat as equal
    const normalizedCurrent = {
      ...currentSnapshot,
      leadGen: currentSnapshot.leadGen?.enabled ? currentSnapshot.leadGen : undefined,
    };
    const normalizedPublished = {
      ...comparablePublishedVersion,
      leadGen: comparablePublishedVersion.leadGen?.enabled ? comparablePublishedVersion.leadGen : undefined,
    };

    return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedPublished);
  }, [
    quiz.isPublished,
    quiz.title,
    quiz.description,
    quiz.coverImageUrl,
    quiz.ctaText,
    quiz.primaryColor,
    quiz.leadGen,
    questionsJson,
    outcomesJson,
    publishedVersion,
  ]);

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

  // Sync draft state when Introduction sheet opens
  useEffect(() => {
    if (activeSheet?.type === 'introduction') {
      setDraftTitle(quiz.title ?? '');
      setDraftDescription(quiz.description ?? '');
      setDraftCtaText(quiz.ctaText ?? '');
      setDraftCoverImageUrl(quiz.coverImageUrl ?? '');
      setCoverFile(null);
    }
  }, [activeSheet, quiz.title, quiz.description, quiz.ctaText, quiz.coverImageUrl]);

  // Sync draft state when Outcome sheet opens
  useEffect(() => {
    if (activeSheet?.type === 'outcome' && activeOutcome) {
      setDraftOutcomeTitle(activeOutcome.title ?? '');
      setDraftOutcomeDescription(activeOutcome.description ?? '');
      setDraftOutcomeCtaText(activeOutcome.ctaText ?? '');
      setDraftOutcomeCtaUrl(activeOutcome.ctaUrl ?? '');
      setDraftOutcomeImageUrl(activeOutcome.imageUrl ?? '');
      setOutcomeFile(null);
    }
  }, [activeSheet, activeOutcome]);

  const handleAddQuestion = () => {
    const newQuestion: Partial<Question> = {
      id: generateUUID(),
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
      id: generateUUID(),
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

    if (!file) {
      setDraftCoverImageUrl('');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setDraftCoverImageUrl(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing cover image:', error);
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        setDraftCoverImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOutcomeImageChange = async (file: File | null) => {
    setOutcomeFile(file);

    if (!file) {
      setDraftOutcomeImageUrl('');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setDraftOutcomeImageUrl(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing outcome image:', error);
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        setDraftOutcomeImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveIntroduction = async () => {
    updateQuizField('title', draftTitle);
    updateQuizField('description', draftDescription);
    updateQuizField('ctaText', draftCtaText);
    updateQuizField('coverImageUrl', draftCoverImageUrl);
    await forceSave();
    setActiveSheet(null);
    toast.success('Salvo');
  };

  const handleCancelIntroduction = () => {
    setDraftTitle(quiz.title ?? '');
    setDraftDescription(quiz.description ?? '');
    setDraftCtaText(quiz.ctaText ?? '');
    setDraftCoverImageUrl(quiz.coverImageUrl ?? '');
    setCoverFile(null);
    setActiveSheet(null);
  };

  const handleSaveOutcome = async () => {
    if (!activeOutcome?.id) return;

    updateOutcome(activeOutcome.id, {
      title: draftOutcomeTitle,
      description: draftOutcomeDescription,
      ctaText: draftOutcomeCtaText,
      ctaUrl: draftOutcomeCtaUrl,
      imageUrl: draftOutcomeImageUrl,
    });
    await forceSave();
    setActiveSheet(null);
    toast.success('Salvo');
  };

  const handleCancelOutcome = () => {
    if (activeOutcome) {
      setDraftOutcomeTitle(activeOutcome.title ?? '');
      setDraftOutcomeDescription(activeOutcome.description ?? '');
      setDraftOutcomeCtaText(activeOutcome.ctaText ?? '');
      setDraftOutcomeCtaUrl(activeOutcome.ctaUrl ?? '');
      setDraftOutcomeImageUrl(activeOutcome.imageUrl ?? '');
      setOutcomeFile(null);
    }
    setActiveSheet(null);
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
    if (!user || !quiz.id) return;

    try {
      setIsPublishing(true);
      cancelPendingSave();

      // First save any pending changes
      await forceSave();

      // Then publish using the new service method
      await QuizService.publishQuiz(quiz.id, user.uid);

      // Update local state with the new published version
      const snapshot = {
        title: quiz.title || '',
        description: quiz.description || '',
        coverImageUrl: quiz.coverImageUrl,
        ctaText: quiz.ctaText,
        primaryColor: quiz.primaryColor || '#4F46E5',
        questions: (quiz.questions || []) as any,
        outcomes: (quiz.outcomes || []) as any,
        leadGen: quiz.leadGen,
      };
      setPublishedVersion(snapshot, Date.now());
      updateQuizField('isPublished', true);

      setShowPublishModal(true);
      toast.success('Quiz publicado com sucesso!');
    } catch (error) {
      console.error('Error publishing quiz:', error);
      toast.error('Erro ao publicar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  // Called from header - opens confirmation modal
  const handlePublishUpdateClick = () => {
    setShowUpdateConfirmModal(true);
  };

  // Called when user confirms in the modal
  const handlePublishUpdateConfirm = async () => {
    if (!user || !quiz.id) return;

    setShowUpdateConfirmModal(false);

    try {
      setIsPublishing(true);
      cancelPendingSave();

      // First save any pending changes
      await forceSave();

      // Then update the published version
      await QuizService.publishQuiz(quiz.id, user.uid);

      // Update local state with the new published version
      const snapshot = {
        title: quiz.title || '',
        description: quiz.description || '',
        coverImageUrl: quiz.coverImageUrl,
        ctaText: quiz.ctaText,
        primaryColor: quiz.primaryColor || '#4F46E5',
        questions: (quiz.questions || []) as any,
        outcomes: (quiz.outcomes || []) as any,
        leadGen: quiz.leadGen,
      };
      setPublishedVersion(snapshot, Date.now());

      toast.success('Quiz atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating published quiz:', error);
      toast.error('Erro ao atualizar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!user || !quiz.id) return;

    try {
      setIsPublishing(true);
      cancelPendingSave();

      await QuizService.unpublishQuiz(quiz.id, user.uid);
      updateQuizField('isPublished', false);

      toast.success('Quiz despublicado');
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      toast.error('Erro ao despublicar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!publishedVersion) {
      toast.error('Não é possível descartar', {
        description: 'Este quiz foi publicado antes do sistema de versões. Publique novamente para habilitar esta função.',
      });
      return;
    }

    loadPublishedVersion();
    toast.success('Alterações descartadas');
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
        <section ref={introductionRef} className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Introdução
          </div>
          <LoadingCard isLoading={loadingSections.introduction}>
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
          </LoadingCard>
        </section>

        <section ref={questionsRef} className="space-y-3">
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
                  <LoadingCard isLoading={loadingSections.questions}>
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
                        'group w-full rounded-2xl border border-border bg-muted/60 px-4 py-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        {
                          'opacity-60': isDragging,
                        }
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {question.text || 'Pergunta sem texto'}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
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
                  </LoadingCard>
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

        <section ref={outcomesRef} className="space-y-3">
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
              outcomes.map((outcome) => (
                <LoadingCard key={outcome.id} isLoading={loadingSections.outcomes}>
                  <button
                    type="button"
                    onClick={() => outcome.id && setActiveSheet({ type: 'outcome', id: outcome.id })}
                    className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-border bg-primary/10 text-primary">
                        {outcome.imageUrl ? (
                          <img
                            src={outcome.imageUrl}
                            alt="Resultado"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center">
                            <Rocket className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {outcome.title || 'Novo resultado'}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {outcome.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                  </button>
                </LoadingCard>
              ))
            )}
          </div>
        </section>

        <section ref={leadGenRef} className="space-y-3 pb-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Captura de Leads
          </div>
          <LoadingCard isLoading={loadingSections.leadGen}>
            <button
              type="button"
              onClick={() => setActiveSheet({ type: 'lead-gen' })}
              className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary">
                  <ContactIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {quiz.leadGen?.enabled ? 'Ativado' : 'Desativado'}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {quiz.leadGen?.enabled
                      ? `${(quiz.leadGen.fields || []).length} campos solicitados`
                      : 'Configure a captura de dados dos participantes'}
                  </p>
                </div>
              </div>
            </button>
          </LoadingCard>
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
            onPublishUpdate={handlePublishUpdateClick}
            onUnpublish={handleUnpublish}
            onDiscardChanges={handleDiscardChanges}
            isPublishing={isPublishing}
            hasUnpublishedChanges={hasUnpublishedChanges}
            publishedVersion={publishedVersion}
          />
        </div>

        {/* Mobile View Toggle - Fixed on mobile */}
        <div className="flex-shrink-0 flex justify-center md:hidden px-4 py-3 bg-background">
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
          <div className="h-full max-w-7xl mx-auto">
            {/* Grid Layout - Proper height constraints for scrolling */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-8 h-full md:px-8 md:py-8">
              <div className={cn(
                "h-full min-h-0 md:col-span-3 px-4 py-4 md:px-0 md:py-0",
                mobileView === 'editor' && 'hidden md:block'
              )}>
                <ChatInterface userName={resolvedUserName} />
              </div>

              <div className={cn(
                "h-full min-h-0 md:col-span-2 px-4 py-4 md:px-0 md:py-0",
                mobileView === 'chat' && 'hidden md:block'
              )}>
                {editorPanel}
              </div>
            </div>
          </div>
        </main>

        <Sheet open={sheetOpen} onOpenChange={(open) => !open && setActiveSheet(null)}>
          <SheetContent
            className="max-w-lg flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:min-h-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {activeSheet?.type === 'introduction' && (
              <>
                <SheetHeader className="flex-shrink-0 pb-6">
                  <SheetTitle className="text-2xl">Introdução</SheetTitle>
                  <SheetDescription>
                    Atualize o título e a descrição para deixar o quiz alinhado com sua proposta.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto relative min-h-0">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Título</p>
                      <Input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        placeholder="Título do seu quiz"
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Descrição</p>
                      <Textarea
                        value={draftDescription}
                        onChange={(event) => setDraftDescription(event.target.value)}
                        placeholder="Descreva o que o participante vai viver"
                        rows={4}
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Imagem principal</p>
                      <Upload
                        file={coverFile}
                        previewUrl={draftCoverImageUrl || undefined}
                        onFileChange={handleCoverImageChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Texto do CTA</p>
                      <Input
                        value={draftCtaText}
                        onChange={(event) => setDraftCtaText(event.target.value)}
                        placeholder="Começar quiz"
                        autoFocus={false}
                      />
                    </div>
                  </div>
                  {/* Gradient overlay for fade effect - sticky to stay at bottom of viewport */}
                  <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                </div>
              </>
            )}

            {activeSheet?.type === 'outcome' && activeOutcome && (
              <>
                <SheetHeader className="flex-shrink-0 pb-6">
                  <SheetTitle className="text-2xl">Resultado</SheetTitle>
                  <SheetDescription>
                    Defina o título e a descrição desse resultado para mostrar o impacto que o participante teve.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto relative min-h-0">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Título</p>
                      <Input
                        value={draftOutcomeTitle}
                        onChange={(event) => setDraftOutcomeTitle(event.target.value)}
                        placeholder="Título do resultado"
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Descrição</p>
                      <Textarea
                        value={draftOutcomeDescription}
                        onChange={(event) => setDraftOutcomeDescription(event.target.value)}
                        placeholder="Descreva esse resultado"
                        rows={4}
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Imagem do resultado</p>
                      <Upload
                        file={outcomeFile}
                        previewUrl={draftOutcomeImageUrl || undefined}
                        onFileChange={handleOutcomeImageChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>Texto do CTA</p>
                      <Input
                        value={draftOutcomeCtaText}
                        onChange={(event) => setDraftOutcomeCtaText(event.target.value)}
                        placeholder="Quer saber mais?"
                        autoFocus={false}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className={fieldLabelClass}>URL do CTA</p>
                      <Input
                        type="url"
                        value={draftOutcomeCtaUrl}
                        onChange={(event) => setDraftOutcomeCtaUrl(event.target.value)}
                        placeholder="https://seusite.com/cta"
                        autoFocus={false}
                      />
                    </div>
                  </div>
                  {/* Gradient overlay for fade effect - sticky to stay at bottom of viewport */}
                  <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                </div>
              </>
            )}
            {activeSheet?.type === 'lead-gen' && (
              <LeadGenSheet onClose={() => setActiveSheet(null)} />
            )}
            {activeSheet?.type !== 'lead-gen' && (
              <div className="flex-shrink-0 border-t bg-background py-8 mt-auto">
                {activeSheet?.type === 'outcome' && (
                  <DrawerFooter
                    onSave={handleSaveOutcome}
                    onCancel={handleCancelOutcome}
                  />
                )}
                {activeSheet?.type === 'introduction' && (
                  <DrawerFooter
                    onSave={handleSaveIntroduction}
                    onCancel={handleCancelIntroduction}
                  />
                )}
              </div>
            )}
            {/* LeadGenSheet has its own footer */}
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
          loading={isPublishing}
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
              onPublishUpdate={handlePublishUpdateClick}
              onUnpublish={handleUnpublish}
              onDiscardChanges={handleDiscardChanges}
              isPublishing={isPublishing}
              hasUnpublishedChanges={hasUnpublishedChanges}
              publishedVersion={publishedVersion}
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

      {/* Update Confirmation Modal */}
      <Dialog open={showUpdateConfirmModal} onOpenChange={setShowUpdateConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar quiz publicado?</DialogTitle>
            <DialogDescription>
              As alterações serão refletidas imediatamente no quiz ao vivo. Pessoas que estiverem fazendo o quiz poderão ver as mudanças.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUpdateConfirmModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePublishUpdateConfirm}
              disabled={isPublishing}
            >
              {isPublishing ? 'Atualizando...' : 'Atualizar Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
