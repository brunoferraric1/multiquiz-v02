'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteQuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    isDeleting: boolean;
}

export function DeleteQuizDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    isDeleting
}: DeleteQuizDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing while deleting
            if (!isDeleting) onOpenChange(val);
        }}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Excluir Quiz</DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja excluir o quiz &quot;{title}&quot;?
                        <br />
                        <br />
                        Esta ação não pode ser desfeita e todos os dados associados serão permanentemente removidos.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="min-w-[100px]"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            'Excluir'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
