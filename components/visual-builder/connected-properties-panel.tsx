'use client'

import { useState, useEffect, useId } from 'react'
import { useVisualBuilderStore, createOutcome, createBlock } from '@/store/visual-builder-store'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BuilderProperties } from './builder-properties'
import {
  HeaderBlockEditor,
  TextBlockEditor,
  MediaBlockEditor,
  OptionsBlockEditor,
  FieldsBlockEditor,
  PriceBlockEditor,
  ButtonBlockEditor,
  BannerBlockEditor,
  ListBlockEditor,
  BlockControls,
} from './editors'
import {
  Block,
  BlockType,
  HeaderConfig,
  TextConfig,
  MediaConfig,
  OptionsConfig,
  FieldsConfig,
  PriceConfig,
  ButtonConfig,
  BannerConfig,
  ListConfig,
} from '@/types/blocks'
import { Separator } from '@/components/ui/separator'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import { SectionTitle } from '@/components/ui/section-title'
import { useMessages } from '@/lib/i18n/context'
import {
  Heading1,
  Type,
  Image,
  List,
  FormInput,
  DollarSign,
  MousePointer,
  AlertTriangle,
  ListChecks,
  Trash2,
  GripVertical,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const blockTypeIcons: Record<BlockType, React.ReactNode> = {
  header: <Heading1 className="w-4 h-4" />,
  text: <Type className="w-4 h-4" />,
  media: <Image className="w-4 h-4" />,
  options: <List className="w-4 h-4" />,
  fields: <FormInput className="w-4 h-4" />,
  price: <DollarSign className="w-4 h-4" />,
  button: <MousePointer className="w-4 h-4" />,
  banner: <AlertTriangle className="w-4 h-4" />,
  list: <ListChecks className="w-4 h-4" />,
}

// Sortable block item for the sidebar list
interface SortableBlockItemProps {
  block: Block
  isSelected: boolean
  onClick: () => void
  blockLabel: string
  dragLabel: string
}

function SortableBlockItem({ block, isSelected, onClick, blockLabel, dragLabel }: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors',
        isDragging && 'opacity-50',
        isSelected && 'bg-muted'
      )}
    >
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-2 text-left"
      >
        <span className="text-muted-foreground">
          {blockTypeIcons[block.type]}
        </span>
        <span className="flex-1 text-sm">
          {blockLabel}
        </span>
      </button>
      <button
        type="button"
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-all cursor-grab active:cursor-grabbing"
        aria-label={dragLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}

interface ConnectedPropertiesPanelProps {
  className?: string
}

