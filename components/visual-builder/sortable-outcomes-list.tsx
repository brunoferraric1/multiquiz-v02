'use client'

import { useVisualBuilderStore } from '@/store/visual-builder-store'
import { SortableSidebarList } from './sortable-sidebar-list'
import { SortableSidebarItem } from './sortable-sidebar-item'
import { useMessages } from '@/lib/i18n/context'

/**
 * SortableOutcomesList - A drag-and-drop enabled list of outcomes
 *
 * Uses reusable SortableSidebarList and SortableSidebarItem components.
 * Each outcome has drag handle, and actions menu (duplicate, delete).
 */
export function SortableOutcomesList() {
  const messages = useMessages()
  const copy = messages.visualBuilder
  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)

  // Get actions from store
  const setActiveStepId = useVisualBuilderStore((state) => state.setActiveStepId)
  const setSelectedOutcomeId = useVisualBuilderStore((state) => state.setSelectedOutcomeId)
  const deleteOutcome = useVisualBuilderStore((state) => state.deleteOutcome)
  const duplicateOutcome = useVisualBuilderStore((state) => state.duplicateOutcome)
  const reorderOutcomes = useVisualBuilderStore((state) => state.reorderOutcomes)

  // Find result step
  const resultStep = steps.find((s) => s.type === 'result')
  const isResultActive = activeStepId === resultStep?.id

  // Handle outcome selection
  const handleOutcomeSelect = (outcomeId: string) => {
    if (resultStep) {
      setActiveStepId(resultStep.id)
    }
    setSelectedOutcomeId(outcomeId)
  }

  if (outcomes.length === 0) {
    return null
  }

  return (
    <SortableSidebarList
      items={outcomes}
      getItemId={(outcome) => outcome.id}
      onReorder={reorderOutcomes}
      data-testid="outcomes-list"
    >
      {outcomes.map((outcome, index) => {
        const letter = String.fromCharCode(65 + index)
        const isOutcomeActive = isResultActive && selectedOutcomeId === outcome.id

        return (
          <SortableSidebarItem
            key={outcome.id}
            id={outcome.id}
            isActive={isOutcomeActive}
            onSelect={() => handleOutcomeSelect(outcome.id)}
            onDelete={() => deleteOutcome(outcome.id)}
            onDuplicate={() => duplicateOutcome(outcome.id, copy.duplicateSuffix)}
            canDelete={outcomes.length > 1}
            icon={letter}
            title={outcome.name || `${copy.sidebar.outcomeLabel} ${index + 1}`}
            data-testid={`outcome-item-${outcome.id}`}
          />
        )
      })}
    </SortableSidebarList>
  )
}
