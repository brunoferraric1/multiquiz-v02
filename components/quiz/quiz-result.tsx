'use client';

import { ArrowLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
};

export function QuizResult({ outcome, mode, onReset, onExit, onCtaClick }: QuizResultProps) {

  const handleCtaClick = () => {
    if (outcome.ctaUrl && onCtaClick) {
      onCtaClick();
    }
  };

  return (
    <div className="space-y-5 text-center">
      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Resultado
        </p>
        <h3 className="text-2xl font-semibold">{outcome.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {outcome.description || 'Adicione uma descrição para este resultado.'}
        </p>
      </div>

      {outcome.imageUrl && (
        <div className="flex justify-center">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="aspect-w-4 aspect-h-3">
              <img
                src={outcome.imageUrl}
                alt="Resultado do quiz"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">

        {outcome.ctaUrl && (
          <Button asChild className="gap-2" onClick={handleCtaClick}>
            <a href={outcome.ctaUrl} target="_blank" rel="noreferrer">
              {outcome.ctaText || 'Saiba mais'}
              <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        )}
        {mode === 'preview' && onExit && (
          <Button variant="ghost" onClick={onExit} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o builder
          </Button>
        )}
      </div>
    </div>
  );
}
