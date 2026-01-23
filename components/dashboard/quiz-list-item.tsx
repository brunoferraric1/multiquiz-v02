'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Quiz } from '@/types';
import { useLocale, useMessages } from '@/lib/i18n/context';
import { getDateLocale } from '@/lib/i18n/date-locale';
import { localizePathname } from '@/lib/i18n/paths';
import { extractIntroMediaPreviewFromVisualBuilderData } from '@/lib/utils/visual-builder-helpers';
import { Badge } from '@/components/ui/badge';
import { QuizActionMenu } from './quiz-action-menu';

interface QuizListItemProps {
    quiz: Quiz;
    onDelete: (id: string) => Promise<void>;
    isDeleting?: boolean;
}

export function QuizListItem({ quiz, onDelete, isDeleting }: QuizListItemProps) {
    const router = useRouter();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const locale = useLocale();
    const messages = useMessages();
    const dashboard = messages.dashboard;

    const handleEdit = () => {
        router.push(localizePathname(`/visual-builder/${quiz.id}`, locale));
    };

    // Extract preview image dynamically from visual builder data
    // This ensures we always show the current state (with fallback to first media in any step)
    const previewImageUrl = extractIntroMediaPreviewFromVisualBuilderData(quiz.visualBuilderData);

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
                    {previewImageUrl && !imageError ? (
                        <>
                            {imageLoading && (
                                <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60 animate-spin" />
                                </div>
                            )}
                            <img
                                src={previewImageUrl}
                                alt={quiz.title}
                                className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                                    }`}
                                onLoad={() => setImageLoading(false)}
                                onError={() => {
                                    setImageError(true);
                                    setImageLoading(false);
                                }}
                            />
                        </>
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
                            {formatDistanceToNow(quiz.updatedAt, {
                                addSuffix: true,
                                locale: getDateLocale(locale),
                            })}
                        </span>
                        <span>•</span>
                        <span>{quiz.stats.completions} {dashboard.quizCard.leads}</span>
                    </div>
                </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4 ml-4">
                {quiz.isPublished ? (
                    <Badge variant="published" className="items-center gap-1 hidden sm:flex">
                        <Globe size={10} /> {dashboard.quizCard.published}
                    </Badge>
                ) : (
                    <Badge variant="draft" className="items-center gap-1 hidden sm:flex">
                        <Lock size={10} /> {dashboard.quizCard.draft}
                    </Badge>
                )}

                <QuizActionMenu quiz={quiz} onDelete={onDelete} isDeleting={isDeleting} />
            </div>
        </div>
    );
}
