'use client'

import { useMemo } from 'react'
import { useVisualBuilderStore, Step, StepType } from '@/store/visual-builder-store'
import { HeaderConfig } from '@/types/blocks'
import { Play, HelpCircle, Users, Gift } from 'lucide-react'
import { SortableSidebarList } from './sortable-sidebar-list'
import { SortableSidebarItem } from './sortable-sidebar-item'

// Step type icons
const stepTypeIcons: Record<StepType, React.ReactNode> = {
  intro: <Play className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  'lead-gen': <Users className="w-4 h-4" />,
  promo: <Gift className="w-4 h-4" />,
  result: null, // Result is not shown in this list
}

/**
 * Get the subtitle for a step (header title or step subtitle)
 */
function getStepSubtitle(step: Step): string | undefined {
  const headerBlock = step.blocks?.find(b => b.type === 'header')
  const headerTitle = headerBlock ? (headerBlock.config as HeaderConfig).title : undefined
  return headerTitle || step.subtitle
}

/**
 * SortableStepsList - A drag-and-drop enabled list of steps
 *
 * Uses reusable SortableSidebarList and SortableSidebarItem components.
 * Fixed steps (intro, result) are excluded from this list.
 */
export function SortableStepsList() {
  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)

  // Get actions from store
  const setActiveStepId = useVisualBuilderStore((state) => state.setActiveStepId)
  const reorderSteps = useVisualBuilderStore((state) => state.reorderSteps)
  const deleteStep = useVisualBuilderStore((state) => state.deleteStep)
  const duplicateStep = useVisualBuilderStore((state) => state.duplicateStep)

  // Filter out intro and result steps (they're shown separately in the sidebar)
  const regularSteps = useMemo(
    () => steps.filter(s => s.type !== 'result' && s.type !== 'intro'),
    [steps]
  )

  // Handle reorder - convert from filtered indices to full array indices
  const handleReorder = (fromIndex: number, toIndex: number) => {
    const fromStep = regularSteps[fromIndex]
    const toStep = regularSteps[toIndex]

    if (!fromStep || !toStep) return

    const fullFromIndex = steps.findIndex(s => s.id === fromStep.id)
    const fullToIndex = steps.findIndex(s => s.id === toStep.id)

    if (fullFromIndex !== -1 && fullToIndex !== -1) {
      reorderSteps(fullFromIndex, fullToIndex)
    }
  }

  return (
    <SortableSidebarList
      items={regularSteps}
      getItemId={(step) => step.id}
      onReorder={handleReorder}
      data-testid="steps-list"
    >
      {regularSteps.map((step, index) => (
        <SortableSidebarItem
          key={step.id}
          id={step.id}
          isActive={activeStepId === step.id}
          onSelect={() => setActiveStepId(step.id)}
          onDelete={() => deleteStep(step.id)}
          onDuplicate={() => duplicateStep(step.id)}
          disabled={step.isFixed}
          icon={stepTypeIcons[step.type]}
          title={`${index + 1}. ${step.label}`}
          subtitle={getStepSubtitle(step)}
          data-testid={`step-item-${step.id}`}
        />
      ))}
    </SortableSidebarList>
  )
}
