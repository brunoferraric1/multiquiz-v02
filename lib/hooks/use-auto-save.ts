'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { QuizService } from '@/lib/services/quiz-service';
import type { QuizDraft } from '@/types';

interface UseAutoSaveOptions {
  userId: string | undefined;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave({ userId, enabled = true, debounceMs = 30000 }: UseAutoSaveOptions) {
  const queryClient = useQueryClient();
  const quiz = useQuizBuilderStore((state) => state.quiz);
  const chatHistory = useQuizBuilderStore((state) => state.chatHistory);
  const setSaving = useQuizBuilderStore((state) => state.setSaving);
  const setError = useQuizBuilderStore((state) => state.setError);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const lastSavedCoverRef = useRef<string | undefined>(undefined);
  const savingCoverRef = useRef<boolean>(false);

  const saveToFirestore = useCallback(async () => {
    if (!userId) {
      console.log('Auto-save skipped: missing userId');
      return;
    }

    const { quiz: currentQuiz, chatHistory: currentChatHistory } =
      useQuizBuilderStore.getState();

    if (!currentQuiz.id) {
      console.log('Auto-save skipped: missing quiz.id');
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
      };

      console.log('[AutoSave] Saving quiz with isPublished:', quizToSave.isPublished);
      console.log('[AutoSave] Quiz ID:', quizToSave.id);

      await QuizService.saveQuiz(quizToSave, userId);

      // Only invalidate the quizzes LIST (for dashboard) - NOT the current quiz
      // Invalidating the current quiz would cause an infinite loop:
      // loadQuiz → save → invalidate → refetch → loadQuiz → ...
      queryClient.invalidateQueries({ queryKey: ['quizzes', userId] });

      // Update the last saved snapshot
      lastSavedRef.current = currentSnapshot;

      setError(null);
      console.log('Auto-save completed successfully');
    } catch (error) {
      console.error('Auto-save error:', error);
      setError('Auto-save failed. Your changes are still saved locally.');
    } finally {
      setSaving(false);
    }
  }, [userId, setSaving, setError, queryClient]);

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
