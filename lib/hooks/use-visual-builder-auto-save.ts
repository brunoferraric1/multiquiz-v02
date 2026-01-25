'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useVisualBuilderStore, Step, Outcome } from '@/store/visual-builder-store'
import { QuizService } from '@/lib/services/quiz-service'
import {
  extractTitleFromSteps,
  extractDescriptionFromSteps,
  extractCoverImageFromSteps,
  extractLeadGenConfig,
} from '@/lib/utils/visual-builder-helpers'
import {
  isBase64DataUrl,
  migrateBase64ToStorage,
  getBlockMediaPath,
  getOutcomeBlockMediaPath,
  getVideoThumbnailPath,
  getOptionImagePath,
} from '@/lib/services/storage-service'
import type { QuizDraft } from '@/types'
import type { Block, MediaConfig, OptionsConfig, OptionItem } from '@/types/blocks'

/**
 * Migrate base64 images in blocks to Firebase Storage
 * Returns new blocks array with Storage URLs instead of base64
 */
async function migrateBlockImages(
  blocks: Block[],
  quizId: string,
  containerId: string,
  getPath: (quizId: string, containerId: string, blockId: string) => string
): Promise<Block[]> {
  const migratedBlocks: Block[] = []

  for (const block of blocks) {
    if (block.type === 'media') {
      const config = block.config as MediaConfig
      let newConfig = { ...config }
      let needsUpdate = false

      // Migrate main URL if it's base64
      if (isBase64DataUrl(config.url)) {
        try {
          const storagePath = getPath(quizId, containerId, block.id)
          const downloadUrl = await migrateBase64ToStorage(config.url!, storagePath)
          console.log('[VBAutoSave] Migrated block image to Storage:', block.id)
          newConfig.url = downloadUrl
          needsUpdate = true
        } catch (err) {
          console.error('[VBAutoSave] Failed to migrate block image:', block.id, err)
          newConfig.url = ''
          needsUpdate = true
        }
      }

      // Migrate video thumbnail if it's base64
      if (isBase64DataUrl(config.videoThumbnail)) {
        try {
          const thumbnailPath = getVideoThumbnailPath(quizId, containerId, block.id)
          const downloadUrl = await migrateBase64ToStorage(config.videoThumbnail!, thumbnailPath)
          console.log('[VBAutoSave] Migrated video thumbnail to Storage:', block.id)
          newConfig.videoThumbnail = downloadUrl
          needsUpdate = true
        } catch (err) {
          console.error('[VBAutoSave] Failed to migrate video thumbnail:', block.id, err)
          newConfig.videoThumbnail = ''
          needsUpdate = true
        }
      }

      migratedBlocks.push(needsUpdate ? { ...block, config: newConfig } : block)
    } else if (block.type === 'options') {
      // Migrate option images if any are base64
      const config = block.config as OptionsConfig
      if (!config.showImages || !config.items?.length) {
        migratedBlocks.push(block)
        continue
      }

      let needsUpdate = false
      const migratedItems: OptionItem[] = []

      for (const item of config.items) {
        if (isBase64DataUrl(item.imageUrl)) {
          try {
            const storagePath = getOptionImagePath(quizId, containerId, block.id, item.id)
            const downloadUrl = await migrateBase64ToStorage(item.imageUrl!, storagePath)
            console.log('[VBAutoSave] Migrated option image to Storage:', item.id)
            migratedItems.push({ ...item, imageUrl: downloadUrl })
            needsUpdate = true
          } catch (err) {
            console.error('[VBAutoSave] Failed to migrate option image:', item.id, err)
            migratedItems.push({ ...item, imageUrl: undefined })
            needsUpdate = true
          }
        } else {
          migratedItems.push(item)
        }
      }

      if (needsUpdate) {
        migratedBlocks.push({ ...block, config: { ...config, items: migratedItems } })
      } else {
        migratedBlocks.push(block)
      }
    } else {
      migratedBlocks.push(block)
    }
  }

  return migratedBlocks
}

/**
 * Migrate base64 images in steps to Firebase Storage
 */
async function migrateStepImages(steps: Step[], quizId: string): Promise<Step[]> {
  const migratedSteps: Step[] = []

  for (const step of steps) {
    const migratedBlocks = await migrateBlockImages(
      step.blocks,
      quizId,
      step.id,
      getBlockMediaPath
    )
    migratedSteps.push({
      ...step,
      blocks: migratedBlocks,
    })
  }

  return migratedSteps
}

/**
 * Migrate base64 images in outcomes to Firebase Storage
 */
