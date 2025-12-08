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

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string | React.ReactNode;
    confirmText?: string;
    confirmingText?: string;
    cancelText?: string;
    isConfirming?: boolean;
    /** Button variant: 'destructive' (red), 'warning' (orange), or 'default' */
    variant?: 'destructive' | 'warning' | 'default';
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    confirmingText = 'Processando...',
    cancelText = 'Cancelar',
    isConfirming = false,
    variant = 'destructive',
}: ConfirmDialogProps) {
    const buttonClasses = {
        destructive: '',
        warning: 'bg-orange-500 hover:bg-orange-600 text-white',
        default: '',
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // Prevent closing while confirming
            if (!isConfirming) onOpenChange(val);
        }}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription asChild>
                        <div>{description}</div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isConfirming}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'warning' ? 'default' : variant}
                        onClick={onConfirm}
                        disabled={isConfirming}
                        className={`min-w-[100px] ${buttonClasses[variant]}`}
                    >
                        {isConfirming ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {confirmingText}
                            </>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
