'use client'

import { useState } from 'react'
import { VisualBuilder, Step, Outcome } from '@/components/visual-builder'

// Sample data for testing the visual builder shell
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
  const [steps] = useState<Step[]>(initialSteps)
  const [outcomes] = useState<Outcome[]>(initialOutcomes)
  const [activeStepId, setActiveStepId] = useState('intro')
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | undefined>(undefined)

  return (
    <VisualBuilder
      quizName="Quiz Skincare - Demo"
      steps={steps}
      outcomes={outcomes}
      activeStepId={activeStepId}
      selectedOutcomeId={selectedOutcomeId}
      onStepSelect={(stepId) => {
        setActiveStepId(stepId)
        // Clear outcome selection when selecting a non-result step
        const step = steps.find(s => s.id === stepId)
        if (step?.type !== 'result') {
          setSelectedOutcomeId(undefined)
        } else if (!selectedOutcomeId && outcomes.length > 0) {
          setSelectedOutcomeId(outcomes[0].id)
        }
      }}
      onOutcomeSelect={setSelectedOutcomeId}
      onBack={() => window.history.back()}
      onPreview={() => console.log('Preview clicked')}
      onPublish={() => console.log('Publish clicked')}
      onAddStep={() => console.log('Add step clicked')}
      onAddOutcome={() => console.log('Add outcome clicked')}
    />
  )
}
