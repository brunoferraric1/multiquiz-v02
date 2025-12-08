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

interface UnsavedChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateAndExit: () => void;
    onExitWithoutUpdating: () => void;
    isUpdating?: boolean;
}

export function UnsavedChangesDialog({
    open,
    onOpenChange,
    onUpdateAndExit,
    onExitWithoutUpdating,
    isUpdating = false,
}: UnsavedChangesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Alterações não publicadas</DialogTitle>
                    <DialogDescription>
                        Você tem alterações que ainda não foram publicadas. O que deseja fazer?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={onUpdateAndExit}
                        disabled={isUpdating}
                        className="w-full"
                    >
                        {isUpdating ? 'Atualizando...' : 'Atualizar e sair'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onExitWithoutUpdating}
                        disabled={isUpdating}
                        className="w-full"
                    >
                        Sair sem atualizar
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isUpdating}
                        className="w-full"
                    >
                        Continuar editando
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
