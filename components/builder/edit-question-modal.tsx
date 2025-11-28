'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { Question, AnswerOption, Outcome } from '@/types';
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

// UUID v4 generator with crypto.randomUUID fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface EditQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Partial<Question> | null;
  outcomes: Partial<Outcome>[];
  onSave: (question: Partial<Question>) => void;
}

export function EditQuestionModal({
  open,
  onOpenChange,
  question,
  outcomes,
  onSave,
}: EditQuestionModalProps) {
  const [questionText, setQuestionText] = useState(question?.text || '');
  const [options, setOptions] = useState<AnswerOption[]>(question?.options || []);

  // Sync state when question changes or modal opens
  useEffect(() => {
    if (open && question) {
      setQuestionText(question.text || '');
      setOptions(question.options || []);
    }
  }, [open, question]);

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

  const handleSave = () => {
    if (!question?.id) return;

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
      options: validOptions,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to original values
    if (question) {
      setQuestionText(question.text || '');
      setOptions(question.options || []);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} key={question?.id}>
      <SheetContent
        className="max-w-lg overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Editar Pergunta</SheetTitle>
          <SheetDescription>
            Configure a pergunta e as opções de resposta.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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
              <div className="space-y-4">
                {options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center gap-2">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => handleDeleteOption(option.id)}
                        title="Remover opção"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {outcomes.length > 0 && (
                      <Select
                        value={option.targetOutcomeId || ''}
                        onValueChange={(value) =>
                          handleOptionOutcomeChange(option.id, value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o Resultado Associado" />
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

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!questionText.trim() || options.length === 0}
            className="cursor-pointer"
          >
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


