'use client';

import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BrandKit, UserThemeSettings, BrandKitColors } from '@/types';
import { PRESET_THEMES, DEFAULT_THEME_ID } from '@/lib/themes/preset-themes';

const USERS_COLLECTION = 'users';

export async function getBrandKit(userId: string): Promise<BrandKit | null> {
  if (!db || !userId) return null;

  const userRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  const brandKit = data?.brandKit as BrandKit | undefined;
  if (!brandKit?.colors) return null;

  const updatedAt =
    typeof brandKit.updatedAt === 'number'
      ? brandKit.updatedAt
      : (() => {
          const u = brandKit.updatedAt as unknown;
          if (
            typeof u === 'object' &&
            u !== null &&
            'toMillis' in u &&
            typeof (u as { toMillis?: unknown }).toMillis === 'function'
          ) {
            return (u as { toMillis: () => number }).toMillis();
          }
          return undefined;
        })();

  return {
    name: typeof brandKit.name === 'string' ? brandKit.name : undefined,
    logoUrl: brandKit.logoUrl ?? null,
    colors: {
      primary: brandKit.colors.primary,
      secondary: brandKit.colors.secondary,
      accent: brandKit.colors.accent,
    },
    updatedAt,
  };
}

export async function saveBrandKit(userId: string, brandKit: BrandKit): Promise<void> {
  if (!db || !userId) return;

  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    userRef,
    {
      brandKit: {
        name: brandKit.name?.trim() || null,
        logoUrl: brandKit.logoUrl ?? null,
        colors: brandKit.colors,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}

export async function deleteBrandKit(userId: string): Promise<void> {
  if (!db || !userId) return;

  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    userRef,
    {
      brandKit: deleteField(),
    },
    { merge: true }
  );
}

// Theme Settings functions

/**
 * Get the user's theme settings from Firestore
 */
export async function getThemeSettings(userId: string): Promise<UserThemeSettings | null> {
  if (!db || !userId) return null;

  const userRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  const themeSettings = data?.themeSettings as UserThemeSettings | undefined;

  if (!themeSettings) return null;

  const updatedAt =
    typeof themeSettings.updatedAt === 'number'
      ? themeSettings.updatedAt
      : (() => {
          const u = themeSettings.updatedAt as unknown;
          if (
            typeof u === 'object' &&
            u !== null &&
            'toMillis' in u &&
            typeof (u as { toMillis?: unknown }).toMillis === 'function'
          ) {
            return (u as { toMillis: () => number }).toMillis();
          }
          return undefined;
        })();

  return {
    mode: themeSettings.mode,
    presetId: themeSettings.presetId,
    customBrandKit: themeSettings.customBrandKit,
    updatedAt,
  };
}

/**
 * Save user's theme settings to Firestore
 */
export async function saveThemeSettings(
  userId: string,
  settings: UserThemeSettings
): Promise<void> {
  if (!db || !userId) return;

  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    userRef,
    {
      themeSettings: {
        mode: settings.mode,
        presetId: settings.presetId ?? null,
        customBrandKit: settings.customBrandKit ?? null,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}

/**
 * Resolve the effective colors from theme settings
 * Returns the colors that should be applied to quizzes
 */
export function resolveThemeColors(settings: UserThemeSettings | null): BrandKitColors {
  if (!settings) {
    // Default to dark preset
    return PRESET_THEMES[DEFAULT_THEME_ID].colors;
  }

  if (settings.mode === 'preset' && settings.presetId) {
    return PRESET_THEMES[settings.presetId].colors;
  }

  if (settings.mode === 'custom' && settings.customBrandKit?.colors) {
    return settings.customBrandKit.colors;
  }

  // Fallback to dark preset
  return PRESET_THEMES[DEFAULT_THEME_ID].colors;
}

/**
 * Resolve the logo URL from theme settings
 * Only custom themes can have logos
 */
export function resolveThemeLogo(settings: UserThemeSettings | null): string | null {
  if (!settings || settings.mode !== 'custom') {
    return null;
  }

  return settings.customBrandKit?.logoUrl ?? null;
}
