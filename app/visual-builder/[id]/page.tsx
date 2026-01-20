'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/use-auth'
import { useQuizQuery } from '@/lib/hooks/use-quiz-queries'
import {
  useVisualBuilderStore,
  getDefaultBlocksForStepType,
  getDefaultOutcomeBlocks,
  Step,
  Outcome as VBOutcome,
} from '@/store/visual-builder-store'
import { useVisualBuilderAutoSave } from '@/lib/hooks/use-visual-builder-auto-save'
import { quizToVisualBuilder } from '@/lib/utils/visual-builder-converters'
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

  // Query quiz data
  const { data: quiz, isLoading, error, dataUpdatedAt } = useQuizQuery(id as string, user?.uid)

  // Visual builder store actions
  const initialize = useVisualBuilderStore((state) => state.initialize)
  const reset = useVisualBuilderStore((state) => state.reset)

  // Local state
  const [isPublishing, setIsPublishing] = useState(false)
  const [isNewQuiz, setIsNewQuiz] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const loadedTimestampRef = useRef<number>(0)
  const quizRef = useRef<QuizDraft | null>(null)
  const initializingNewQuizRef = useRef(false)

  // On mount: invalidate cache to get fresh data
  useEffect(() => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['quiz', id] })
      loadedTimestampRef.current = 0
    }
  }, [id, queryClient])

  // Handle new quiz creation when quiz doesn't exist
  useEffect(() => {
    // Only run once, when loading is done and no quiz found
    if (isLoading || isInitialized || initializingNewQuizRef.current) return
    if (quiz) return // Quiz exists, don't create new

    // Quiz not found or permission error (Firestore returns permission error for non-existent docs)
    // This happens when:
    // 1. Quiz truly doesn't exist (!quiz && no error)
    // 2. Quiz doesn't exist and Firestore returns permission error
    const isPermissionError = error && (
      (error as Error)?.message?.includes('permission') ||
      (error as Error)?.message?.includes('insufficient')
    )

    if (!quiz && user && (!error || isPermissionError)) {
      initializingNewQuizRef.current = true
      console.log('[VisualBuilder] Creating new quiz with ID:', id)

      // Initialize visual builder with default data
      const defaultData = createDefaultVisualBuilderData()
      initialize(defaultData)

      // Create a minimal quiz draft for the ref
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
    }
  }, [isLoading, quiz, error, user, id, initialize, isInitialized])

  // Load existing quiz into visual builder store when data arrives
  useEffect(() => {
    if (quiz && user && dataUpdatedAt > loadedTimestampRef.current) {
      // Check ownership
      if (quiz.ownerId !== user.uid) {
        toast.error('Você não tem permissão para editar este quiz.')
        router.push('/dashboard')
        return
      }

      // Convert quiz to visual builder format
      console.log('[VisualBuilder] Loading existing quiz into store. Timestamp:', dataUpdatedAt)
      const vbData = quizToVisualBuilder(quiz)
      initialize(vbData)
      quizRef.current = quiz
      loadedTimestampRef.current = dataUpdatedAt
      setIsNewQuiz(false)
      setIsInitialized(true)
    }
  }, [quiz, user, router, initialize, dataUpdatedAt])

  // Handle actual errors (not just "quiz not found" or permission errors for non-existent docs)
  useEffect(() => {
    if (error && !isLoading && !isInitialized) {
      const errorMessage = (error as Error)?.message || ''

      // Permission errors for non-existent docs are handled by creating a new quiz
      const isPermissionError = errorMessage.includes('permission') || errorMessage.includes('insufficient')
      if (isPermissionError) {
        // This is expected for new quizzes - handled in the "new quiz creation" effect
        console.log('[VisualBuilder] Permission error (expected for new quiz):', errorMessage)
        return
      }

      // Check if it's an explicit authorization error (trying to access someone else's quiz)
      if (errorMessage.includes('Unauthorized')) {
        console.error('Unauthorized access:', error)
        toast.error('Você não tem permissão para acessar este quiz.')
        router.push('/dashboard')
        return
      }

      // Other unexpected errors
      console.error('[VisualBuilder] Unexpected error:', error)
      toast.error('Erro ao carregar o quiz.')
      router.push('/dashboard')
    }
  }, [error, isLoading, isInitialized, router])

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
    // Force save before navigating away
    await forceSave()
    router.push('/dashboard')
  }, [forceSave, router])

  // Handler: Preview quiz
  const handlePreview = useCallback(() => {
    if (!id) return
    // Open quiz preview in new tab
    window.open(`/quiz/${id}?preview=true`, '_blank')
  }, [id])

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

  // Loading state - show while fetching OR before initialization
  if (isLoading || !isInitialized) {
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
