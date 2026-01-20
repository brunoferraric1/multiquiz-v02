'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useVisualBuilderStore } from '@/store/visual-builder-store'
import { QuizService } from '@/lib/services/quiz-service'
import { visualBuilderToQuiz } from '@/lib/utils/visual-builder-converters'
import type { QuizDraft } from '@/types'

interface UseVisualBuilderAutoSaveOptions {
  quizId: string | undefined
  userId: string | undefined
  enabled?: boolean
  debounceMs?: number
  isNewQuiz?: boolean
  /**
   * Existing quiz data to merge with (preserves fields not managed by visual builder)
   */
  existingQuiz?: QuizDraft | null
  /**
   * Callback when auto-save completes successfully
   */
  onSaveComplete?: () => void
  /**
   * Callback when auto-save fails
   */
  onSaveError?: (error: Error) => void
  /**
   * Callback when limit error occurs
   */
  onLimitError?: (error: Error) => void
}

interface UseVisualBuilderAutoSaveReturn {
  forceSave: () => Promise<void>
  cancelPendingSave: () => void
  isSaving: boolean
}

/**
 * Auto-save hook for the Visual Builder
 *
 * This hook listens to changes in the visual builder store (steps/blocks/outcomes)
 * and automatically saves them to Firestore in the legacy quiz format.
 *
 * Key features:
 * - Debounced saves (default 30s, 5s for new quizzes)
 * - Change detection to skip unnecessary saves
 * - Preserves quiz metadata not managed by visual builder
 * - Handles draft limits for free users
 */
export function useVisualBuilderAutoSave({
  quizId,
  userId,
  enabled = true,
  debounceMs = 30000,
  isNewQuiz = false,
  existingQuiz,
  onSaveComplete,
  onSaveError,
  onLimitError,
}: UseVisualBuilderAutoSaveOptions): UseVisualBuilderAutoSaveReturn {
  // Use shorter debounce for new quizzes
  const effectiveDebounceMs = isNewQuiz ? Math.min(debounceMs, 5000) : debounceMs

  const queryClient = useQueryClient()

  // Read visual builder state
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)

  // Refs for tracking state
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef<boolean>(false)
  const existingQuizRef = useRef<QuizDraft | null | undefined>(existingQuiz)

  // Keep existingQuiz ref updated
  useEffect(() => {
    existingQuizRef.current = existingQuiz
  }, [existingQuiz])

  const saveToFirestore = useCallback(async () => {
    console.log('[VBAutoSave] saveToFirestore called', { userId, quizId, stepsCount: steps.length, outcomesCount: outcomes.length })

    if (!userId || !quizId) {
      console.log('[VBAutoSave] Skipped: missing userId or quizId', { userId, quizId })
      return
    }

    // Create a snapshot to compare
    const currentSnapshot = JSON.stringify({ steps, outcomes })

    // Skip if nothing changed
    if (currentSnapshot === lastSavedRef.current) {
      console.log('[VBAutoSave] Skipped: no changes detected')
      return
    }

    // Skip if steps are empty or only have default steps with no real content
    const hasContent = steps.some((step) => {
      if (step.type === 'question') return true
      if (step.type === 'lead-gen') return true
      if (step.type === 'promo') return true
      return false
    }) || outcomes.length > 0

    // For intro-only quizzes, check if there's any real content
    const introStep = steps.find((s) => s.type === 'intro')
    const introHasContent = introStep?.blocks.some((b) => {
      if (b.type === 'header' && b.enabled) {
        const config = b.config as { title?: string; description?: string }
        return !!(config.title || config.description)
      }
      return false
    })

    if (!hasContent && !introHasContent) {
      console.log('[VBAutoSave] Skipped: no meaningful content to save')
      return
    }

    try {
      isSavingRef.current = true
      console.log('[VBAutoSave] Saving quiz...')

      // Convert visual builder data to quiz format
      const vbData = { steps, outcomes }
      const converted = visualBuilderToQuiz(vbData)

      // Merge with existing quiz data to preserve metadata
      const baseQuiz = existingQuizRef.current || {}

      console.log('[VBAutoSave] Converted data:', {
        title: converted.title,
        questionsCount: converted.questions?.length,
        outcomesCount: converted.outcomes?.length,
      })

      const quizToSave: QuizDraft = {
        ...baseQuiz,
        id: quizId,
        title: converted.title || baseQuiz.title || 'Sem título',
        description: converted.description || baseQuiz.description || '',
        coverImageUrl: converted.coverImageUrl || baseQuiz.coverImageUrl,
        questions: converted.questions,
        outcomes: converted.outcomes,
        leadGen: converted.leadGen,
        ownerId: userId,
        updatedAt: Date.now(),
        createdAt: baseQuiz.createdAt || Date.now(),
        isPublished: baseQuiz.isPublished || false,
        stats: baseQuiz.stats || { views: 0, starts: 0, completions: 0 },
        // Preserve live snapshot fields
        publishedVersion: baseQuiz.publishedVersion ?? null,
        publishedAt: baseQuiz.publishedAt ?? null,
        // Store visual builder data for production rendering
        visualBuilderData: {
          schemaVersion: 1,
          steps,
          outcomes,
        },
      }

      await QuizService.saveQuiz(quizToSave, userId, { isNewQuiz })

      // Invalidate the quizzes list (for dashboard)
      queryClient.invalidateQueries({ queryKey: ['quizzes', userId] })

      // Update the last saved snapshot
      lastSavedRef.current = currentSnapshot

      console.log('[VBAutoSave] Save completed successfully')
      onSaveComplete?.()
    } catch (error) {
      const errorCode = (error as any)?.code || (error as Error)?.message
      console.error('[VBAutoSave] Failed to save quiz', {
        errorCode,
        errorMessage: (error as Error)?.message,
        quizId,
        userId,
      })

      if (errorCode === 'DRAFT_LIMIT_REACHED') {
        onLimitError?.(error as Error)
        // Prevent spamming auto-save with the same payload
        lastSavedRef.current = currentSnapshot
      } else {
        onSaveError?.(error as Error)
      }
    } finally {
      isSavingRef.current = false
    }
  }, [steps, outcomes, quizId, userId, isNewQuiz, queryClient, onSaveComplete, onSaveError, onLimitError])

  // Keep saveToFirestore ref updated
  const saveToFirestoreRef = useRef(saveToFirestore)
  useEffect(() => {
    saveToFirestoreRef.current = saveToFirestore
  }, [saveToFirestore])

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled || !userId || !quizId) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveToFirestore()
    }, effectiveDebounceMs)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [steps, outcomes, enabled, userId, quizId, effectiveDebounceMs, saveToFirestore])

  // Force save on unmount (when user leaves the page)
  useEffect(() => {
    return () => {
      // Cancel any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Force immediate save (best effort)
      saveToFirestoreRef.current()
    }
  }, [])

  // Return manual save function and cancel function
  return {
    forceSave: async () => {
      // Cancel pending auto-save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      await saveToFirestore()
    },
    cancelPendingSave: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    },
    isSaving: isSavingRef.current,
  }
}
