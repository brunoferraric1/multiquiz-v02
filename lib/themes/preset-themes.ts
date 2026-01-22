import type { PresetThemeId, BrandKitColors } from '@/types';

export interface PresetTheme {
  id: PresetThemeId;
  name: string;
  colors: BrandKitColors;
}

export const PRESET_THEMES: Record<PresetThemeId, PresetTheme> = {
  'multiquiz-dark': {
    id: 'multiquiz-dark',
    name: 'MultiQuiz Dark',
    colors: {
      primary: '#fbbf24',
      secondary: '#232936',
      accent: '#1a1f2e',
    },
  },
  'multiquiz-light': {
    id: 'multiquiz-light',
    name: 'MultiQuiz Light',
    colors: {
      primary: '#f59e0b',
      secondary: '#ffffff',
      accent: '#f8fafc',
    },
  },
};

export const DEFAULT_THEME_ID: PresetThemeId = 'multiquiz-dark';

/**
 * Get colors for a preset theme
 */
export function getPresetThemeColors(presetId: PresetThemeId): BrandKitColors {
  return PRESET_THEMES[presetId].colors;
}

/**
 * List all preset themes for display
 */
export function getPresetThemesList(): PresetTheme[] {
  return Object.values(PRESET_THEMES);
}
