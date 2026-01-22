/**
 * Color utility functions for WCAG-compliant contrast calculations
 *
 * This module provides functions for:
 * - Converting between color formats (hex, RGB)
 * - Calculating relative luminance per WCAG 2.1
 * - Calculating contrast ratios per WCAG 2.1
 * - Selecting accessible text colors based on background
 * - Mixing colors for UI effects (borders, muted colors)
 */

export const DARK_TEXT = '#0f172a';
export const LIGHT_TEXT = '#f8fafc';
export const WHITE_HEX = '#ffffff';
export const BLACK_HEX = '#000000';

type RGB = { r: number; g: number; b: number };

/**
 * Convert a hex color to RGB components
 */
export const hexToRgb = (value: string): RGB | null => {
  const normalized = value.trim().replace('#', '');
  if (normalized.length !== 6) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
};

/**
 * Clamp a color channel value to valid range [0, 255]
 */
export const clampChannel = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

/**
 * Convert RGB components to hex color
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (channel: number) =>
    clampChannel(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Calculate relative luminance per WCAG 2.1 specification
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * @param value - Hex color string (e.g., "#ffffff" or "ffffff")
 * @returns Relative luminance value between 0 (black) and 1 (white)
 */
export const relativeLuminance = (value: string): number => {
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

/**
 * Calculate contrast ratio between two colors per WCAG 2.1
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * @param l1 - Luminance of first color
 * @param l2 - Luminance of second color
 * @returns Contrast ratio (1:1 to 21:1)
 */
export const getContrastRatio = (l1: number, l2: number): number => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Pre-calculated luminance values for text colors
const LIGHT_TEXT_LUMINANCE = relativeLuminance(LIGHT_TEXT);
const DARK_TEXT_LUMINANCE = relativeLuminance(DARK_TEXT);

/**
 * Get the most readable text color for a given background
 *
 * This function calculates actual WCAG contrast ratios for both
 * light and dark text options, and returns whichever has better contrast.
 *
 * WCAG 2.1 AA requires:
 * - 4.5:1 for normal text
 * - 3:1 for large text (18pt+ or 14pt+ bold)
 *
 * @param bgHex - Background color as hex string
 * @returns Either DARK_TEXT or LIGHT_TEXT, whichever has better contrast
 */
export const getReadableTextColor = (bgHex: string): string => {
  const bgLum = relativeLuminance(bgHex);

  const lightContrast = getContrastRatio(bgLum, LIGHT_TEXT_LUMINANCE);
  const darkContrast = getContrastRatio(bgLum, DARK_TEXT_LUMINANCE);

  return darkContrast > lightContrast ? DARK_TEXT : LIGHT_TEXT;
};

/**
 * Check if a text color on a background meets WCAG AA requirements
 *
 * @param textHex - Text color as hex string
 * @param bgHex - Background color as hex string
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns true if the combination meets WCAG AA requirements
 */
export const meetsWcagAA = (
  textHex: string,
  bgHex: string,
  isLargeText = false
): boolean => {
  const textLum = relativeLuminance(textHex);
  const bgLum = relativeLuminance(bgHex);
  const ratio = getContrastRatio(textLum, bgLum);
  const threshold = isLargeText ? 3 : 4.5;
  return ratio >= threshold;
};

/**
 * Mix two colors together by a specified amount
 *
 * @param base - Base color as hex string
 * @param target - Target color to mix toward
 * @param amount - Mix amount (0 = all base, 1 = all target)
 * @returns Mixed color as hex string
 */
export const mixColors = (
  base: string,
  target: string,
  amount: number
): string => {
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

/**
 * Get a subtle border color for a card based on its background
 *
 * Creates a border that's slightly lighter (for dark cards) or
 * slightly darker (for light cards) than the card background.
 *
 * @param cardColor - Card background color as hex string
 * @returns Border color as hex string
 */
export const getCardBorder = (cardColor: string): string => {
  const cardLum = relativeLuminance(cardColor);
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX;
  const amount = cardLum < 0.5 ? 0.12 : 0.08;
  return mixColors(cardColor, target, amount);
};

/**
 * Get a muted foreground color for secondary text
 *
 * Creates a color that's between the readable text color and
 * the background, providing a softer appearance for less important text.
 *
 * @param backgroundColor - Background color as hex string
 * @param amount - How much to mute (0 = full contrast, 1 = invisible)
 * @returns Muted text color as hex string
 */
export const getMutedForeground = (
  backgroundColor: string,
  amount = 0.45
): string => {
  const textColor = getReadableTextColor(backgroundColor);
  return mixColors(textColor, backgroundColor, amount);
};

/**
 * Get a subtle input background color based on card color
 *
 * Creates an input background that's slightly different from the card,
 * lighter for dark cards, darker for light cards.
 *
 * @param cardColor - Card background color as hex string
 * @returns Input background color as hex string
 */
export const getInputBackground = (cardColor: string): string => {
  const cardLum = relativeLuminance(cardColor);
  return cardLum < 0.5
    ? mixColors(cardColor, WHITE_HEX, 0.08)
    : mixColors(cardColor, BLACK_HEX, 0.04);
};

/**
 * Get a subtle input border color
 *
 * @param inputColor - Input background color as hex string
 * @param inputForeground - Input text color as hex string
 * @returns Input border color as hex string
 */
export const getInputBorder = (
  inputColor: string,
  inputForeground: string
): string => {
  return mixColors(inputColor, inputForeground, 0.1);
};

/**
 * Get hover background for interactive cards
 *
 * @param cardColor - Card background color as hex string
 * @returns Hover background color as hex string
 */
export const getCardHoverBackground = (cardColor: string): string => {
  const cardLum = relativeLuminance(cardColor);
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX;
  const amount = cardLum < 0.5 ? 0.14 : 0.08;
  return mixColors(cardColor, target, amount);
};

/**
 * Get hover border for interactive cards
 *
 * @param cardColor - Card background color as hex string
 * @returns Hover border color as hex string
 */
export const getCardHoverBorder = (cardColor: string): string => {
  const cardLum = relativeLuminance(cardColor);
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX;
  const amount = cardLum < 0.5 ? 0.22 : 0.16;
  return mixColors(cardColor, target, amount);
};
