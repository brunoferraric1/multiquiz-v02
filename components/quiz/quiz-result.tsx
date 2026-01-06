'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ensureProtocol } from '@/lib/utils';
import { FormattedText } from './formatted-text';
import { QuizSurface } from './quiz-surface';

type QuizResultProps = {
  outcome: {
    title: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  mode: 'preview' | 'live';
  onReset: () => void;
  onExit?: () => void;
  onCtaClick?: () => void;
  primaryColor?: string;
};

export function QuizResult({ outcome, mode, onReset, onExit, onCtaClick, primaryColor }: QuizResultProps) {
  const ctaUrl = ensureProtocol(outcome.ctaUrl);
  const hasCtaUrl = Boolean(ctaUrl);

  const handleCtaClick = () => {
    if (hasCtaUrl && onCtaClick) {
      onCtaClick();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
      <div className="space-y-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Resultado
        </p>

        <QuizSurface className="p-8">
          {outcome.imageUrl && (
            <div className="flex justify-center mb-8">
              <div className="w-full overflow-hidden rounded-2xl shadow-sm aspect-[4/3]">
                <img
                  src={outcome.imageUrl}
                  alt="Resultado do quiz"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <h3 className="text-2xl font-semibold">{outcome.title}</h3>
          <FormattedText
            text={outcome.description}
            fallback="Adicione uma descrição para este resultado."
            className="mt-2 text-sm text-card-foreground/70"
          />

          {outcome.ctaText && (
            <div className="mt-6 flex justify-center">
              <Button
                asChild={hasCtaUrl}
                className="gap-2 w-full sm:w-auto min-w-[200px]"
                onClick={handleCtaClick}
                style={primaryColor ? { backgroundColor: primaryColor } : undefined}
              >
                {hasCtaUrl ? (
                  <a href={ctaUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center">
                    <span className="truncate">{outcome.ctaText}</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 ml-1" />
                  </a>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="truncate">{outcome.ctaText}</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 ml-1" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </QuizSurface>
      </div>
    </div>
  );
}
