'use client'

import { useVisualBuilderStore, createOutcome } from '@/store/visual-builder-store'
import { BuilderSidebar } from './builder-sidebar'

/**
 * ConnectedBuilderSidebar - A store-connected version of BuilderSidebar
 *
 * This component reads state from the Zustand store and dispatches actions
 * when the user interacts with steps and outcomes.
 */
export function ConnectedBuilderSidebar() {
  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)

  // Get actions from store
  const setActiveStepId = useVisualBuilderStore((state) => state.setActiveStepId)
  const setSelectedOutcomeId = useVisualBuilderStore((state) => state.setSelectedOutcomeId)
  const setAddStepSheetOpen = useVisualBuilderStore((state) => state.setAddStepSheetOpen)
  const deleteStep = useVisualBuilderStore((state) => state.deleteStep)
  const addOutcome = useVisualBuilderStore((state) => state.addOutcome)
  const deleteOutcome = useVisualBuilderStore((state) => state.deleteOutcome)

  // Handlers
  const handleStepSelect = (stepId: string) => {
    setActiveStepId(stepId)
  }

  const handleOutcomeSelect = (outcomeId: string) => {
    // When selecting an outcome, also select the result step
    const resultStep = steps.find(s => s.type === 'result')
    if (resultStep) {
      setActiveStepId(resultStep.id)
    }
    setSelectedOutcomeId(outcomeId)
  }

  const handleAddStep = () => {
    setAddStepSheetOpen(true)
  }

  const handleAddOutcome = () => {
    const newOutcome = createOutcome()
    addOutcome(newOutcome)
  }

  const handleDeleteStep = (stepId: string) => {
    deleteStep(stepId)
  }

  const handleDeleteOutcome = (outcomeId: string) => {
    deleteOutcome(outcomeId)
  }

  return (
    <BuilderSidebar
      steps={steps}
      outcomes={outcomes}
      activeStepId={activeStepId}
      selectedOutcomeId={selectedOutcomeId}
      onStepSelect={handleStepSelect}
      onOutcomeSelect={handleOutcomeSelect}
      onAddStep={handleAddStep}
      onAddOutcome={handleAddOutcome}
      onDeleteStep={handleDeleteStep}
      onDeleteOutcome={handleDeleteOutcome}
    />
  )
}
