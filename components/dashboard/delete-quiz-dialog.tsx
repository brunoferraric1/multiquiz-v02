'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            title="Excluir Quiz"
            description={
                <>
                    Tem certeza que deseja excluir o quiz &quot;{title}&quot;?
                    <br /><br />
                    Esta ação não pode ser desfeita e todos os dados associados serão permanentemente removidos.
                </>
            }
            confirmText="Excluir"
            confirmingText="Excluindo..."
            isConfirming={isDeleting}
            variant="destructive"
        />
    );
}
