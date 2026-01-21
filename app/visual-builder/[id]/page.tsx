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
  const [isNewQuiz, setIsNewQuiz] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isCheckingQuiz, setIsCheckingQuiz] = useState(true)
  const quizRef = useRef<QuizDraft | null>(null)
  const checkedRef = useRef(false)

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

  // Set up auto-save
  const { forceSave } = useVisualBuilderAutoSave({
    quizId: id as string,
    userId: user?.uid,
    enabled: isInitialized && !!user,
    isNewQuiz: isNewQuiz,
    existingQuiz: quizRef.current,
    onSaveComplete: () => {
      console.log('[VisualBuilder] Auto-save completed')
      // After first save of new quiz, it's no longer "new"
      if (isNewQuiz) {
        setIsNewQuiz(false)
        // Invalidate query so it fetches the saved quiz
        queryClient.invalidateQueries({ queryKey: ['quiz', id] })
      }
    },
    onSaveError: (err) => {
      console.error('[VisualBuilder] Auto-save error:', err)
      toast.error('Erro ao salvar alterações.')
    },
    onLimitError: () => {
      toast.error('Limite de rascunhos atingido. Exclua um rascunho ou faça upgrade.')
      router.push('/dashboard')
    },
  })

  // Handler: Back to dashboard
  const handleBack = useCallback(async () => {
    console.log('[VisualBuilder] handleBack - forcing save before navigation')
    // Force save before navigating away
    await forceSave()
    console.log('[VisualBuilder] handleBack - save complete, navigating to dashboard')
    router.push('/dashboard')
  }, [forceSave, router])

  // Handler: Preview quiz
  const handlePreview = useCallback(async () => {
    console.log('[VisualBuilder] handlePreview called', { id, isSavingForPreview })
    if (!id || isSavingForPreview) return

    try {
      setIsSavingForPreview(true)
      console.log('[VisualBuilder] handlePreview - forcing save before preview')
      // Force save before preview to ensure latest changes are visible
      await forceSave()
      console.log('[VisualBuilder] handlePreview - save complete, opening preview')
      // Open quiz preview in new tab
      window.open(`/quiz/${id}?preview=true`, '_blank')
    } catch (err) {
      console.error('[VisualBuilder] Error saving before preview:', err)
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSavingForPreview(false)
    }
  }, [id, forceSave, isSavingForPreview])

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

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['quiz', id] })
      queryClient.invalidateQueries({ queryKey: ['quizzes', user.uid] })

      toast.success('Quiz publicado com sucesso!')
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
  const quizIsPublished = quizRef.current?.isPublished || false

  return (
    <ConnectedVisualBuilder
      quizName={quizTitle}
      onBack={handleBack}
      onPreview={handlePreview}
      onPublish={handlePublish}
      isPublishing={isPublishing}
      isPublished={quizIsPublished}
    />
  )
}

export default function VisualBuilderEditorPage() {
  return (
    <ProtectedRoute>
      <VisualBuilderEditor />
    </ProtectedRoute>
  )
}
