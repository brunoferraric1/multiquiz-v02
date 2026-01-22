'use client';

import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/services/user-profile-service';
import type { AuthUser } from '@/types';

// Track which users have been synced this session to prevent repeated writes
// that would trigger subscription snapshots and cause re-render loops
const syncedUsersThisSession = new Set<string>();

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const nextUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        const projectId = auth?.app?.options?.projectId;
        if (projectId?.includes('staging')) {
          console.log('[Auth Debug]', {
            uid: firebaseUser.uid,
            projectId,
            authDomain: auth?.app?.options?.authDomain,
          });
        }

        setUser(nextUser);

        // Only sync profile once per user per session to avoid triggering
        // subscription snapshot updates that cause re-render loops
        if (!syncedUsersThisSession.has(firebaseUser.uid)) {
          syncedUsersThisSession.add(firebaseUser.uid);
          void upsertUserProfile(nextUser).catch((error) => {
            console.warn('[useAuth] Failed to sync user profile', error);
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Reset auth state
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    try {
      await updateProfile(auth.currentUser, data);
      const updatedUser: AuthUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
      };

      setUser(updatedUser);
      void upsertUserProfile(updatedUser).catch((error) => {
        console.warn('[useAuth] Failed to sync updated profile', error);
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
    updateUserProfile,
  };
}
