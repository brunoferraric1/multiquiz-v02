'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { auth, db } from '@/lib/firebase';
import { QuizService } from '@/lib/services/quiz-service';
import type { QuizDraft } from '@/types';

interface UseAutoSaveOptions {
  userId: string | undefined;
  enabled?: boolean;
  debounceMs?: number;
  onLimitError?: (error: Error) => void;
  isNewQuiz?: boolean;
}

export function useAutoSave({
  userId,
  enabled = true,
  debounceMs = 30000,
  onLimitError,
  isNewQuiz = false,
}: UseAutoSaveOptions) {
  const queryClient = useQueryClient();
  const quiz = useQuizBuilderStore((state) => state.quiz);
  const chatHistory = useQuizBuilderStore((state) => state.chatHistory);
  const setSaving = useQuizBuilderStore((state) => state.setSaving);
  const setError = useQuizBuilderStore((state) => state.setError);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const lastSavedCoverRef = useRef<string | undefined>(undefined);
  const savingCoverRef = useRef<boolean>(false);
  // Track the quiz ID to detect when a new/different quiz is loaded
  const initializedQuizIdRef = useRef<string | null>(null);

  // When a quiz is first loaded (different ID), initialize the lastSavedCoverRef
  // to prevent immediate save from overwriting Firestore data with stale localStorage data
  useEffect(() => {
    if (quiz.id && quiz.id !== initializedQuizIdRef.current) {
      console.log('[AutoSave] Quiz loaded, initializing cover ref:', quiz.coverImageUrl?.slice(0, 60));
      lastSavedCoverRef.current = quiz.coverImageUrl;
      initializedQuizIdRef.current = quiz.id;
    }
  }, [quiz.id, quiz.coverImageUrl]);

  const saveToFirestore = useCallback(async () => {
    if (!userId) {
      console.log('Auto-save skipped: missing userId');
      return;
    }

    const {
      quiz: currentQuiz,
      chatHistory: currentChatHistory,
      publishedVersion: currentPublishedVersion,
      publishedAt: currentPublishedAt,
    } = useQuizBuilderStore.getState();

    if (!currentQuiz.id) {
      console.log('Auto-save skipped: missing quiz.id');
      return;
    }

    // Prevent saving default/invalid state (e.g., after Fast Refresh reset)
    if (!currentQuiz.title && currentQuiz.questions?.length === 0 && currentQuiz.outcomes?.length === 0) {
      console.log('Auto-save skipped: quiz appears to be in default/uninitialized state');
      return;
    }

    // Create a snapshot to compare
    const currentSnapshot = JSON.stringify({
      quiz: currentQuiz,
      chatHistory: currentChatHistory,
    });

    // Skip if nothing changed
    if (currentSnapshot === lastSavedRef.current) {
      console.log('Auto-save skipped: no changes detected');
      return;
    }

    try {
      setSaving(true);
      console.log('Auto-saving quiz...');

      const quizToSave: QuizDraft = {
        ...currentQuiz,
        id: currentQuiz.id,
        title: currentQuiz.title || 'Sem título',
        description: currentQuiz.description || '',
        questions: currentQuiz.questions || [],
        outcomes: currentQuiz.outcomes || [],
        conversationHistory: currentChatHistory,
        ownerId: userId,
        updatedAt: Date.now(),
        createdAt: currentQuiz.createdAt || Date.now(),
        isPublished: currentQuiz.isPublished || false,
        stats: currentQuiz.stats || { views: 0, starts: 0, completions: 0 },
        leadGen: currentQuiz.leadGen,
        // Preserve live snapshot fields so auto-save doesn't wipe them
        publishedVersion: currentPublishedVersion ?? null,
        publishedAt: currentPublishedAt ?? null,
      };

      console.log('[AutoSave] quizToSave.leadGen:', JSON.stringify(quizToSave.leadGen));

      console.log('[AutoSave] Saving quiz with isPublished:', quizToSave.isPublished);
      console.log('[AutoSave] Quiz ID:', quizToSave.id);

      await QuizService.saveQuiz(quizToSave, userId, { isNewQuiz });

      // Only invalidate the quizzes LIST (for dashboard) - NOT the current quiz
      // Invalidating the current quiz would cause an infinite loop:
      // loadQuiz → save → invalidate → refetch → loadQuiz → ...
      queryClient.invalidateQueries({ queryKey: ['quizzes', userId] });

      // Update the last saved snapshot
      lastSavedRef.current = currentSnapshot;

      setError(null);
      console.log('Auto-save completed successfully');
    } catch (error) {
      const errorCode = (error as any)?.code || (error as Error)?.message;
      const authUser = auth?.currentUser;
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AutoSave] Failed to save quiz', {
          errorCode,
          errorMessage: (error as Error)?.message,
          userId,
          quizId: currentQuiz.id,
          quizOwnerId: currentQuiz.ownerId,
          isPublished: currentQuiz.isPublished,
          authUid: authUser?.uid,
          authEmail: authUser?.email,
          authProviders: authUser?.providerData?.map((provider) => provider.providerId),
          authProjectId: auth?.app?.options?.projectId,
          dbProjectId: db?.app?.options?.projectId,
          hasAuthUser: Boolean(authUser),
          hasDb: Boolean(db),
        });
      } else {
        console.error('[AutoSave] Failed to save quiz', { errorCode });
      }
      if (errorCode === 'DRAFT_LIMIT_REACHED') {
        setError('Limite de rascunhos atingido no plano gratuito. Exclua um rascunho ou faça upgrade.');
        onLimitError?.(error as Error);
        // Prevent spamming auto-save with the same payload
        lastSavedRef.current = currentSnapshot;
      } else {
        setError('Auto-save failed. Your changes are still saved locally.');
      }
    } finally {
      setSaving(false);
    }
  }, [userId, setSaving, setError, queryClient, isNewQuiz]);

  const saveToFirestoreRef = useRef(saveToFirestore);

  useEffect(() => {
    saveToFirestoreRef.current = saveToFirestore;
  }, [saveToFirestore]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled || !userId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveToFirestore();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [quiz, chatHistory, enabled, userId, debounceMs, saveToFirestore]);

  // Immediate save when cover image changes to a NEW Unsplash URL (important user action)
  useEffect(() => {
    if (!enabled || !userId || !quiz.id) return;

    const currentCover = quiz.coverImageUrl;

    // Only save if:
    // 1. There's a cover image
    // 2. It's an Unsplash URL (not a manual upload or other source)
    // 3. It's different from what we last saved
    // 4. We're not already in the middle of saving a cover
    const isUnsplashUrl = currentCover?.includes('unsplash.com');
    const isDifferentFromLastSaved = currentCover !== lastSavedCoverRef.current;

    if (currentCover && isUnsplashUrl && isDifferentFromLastSaved && !savingCoverRef.current) {
      console.log('Cover image changed to new Unsplash URL, triggering immediate save...', {
        newCover: currentCover?.slice(0, 60),
        lastSaved: lastSavedCoverRef.current?.slice(0, 60),
      });

      // Mark that we're saving this cover to prevent duplicate saves
      savingCoverRef.current = true;
      lastSavedCoverRef.current = currentCover;

      // Cancel any pending debounced save and save immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Use a small delay to ensure the state has fully propagated
      setTimeout(async () => {
        await saveToFirestore();
        savingCoverRef.current = false;
      }, 100);
    }
  }, [quiz.coverImageUrl, quiz.id, enabled, userId, saveToFirestore]);

  // Force save on unmount (when user leaves the page)
  useEffect(() => {
    return () => {
      // Cancel any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Force immediate save (best effort)
      saveToFirestoreRef.current();
    };
  }, []);

  // Return manual save function and cancel function
  return {
    forceSave: async () => {
      // Cancel pending auto-save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      await saveToFirestore();
    },
    cancelPendingSave: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
  };
}
