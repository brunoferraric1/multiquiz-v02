'use client'

import { useVisualBuilderStore } from '@/store/visual-builder-store'
import { BlockList } from './blocks'
import { Block } from '@/types/blocks'
import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

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
  const messages = useMessages()
  const previewCopy = messages.visualBuilder.preview
  // Get state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)
  const selectedBlockId = useVisualBuilderStore((state) => state.selectedBlockId)
  const editingBlockId = useVisualBuilderStore((state) => state.editingBlockId)

  // Get actions from store
  const setSelectedBlockId = useVisualBuilderStore((state) => state.setSelectedBlockId)
  const setEditingBlockId = useVisualBuilderStore((state) => state.setEditingBlockId)
  const addBlock = useVisualBuilderStore((state) => state.addBlock)
  const addOutcomeBlock = useVisualBuilderStore((state) => state.addOutcomeBlock)
  const updateBlock = useVisualBuilderStore((state) => state.updateBlock)
  const updateOutcomeBlock = useVisualBuilderStore((state) => state.updateOutcomeBlock)
  const deleteBlock = useVisualBuilderStore((state) => state.deleteBlock)
  const deleteOutcomeBlock = useVisualBuilderStore((state) => state.deleteOutcomeBlock)
  const setAddBlockSheetOpen = useVisualBuilderStore((state) => state.setAddBlockSheetOpen)
  const reorderBlocks = useVisualBuilderStore((state) => state.reorderBlocks)
  const reorderOutcomeBlocks = useVisualBuilderStore((state) => state.reorderOutcomeBlocks)

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
  // Note: We depend on activeStep.blocks directly to ensure re-renders when blocks change
  const blocks = useMemo(() => {
    if (!activeStep) return []

    // For result steps, show outcome blocks
    if (activeStep.type === 'result') {
      return selectedOutcome?.blocks || []
    }

    // For other steps, show step blocks
    return activeStep.blocks || []
  }, [activeStep, activeStep?.blocks, selectedOutcome, selectedOutcome?.blocks])

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!activeStep || steps.length <= 1) return 0
    const currentIndex = steps.findIndex((s) => s.id === activeStepId)
    // Don't count the result step in the progress
    const totalSteps = steps.filter((s) => s.type !== 'result').length
    if (totalSteps <= 1) return 100
    return Math.round((currentIndex / (totalSteps - 1)) * 100)
  }, [steps, activeStep, activeStepId])

  // Get step settings
  const showProgress = activeStep?.settings?.showProgress ?? false
  const allowBack = activeStep?.settings?.allowBack ?? false
  const isIntroStep = activeStep?.type === 'intro'

  // Handle block selection
  const handleBlockSelect = (blockId: string) => {
    setSelectedBlockId(blockId)
  }

  // Handle double-click to enter inline edit mode
  const handleBlockDoubleClick = (blockId: string) => {
    // First select the block, then enter edit mode
    setSelectedBlockId(blockId)
    setEditingBlockId(blockId)
  }

  // Handle inline edit - update block config
  const handleBlockEdit = (blockId: string, config: Partial<Block['config']>) => {
    if (!activeStep) return

    if (activeStep.type === 'result' && selectedOutcomeId) {
      updateOutcomeBlock(selectedOutcomeId, blockId, config)
    } else if (activeStepId) {
      updateBlock(activeStepId, blockId, config)
    }

    // Exit edit mode after saving
    setEditingBlockId(undefined)
  }

  // Handle block insertion
  const handleInsertBlock = (index: number) => {
    // Open the add block sheet with the insertion index
    setAddBlockSheetOpen(true, index)
  }

  // Handle block deletion
  const handleDeleteBlock = (blockId: string) => {
    if (!activeStep) return

    if (activeStep.type === 'result' && selectedOutcomeId) {
      deleteOutcomeBlock(selectedOutcomeId, blockId)
    } else if (activeStepId) {
      deleteBlock(activeStepId, blockId)
    }
  }

  // Handle block reordering
  const handleReorderBlocks = (fromIndex: number, toIndex: number) => {
    if (!activeStep) return

    if (activeStep.type === 'result' && selectedOutcomeId) {
      reorderOutcomeBlocks(selectedOutcomeId, fromIndex, toIndex)
    } else if (activeStepId) {
      reorderBlocks(activeStepId, fromIndex, toIndex)
    }
  }

  // Show empty state if no step is selected
  if (!activeStep) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {previewCopy.selectStep}
      </div>
    )
  }

  // Show empty state for result step without outcome selected
  if (activeStep.type === 'result' && !selectedOutcome) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {outcomes.length === 0
          ? previewCopy.addOutcome
          : previewCopy.selectOutcome}
      </div>
    )
  }

  return (
    <div data-testid="step-preview">
      {/* Navigation header - back button and progress bar */}
      {(showProgress || (allowBack && !isIntroStep)) && (
        <div className="px-4 pt-4 pb-0 space-y-2">
          {/* Back button */}
          {allowBack && !isIntroStep && (
            <button
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{previewCopy.back}</span>
            </button>
          )}

          {/* Progress bar */}
          {showProgress && (
            <div className="w-full">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blocks */}
      <div className="p-4">
        <BlockList
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          editingBlockId={editingBlockId}
          onBlockSelect={handleBlockSelect}
          onBlockDoubleClick={handleBlockDoubleClick}
          onBlockEdit={handleBlockEdit}
          onDeleteBlock={handleDeleteBlock}
          onInsertBlock={handleInsertBlock}
          onReorderBlocks={handleReorderBlocks}
        />
      </div>
    </div>
  )
}
