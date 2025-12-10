'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingCardProps {
    isLoading: boolean;
    children: React.ReactNode;
    className?: string;
}

/**
 * A wrapper component that adds an animated loading border (beam effect)
 * and content fade when isLoading is true.
 */
export function LoadingCard({ isLoading, children, className }: LoadingCardProps) {
    return (
        <div className={cn('relative', className)}>
            {/* Animated beam border */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Rotating gradient beam */}
                        <motion.div
                            className="absolute inset-[-2px] rounded-2xl"
                            style={{
                                background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)) 60deg, transparent 120deg)',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                        {/* Inner background to mask the rotating gradient - matches card bg */}
                        <div className="absolute inset-[2px] rounded-2xl bg-muted/60" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading spinner overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="loading-spinner"
                        className="absolute inset-0 flex items-center justify-center rounded-2xl z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <Loader2 className="h-6 w-6 text-primary" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content with fade transition */}
            <motion.div
                animate={{ opacity: isLoading ? 0.3 : 1 }}
                transition={{ duration: 0.2 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
