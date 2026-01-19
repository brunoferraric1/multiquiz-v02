'use client'

import { useEffect } from 'react'
import { ConnectedVisualBuilder } from '@/components/visual-builder'
import { useVisualBuilderStore, Step, Outcome } from '@/store/visual-builder-store'

// Sample data for testing the visual builder
const initialSteps: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', isFixed: true, subtitle: 'Bem-vindo ao Quiz!' },
  { id: 'q1', type: 'question', label: 'P1', subtitle: 'Qual seu tipo de pele?' },
  { id: 'q2', type: 'question', label: 'P2', subtitle: 'Com que frequência você hidrata?' },
  { id: 'lead', type: 'lead-gen', label: 'Captura', subtitle: 'Deixe seus dados' },
  { id: 'result', type: 'result', label: 'Resultado', isFixed: true },
]

const initialOutcomes: Outcome[] = [
  { id: 'outcome-1', name: 'Pele Seca' },
  { id: 'outcome-2', name: 'Pele Oleosa' },
]

export default function VisualBuilderPage() {
  const initialize = useVisualBuilderStore((state) => state.initialize)

  // Initialize store with demo data on mount
  useEffect(() => {
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
