'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, ImageIcon, Plus, Rocket, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import { compressImage } from '@/lib/utils';
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

  const questions = quiz.questions ?? [];
  const outcomes = quiz.outcomes ?? [];

  const editingQuestion = editingQuestionId
    ? questions.find((question) => question.id === editingQuestionId)
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
      updateQuizField('isPublished', true);
      await forceSave();
      alert('Quiz publicado com sucesso! 🎉');
    } catch (error) {
      console.error('Error publishing quiz:', error);
      alert('Erro ao publicar quiz');
    } finally {
      setIsPublishing(false);
    }
  };

  const introDescription = quiz.description
    ? quiz.description
    : 'Conte mais sobre o que torna esse quiz especial.';
  const coverImagePreview = quiz.coverImageUrl ? quiz.coverImageUrl : undefined;

  const sheetOpen = Boolean(activeSheet);

  if (isPreviewOpen) {
    return (
      <div className="relative h-screen flex flex-col">
        <BuilderHeader
          quiz={quiz}
          isPreview={true}
          onBack={() => setIsPreviewOpen(false)}
          onPublish={handlePublish}
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
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <BuilderHeader
        quiz={quiz}
        isPreview={false}
        onBack={handleBack}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />

      <main className="flex-1 overflow-hidden min-h-0">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
            <div className="h-full min-h-0 lg:col-span-3">
              <ChatInterface />
            </div>

            <div className="h-full min-h-0 lg:col-span-2">
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
                      {questions.map((question, index) => (
                        <button
                          key={question.id ?? index}
                          type="button"
                          onClick={() =>
                            question.id && setEditingQuestionId(question.id)
                          }
                          className="w-full rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                          </div>
                        </button>
                      ))}
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
                  <p className={fieldLabelClass}>
                    Título
                  </p>
                  <Input
                    value={quiz.title ?? ''}
                    onChange={(event) => updateQuizField('title', event.target.value)}
                    placeholder="Título do seu quiz"
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    Descrição
                  </p>
                  <Textarea
                    value={quiz.description ?? ''}
                    onChange={(event) => updateQuizField('description', event.target.value)}
                    placeholder="Descreva o que o participante vai viver"
                    rows={4}
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    Imagem principal
                  </p>
                  <Upload
                    file={coverFile}
                    previewUrl={coverImagePreview}
                    onFileChange={handleCoverImageChange}
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    Texto do CTA
                  </p>
                  <Input
                    value={quiz.ctaText ?? ''}
                    onChange={(event) => updateQuizField('ctaText', event.target.value)}
                    placeholder="Quer saber mais?"
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    URL do CTA
                  </p>
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
                  <p className={fieldLabelClass}>
                    Imagem do resultado
                  </p>
                  <Upload
                    file={outcomeFile}
                    previewUrl={activeOutcome.imageUrl || undefined}
                    onFileChange={handleOutcomeImageChange}
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    Título
                  </p>
                  <Input
                    value={activeOutcome.title ?? ''}
                    onChange={(event) => handleOutcomeFieldChange('title', event.target.value)}
                    placeholder="Título do resultado"
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    Descrição
                  </p>
                  <Textarea
                    value={activeOutcome.description ?? ''}
                    onChange={(event) => handleOutcomeFieldChange('description', event.target.value)}
                    placeholder="Descreva esse resultado"
                    rows={4}
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    Texto do CTA
                  </p>
                  <Input
                    value={activeOutcome.ctaText ?? ''}
                    onChange={(event) => handleOutcomeFieldChange('ctaText', event.target.value)}
                    placeholder="Quer saber mais?"
                  />
                </div>
                <div className="space-y-1">
                  <p className={fieldLabelClass}>
                    URL do CTA
                  </p>
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
    </div>
  );
}
