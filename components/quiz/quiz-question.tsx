'use client';

import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import type { AnswerOption } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuizProgressBar } from './quiz-progress-bar';
import { FormattedText } from './formatted-text';

type QuizQuestionProps = {
  question: {
    id: string;
    text: string;
    options: Partial<AnswerOption>[];
    allowMultiple?: boolean;
    imageUrl?: string;
  };
  currentQuestionIndex: number;
  totalQuestions: number;
  primaryColor?: string;
  selectedOptionIds: string[];
  onOptionSelect: (optionId: string) => void;
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
};

export function QuizQuestion({
  question,
  currentQuestionIndex,
  totalQuestions,
  primaryColor,
  selectedOptionIds,
  onOptionSelect,
  onNext,
  onBack,
  onReset,
}: QuizQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Pergunta {currentQuestionIndex + 1} de {totalQuestions}
          </span>
          {question.allowMultiple && <span>Selecione quantas quiser</span>}
        </div>
        <QuizProgressBar
          current={currentQuestionIndex + 1}
          total={totalQuestions}
          color={primaryColor}
        />
      </div>

      <div className="space-y-3">
        <FormattedText
          text={question.text}
          className="text-center"
          paragraphClassName="text-xl font-semibold leading-tight text-center"
        />
        {question.imageUrl && (
          <div className="flex justify-center">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="aspect-w-4 aspect-h-3">
                <img
                  src={question.imageUrl}
                  alt="Ilustração da pergunta"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id || '');
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => option.id && onOptionSelect(option.id)}
              className={cn(
                'w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-left transition duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground shadow'
                  : 'hover:border-primary/70'
              )}
            >
              <p className="text-sm font-medium text-foreground">{option.text}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">

          <Button
            onClick={onNext}
            disabled={selectedOptionIds.length === 0}
            className="gap-2"
          >
            {currentQuestionIndex === totalQuestions - 1 ? (
              <>
                Ver resultado
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Próxima
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
