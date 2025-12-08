'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreVertical,
    Share2,
    Trash2,
    Edit,
    Check,
    LineChart,
    Globe,
    GlobeLock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { QuizService } from '@/lib/services/quiz-service';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Quiz } from '@/types';

interface QuizActionMenuProps {
    quiz: Quiz;
    onDelete: (id: string) => Promise<void>;
    isDeleting?: boolean;
}

export function QuizActionMenu({ quiz, onDelete, isDeleting = false }: QuizActionMenuProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeletingInternal, setIsDeletingInternal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleCopyLink = async () => {
        if (!quiz.isPublished || !quiz.id) return;
        const url = typeof window !== 'undefined'
            ? `${window.location.origin}/quiz/${quiz.id}`
            : '';
        if (!url) return;

        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeletingInternal(true);
        try {
            await onDelete(quiz.id);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Delete failed', error);
            setIsDeletingInternal(false);
        }
    };

    const handleEdit = () => {
        setMobileMenuOpen(false);
        router.push(`/builder/${quiz.id}`);
    };

    const handleReports = () => {
        setMobileMenuOpen(false);
        router.push(`/dashboard/reports/${quiz.id}`);
    };

    const handleCopyLinkAndClose = async () => {
        await handleCopyLink();
        setMobileMenuOpen(false);
    };

    const handleDeleteClick = () => {
        setMobileMenuOpen(false);
        setShowDeleteDialog(true);
    };

    const handlePublish = async () => {
        if (!user || !quiz.id || isPublishing) return;
        setIsPublishing(true);
        try {
            await QuizService.publishQuiz(quiz.id, user.uid);
            setMobileMenuOpen(false);
            router.refresh();
        } catch (error) {
            console.error('Publish failed', error);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        if (!user || !quiz.id || isPublishing) return;
        setIsPublishing(true);
        try {
            await QuizService.unpublishQuiz(quiz.id, user.uid);
            setMobileMenuOpen(false);
            router.refresh();
        } catch (error) {
            console.error('Unpublish failed', error);
        } finally {
            setIsPublishing(false);
        }
    };

    // Menu items component for reusability
    const MenuItems = ({ isMobile = false }: { isMobile?: boolean }) => {
        const itemClass = isMobile
            ? "flex items-center gap-4 px-6 py-4 text-base active:bg-accent transition-colors cursor-pointer"
            : "";
        const iconSize = isMobile ? 20 : 16;

        return (
            <>
                {isMobile ? (
                    <>
                        <button onClick={handleEdit} className={itemClass}>
                            <Edit size={iconSize} />
                            <span>Editar</span>
                        </button>
                        <button onClick={handleReports} className={itemClass}>
                            <LineChart size={iconSize} />
                            <span>Relatório</span>
                        </button>
                        <div className="h-px bg-border my-2" />
                        {quiz.isPublished ? (
                            <button
                                onClick={handleUnpublish}
                                disabled={isPublishing}
                                className={`${itemClass} text-orange-500 ${isPublishing ? 'opacity-50' : ''}`}
                            >
                                <GlobeLock size={iconSize} />
                                <span>{isPublishing ? 'Despublicando...' : 'Despublicar'}</span>
                            </button>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className={`${itemClass} text-green-500 ${isPublishing ? 'opacity-50' : ''}`}
                            >
                                <Globe size={iconSize} />
                                <span>{isPublishing ? 'Publicando...' : 'Publicar'}</span>
                            </button>
                        )}
                        <button
                            onClick={handleCopyLinkAndClose}
                            disabled={!quiz.isPublished}
                            className={`${itemClass} ${!quiz.isPublished ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {copied ? (
                                <Check size={iconSize} className="text-green-600" />
                            ) : (
                                <Share2 size={iconSize} />
                            )}
                            <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
                        </button>
                        <div className="h-px bg-border my-2" />
                        <button
                            onClick={handleDeleteClick}
                            className={`${itemClass} text-destructive`}
                        >
                            <Trash2 size={iconSize} />
                            <span>Excluir</span>
                        </button>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleReports}>
                            <LineChart className="mr-2 h-4 w-4" />
                            Relatório
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {quiz.isPublished ? (
                            <DropdownMenuItem
                                onClick={handleUnpublish}
                                disabled={isPublishing}
                                className="text-orange-600 focus:text-orange-700 focus:bg-orange-100"
                            >
                                <GlobeLock className="mr-2 h-4 w-4" />
                                {isPublishing ? 'Despublicando...' : 'Despublicar'}
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="text-green-600 focus:text-green-700 focus:bg-green-100"
                            >
                                <Globe className="mr-2 h-4 w-4" />
                                {isPublishing ? 'Publicando...' : 'Publicar'}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={handleCopyLink}
                            disabled={!quiz.isPublished}
                            className={!quiz.isPublished ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            {copied ? (
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                            ) : (
                                <Share2 className="mr-2 h-4 w-4" />
                            )}
                            {copied ? 'Copiado!' : 'Copiar Link'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={handleDeleteClick}
                            className="text-red-600 focus:text-red-600 focus:bg-red-100"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </>
                )}
            </>
        );
    };

    return (
        <>
            {/* Desktop: Dropdown Menu */}
            <div className="hidden md:block">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <MenuItems isMobile={false} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile: Bottom Sheet */}
            <div className="md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuOpen(true);
                    }}
                >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Abrir menu</span>
                </Button>

                <BottomDrawer
                    open={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    title="Ações"
                >
                    <div className="py-2">
                        <MenuItems isMobile={true} />
                    </div>
                </BottomDrawer>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Excluir Quiz</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o quiz &quot;{quiz.title}&quot;?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting || isDeletingInternal}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting || isDeletingInternal}
                        >
                            {isDeletingInternal ? 'Excluindo...' : 'Excluir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
