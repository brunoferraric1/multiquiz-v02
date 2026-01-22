'use client';

import { cn } from '@/lib/utils';
import type { BrandKitColors } from '@/types';
import { Check } from 'lucide-react';

interface ThemeCardProps {
  name: string;
  colors: BrandKitColors;
  isSelected: boolean;
  proBadge?: string;
  benefits?: string[];
  onClick: () => void;
}

/**
 * Selectable theme card with color preview dots
 *
 * When benefits are provided, shows them as a list with green checkmarks
 * to highlight Pro feature value
 */
export function ThemeCard({
  name,
  colors,
  isSelected,
  proBadge,
  benefits,
  onClick,
}: ThemeCardProps) {
  const hasBenefits = benefits && benefits.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-3 p-3 rounded-lg border-2 transition-all text-left w-full',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      {/* Top row: colors, name, badge, check */}
      <div className="flex items-center gap-3 w-full">
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
        <span className="flex-1 text-sm font-medium">
          {name}
        </span>

        {/* Pro badge */}
        {proBadge && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
            {proBadge}
          </span>
        )}

        {/* Selected check */}
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Benefits list */}
      {hasBenefits && (
        <ul className="flex flex-col gap-1.5 pl-1">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
