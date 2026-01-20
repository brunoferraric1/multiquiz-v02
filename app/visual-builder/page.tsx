'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectedVisualBuilder } from '@/components/visual-builder'
import {
  useVisualBuilderStore,
  Step,
  Outcome,
  getDefaultBlocksForStepType,
  getDefaultOutcomeBlocks,
} from '@/store/visual-builder-store'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function VisualBuilderPage() {
  const router = useRouter()
  const initialize = useVisualBuilderStore((state) => state.initialize)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize store with demo data on mount (client-side only)
  useEffect(() => {
    // Create sample data for testing the visual builder
    // This runs only on the client to avoid hydration mismatches
    const initialSteps: Step[] = [
      {
        id: 'intro',
        type: 'intro',
        label: 'Intro',
        isFixed: true,
        subtitle: 'Bem-vindo ao Quiz!',
        blocks: getDefaultBlocksForStepType('intro'),
        settings: { showProgress: false, allowBack: false },
      },
      {
        id: 'q1',
        type: 'question',
        label: 'P1',
        subtitle: 'Qual seu tipo de pele?',
        blocks: getDefaultBlocksForStepType('question'),
        settings: { showProgress: true, allowBack: true },
      },
      {
        id: 'q2',
        type: 'question',
        label: 'P2',
        subtitle: 'Com que frequência você hidrata?',
        blocks: getDefaultBlocksForStepType('question'),
        settings: { showProgress: true, allowBack: true },
      },
      {
        id: 'lead',
        type: 'lead-gen',
        label: 'Captura',
        subtitle: 'Deixe seus dados',
        blocks: getDefaultBlocksForStepType('lead-gen'),
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

    const initialOutcomes: Outcome[] = [
      { id: 'outcome-1', name: 'Pele Seca', blocks: getDefaultOutcomeBlocks() },
      { id: 'outcome-2', name: 'Pele Oleosa', blocks: getDefaultOutcomeBlocks() },
    ]

    initialize({ steps: initialSteps, outcomes: initialOutcomes })
    setIsInitialized(true)
  }, [initialize])

  // Show loading state until store is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const handlePreview = () => {
    toast.info('Esta é uma página de demonstração. Crie um quiz para usar o Preview.', {
      action: {
        label: 'Criar Quiz',
        onClick: () => router.push('/builder'),
      },
    })
  }

  const handlePublish = () => {
    toast.info('Esta é uma página de demonstração. Crie um quiz para publicar.', {
      action: {
        label: 'Criar Quiz',
        onClick: () => router.push('/builder'),
      },
    })
  }

  return (
    <ConnectedVisualBuilder
      quizName="Quiz Skincare - Demo"
      onBack={() => router.push('/dashboard')}
      onPreview={handlePreview}
      onPublish={handlePublish}
    />
  )
}
