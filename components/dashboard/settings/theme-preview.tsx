'use client';

import type { BrandKitColors } from '@/types';
import { useMemo, type CSSProperties } from 'react';

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

const DARK_TEXT = '#0f172a';
const LIGHT_TEXT = '#f8fafc';
const WHITE_HEX = '#ffffff';
const BLACK_HEX = '#000000';

// Color utility functions (same as blocks-quiz-player.tsx)
const hexToRgb = (value: string) => {
  const normalized = value.trim().replace('#', '');
  if (normalized.length !== 6) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
};

const relativeLuminance = (value: string) => {
  const rgb = hexToRgb(value);
  if (!rgb) return 0;
  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getReadableTextColor = (value: string) => {
  return relativeLuminance(value) > 0.6 ? DARK_TEXT : LIGHT_TEXT;
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (channel: number) => clampChannel(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixColors = (base: string, target: string, amount: number) => {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);
  if (!baseRgb || !targetRgb) return base;
  const mix = (from: number, to: number) => from + (to - from) * amount;
  return rgbToHex(
    mix(baseRgb.r, targetRgb.r),
    mix(baseRgb.g, targetRgb.g),
    mix(baseRgb.b, targetRgb.b)
  );
};

const getCardBorder = (cardColor: string) => {
  const cardLum = relativeLuminance(cardColor);
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX;
  const amount = cardLum < 0.5 ? 0.12 : 0.08;
  return mixColors(cardColor, target, amount);
};

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
    const mutedForeground = mixColors(
      getReadableTextColor(backgroundColor),
      backgroundColor,
      0.45
    );

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
