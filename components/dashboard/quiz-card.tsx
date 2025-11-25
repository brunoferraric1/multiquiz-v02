
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Trash2, Share2, Check, Edit, Globe, Lock } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => void;
}

export function QuizCard({ quiz, onDelete }: QuizCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quiz.isPublished) return;

    const url = `${window.location.origin}/quiz/${quiz.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    router.push(`/builder/${quiz.id}`);
  };

  return (
    <Card onClick={handleEdit} className="flex flex-col h-full group cursor-pointer">
      <CardHeader className="p-0">
        {/* Cover Image */}
        <div className="h-32 bg-muted relative shrink-0">
          {quiz.coverImageUrl ? (
            <img
              src={quiz.coverImageUrl}
              alt={quiz.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">?</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            {quiz.isPublished ? (
              <Badge variant="secondary" className="flex items-center">
                <Globe size={10} className="mr-1" /> Publicado
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center">
                <Lock size={10} className="mr-1" /> Rascunho
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="absolute top-2 right-2 bg-card/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-card-foreground">
            {quiz.stats.completions} Leads
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-card/90 text-card-foreground text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              Editar Quiz
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 flex flex-col flex-1">
        <CardTitle className="text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {quiz.title}
        </CardTitle>
        <CardDescription className="text-sm mb-4 line-clamp-2 flex-1">
          {quiz.description}
        </CardDescription>
      </CardContent>

      <CardFooter className="p-5 flex items-center justify-between">
        <div className="flex space-x-2">
          {/* Preview */}
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/preview/${quiz.id}`);
            }}
            title="Pré-visualizar"
          >
            <Play size={18} />
          </Button>

          {/* Share */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
            disabled={!quiz.isPublished}
            title={quiz.isPublished ? 'Copiar Link' : 'Publique para compartilhar'}
          >
            {copied ? (
              <Check size={18} className="text-green-600" />
            ) : (
              <Share2 size={18} />
            )}
          </Button>

          {/* Edit */}
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            title="Editar"
          >
            <Edit size={18} />
          </Button>
        </div>

        {/* Delete */}
        <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Tem certeza que deseja excluir este quiz?')) {
                onDelete(quiz.id);
              }
            }}
            title="Excluir"
          >
            <Trash2 size={18} />
          </Button>
      </CardFooter>
    </Card>
  );
}

