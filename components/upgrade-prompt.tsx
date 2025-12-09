'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
    feature: string;
    description?: string;
    variant?: 'inline' | 'card' | 'banner';
}

export function UpgradePrompt({
    feature,
    description,
    variant = 'card'
}: UpgradePromptProps) {
    if (variant === 'banner') {
        return (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">
                            Desbloqueie {feature}
                        </p>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
                <Button asChild size="sm" className="shrink-0">
                    <Link href="/pricing">
                        Fazer Upgrade
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>{feature} disponível no</span>
                <Link
                    href="/pricing"
                    className="text-primary font-medium hover:underline"
                >
                    Plano Pro
                </Link>
            </div>
        );
    }

    // Card variant (default)
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xl bg-muted/30">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Lock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature}
            </h3>
            {description && (
                <p className="text-muted-foreground mb-6 max-w-sm">
                    {description}
                </p>
            )}
            <Button asChild>
                <Link href="/pricing">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Fazer Upgrade para Pro
                </Link>
            </Button>
        </div>
    );
}
