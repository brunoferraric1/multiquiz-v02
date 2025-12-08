'use client';

import { Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type QuizIntroProps = {
  title: string;
  description: string;
  coverImageUrl?: string;
  primaryColor?: string;
  questionCount: number;
  outcomeCount: number;
  mode: 'preview' | 'live';
  onStart: () => void;
  ctaText?: string;
};

export function QuizIntro({
  title,
  description,
  coverImageUrl,
  primaryColor,
  questionCount,
  outcomeCount,
  mode,
  onStart,
  ctaText,
}: QuizIntroProps) {
  const canStart = questionCount > 0 && outcomeCount > 0;
  const startButtonText = ctaText || (mode === 'preview' ? 'Começar prévia' : 'Começar quiz');

  return (
    <div className="space-y-5 text-center">
      <div className="flex justify-center">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          {coverImageUrl ? (
            <div className="aspect-[4/3]">
              <img
                src={coverImageUrl}
                alt="Capa do quiz"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground bg-muted/60">
              Adicione uma imagem de capa para o quiz
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground" />

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <div className="space-y-4">
        <Button onClick={onStart} disabled={!canStart} size="lg" className="justify-center gap-2">
          <Play className="h-4 w-4" />
          {startButtonText}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {questionCount} perguntas • Leva ~1 minuto para responder
        </p>
      </div>
    </div>
  );
}
