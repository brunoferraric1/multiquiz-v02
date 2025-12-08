'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { copyToClipboard } from '@/lib/copy-to-clipboard';

interface PublishSuccessDrawerProps {
    open: boolean;
    onClose: () => void;
    quizId: string;
}

export function PublishSuccessDrawer({
    open,
    onClose,
    quizId,
}: PublishSuccessDrawerProps) {
    const [copied, setCopied] = useState(false);

    // Generate the quiz URL - uses current domain + /quiz/[id] route
    const quizUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/quiz/${quizId}`
        : '';

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

    const handleCopyLink = async () => {
        if (!quizUrl) return;

        try {
            const copiedSuccessfully = await copyToClipboard(quizUrl);
            if (!copiedSuccessfully) throw new Error('Clipboard not supported');

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy quiz link:', error);
        }
    };

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
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card border-t border-border shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                            <span className="sr-only">Fechar</span>
                        </button>

                        {/* Content */}
                        <div className="px-6 pb-8 pt-2">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <Globe className="w-8 h-8 text-green-600 dark:text-green-500" />
                                </div>
                                <h2 className="text-2xl font-semibold">Quiz Publicado!</h2>
                                <p className="text-base text-muted-foreground">
                                    Seu quiz está no ar e pronto para receber respostas. Compartilhe o link abaixo com sua audiência.
                                </p>
                            </div>

                            <div className="space-y-4 pt-6">
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={quizUrl}
                                        className="flex-1 font-mono text-sm bg-muted"
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                                </div>

                                <Button
                                    onClick={handleCopyLink}
                                    className="w-full gap-2"
                                    size="lg"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={20} />
                                            Link Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={20} />
                                            Copiar Link
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="w-full"
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
