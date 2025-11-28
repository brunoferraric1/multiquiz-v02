'use client';

import { ArrowLeft, Rocket } from 'lucide-react';
import type { Quiz } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BuilderHeaderProps {
  quiz: Partial<Quiz>;
  isPreview: boolean;
  onBack: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export function BuilderHeader({
  quiz,
  isPreview,
  onBack,
  onPublish,
  isPublishing,
}: BuilderHeaderProps) {
  const handleBack = () => {
    onBack();
  };

  return (
    <header className="bg-card border-b shrink-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
              {isPreview ? 'Editor' : 'Voltar'}
            </Button>
            <div className="border-l border-border h-6" />
            <h1 className="text-lg font-semibold truncate max-w-[8rem] sm:max-w-xs md:max-w-md lg:max-w-lg">
              {quiz.title || 'Novo Quiz'}
            </h1>
            {!quiz.isPublished && <Badge variant="draft">Rascunho</Badge>}
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={onPublish}
              disabled={isPublishing || quiz.isPublished}
              className="gap-2"
            >
              <Rocket size={16} />
              {isPublishing
                ? 'Publicando...'
                : quiz.isPublished
                ? 'Publicado'
                : 'Publicar'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
