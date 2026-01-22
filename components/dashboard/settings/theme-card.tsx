'use client';

import { cn } from '@/lib/utils';
import type { BrandKitColors } from '@/types';
import { Check, Lock } from 'lucide-react';

interface ThemeCardProps {
  name: string;
  colors: BrandKitColors;
  isSelected: boolean;
  isLocked?: boolean;
  proBadge?: string;
  onClick: () => void;
}

/**
 * Selectable theme card with color preview dots
 */
export function ThemeCard({
  name,
  colors,
  isSelected,
  isLocked = false,
  proBadge,
  onClick,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left w-full',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        isLocked && 'opacity-60 cursor-not-allowed hover:border-border hover:bg-transparent'
      )}
    >
      {/* Color dots */}
      <div className="flex gap-1.5">
        <div
          className="w-5 h-5 rounded-full border border-white/20"
          style={{ backgroundColor: colors.primary }}
          title="Primary"
        />
        <div
          className="w-5 h-5 rounded-full border border-black/10"
          style={{ backgroundColor: colors.secondary }}
          title="Secondary"
        />
        <div
          className="w-5 h-5 rounded-full border border-black/10"
          style={{ backgroundColor: colors.accent }}
          title="Accent"
        />
      </div>

      {/* Theme name */}
      <span className="flex-1 text-sm font-medium">{name}</span>

      {/* Pro badge or lock icon */}
      {isLocked && proBadge && (
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Lock className="w-3 h-3" />
          {proBadge}
        </span>
      )}

      {/* Selected check */}
      {isSelected && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}
