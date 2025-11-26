'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQuizBuilderStore } from '@/store/quiz-builder-store';
import { QuizService } from '@/lib/services/quiz-service';
import type { Quiz } from '@/types';

interface UseAutoSaveOptions {
  userId: string | undefined;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave({ userId, enabled = true, debounceMs = 30000 }: UseAutoSaveOptions) {
  const quiz = useQuizBuilderStore((state) => state.quiz);
  const chatHistory = useQuizBuilderStore((state) => state.chatHistory);
  const setSaving = useQuizBuilderStore((state) => state.setSaving);
  const setError = useQuizBuilderStore((state) => state.setError);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const lastSavedCoverRef = useRef<string | undefined>(undefined);
  const savingCoverRef = useRef<boolean>(false);

  const saveToFirestore = useCallback(async () => {
    if (!userId || !quiz.id) {
      console.log('Auto-save skipped: missing userId or quiz.id');
      return;
    }

    // Create a snapshot to compare
    const currentSnapshot = JSON.stringify({ quiz, chatHistory });

    // Skip if nothing changed
    if (currentSnapshot === lastSavedRef.current) {
      console.log('Auto-save skipped: no changes detected');
      return;
    }

    try {
      setSaving(true);
      console.log('Auto-saving quiz...');

      const quizToSave: any = {
        ...quiz,
        id: quiz.id,
        title: quiz.title || 'Sem título',
        description: quiz.description || '',
        questions: quiz.questions || [],
        outcomes: quiz.outcomes || [],
        conversationHistory: chatHistory,
        ownerId: userId,
        updatedAt: Date.now(),
        createdAt: quiz.createdAt || Date.now(),
        isPublished: quiz.isPublished || false,
        stats: quiz.stats || { views: 0, starts: 0, completions: 0 },
      };

      await QuizService.saveQuiz(quizToSave, userId);

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
  }, [userId, quiz, chatHistory, setSaving, setError]);

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
      saveToFirestore();
    };
  }, [saveToFirestore]);

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
