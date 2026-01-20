'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/use-auth'
import { useQuizQuery } from '@/lib/hooks/use-quiz-queries'
import { useVisualBuilderStore } from '@/store/visual-builder-store'
import { useVisualBuilderAutoSave } from '@/lib/hooks/use-visual-builder-auto-save'
import { quizToVisualBuilder } from '@/lib/utils/visual-builder-converters'
import { QuizService } from '@/lib/services/quiz-service'
import { ProtectedRoute } from '@/components/protected-route'
import { ConnectedVisualBuilder } from '@/components/visual-builder'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Quiz, QuizDraft } from '@/types'

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
  const loadedTimestampRef = useRef<number>(0)
  const quizRef = useRef<QuizDraft | null>(null)

  // On mount: invalidate cache to get fresh data
  useEffect(() => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['quiz', id] })
      loadedTimestampRef.current = 0
    }
  }, [id, queryClient])

  // Load quiz into visual builder store when data arrives
  useEffect(() => {
    if (quiz && user && dataUpdatedAt > loadedTimestampRef.current) {
      // Check ownership
      if (quiz.ownerId !== user.uid) {
        toast.error('Você não tem permissão para editar este quiz.')
        router.push('/dashboard')
        return
      }

      // Convert quiz to visual builder format
      console.log('[VisualBuilder] Loading quiz into store. Timestamp:', dataUpdatedAt)
      const vbData = quizToVisualBuilder(quiz)
      initialize(vbData)
      quizRef.current = quiz
      loadedTimestampRef.current = dataUpdatedAt
    }
  }, [quiz, user, router, initialize, dataUpdatedAt])

  // Handle errors
  useEffect(() => {
    if (error && !isLoading) {
      console.error('Error loading quiz:', error)
      toast.error('Erro ao carregar o quiz. Verifique se ele existe.')
      router.push('/dashboard')
    }
  }, [error, isLoading, router])

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
    enabled: !!quiz && !!user,
    existingQuiz: quiz,
    onSaveComplete: () => {
      console.log('[VisualBuilder] Auto-save completed')
    },
    onSaveError: (err) => {
      console.error('[VisualBuilder] Auto-save error:', err)
      toast.error('Erro ao salvar alterações. Suas mudanças estão salvas localmente.')
    },
    onLimitError: () => {
      toast.error('Limite de rascunhos atingido. Exclua um rascunho ou faça upgrade.')
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    )
  }

  // Error state (will redirect via useEffect)
  if (error || !quiz) {
    return null
  }

  return (
    <ConnectedVisualBuilder
      quizName={quiz.title || 'Meu Quiz'}
      onBack={handleBack}
      onPreview={handlePreview}
      onPublish={handlePublish}
      isPublishing={isPublishing}
      isPublished={quiz.isPublished}
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
