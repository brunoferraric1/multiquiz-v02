'use client';

import type { HTMLAttributes } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const quizSurfaceBaseClassName =
  'rounded-2xl border border-border/5 bg-card text-card-foreground shadow-sm';
export const quizSurfaceInteractiveClassName =
  'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-[var(--cursor-interactive)]';

type QuizSurfaceProps = HTMLAttributes<HTMLDivElement>;

export function QuizSurface({ className, ...props }: QuizSurfaceProps) {
  return <Card className={cn(quizSurfaceBaseClassName, className)} {...props} />;
}