export function ConnectedPropertiesPanel({ className }: ConnectedPropertiesPanelProps) {
  const messages = useMessages()
  const copy = messages.visualBuilder
  // DnD state to avoid hydration mismatch
  const dndId = useId()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)
  const selectedBlockId = useVisualBuilderStore((state) => state.selectedBlockId)

  // Get actions from store
  const setSelectedBlockId = useVisualBuilderStore((state) => state.setSelectedBlockId)
  const addBlock = useVisualBuilderStore((state) => state.addBlock)
  const addOutcomeBlock = useVisualBuilderStore((state) => state.addOutcomeBlock)
  const updateBlock = useVisualBuilderStore((state) => state.updateBlock)
  const deleteBlock = useVisualBuilderStore((state) => state.deleteBlock)
  const deleteStep = useVisualBuilderStore((state) => state.deleteStep)
  const reorderBlocks = useVisualBuilderStore((state) => state.reorderBlocks)
  const updateOutcomeBlock = useVisualBuilderStore((state) => state.updateOutcomeBlock)
  const deleteOutcomeBlock = useVisualBuilderStore((state) => state.deleteOutcomeBlock)
  const reorderOutcomeBlocks = useVisualBuilderStore((state) => state.reorderOutcomeBlocks)
  const updateStepSettings = useVisualBuilderStore((state) => state.updateStepSettings)
  const setAddBlockSheetOpen = useVisualBuilderStore((state) => state.setAddBlockSheetOpen)
  const setActiveStepId = useVisualBuilderStore((state) => state.setActiveStepId)
  const addOutcome = useVisualBuilderStore((state) => state.addOutcome)

  // Find the active step and selected block
  const activeStep = steps.find((s) => s.id === activeStepId)
  const selectedOutcome = outcomes.find((o) => o.id === selectedOutcomeId)
  const isResultStep = activeStep?.type === 'result'
  const isIntroStep = activeStep?.type === 'intro'

  // Get the blocks to search in (step blocks or outcome blocks for result step)
  const currentBlocks = isResultStep && selectedOutcome
    ? (selectedOutcome.blocks || [])
    : (activeStep?.blocks || [])

  // Find the selected block
  const selectedBlock = selectedBlockId
    ? currentBlocks.find((b) => b.id === selectedBlockId)
    : undefined

  // Find block index for reorder controls
  const blockIndex = selectedBlock
    ? currentBlocks.findIndex((b) => b.id === selectedBlock.id)
    : -1

  // Check if there's a price block in the current blocks
  const hasPriceBlock = currentBlocks.some((b) => b.type === 'price')

  // Handlers for block operations
  const handleUpdateBlock = (config: Partial<Block['config']>) => {
    if (!selectedBlockId || !selectedBlock) return

    const nextSelectionType = (config as OptionsConfig | PriceConfig).selectionType
    const isSelectableBlock = selectedBlock.type === 'options' || selectedBlock.type === 'price'
    const previousSelectionType =
      selectedBlock.type === 'price'
        ? ((selectedBlock.config as PriceConfig).selectionType ?? 'single')
        : (selectedBlock.config as OptionsConfig).selectionType
    const shouldAutoAttachCta =
      isSelectableBlock &&
      nextSelectionType === 'multiple' &&
      previousSelectionType !== 'multiple' &&
      blockIndex >= 0

    const addAutoButton = () => {
      const action = selectedBlock.type === 'price' ? 'selected_price' : 'next_step'
      const hasMatchingButton = currentBlocks.some((block) => {
        if (block.type !== 'button') return false
        return (block.config as ButtonConfig).action === action
      })

      if (hasMatchingButton) return

      const buttonBlock = createBlock('button')
      const buttonConfig = buttonBlock.config as ButtonConfig
      buttonConfig.text = copy.defaults.buttonContinue ?? buttonConfig.text ?? 'Continuar'
      buttonConfig.action = action

      if (isResultStep && selectedOutcomeId) {
        addOutcomeBlock(selectedOutcomeId, buttonBlock, blockIndex + 1)
      } else if (activeStepId) {
        addBlock(activeStepId, buttonBlock, blockIndex + 1)
      }

      setSelectedBlockId(selectedBlockId)
    }

    if (isResultStep && selectedOutcomeId) {
      updateOutcomeBlock(selectedOutcomeId, selectedBlockId, config)
    } else if (activeStepId) {
      updateBlock(activeStepId, selectedBlockId, config)
    }

    if (shouldAutoAttachCta) {
      addAutoButton()
    }
  }

  const handleDeleteBlock = () => {
    if (!selectedBlockId) return

    if (isResultStep && selectedOutcomeId) {
      deleteOutcomeBlock(selectedOutcomeId, selectedBlockId)
    } else if (activeStepId) {
      deleteBlock(activeStepId, selectedBlockId)
    }
  }

  const handleMoveBlock = (direction: 'up' | 'down') => {
    if (blockIndex === -1) return

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1

    if (isResultStep && selectedOutcomeId) {
      reorderOutcomeBlocks(selectedOutcomeId, blockIndex, newIndex)
    } else if (activeStepId) {
      reorderBlocks(activeStepId, blockIndex, newIndex)
    }
  }

  const handleBack = () => {
    setSelectedBlockId(undefined)
  }

  // Handle DnD reorder from sidebar
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = currentBlocks.findIndex((b) => b.id === active.id)
      const newIndex = currentBlocks.findIndex((b) => b.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        if (isResultStep && selectedOutcomeId) {
          reorderOutcomeBlocks(selectedOutcomeId, oldIndex, newIndex)
        } else if (activeStepId) {
          reorderBlocks(activeStepId, oldIndex, newIndex)
        }
      }
    }
  }

  const handleCreateOutcome = () => {
    // Find result step and navigate to it
    const resultStep = steps.find((s) => s.type === 'result')
    if (resultStep) {
      // Create a new outcome
      const newOutcome = createOutcome('', copy)
      addOutcome(newOutcome, copy)
      // Navigate to result step (this will also select the new outcome)
      setActiveStepId(resultStep.id)
    }
  }

  // Render block editor based on type
  const renderBlockEditor = (block: Block) => {
    switch (block.type) {
      case 'header':
        return (
          <HeaderBlockEditor
            config={block.config as HeaderConfig}
            onChange={handleUpdateBlock}
          />
        )
      case 'text':
        return (
          <TextBlockEditor
            config={block.config as TextConfig}
            onChange={handleUpdateBlock}
          />
        )
      case 'media':
        return (
          <MediaBlockEditor
            config={block.config as MediaConfig}
            onChange={handleUpdateBlock}
          />
        )
      case 'options':
        return (
          <OptionsBlockEditor
            config={block.config as OptionsConfig}
            onChange={handleUpdateBlock}
            outcomes={outcomes}
            onCreateOutcome={handleCreateOutcome}
          />
        )
      case 'fields':
        return (
          <FieldsBlockEditor
            config={block.config as FieldsConfig}
            onChange={handleUpdateBlock}
          />
        )
      case 'price':
        return (
          <PriceBlockEditor
            config={block.config as PriceConfig}
            onChange={handleUpdateBlock}
          />
        )
      case 'button':
        return (
          <ButtonBlockEditor
            config={block.config as ButtonConfig}
            onChange={handleUpdateBlock}
            disableUrl={isIntroStep}
            disableNextStep={isResultStep}
            disableSelectedPrice={!hasPriceBlock}
          />
        )
      case 'banner':
        return (
          <BannerBlockEditor
            config={block.config as BannerConfig}
            onChange={handleUpdateBlock}
          />
        )
      case 'list':
        return (
          <ListBlockEditor
            config={block.config as ListConfig}
            onChange={handleUpdateBlock}
          />
        )
      default:
        return null
    }
  }

  // If a block is selected, show block editor
  if (selectedBlock) {
    return (
      <BuilderProperties
        title={copy.blockTypes[selectedBlock.type]}
        showBack
        onBack={handleBack}
        className={className}
      >
        {/* Block editor */}
        {renderBlockEditor(selectedBlock)}

        <Separator className="my-6" />

        {/* Block controls */}
        <BlockControls
          onMoveUp={() => handleMoveBlock('up')}
          onMoveDown={() => handleMoveBlock('down')}
          onDelete={handleDeleteBlock}
          canMoveUp={blockIndex > 0}
          canMoveDown={blockIndex < currentBlocks.length - 1}
          blockTypeName={copy.blockTypes[selectedBlock.type]}
        />
      </BuilderProperties>
    )
  }

  // If result step with outcome selected, show outcome info
  if (isResultStep && selectedOutcome) {
    return (
      <BuilderProperties
        title={selectedOutcome.name || copy.sidebar.outcomeLabel}
        className={className}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {copy.properties.clickPreview}
          </p>

          <Separator />
          <div className="space-y-2">
            <SectionTitle className="mb-0">{copy.properties.blocksInResult}</SectionTitle>
            {isMounted ? (
              <DndContext
                id={`${dndId}-outcome`}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={currentBlocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {currentBlocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        blockLabel={copy.blockTypes[block.type]}
                        dragLabel={copy.itemActions.dragBlock}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-1">
                  {currentBlocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-muted-foreground">
                        {blockTypeIcons[block.type]}
                      </span>
                      <span className="flex-1 text-sm">
                        {copy.blockTypes[block.type]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            <GhostAddButton
              onClick={() => setAddBlockSheetOpen(true)}
              aria-label={copy.properties.addBlock}
            >
              {copy.properties.addBlock}
            </GhostAddButton>
          </div>
        </div>
      </BuilderProperties>
    )
  }

  // If step is selected, show step settings
  if (activeStep) {
    const canDeleteStep = !activeStep.isFixed

    return (
      <>
        <BuilderProperties
          title={activeStep.label}
          actions={
            canDeleteStep ? (
              <button
                onClick={() => deleteStep(activeStep.id)}
                className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={copy.properties.deleteStep}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : null
          }
          className={className}
        >
          <div className="space-y-4">
            {/* Step navigation toggles - hidden on intro step */}
            {!isIntroStep && (
              <div className="space-y-1">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    updateStepSettings(activeStep.id, {
                      showProgress: !(activeStep.settings?.showProgress ?? false),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      updateStepSettings(activeStep.id, {
                        showProgress: !(activeStep.settings?.showProgress ?? false),
                      })
                    }
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-left">{copy.stepSettings.progressLabel}</span>
                  <Switch
                    checked={activeStep.settings?.showProgress ?? false}
                    onCheckedChange={(checked) =>
                      updateStepSettings(activeStep.id, { showProgress: checked })
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    updateStepSettings(activeStep.id, {
                      allowBack: !(activeStep.settings?.allowBack ?? false),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      updateStepSettings(activeStep.id, {
                        allowBack: !(activeStep.settings?.allowBack ?? false),
                      })
                    }
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-left">{copy.stepSettings.backLabel}</span>
                  <Switch
                    checked={activeStep.settings?.allowBack ?? false}
                    onCheckedChange={(checked) =>
                      updateStepSettings(activeStep.id, { allowBack: checked })
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Block list */}
            {!isIntroStep && <Separator />}
            <div className="space-y-2">
              <SectionTitle className="mb-0">{copy.properties.blocksInStep}</SectionTitle>
              {isMounted ? (
                <DndContext
                  id={`${dndId}-step`}
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentBlocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {currentBlocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        blockLabel={copy.blockTypes[block.type]}
                        dragLabel={copy.itemActions.dragBlock}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              ) : (
                <div className="space-y-1">
                  {currentBlocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-muted-foreground">
                        {blockTypeIcons[block.type]}
                      </span>
                      <span className="flex-1 text-sm">
                        {copy.blockTypes[block.type]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <GhostAddButton
                onClick={() => setAddBlockSheetOpen(true)}
                aria-label={copy.properties.addBlock}
              >
                {copy.properties.addBlock}
              </GhostAddButton>
            </div>
          </div>
        </BuilderProperties>
      </>
    )
  }

  // Default empty state
  return (
    <BuilderProperties title={copy.properties.title} className={className}>
      <div className="text-sm text-muted-foreground">
        {copy.properties.emptySelection}
      </div>
    </BuilderProperties>
  )
}
