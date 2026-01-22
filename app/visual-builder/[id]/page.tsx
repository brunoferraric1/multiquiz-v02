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
import { ProtectedRoute } from '@/components/protected-route'
import { ConnectedVisualBuilder } from '@/components/visual-builder'
import { PublishSuccessModal } from '@/components/builder/publish-success-modal'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Quiz, QuizDraft } from '@/types'

/**
 * Create default visual builder data for a new quiz
 */
function createDefaultVisualBuilderData() {
  const initialSteps: Step[] = [
    {
      id: 'intro',
      type: 'intro',
      label: 'Intro',
      isFixed: true,
      blocks: getDefaultBlocksForStepType('intro'),
      settings: { showProgress: false, allowBack: false },
    },
    {
      id: `question-${Date.now()}`,
      type: 'question',
      label: 'P1',
      blocks: getDefaultBlocksForStepType('question'),
      settings: { showProgress: true, allowBack: true },
    },
    {
      id: 'result',
      type: 'result',
      label: 'Resultado',
      isFixed: true,
      blocks: [],
      settings: { showProgress: false, allowBack: false },
    },
  ]

  const initialOutcomes: VBOutcome[] = [
    { id: `outcome-${Date.now()}`, name: 'Resultado 1', blocks: getDefaultOutcomeBlocks() },
  ]

  return { steps: initialSteps, outcomes: initialOutcomes }
}

function VisualBuilderEditor() {
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Visual builder store actions
  const initialize = useVisualBuilderStore((state) => state.initialize)
  const reset = useVisualBuilderStore((state) => state.reset)

  // Local state
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingForPreview, setIsSavingForPreview] = useState(false)
  const [isSavingForBack, setIsSavingForBack] = useState(false)
  const [isNewQuiz, setIsNewQuiz] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isCheckingQuiz, setIsCheckingQuiz] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const quizRef = useRef<QuizDraft | null>(null)
  const checkedRef = useRef(false)
  const savingStartedAtRef = useRef<number | null>(null)
  const savingDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
            toast.error('Você não tem permissão para editar este quiz.')
            router.push('/dashboard')
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
        toast.error('Erro ao carregar o quiz.')
        router.push('/dashboard')
      } finally {
        setIsCheckingQuiz(false)
      }
    }

    checkAndLoadQuiz()
  }, [user, id, initialize, router])

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
      toast.error('Erro ao salvar alterações.')
    },
    onLimitError: () => {
      toast.error('Limite de rascunhos atingido. Exclua um rascunho ou faça upgrade.')
      router.push('/dashboard')
    },
  })

  useEffect(() => {
    if (isSaving) {
      startSavingStatus()
    }
  }, [isSaving, startSavingStatus])

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
      router.push('/dashboard')
    } finally {
      setIsSavingForBack(false)
    }
  }, [forceSave, router, isSavingForBack, startSavingStatus, showSavedStatus])

  // Handler: Preview quiz
  const handlePreview = useCallback(async () => {
    console.log('[VisualBuilder] handlePreview called', { id, isSavingForPreview })
    if (!id || isSavingForPreview) return

    try {
      setIsSavingForPreview(true)
      startSavingStatus()
      console.log('[VisualBuilder] handlePreview - forcing save before preview')
      // Force save before preview to ensure latest changes are visible
      await forceSave()
      showSavedStatus()
      console.log('[VisualBuilder] handlePreview - save complete, opening preview')
      // Open quiz preview in new tab
      window.open(`/quiz/${id}?preview=true`, '_blank')
    } catch (err) {
      console.error('[VisualBuilder] Error saving before preview:', err)
      clearSaveStatusTimeouts()
      savingStartedAtRef.current = null
      setSaveStatus('idle')
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSavingForPreview(false)
    }
  }, [id, forceSave, isSavingForPreview, startSavingStatus, showSavedStatus, clearSaveStatusTimeouts])

  // Handler: Publish quiz
  const handlePublish = useCallback(async () => {
    if (!id || !user?.uid || isPublishing) return

    try {
      setIsPublishing(true)

      // Force save before publishing to ensure latest changes are saved
      await forceSave()

      // Publish the quiz
      const result = await QuizService.publishQuiz(id as string, user.uid)

      if (result.status === 'limit-reached') {
        toast.error('Limite de quizzes publicados atingido. Faça upgrade para publicar mais.')
        return
      }

      // Update local state to reflect published state (triggers re-render)
      setIsPublished(true)

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
      setShowPublishModal(true)
    } catch (err) {
      console.error('[VisualBuilder] Publish error:', err)
      toast.error('Erro ao publicar o quiz. Tente novamente.')
    } finally {
      setIsPublishing(false)
    }
  }, [id, user?.uid, isPublishing, forceSave, queryClient])

  // Loading state - show while checking quiz OR before initialization
  if (isCheckingQuiz || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isNewQuiz ? 'Criando novo quiz...' : 'Carregando quiz...'}
          </p>
        </div>
      </div>
    )
  }

  // Get quiz name from ref (works for both new and existing quizzes)
  const quizTitle = quizRef.current?.title || 'Novo Quiz'

  return (
    <>
      <ConnectedVisualBuilder
        quizName={quizTitle}
        onBack={handleBack}
        onPreview={handlePreview}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        isPublished={isPublished}
        isPreviewing={isSavingForPreview}
        isBackSaving={isSavingForBack}
        saveStatus={saveStatus}
      />
      <PublishSuccessModal
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        quizId={id as string}
      />
    </>
  )
}

export default function VisualBuilderEditorPage() {
  return (
    <ProtectedRoute>
      <VisualBuilderEditor />
    </ProtectedRoute>
  )
}
