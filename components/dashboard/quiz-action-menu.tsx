'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreVertical,
    Play,
    Share2,
    Trash2,
    Edit,
    Check,
    Copy,
    LineChart,
    Eye
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import type { Quiz } from '@/types';

interface QuizActionMenuProps {
    quiz: Quiz;
    onDelete: (id: string) => Promise<void>;
    isDeleting?: boolean;
}

export function QuizActionMenu({ quiz, onDelete, isDeleting = false }: QuizActionMenuProps) {
    const router = useRouter();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeletingInternal, setIsDeletingInternal] = useState(false);
    const [copied, setCopied] = useState(false);

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

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push(`/builder/${quiz.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/builder/${quiz.id}?mode=preview`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Pré-visualizar
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.push(`/dashboard/reports/${quiz.id}`)}>
                        <LineChart className="mr-2 h-4 w-4" />
                        Relatório
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

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
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-100"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
