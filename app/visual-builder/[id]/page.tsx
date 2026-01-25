'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  useVisualBuilderStore,
  getDefaultBlocksForStepType,
  getDefaultOutcomeBlocks,
  Step,
  Outcome as VBOutcome,
} from '@/store/visual-builder-store'
import { useVisualBuilderAutoSave } from '@/lib/hooks/use-visual-builder-auto-save'
import { QuizService } from '@/lib/services/quiz-service'
import { getThemeSettings, resolveThemeColors, resolveThemeLogo } from '@/lib/services/brand-kit-service'
import { ProtectedRoute } from '@/components/protected-route'
import { ConnectedVisualBuilder } from '@/components/visual-builder'
import { MobileGate } from '@/components/visual-builder/mobile-gate'
import { PublishSuccessModal } from '@/components/builder/publish-success-modal'
import { PreviewOverlay } from '@/components/preview-overlay'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale, useMessages } from '@/lib/i18n/context'
import { localizePathname } from '@/lib/i18n/paths'
import type { BrandKitColors, Quiz, QuizDraft } from '@/types'

/**
 * Create default visual builder data for a new quiz
 */
function VisualBuilderEditor() {
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const locale = useLocale()
  const messages = useMessages()
  const copy = messages.visualBuilder

  // Visual builder store state and actions
  const initialize = useVisualBuilderStore((state) => state.initialize)
  const reset = useVisualBuilderStore((state) => state.reset)
  const storeSteps = useVisualBuilderStore((state) => state.steps)
  const storeOutcomes = useVisualBuilderStore((state) => state.outcomes)

  // Local state
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingForPreview, setIsSavingForPreview] = useState(false)
  const [isSavingForBack, setIsSavingForBack] = useState(false)
  const [isNewQuiz, setIsNewQuiz] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isCheckingQuiz, setIsCheckingQuiz] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishWasUpdate, setPublishWasUpdate] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null)
  const [brandKitColors, setBrandKitColors] = useState<BrandKitColors | null>(null)
  const [brandKitLogoUrl, setBrandKitLogoUrl] = useState<string | null>(null)
  const quizRef = useRef<QuizDraft | null>(null)
  const checkedRef = useRef(false)
  const justPublishedRef = useRef(false)
  const isPublishedRef = useRef(false)
  const needsRepublishRef = useRef(false) // True if published but missing publishedVersion data
  const publishedSnapshotRef = useRef<string | null>(null)
  const savingStartedAtRef = useRef<number | null>(null)
  const savingDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createDefaultVisualBuilderData = useCallback(() => {
    const initialSteps: Step[] = [
      {
        id: 'intro',
        type: 'intro',
        label: copy.stepLabels.intro,
        isFixed: true,
        blocks: getDefaultBlocksForStepType('intro', copy),
        settings: { showProgress: false, allowBack: false },
      },
      {
        id: `question-${Date.now()}`,
        type: 'question',
        label: `${copy.stepLabels.question} 1`,
        blocks: getDefaultBlocksForStepType('question', copy),
        settings: { showProgress: true, allowBack: true },
      },
      {
        id: 'result',
        type: 'result',
        label: copy.stepLabels.result,
        isFixed: true,
        blocks: [],
        settings: { showProgress: false, allowBack: false },
      },
    ]

    const initialOutcomes: VBOutcome[] = [
      {
        id: `outcome-${Date.now()}`,
        name: `${copy.sidebar.outcomeLabel} 1`,
        blocks: getDefaultOutcomeBlocks(copy),
      },
    ]

    return { steps: initialSteps, outcomes: initialOutcomes }
  }, [copy])

  // Check if quiz exists and load it, or create new
  useEffect(() => {
    if (!user || !id || checkedRef.current) return
    checkedRef.current = true

    const checkAndLoadQuiz = async () => {
      setIsCheckingQuiz(true)
      try {
        // Try to fetch the quiz
        const existingQuiz = await QuizService.getQuizById(id as string, user.uid)

        if (existingQuiz) {
          // Quiz exists - check ownership and load it
          if (existingQuiz.ownerId !== user.uid) {
            toast.error(copy.toast.permissionError)
            router.push(localizePathname('/dashboard', locale))
            return
          }

          console.log('[VisualBuilder] Loading existing quiz:', id)
          // visualBuilderData is now always present (quiz-service converts legacy quizzes)
          const vbData = existingQuiz.visualBuilderData
            ? { steps: existingQuiz.visualBuilderData.steps, outcomes: existingQuiz.visualBuilderData.outcomes }
            : { steps: [], outcomes: [] } // Fallback (should not happen after migration)
          console.log('[VisualBuilder] Using visualBuilderData with', vbData.steps.length, 'steps')
          initialize(vbData)
          quizRef.current = existingQuiz
          setIsNewQuiz(false)
          setIsPublished(existingQuiz.isPublished || false)
          isPublishedRef.current = existingQuiz.isPublished || false

          // Check if there are unpublished changes by comparing draft with published version
          if (existingQuiz.isPublished) {
            const currentSnapshot = JSON.stringify(vbData)

            if (existingQuiz.publishedVersion?.visualBuilderData) {
              try {
                const publishedVBData = typeof existingQuiz.publishedVersion.visualBuilderData === 'string'
                  ? JSON.parse(existingQuiz.publishedVersion.visualBuilderData)
                  : existingQuiz.publishedVersion.visualBuilderData
                const publishedSnapshot = JSON.stringify({
                  steps: publishedVBData.steps,
                  outcomes: publishedVBData.outcomes,
                })
                // Store the published snapshot for future comparisons
                publishedSnapshotRef.current = publishedSnapshot
                setHasUnpublishedChanges(currentSnapshot !== publishedSnapshot)
                console.log('[VisualBuilder] Has unpublished changes:', currentSnapshot !== publishedSnapshot)
              } catch {
                // If comparison fails, use current state as baseline
                publishedSnapshotRef.current = currentSnapshot
                setHasUnpublishedChanges(false)
                console.log('[VisualBuilder] Using current state as published baseline (parse error)')
              }
            } else {
              // Quiz is published but no publishedVersion data - this is a data inconsistency
              // Show the banner to encourage republishing, which will fix the data
              publishedSnapshotRef.current = currentSnapshot
              needsRepublishRef.current = true
              setHasUnpublishedChanges(true)
              console.log('[VisualBuilder] No publishedVersion data - showing banner to encourage republish')
            }
          }
        } else {
          // Quiz doesn't exist - create new
          console.log('[VisualBuilder] Creating new quiz with ID:', id)
          const defaultData = createDefaultVisualBuilderData()
          initialize(defaultData)

          const newQuizDraft: QuizDraft = {
            id: id as string,
            title: '',
            description: '',
            questions: [],
            outcomes: [],
            primaryColor: '#4F46E5',
            brandKitMode: 'default',
            isPublished: false,
            ownerId: user.uid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            stats: { views: 0, starts: 0, completions: 0 },
          }

          quizRef.current = newQuizDraft
          setIsNewQuiz(true)
        }

        setIsInitialized(true)
      } catch (err) {
        const errorMessage = (err as Error)?.message || ''

        // Permission error usually means quiz doesn't exist (Firestore rules)
        if (errorMessage.includes('permission') || errorMessage.includes('insufficient')) {
          console.log('[VisualBuilder] Quiz not found, creating new:', id)
          const defaultData = createDefaultVisualBuilderData()
          initialize(defaultData)

          const newQuizDraft: QuizDraft = {
            id: id as string,
            title: '',
            description: '',
            questions: [],
            outcomes: [],
            primaryColor: '#4F46E5',
            brandKitMode: 'default',
            isPublished: false,
            ownerId: user.uid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            stats: { views: 0, starts: 0, completions: 0 },
          }

          quizRef.current = newQuizDraft
          setIsNewQuiz(true)
          setIsInitialized(true)
          return
        }

        // Actual error
        console.error('[VisualBuilder] Error loading quiz:', err)
        toast.error(copy.toast.loadError)
        router.push(localizePathname('/dashboard', locale))
      } finally {
        setIsCheckingQuiz(false)
      }
    }

    checkAndLoadQuiz()
  }, [copy.toast.loadError, copy.toast.permissionError, createDefaultVisualBuilderData, id, initialize, locale, router, user])

  // Reset store on unmount
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  useEffect(() => {
    return () => {
      if (savingDelayTimeoutRef.current) {
        clearTimeout(savingDelayTimeoutRef.current)
      }
      if (savedResetTimeoutRef.current) {
        clearTimeout(savedResetTimeoutRef.current)
      }
    }
  }, [])

  const clearSaveStatusTimeouts = useCallback(() => {
    if (savingDelayTimeoutRef.current) {
      clearTimeout(savingDelayTimeoutRef.current)
      savingDelayTimeoutRef.current = null
    }
    if (savedResetTimeoutRef.current) {
      clearTimeout(savedResetTimeoutRef.current)
      savedResetTimeoutRef.current = null
    }
  }, [])

  const startSavingStatus = useCallback(() => {
    clearSaveStatusTimeouts()
    savingStartedAtRef.current = Date.now()
    setSaveStatus('saving')
  }, [clearSaveStatusTimeouts])

  const showSavedStatus = useCallback(() => {
    const minSavingDurationMs = 900
    const savedDurationMs = 2000
    const startedAt = savingStartedAtRef.current
    const elapsed = startedAt ? Date.now() - startedAt : minSavingDurationMs
    const delay = Math.max(minSavingDurationMs - elapsed, 0)

    clearSaveStatusTimeouts()

    const finalizeSavedState = () => {
      setSaveStatus('saved')
      savedResetTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, savedDurationMs)
    }

    if (delay > 0) {
      savingDelayTimeoutRef.current = setTimeout(finalizeSavedState, delay)
    } else {
      finalizeSavedState()
    }
  }, [clearSaveStatusTimeouts])

  // Set up auto-save
  const { forceSave, isSaving } = useVisualBuilderAutoSave({
    quizId: id as string,
    userId: user?.uid,
    enabled: isInitialized && !!user,
    isNewQuiz: isNewQuiz,
    existingQuiz: quizRef.current,
    onSaveComplete: () => {
      console.log('[VisualBuilder] Auto-save completed')
      showSavedStatus()
      // After first save of new quiz, it's no longer "new"
      if (isNewQuiz) {
        setIsNewQuiz(false)
        // Invalidate query so it fetches the saved quiz
        queryClient.invalidateQueries({ queryKey: ['quiz', id] })
      }
    },
    onSaveError: (err) => {
      console.error('[VisualBuilder] Auto-save error:', err)
      clearSaveStatusTimeouts()
      savingStartedAtRef.current = null
      setSaveStatus('idle')
      toast.error(copy.toast.saveError)
    },
    onLimitError: () => {
      toast.error(copy.toast.limitDraft)
      router.push(localizePathname('/dashboard', locale))
    },
  })

  useEffect(() => {
    if (isSaving) {
      startSavingStatus()
    }
  }, [isSaving, startSavingStatus])

  // Detect unpublished changes immediately when store state changes
  useEffect(() => {
    // Only check if quiz is published and initialized
    if (!isPublished || !publishedSnapshotRef.current || !isInitialized) {
      console.log('[VisualBuilder] Change detection skipped:', { isPublished, hasSnapshot: !!publishedSnapshotRef.current, isInitialized })
      return
    }

    // Skip right after publishing (snapshot is being updated)
    if (justPublishedRef.current) {
      console.log('[VisualBuilder] Change detection skipped: just published')
      justPublishedRef.current = false
      return
    }

    const currentSnapshot = JSON.stringify({
      steps: storeSteps,
      outcomes: storeOutcomes,
    })

    const hasChanges = currentSnapshot !== publishedSnapshotRef.current

    // For legacy quizzes without publishedVersion data, always show the banner
    // until the user republishes (which will fix the data)
    if (needsRepublishRef.current && !hasChanges) {
      console.log('[VisualBuilder] Change detection: keeping banner for legacy quiz')
      return
    }

    console.log('[VisualBuilder] Change detection:', {
      hasChanges,
      hasUnpublishedChanges,
      currentLength: currentSnapshot.length,
      publishedLength: publishedSnapshotRef.current.length
    })

    if (hasChanges !== hasUnpublishedChanges) {
      console.log('[VisualBuilder] Updating hasUnpublishedChanges to:', hasChanges)
      setHasUnpublishedChanges(hasChanges)
    }
  }, [storeSteps, storeOutcomes, isPublished, isInitialized, hasUnpublishedChanges])

  // Fetch user's theme settings for preview
  useEffect(() => {
    if (!user?.uid) {
      setBrandKitColors(null)
      setBrandKitLogoUrl(null)
      return
    }

    let isActive = true
    getThemeSettings(user.uid)
      .then((settings) => {
        if (!isActive) return
        // Always resolve colors (uses default preset if no settings)
        setBrandKitColors(resolveThemeColors(settings))
        setBrandKitLogoUrl(resolveThemeLogo(settings))
      })
      .catch((error) => {
        if (!isActive) return
        console.error('[VisualBuilder] Failed to load theme settings for preview', error)
        // On error, use default theme colors
        setBrandKitColors(resolveThemeColors(null))
        setBrandKitLogoUrl(null)
      })

    return () => {
      isActive = false
    }
  }, [user?.uid, isInitialized])

  // Handler: Back to dashboard
  const handleBack = useCallback(async () => {
    if (isSavingForBack) return
    console.log('[VisualBuilder] handleBack - forcing save before navigation')
    // Force save before navigating away
    setIsSavingForBack(true)
    startSavingStatus()
    try {
      await forceSave()
      showSavedStatus()
      console.log('[VisualBuilder] handleBack - save complete, navigating to dashboard')
      router.push(localizePathname('/dashboard', locale))
    } finally {
      setIsSavingForBack(false)
    }
  }, [forceSave, isSavingForBack, locale, router, showSavedStatus, startSavingStatus])

  // Handler: Preview quiz
  const handlePreview = useCallback(async () => {
    console.log('[VisualBuilder] handlePreview called', { id, isSavingForPreview })
    if (!id || !user?.uid || isSavingForPreview) return

    try {
      setIsSavingForPreview(true)
      startSavingStatus()
      console.log('[VisualBuilder] handlePreview - forcing save before preview')
      // Force save before preview to ensure latest changes are visible
      await forceSave()
      showSavedStatus()
      console.log('[VisualBuilder] handlePreview - save complete, loading quiz for preview')

      // Load the saved draft for preview
      const savedQuiz = await QuizService.getQuizById(id as string, user.uid, 'draft')
      if (savedQuiz) {
        setPreviewQuiz(savedQuiz)
        setIsPreviewOpen(true)
      }
    } catch (err) {
      console.error('[VisualBuilder] Error saving before preview:', err)
      clearSaveStatusTimeouts()
      savingStartedAtRef.current = null
      setSaveStatus('idle')
      toast.error(copy.toast.previewSaveError)
    } finally {
      setIsSavingForPreview(false)
    }
  }, [clearSaveStatusTimeouts, copy.toast.previewSaveError, forceSave, id, isSavingForPreview, showSavedStatus, startSavingStatus, user?.uid])

  // Handler: Publish quiz
  const handlePublish = useCallback(async () => {
    if (!id || !user?.uid || isPublishing) return

    // Capture if this is an update before state changes
    const wasUpdate = isPublishedRef.current

    try {
      setIsPublishing(true)

      // Force save before publishing to ensure latest changes are saved
      await forceSave()

      // Publish the quiz
      const result = await QuizService.publishQuiz(id as string, user.uid)

      if (result.status === 'limit-reached') {
        toast.error(copy.toast.limitPublish)
        return
      }

      // Update local state to reflect published state (triggers re-render)
      setIsPublished(true)
      isPublishedRef.current = true // Keep ref in sync for callbacks
      setHasUnpublishedChanges(false)
      justPublishedRef.current = true // Prevents the next auto-save from marking as changed
      needsRepublishRef.current = false // Clear the legacy quiz flag after republishing

      // Store current state as the new published snapshot for change detection
      const currentState = useVisualBuilderStore.getState()
      publishedSnapshotRef.current = JSON.stringify({
        steps: currentState.steps,
        outcomes: currentState.outcomes,
      })

      // Also update ref for consistency
      if (quizRef.current) {
        quizRef.current = {
          ...quizRef.current,
          isPublished: true,
          publishedAt: Date.now(),
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['quiz', id] })
      queryClient.invalidateQueries({ queryKey: ['quizzes', user.uid] })

      // Show success modal with quiz URL
      setPublishWasUpdate(wasUpdate)
      setShowPublishModal(true)
    } catch (err) {
      console.error('[VisualBuilder] Publish error:', err)
      toast.error(copy.toast.publishError)
    } finally {
      setIsPublishing(false)
    }
  }, [copy.toast.limitPublish, copy.toast.publishError, forceSave, id, isPublishing, queryClient, user?.uid])

  // Handler: Undo changes (restore to published state)
  const handleUndoChanges = useCallback(() => {
    if (!publishedSnapshotRef.current) return

    try {
      const publishedData = JSON.parse(publishedSnapshotRef.current)
      const { setSteps, setOutcomes } = useVisualBuilderStore.getState()

      // Restore the published state
      setSteps(publishedData.steps)
      setOutcomes(publishedData.outcomes)

      // Reset the unpublished changes flag
      setHasUnpublishedChanges(false)

      console.log('[VisualBuilder] Reverted to published state')
    } catch (err) {
      console.error('[VisualBuilder] Failed to undo changes:', err)
    }
  }, [])

  // Simple back handler for mobile gate (works even during loading)
  const handleMobileBack = useCallback(() => {
    router.push(localizePathname('/dashboard', locale))
  }, [locale, router])

  // Loading state - show while checking quiz OR before initialization
  if (isCheckingQuiz || !isInitialized) {
    return (
      <MobileGate onBack={handleMobileBack}>
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isNewQuiz ? copy.loading.creatingQuiz : copy.loading.loadingQuiz}
            </p>
          </div>
        </div>
      </MobileGate>
    )
  }

  // Get quiz name from ref (works for both new and existing quizzes)
  const quizTitle = quizRef.current?.title || copy.quiz.defaultTitle

  return (
    <MobileGate onBack={handleMobileBack}>
      <ConnectedVisualBuilder
        quizName={quizTitle}
        quizId={id as string}
        onBack={handleBack}
        onPreview={handlePreview}
        onPublish={handlePublish}
        onUndoChanges={handleUndoChanges}
        isPublishing={isPublishing}
        isPublished={isPublished}
        hasUnpublishedChanges={hasUnpublishedChanges}
        isPreviewing={isSavingForPreview}
        isBackSaving={isSavingForBack}
        themeColors={brandKitColors}
        onThemeChange={setBrandKitColors}
      />
      <PublishSuccessModal
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        quizId={id as string}
        isUpdate={publishWasUpdate}
      />
      <PreviewOverlay
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quiz={previewQuiz}
        brandKitColors={brandKitColors}
        brandKitLogoUrl={brandKitLogoUrl}
        warningText={copy.preview.warning}
      />
    </MobileGate>
  )
}

export default function VisualBuilderEditorPage() {
  return (
    <ProtectedRoute>
      <VisualBuilderEditor />
    </ProtectedRoute>
  )
}
