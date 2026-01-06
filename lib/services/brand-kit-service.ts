'use client';

import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BrandKit } from '@/types';

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
      : typeof (brandKit.updatedAt as { toMillis?: () => number } | undefined)?.toMillis === 'function'
        ? (brandKit.updatedAt as { toMillis: () => number }).toMillis()
        : undefined;

  return {
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
