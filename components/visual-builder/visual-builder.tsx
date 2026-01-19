'use client'

import { useState } from 'react'
import { BuilderHeaderNav, HeaderTab } from './builder-header-nav'
import { BuilderSidebar, Step, Outcome } from './builder-sidebar'
import { BuilderPreview } from './builder-preview'
import { BuilderProperties } from './builder-properties'

export type { HeaderTab } from './builder-header-nav'
export type { Step, Outcome, StepType } from './builder-sidebar'

interface VisualBuilderProps {
  quizName?: string
  steps?: Step[]
  outcomes?: Outcome[]
  activeStepId?: string
  selectedOutcomeId?: string
  onTabChange?: (tab: HeaderTab) => void
  onBack?: () => void
  onPreview?: () => void
  onPublish?: () => void
  onStepSelect?: (stepId: string) => void
  onOutcomeSelect?: (outcomeId: string) => void
  onAddStep?: () => void
  onAddOutcome?: () => void
}

export function VisualBuilder({
  quizName = 'Meu Quiz',
  steps = [],
  outcomes = [],
  activeStepId,
  selectedOutcomeId,
  onTabChange,
  onBack,
  onPreview,
  onPublish,
  onStepSelect,
  onOutcomeSelect,
  onAddStep,
  onAddOutcome,
}: VisualBuilderProps) {
  const [activeTab, setActiveTab] = useState<HeaderTab>('editar')
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')

  const handleTabChange = (tab: HeaderTab) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  // Get the active step title for properties panel
  const activeStep = steps.find(s => s.id === activeStepId)
  const propertiesTitle = activeStep?.label || 'Propriedades'

  return (
    <div data-testid="visual-builder" className="h-screen flex flex-col bg-muted overflow-hidden">
      {/* HEADER */}
      <BuilderHeaderNav
        quizName={quizName}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={onBack}
        onPreview={onPreview}
        onPublish={onPublish}
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
