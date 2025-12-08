'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Lock, Pencil } from 'lucide-react';
import type { Quiz } from '@/types';
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

  const handleEdit = () => {
    router.push(`/builder/${quiz.id}`);
  };

  return (
    <Card onClick={handleEdit} className="flex flex-col h-full group cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {/* Cover Image */}
        <div className="h-32 bg-muted relative shrink-0">
          {quiz.coverImageUrl ? (
            <img
              src={quiz.coverImageUrl}
              alt={quiz.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground rounded-t-lg">
              <span className="text-4xl opacity-20">?</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 left-2 z-10">
            {quiz.isPublished ? (
              <Badge variant="published" className="flex items-center gap-1 rounded shadow-sm border-none">
                <Globe size={10} /> Publicado
              </Badge>
            ) : (
              <Badge variant="draft" className="flex items-center gap-1 rounded shadow-sm border-none">
                <Lock size={10} /> Rascunho
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
          {quiz.description || 'Sem descrição'}
        </CardDescription>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-border/50 mt-auto">
        <div className="text-xs text-muted-foreground pt-4 flex items-center gap-1.5 group-hover:text-accent transition-colors">
          <Pencil size={14} />
          Editar
        </div>

        <div className="pt-4" onClick={(e) => e.stopPropagation()}>
          <QuizActionMenu quiz={quiz} onDelete={onDelete} isDeleting={isDeleting} />
        </div>
      </CardFooter>
    </Card>
  );
}
