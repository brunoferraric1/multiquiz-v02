'use client'

import { useState } from 'react'
import { BuilderHeaderNav } from './builder-header-nav'
import { BuilderSidebar, Step, Outcome } from './builder-sidebar'
import { BuilderPreview } from './builder-preview'
import { BuilderProperties } from './builder-properties'
import { useMessages } from '@/lib/i18n/context'

export type { Step, Outcome, StepType } from './builder-sidebar'

interface VisualBuilderProps {
  quizName?: string
  steps?: Step[]
  outcomes?: Outcome[]
  activeStepId?: string
  selectedOutcomeId?: string
  onBack?: () => void
  onPreview?: () => void
  onPublish?: () => void
  onStepSelect?: (stepId: string) => void
  onOutcomeSelect?: (outcomeId: string) => void
  onAddStep?: () => void
  onAddOutcome?: () => void
  isPublished?: boolean
}

export function VisualBuilder({
  quizName,
  steps = [],
  outcomes = [],
  activeStepId,
  selectedOutcomeId,
  onBack,
  onPreview,
  onPublish,
  onStepSelect,
  onOutcomeSelect,
  onAddStep,
  onAddOutcome,
  isPublished = false,
}: VisualBuilderProps) {
  const messages = useMessages()
  const copy = messages.visualBuilder
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')

  // Get the active step title for properties panel
  const activeStep = steps.find(s => s.id === activeStepId)
  const propertiesTitle = activeStep?.label || copy.properties.title
  const resolvedQuizName = quizName ?? copy.quiz.defaultName

  return (
    <div data-testid="visual-builder" className="h-screen flex flex-col bg-muted overflow-hidden">
      {/* HEADER */}
      <BuilderHeaderNav
        quizName={resolvedQuizName}
        onBack={onBack}
        onPublish={onPublish}
        isPublished={isPublished}
      />

      {/* MAIN CONTENT - Three column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Steps list */}
        <BuilderSidebar
          steps={steps}
          outcomes={outcomes}
          activeStepId={activeStepId}
          selectedOutcomeId={selectedOutcomeId}
          onStepSelect={onStepSelect}
          onOutcomeSelect={onOutcomeSelect}
          onAddStep={onAddStep}
          onAddOutcome={onAddOutcome}
        />

        {/* CENTER - Preview area */}
        <BuilderPreview
          device={device}
          onDeviceChange={setDevice}
          onPreview={onPreview}
        >
          {/* Preview content will be added in next milestone */}
        </BuilderPreview>

        {/* RIGHT PANEL - Properties */}
        <BuilderProperties
          title={propertiesTitle}
          className="hidden md:flex"
        >
          {/* Properties content will be added in next milestone */}
        </BuilderProperties>
      </div>
    </div>
  )
}
