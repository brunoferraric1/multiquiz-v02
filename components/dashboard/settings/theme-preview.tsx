'use client';

import type { BrandKitColors } from '@/types';
import { useMemo, type CSSProperties } from 'react';
import {
  getReadableTextColor,
  getCardBorder,
  getMutedForeground,
} from '@/lib/utils/color';

interface ThemePreviewProps {
  colors: BrandKitColors;
  logoUrl?: string | null;
  copy: {
    title: string;
    questionLabel: string;
    option1: string;
    option2: string;
    buttonText: string;
  };
}

type BrandKitStyle = CSSProperties & Record<`--${string}`, string>;

/**
 * Mini quiz preview showing active theme colors
 */
export function ThemePreview({
  colors,
  logoUrl,
  copy,
}: ThemePreviewProps) {
  const style = useMemo(() => {
    const primary = colors.primary;
    const cardColor = colors.secondary;
    const backgroundColor = colors.accent;
    const cardBorder = getCardBorder(cardColor);
    const mutedForeground = getMutedForeground(backgroundColor);

    const brandKitStyle: BrandKitStyle = {
      '--color-primary': primary,
      '--color-primary-foreground': getReadableTextColor(primary),
      '--color-secondary': cardColor,
      '--color-secondary-foreground': getReadableTextColor(cardColor),
      '--color-background': backgroundColor,
      '--color-foreground': getReadableTextColor(backgroundColor),
      '--color-muted-foreground': mutedForeground,
      '--color-card': cardColor,
      '--color-card-foreground': getReadableTextColor(cardColor),
      '--color-border': cardBorder,
    };

    return brandKitStyle;
  }, [colors]);

  return (
    <div
      className="rounded-xl overflow-hidden border shadow-sm"
      style={{
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-foreground)',
        ...style,
      }}
    >
      {/* Logo area */}
      {logoUrl && (
        <div className="p-3 flex justify-center">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 w-auto max-w-[120px] object-contain"
          />
        </div>
      )}

      {/* Preview content */}
      <div className="p-4 space-y-4">
        {/* Question label */}
        <div className="text-center">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-foreground)' }}
          >
            {copy.questionLabel}
          </p>
        </div>

        {/* Option cards */}
        <div className="space-y-2">
          <div
            className="p-3 rounded-lg border text-center text-sm"
            style={{
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-card-foreground)',
              borderColor: 'var(--color-border)',
            }}
          >
            {copy.option1}
          </div>
          <div
            className="p-3 rounded-lg border text-center text-sm"
            style={{
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-card-foreground)',
              borderColor: 'var(--color-primary)',
              boxShadow: `0 0 0 1px var(--color-primary)`,
            }}
          >
            {copy.option2}
          </div>
        </div>

        {/* Button */}
        <button
          type="button"
          className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          {copy.buttonText}
        </button>
      </div>
    </div>
  );
}
