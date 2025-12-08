
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Trash2, Share2, Check, Edit, Globe, Lock, Loader2 } from 'lucide-react';
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
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { DeleteQuizDialog } from '@/components/dashboard/delete-quiz-dialog';

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export function QuizCard({ quiz, onDelete, isDeleting = false }: QuizCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting_Internal, setIsDeleting_Internal] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quiz.isPublished || !quiz.id) return;

    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/quiz/${quiz.id}`
      : '';

    if (!url) return;

    try {
      const copiedSuccessfully = await copyToClipboard(url);
      if (!copiedSuccessfully) throw new Error('Clipboard not supported');

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy quiz link:', error);
    }
  };

  const handleEdit = () => {
    router.push(`/builder/${quiz.id}`);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting_Internal(true);
    try {
      await onDelete(quiz.id);
      // Only close dialog after successful deletion
      setShowDeleteDialog(false);
    } catch (error: any) {
      // Keep dialog open on error so user can retry
      console.error('Failed to delete quiz:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao excluir quiz: ${errorMessage}`);
      setIsDeleting_Internal(false);
    }
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
              <Badge variant="published" className="flex items-center gap-1">
                <Globe size={10} /> Publicado
              </Badge>
            ) : (
              <Badge variant="draft" className="flex items-center gap-1">
                <Lock size={10} /> Rascunho
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
            e.preventDefault();
            setShowDeleteDialog(true);
          }}
          disabled={isDeleting}
          title={isDeleting ? "Excluindo..." : "Excluir"}
        >
          <Trash2 size={18} />
        </Button>
      </CardFooter>

      {/* Delete Confirmation Dialog */}
      <DeleteQuizDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        title={quiz.title}
        isDeleting={isDeleting_Internal}
      />
    </Card>
  );
}
