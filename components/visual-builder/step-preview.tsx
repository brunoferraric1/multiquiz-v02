'use client'

import { useVisualBuilderStore, createBlock } from '@/store/visual-builder-store'
import { BlockList } from './blocks'
import { useMemo } from 'react'

/**
 * StepPreview - Renders the blocks for the currently active step
 *
 * This component is connected to the store and renders:
 * - Blocks from the active step (for non-result steps)
 * - Blocks from the selected outcome (for result step)
 * - Insertion points between blocks
 * - Selection highlighting
 */
export function StepPreview() {
  // Get state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)
  const selectedBlockId = useVisualBuilderStore((state) => state.selectedBlockId)

  // Get actions from store
  const setSelectedBlockId = useVisualBuilderStore((state) => state.setSelectedBlockId)
  const addBlock = useVisualBuilderStore((state) => state.addBlock)
  const addOutcomeBlock = useVisualBuilderStore((state) => state.addOutcomeBlock)
  const setAddBlockSheetOpen = useVisualBuilderStore((state) => state.setAddBlockSheetOpen)

  // Get the active step
  const activeStep = useMemo(
    () => steps.find((s) => s.id === activeStepId),
    [steps, activeStepId]
  )

  // Get the selected outcome (for result step)
  const selectedOutcome = useMemo(
    () => outcomes.find((o) => o.id === selectedOutcomeId),
    [outcomes, selectedOutcomeId]
  )

  // Determine which blocks to show
  const blocks = useMemo(() => {
    if (!activeStep) return []

    // For result steps, show outcome blocks
    if (activeStep.type === 'result') {
      return selectedOutcome?.blocks || []
    }

    // For other steps, show step blocks
    return activeStep.blocks || []
  }, [activeStep, selectedOutcome])

  // Handle block selection
  const handleBlockSelect = (blockId: string) => {
    setSelectedBlockId(blockId)
  }

  // Handle block insertion
  const handleInsertBlock = (index: number) => {
    // Open the add block sheet - the sheet will handle the actual insertion
    // We store the index in a way the sheet can access it
    // For now, we just open the sheet
    setAddBlockSheetOpen(true)
  }

  // Show empty state if no step is selected
  if (!activeStep) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Selecione uma etapa para ver o preview
      </div>
    )
  }

  // Show empty state for result step without outcome selected
  if (activeStep.type === 'result' && !selectedOutcome) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {outcomes.length === 0
          ? 'Adicione um resultado para começar'
          : 'Selecione um resultado para ver o preview'}
      </div>
    )
  }

  return (
    <div data-testid="step-preview" className="p-4">
      <BlockList
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        onBlockSelect={handleBlockSelect}
        onInsertBlock={handleInsertBlock}
      />
    </div>
  )
}
