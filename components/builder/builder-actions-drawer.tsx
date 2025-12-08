'use client';

import { useRouter } from 'next/navigation';
import {
    RefreshCw,
    Rocket,
    Globe,
    GlobeLock,
    Undo2,
    Trash2,
    Check,
} from 'lucide-react';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import type { Quiz, QuizDraft } from '@/types';

interface BuilderActionsDrawerProps {
    open: boolean;
    onClose: () => void;
    quiz: QuizDraft | Quiz;
    onPublish: () => void;
    onPublishUpdate?: () => void;
    onUnpublish?: () => void;
    onDiscardChanges?: () => void;
    onCopyLink: () => void;
    onDelete: () => void;
    isPublishing: boolean;
    hasUnpublishedChanges: boolean;
    copied: boolean;
}

export function BuilderActionsDrawer({
    open,
    onClose,
    quiz,
    onPublish,
    onPublishUpdate,
    onUnpublish,
    onDiscardChanges,
    onCopyLink,
    onDelete,
    isPublishing,
    hasUnpublishedChanges,
    copied,
}: BuilderActionsDrawerProps) {
    const router = useRouter();

    const itemClass = "flex w-full items-center gap-3 px-6 py-4 text-base font-medium transition-colors active:bg-muted";

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    // Copy link stays open, doesn't close drawer
    const handleCopyLink = () => {
        onCopyLink();
        // Drawer stays open, inline feedback + toast handles the confirmation
    };

    return (
        <BottomDrawer open={open} onClose={onClose} title="Ações">
            <div className="py-2">
                {quiz.isPublished ? (
                    <>
                        {/* Published quiz actions */}

                        {/* Pending changes section (only if has changes) */}
                        {hasUnpublishedChanges && (
                            <>
                                {/* Section header for pending changes */}
                                <div className="flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                    <span>Alterações pendentes</span>
                                </div>

                                <button
                                    onClick={() => handleAction(onPublishUpdate || (() => { }))}
                                    disabled={isPublishing}
                                    className={`${itemClass} text-yellow-600 dark:text-yellow-500 ${isPublishing ? 'opacity-50' : ''}`}
                                >
                                    <RefreshCw size={20} />
                                    <span>{isPublishing ? 'Publicando...' : 'Publicar alterações'}</span>
                                </button>

                                <button
                                    onClick={() => handleAction(onDiscardChanges || (() => { }))}
                                    className={itemClass}
                                >
                                    <Undo2 size={20} />
                                    <span>Descartar alterações</span>
                                </button>

                                <div className="h-px bg-border my-2" />
                            </>
                        )}

                        {/* Public link + Unpublish section */}
                        <button
                            onClick={handleCopyLink}
                            className={`${itemClass} ${copied ? 'text-green-600 dark:text-green-500' : ''}`}
                        >
                            {copied ? <Check size={20} /> : <Globe size={20} />}
                            <span>{copied ? 'Link copiado!' : 'Copiar link público'}</span>
                        </button>

                        <button
                            onClick={() => handleAction(onUnpublish || (() => { }))}
                            disabled={isPublishing}
                            className={`${itemClass} text-orange-500 ${isPublishing ? 'opacity-50' : ''}`}
                        >
                            <GlobeLock size={20} />
                            <span>Despublicar quiz</span>
                        </button>
                    </>
                ) : (
                    <>
                        {/* Draft quiz actions */}
                        <button
                            onClick={() => handleAction(onPublish)}
                            disabled={isPublishing}
                            className={`${itemClass} text-green-600 dark:text-green-500 ${isPublishing ? 'opacity-50' : ''}`}
                        >
                            <Rocket size={20} />
                            <span>{isPublishing ? 'Publicando...' : 'Publicar'}</span>
                        </button>

                        <div className="h-px bg-border my-2" />

                        <button
                            onClick={() => handleAction(onDelete)}
                            className={`${itemClass} text-destructive`}
                        >
                            <Trash2 size={20} />
                            <span>Excluir Quiz</span>
                        </button>
                    </>
                )}
            </div>
        </BottomDrawer>
    );
}
