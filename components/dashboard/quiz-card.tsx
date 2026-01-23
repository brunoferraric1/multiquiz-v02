'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Lock, Pencil } from 'lucide-react';
import type { Quiz } from '@/types';
import { useLocale, useMessages } from '@/lib/i18n/context';
import { localizePathname } from '@/lib/i18n/paths';
import { extractIntroMediaPreviewFromVisualBuilderData } from '@/lib/utils/visual-builder-helpers';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuizActionMenu } from './quiz-action-menu';

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export function QuizCard({ quiz, onDelete, isDeleting = false }: QuizCardProps) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const locale = useLocale();
  const messages = useMessages();
  const dashboard = messages.dashboard;
  const common = messages.common;

  const handleEdit = () => {
    router.push(localizePathname(`/visual-builder/${quiz.id}`, locale));
  };

  // Extract preview image dynamically from visual builder data
  // This ensures we always show the current state (with fallback to first media in any step)
  const previewImageUrl = extractIntroMediaPreviewFromVisualBuilderData(quiz.visualBuilderData);

  return (
    <Card onClick={handleEdit} className="flex flex-col h-full group cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {/* Cover Image */}
        <div className="h-32 bg-muted relative shrink-0 overflow-hidden rounded-t-lg">
          {previewImageUrl && !imageError ? (
            <>
              {/* Skeleton loader */}
              {imageLoading && (
                <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60 animate-spin" />
                </div>
              )}
              <img
                src={previewImageUrl}
                alt={quiz.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl opacity-20">?</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 left-2 z-10">
            {quiz.isPublished ? (
              <Badge variant="published" className="flex items-center gap-1 rounded shadow-sm border-none">
                <Globe size={10} /> {dashboard.quizCard.published}
              </Badge>
            ) : (
              <Badge variant="draft" className="flex items-center gap-1 rounded shadow-sm border-none">
                <Lock size={10} /> {dashboard.quizCard.draft}
              </Badge>
            )}
          </div>

          {/* Stats */}


        </div>
      </CardHeader>

      <CardContent className="p-5 flex flex-col flex-1">
        <CardTitle className="text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {quiz.title}
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2 flex-1">
          {quiz.description || dashboard.quizCard.noDescription}
        </CardDescription>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-border/50 mt-auto">
        <div className="text-xs text-muted-foreground pt-4 flex items-center gap-1.5 group-hover:text-accent transition-colors">
          <Pencil size={14} />
          {common.buttons.edit}
        </div>

        <div className="pt-4" onClick={(e) => e.stopPropagation()}>
          <QuizActionMenu quiz={quiz} onDelete={onDelete} isDeleting={isDeleting} />
        </div>
      </CardFooter>
    </Card>
  );
}
