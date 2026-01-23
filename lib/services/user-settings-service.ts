'use client';

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WebhookConfig, UserSettings } from '@/types';

const USERS_COLLECTION = 'users';

/**
 * Generate a random secret for HMAC signing
 */
export function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return 'whsec_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get user's webhook configuration from Firestore
 */
export async function getWebhookConfig(userId: string): Promise<WebhookConfig | null> {
  if (!db || !userId) return null;

  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    const webhookConfig = data?.webhookConfig as WebhookConfig | undefined;

    if (!webhookConfig) return null;

    return {
      enabled: webhookConfig.enabled ?? false,
      url: webhookConfig.url ?? '',
      secret: webhookConfig.secret ?? '',
    };
  } catch (error) {
    console.error('[UserSettingsService] Error getting webhook config:', error);
    return null;
  }
}

/**
 * Save user's webhook configuration to Firestore
 */
export async function saveWebhookConfig(
  userId: string,
  config: WebhookConfig
): Promise<void> {
  if (!db || !userId) return;

  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        webhookConfig: {
          enabled: config.enabled,
          url: config.url,
          secret: config.secret,
          updatedAt: serverTimestamp(),
        },
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[UserSettingsService] Error saving webhook config:', error);
    throw error;
  }
}

/**
 * Get full user settings (currently just webhook config)
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const webhookConfig = await getWebhookConfig(userId);
  return {
    webhookConfig: webhookConfig ?? undefined,
  };
}
