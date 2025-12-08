'use client';

import { useRouter } from 'next/navigation';
import { Globe, Lock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Quiz } from '@/types';
import { Badge } from '@/components/ui/badge';
import { QuizActionMenu } from './quiz-action-menu';

interface QuizListItemProps {
    quiz: Quiz;
    onDelete: (id: string) => Promise<void>;
    isDeleting?: boolean;
}

export function QuizListItem({ quiz, onDelete, isDeleting }: QuizListItemProps) {
    const router = useRouter();

    const handleEdit = () => {
        router.push(`/builder/${quiz.id}`);
    };

    return (
        <div
            className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-sm transition-all group"
        >
            <div
                className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                onClick={handleEdit}
            >
                {/* Thumbnail */}
                <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0 overflow-hidden relative">
                    {quiz.coverImageUrl ? (
                        <img
                            src={quiz.coverImageUrl}
                            alt={quiz.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                            ?
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {quiz.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                            {formatDistanceToNow(quiz.updatedAt, { addSuffix: true, locale: ptBR })}
                        </span>
                        <span>•</span>
                        <span>{quiz.stats.completions} leads</span>
                    </div>
                </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4 ml-4">
                {quiz.isPublished ? (
                    <Badge variant="published" className="items-center gap-1 hidden sm:flex">
                        <Globe size={10} /> Publicado
                    </Badge>
                ) : (
                    <Badge variant="draft" className="items-center gap-1 hidden sm:flex">
                        <Lock size={10} /> Rascunho
                    </Badge>
                )}

                <QuizActionMenu quiz={quiz} onDelete={onDelete} isDeleting={isDeleting} />
            </div>
        </div>
    );
}
