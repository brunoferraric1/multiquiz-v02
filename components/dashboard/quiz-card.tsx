'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Trash2, Share2, Check, Edit, Globe, Lock } from 'lucide-react';
import type { Quiz } from '@/types';
import { Badge, Card } from '@/components/ui';

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
    <Card hover onClick={handleEdit} className="flex flex-col h-full group">
      {/* Cover Image */}
      <div className="h-32 bg-brand-100 relative shrink-0">
        {quiz.coverImageUrl ? (
          <img
            src={quiz.coverImageUrl}
            alt={quiz.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-300">
            <span className="text-4xl">?</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          {quiz.isPublished ? (
            <Badge variant="success" className="flex items-center shadow-sm">
              <Globe size={10} className="mr-1" /> Publicado
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center shadow-sm">
              <Lock size={10} className="mr-1" /> Rascunho
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-brand-700 shadow-sm">
          {quiz.stats.completions} Leads
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
            Editar Quiz
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
          {quiz.title}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
          {quiz.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <div className="flex space-x-2">
            {/* Preview */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/preview/${quiz.id}`);
              }}
              className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-full transition-colors"
              title="Pré-visualizar"
            >
              <Play size={18} className="ml-0.5" />
            </button>

            {/* Share */}
            <button
              onClick={handleCopyLink}
              disabled={!quiz.isPublished}
              className={`p-2 rounded-full transition-colors ${
                quiz.isPublished
                  ? 'text-gray-500 hover:text-brand-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={quiz.isPublished ? 'Copiar Link' : 'Publique para compartilhar'}
            >
              {copied ? (
                <Check size={18} className="text-green-600" />
              ) : (
                <Share2 size={18} />
              )}
            </button>

            {/* Edit */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Editar"
            >
              <Edit size={18} />
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Tem certeza que deseja excluir este quiz?')) {
                onDelete(quiz.id);
              }
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </Card>
  );
}
