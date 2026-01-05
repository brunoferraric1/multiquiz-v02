import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AuthUser } from '@/types';

export async function upsertUserProfile(user: AuthUser): Promise<void> {
  if (!db) return;

  const userRef = doc(db, 'users', user.uid);

  await setDoc(
    userRef,
    {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
