'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomDrawerProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function BottomDrawer({ open, onClose, title, children }: BottomDrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        ref={drawerRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl bg-card border-t border-border shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
                                <h2 className="text-lg font-semibold">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    <X size={20} />
                                    <span className="sr-only">Fechar</span>
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(85vh-100px)]">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
