'use client';

import { CheckCircle2, Cloud, AlertCircle } from 'lucide-react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { cn } from '@/lib/utils';

export function SaveIndicator() {
  const isSaving = useQuizBuilderStore((state) => state.isSaving);
  const error = useQuizBuilderStore((state) => state.error);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle size={16} className="animate-pulse" />
        <span>Erro ao salvar</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cloud size={16} className="animate-pulse" />
        <span>Salvando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle2 size={16} className="text-green-600" />
      <span>Salvo</span>
    </div>
  );
}