async function migrateOutcomeImages(outcomes: Outcome[], quizId: string): Promise<Outcome[]> {
  const migratedOutcomes: Outcome[] = []

  for (const outcome of outcomes) {
    const migratedBlocks = await migrateBlockImages(
      outcome.blocks,
      quizId,
      outcome.id,
      getOutcomeBlockMediaPath
    )
    migratedOutcomes.push({
      ...outcome,
      blocks: migratedBlocks,
    })
  }

  return migratedOutcomes
}

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

  // Store actions to update after migration
  const setSteps = useVisualBuilderStore((state) => state.setSteps)
  const setOutcomes = useVisualBuilderStore((state) => state.setOutcomes)

  // Refs for tracking state
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef<boolean>(false)
  const existingQuizRef = useRef<QuizDraft | null | undefined>(existingQuiz)
  const isMountedRef = useRef(true)
  const [isSaving, setIsSaving] = useState(false)

  // Keep existingQuiz ref updated
  useEffect(() => {
    existingQuizRef.current = existingQuiz
  }, [existingQuiz])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const setSavingState = useCallback((nextState: boolean) => {
    if (isMountedRef.current) {
      setIsSaving(nextState)
    }
  }, [])

  const saveToFirestore = useCallback(async () => {
    console.log('[VBAutoSave] saveToFirestore called', {
      userId,
      quizId,
      stepsCount: steps.length,
      outcomesCount: outcomes.length,
      stepTypes: steps.map(s => s.type),
    })

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
      setSavingState(true)
      console.log('[VBAutoSave] Saving quiz...')

      // Check if there are any base64 images that need migration
      const hasBase64Images = [...steps, ...outcomes].some((item) =>
        item.blocks?.some((block) =>
          block.type === 'media' && isBase64DataUrl((block.config as any)?.url)
        )
      )

      // For new quizzes with images, we need to save a skeleton first
      // so that Storage rules can verify quiz ownership
      if (isNewQuiz && hasBase64Images) {
        console.log('[VBAutoSave] New quiz with images - saving skeleton first...')
        const baseQuiz = existingQuizRef.current || {}
        const skeletonQuiz: QuizDraft = {
          id: quizId,
          title: baseQuiz.title || 'Sem título',
          description: baseQuiz.description || '',
          ownerId: userId,
          updatedAt: Date.now(),
          createdAt: baseQuiz.createdAt || Date.now(),
          isPublished: false,
          stats: { views: 0, starts: 0, completions: 0 },
          // Minimal visualBuilderData to satisfy schema
          visualBuilderData: {
            schemaVersion: 1,
            steps: [],
            outcomes: [],
          },
        }
        await QuizService.saveQuiz(skeletonQuiz, userId, { isNewQuiz: true })
        console.log('[VBAutoSave] Skeleton saved, now migrating images...')
      }

      // Migrate base64 images to Firebase Storage
      // This converts data URLs to storage URLs and avoids Firestore's 1MB limit
      console.log('[VBAutoSave] Migrating images to Storage...')
      const migratedSteps = await migrateStepImages(
        JSON.parse(JSON.stringify(steps)),
        quizId
      )
      const migratedOutcomes = await migrateOutcomeImages(
        JSON.parse(JSON.stringify(outcomes)),
        quizId
      )
      console.log('[VBAutoSave] Image migration complete')

      // Extract metadata from visual builder steps (no legacy conversion needed)
      const title = extractTitleFromSteps(migratedSteps)
      const description = extractDescriptionFromSteps(migratedSteps)
      const coverImageUrl = extractCoverImageFromSteps(migratedSteps)
      const leadGen = extractLeadGenConfig(migratedSteps)

      // Merge with existing quiz data to preserve metadata
      const baseQuiz = existingQuizRef.current || {}

      console.log('[VBAutoSave] Extracted metadata:', {
        title: title || baseQuiz.title,
        stepsCount: migratedSteps.length,
        outcomesCount: migratedOutcomes.length,
      })

      // Save only visualBuilderData as the single source of truth
      const quizToSave: QuizDraft = {
        ...baseQuiz,
        id: quizId,
        title: title || baseQuiz.title || 'Sem título',
        description: description || baseQuiz.description || '',
        coverImageUrl: coverImageUrl || baseQuiz.coverImageUrl,
        // No longer saving legacy questions/outcomes - visualBuilderData is the source of truth
        leadGen: leadGen,
        ownerId: userId,
        updatedAt: Date.now(),
        createdAt: baseQuiz.createdAt || Date.now(),
        isPublished: baseQuiz.isPublished || false,
        stats: baseQuiz.stats || { views: 0, starts: 0, completions: 0 },
        // Preserve live snapshot fields
        publishedVersion: baseQuiz.publishedVersion ?? null,
        publishedAt: baseQuiz.publishedAt ?? null,
        // Visual builder data is the single source of truth
        visualBuilderData: {
          schemaVersion: 1,
          steps: migratedSteps,
          outcomes: migratedOutcomes,
        },
      }

      // If we saved a skeleton earlier (for new quiz with images), this is no longer a new quiz
      const effectiveIsNewQuiz = isNewQuiz && !hasBase64Images
      await QuizService.saveQuiz(quizToSave, userId, { isNewQuiz: effectiveIsNewQuiz })

      // Invalidate the quizzes list (for dashboard)
      queryClient.invalidateQueries({ queryKey: ['quizzes', userId] })

      // Check if any images were migrated (compare URLs)
      const hadMigration = JSON.stringify(steps) !== JSON.stringify(migratedSteps) ||
        JSON.stringify(outcomes) !== JSON.stringify(migratedOutcomes)

      if (hadMigration) {
        console.log('[VBAutoSave] Images were migrated, updating store with Storage URLs')
        // Update the store with migrated data so base64 URLs are replaced with Storage URLs
        // This prevents re-uploading the same images on subsequent saves
        setSteps(migratedSteps)
        setOutcomes(migratedOutcomes)
      }

      // Update the last saved snapshot with MIGRATED data
      lastSavedRef.current = JSON.stringify({
        steps: migratedSteps,
        outcomes: migratedOutcomes,
      })

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
      setSavingState(false)
    }
  }, [steps, outcomes, quizId, userId, isNewQuiz, queryClient, setSteps, setOutcomes, onSaveComplete, onSaveError, onLimitError, setSavingState])

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
      isMountedRef.current = false
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
    isSaving,
  }
}
