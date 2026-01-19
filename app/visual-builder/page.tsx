'use client'

import { useEffect } from 'react'
import { ConnectedVisualBuilder } from '@/components/visual-builder'
import {
  useVisualBuilderStore,
  Step,
  Outcome,
  getDefaultBlocksForStepType,
  getDefaultOutcomeBlocks,
} from '@/store/visual-builder-store'

export default function VisualBuilderPage() {
  const initialize = useVisualBuilderStore((state) => state.initialize)

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
  }, [initialize])

  return (
    <ConnectedVisualBuilder
      quizName="Quiz Skincare - Demo"
      onBack={() => window.history.back()}
      onPreview={() => console.log('Preview clicked')}
      onPublish={() => console.log('Publish clicked')}
    />
  )
}
