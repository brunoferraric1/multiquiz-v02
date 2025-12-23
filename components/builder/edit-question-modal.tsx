'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Question, AnswerOption, Outcome } from '@/types';
import { compressImage } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { DrawerFooter } from '@/components/builder/drawer-footer';
import { Upload } from '@/components/ui/upload';

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

interface EditQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Partial<Question> | null;
  questionIndex: number | null;
  totalQuestions: number;
  outcomes: Partial<Outcome>[];
  onSave: (question: Partial<Question>, destinationIndex?: number) => void;
}

export function EditQuestionModal({
  open,
  onOpenChange,
  question,
  questionIndex,
  totalQuestions,
  outcomes,
  onSave,
}: EditQuestionModalProps) {
  const [questionText, setQuestionText] = useState(question?.text || '');
  const [options, setOptions] = useState<AnswerOption[]>(question?.options || []);
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [draftQuestionImageUrl, setDraftQuestionImageUrl] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(
    questionIndex !== null ? String(questionIndex + 1) : '1'
  );

  // Sync state when question changes or modal opens
  useEffect(() => {
    if (open && question) {
      setQuestionText(question.text || '');
      setOptions(question.options || []);
      setDraftQuestionImageUrl(question.imageUrl ?? '');
      setQuestionFile(null);
      const maxIndex = Math.max(totalQuestions - 1, 0);
      const safeIndex =
        questionIndex !== null
          ? Math.min(Math.max(questionIndex, 0), maxIndex)
          : 0;
      setSelectedOrder(String(safeIndex + 1));
    }
  }, [open, question, questionIndex, totalQuestions]);

  const handleAddOption = () => {
    const fallbackOutcomeId = outcomes[0]?.id || '';
    const newOption: AnswerOption = {
      id: generateUUID(),
      text: '',
      targetOutcomeId: fallbackOutcomeId,
    };
    setOptions([...options, newOption]);
  };

  const handleDeleteOption = (optionId: string) => {
    setOptions(options.filter((opt) => opt.id !== optionId));
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    setOptions(
      options.map((opt) => (opt.id === optionId ? { ...opt, text } : opt))
    );
  };

  const handleOptionOutcomeChange = (
    optionId: string,
    targetOutcomeId: string
  ) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId ? { ...opt, targetOutcomeId } : opt
      )
    );
  };

  const handleOptionIconChange = (
    optionId: string,
    icon: string | undefined
  ) => {
    setOptions(
      options.map((opt) => {
        if (opt.id === optionId) {
          const updated = { ...opt };
          if (icon) {
            updated.icon = icon;
          } else {
            delete updated.icon;
          }
          return updated;
        }
        return opt;
      })
    );
  };

  const handleQuestionImageChange = async (file: File | null) => {
    setQuestionFile(file);

    if (!file) {
      setDraftQuestionImageUrl('');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setDraftQuestionImageUrl(compressedDataUrl);
    } catch (error) {
      console.error('Error compressing question image:', error);
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        setDraftQuestionImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!question?.id) return;
    const parsedOrder = Number.parseInt(selectedOrder, 10);
    const maxIndex = Math.max(totalQuestions - 1, 0);
    const destinationIndex = Number.isNaN(parsedOrder)
      ? null
      : Math.min(Math.max(parsedOrder - 1, 0), maxIndex);

    // Ensure all options have required fields
    const validOptions = options
      .filter((opt) => opt.text.trim() !== '')
      .map((opt) => ({
        ...opt,
        targetOutcomeId: opt.targetOutcomeId || outcomes[0]?.id || '',
      }))
      .filter((opt) => opt.targetOutcomeId); // Only include options with valid outcome

    onSave({
      id: question.id,
      text: questionText,
      imageUrl: draftQuestionImageUrl || undefined,
      options: validOptions,
    }, destinationIndex === null ? undefined : destinationIndex);
    onOpenChange(false);
    toast.success('Salvo');
  };

  const handleCancel = () => {
    // Reset to original values
    if (question) {
      setQuestionText(question.text || '');
      setOptions(question.options || []);
      setDraftQuestionImageUrl(question.imageUrl ?? '');
      setQuestionFile(null);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} key={question?.id}>
      <SheetContent
        className="max-w-lg flex flex-col [&>div]:flex [&>div]:flex-col [&>div]:min-h-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex-shrink-0 pb-6">
          <SheetTitle className="text-2xl">Editar Pergunta</SheetTitle>
          <SheetDescription>
            Configure a pergunta e as opções de resposta.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto relative min-h-0 px-1">
          <div className="space-y-6">
            {/* Question Text Section */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Pergunta
              </p>
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder='Qual opção combina mais com você sobre "Meu Novo Quiz"?'
                className="w-full"
                rows={3}
                autoFocus={false}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Ordem
              </p>
              <Select
                value={selectedOrder}
                onValueChange={(value) => setSelectedOrder(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Selecione a ordem" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalQuestions }, (_, index) => {
                    const order = index + 1;
                    return (
                      <SelectItem key={order} value={String(order)}>
                        {order}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Question Image Section */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Imagem da Pergunta
              </p>
              <Upload
                file={questionFile}
                previewUrl={draftQuestionImageUrl || undefined}
                onFileChange={handleQuestionImageChange}
              />
            </div>

            {/* Answer Options Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Opções de Resposta
                </p>
              </div>

              {options.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma opção adicionada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {options.map((option) => (
                    <div
                      key={option.id}
                      className="relative rounded-lg border border-border bg-card/50 p-4 space-y-3 hover:border-primary/30 transition-colors"
                    >
                      {/* Delete button in top-right corner */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => handleDeleteOption(option.id)}
                        title="Remover opção"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>

                      {/* Option text input with emoji */}
                      <div className="flex items-center gap-2 pr-8">
                        <Input
                          value={option.text}
                          onChange={(e) =>
                            handleOptionTextChange(option.id, e.target.value)
                          }
                          placeholder="Texto da opção"
                          className="flex-1"
                          autoFocus={false}
                        />
                        <EmojiPicker
                          value={option.icon}
                          onChange={(emoji) =>
                            handleOptionIconChange(option.id, emoji)
                          }
                        />
                      </div>

                      {/* Outcome selector with label */}
                      {outcomes.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="text-primary">→</span>
                            Leva para o resultado:
                          </label>
                          <Select
                            value={option.targetOutcomeId || ''}
                            onValueChange={(value) =>
                              handleOptionOutcomeChange(option.id, value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o resultado" />
                            </SelectTrigger>
                            <SelectContent>
                              {outcomes.map((outcome) => (
                                <SelectItem
                                  key={outcome.id}
                                  value={outcome.id || ''}
                                >
                                  {outcome.title || 'Resultado sem título'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddOption}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="text-lg">+</span>
                Adicionar Opção
              </button>
            </div>
          </div>
          {/* Gradient overlay for fade effect - sticky to stay at bottom of viewport */}
          <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
        </div>

        <div className="flex-shrink-0 border-t bg-background py-8 mt-auto">
          <DrawerFooter
            onSave={handleSave}
            onCancel={handleCancel}
            saveDisabled={!questionText.trim() || options.length === 0}
            saveText="Salvar"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
