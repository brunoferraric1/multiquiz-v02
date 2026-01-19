'use client'

import { useState } from 'react'
import { useVisualBuilderStore } from '@/store/visual-builder-store'
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
  StepConfigSheet,
} from './editors'
import {
  Block,
  BlockType,
  blockTypeLabels,
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
  Settings,
} from 'lucide-react'

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

interface ConnectedPropertiesPanelProps {
  className?: string
}

export function ConnectedPropertiesPanel({ className }: ConnectedPropertiesPanelProps) {
  // Local state for config sheet
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)
  const selectedBlockId = useVisualBuilderStore((state) => state.selectedBlockId)

  // Get actions from store
  const setSelectedBlockId = useVisualBuilderStore((state) => state.setSelectedBlockId)
  const updateBlock = useVisualBuilderStore((state) => state.updateBlock)
  const deleteBlock = useVisualBuilderStore((state) => state.deleteBlock)
  const reorderBlocks = useVisualBuilderStore((state) => state.reorderBlocks)
  const updateOutcomeBlock = useVisualBuilderStore((state) => state.updateOutcomeBlock)
  const deleteOutcomeBlock = useVisualBuilderStore((state) => state.deleteOutcomeBlock)
  const reorderOutcomeBlocks = useVisualBuilderStore((state) => state.reorderOutcomeBlocks)
  const updateStepSettings = useVisualBuilderStore((state) => state.updateStepSettings)
  const setAddBlockSheetOpen = useVisualBuilderStore((state) => state.setAddBlockSheetOpen)

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

  // Handlers for block operations
  const handleUpdateBlock = (config: Partial<Block['config']>) => {
    if (!selectedBlockId) return

    if (isResultStep && selectedOutcomeId) {
      updateOutcomeBlock(selectedOutcomeId, selectedBlockId, config)
    } else if (activeStepId) {
      updateBlock(activeStepId, selectedBlockId, config)
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
        showBack
        onBack={handleBack}
        className={className}
      >
        {/* Block type header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {blockTypeIcons[selectedBlock.type]}
          </div>
          <h4 className="font-medium text-foreground">
            {blockTypeLabels[selectedBlock.type]}
          </h4>
        </div>

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
          blockTypeName={blockTypeLabels[selectedBlock.type]}
        />
      </BuilderProperties>
    )
  }

  // If result step with outcome selected, show outcome info
  if (isResultStep && selectedOutcome) {
    return (
      <BuilderProperties
        title={selectedOutcome.name || 'Resultado'}
        className={className}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clique em um bloco na prévia para editar seu conteúdo.
          </p>

          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Blocos neste resultado</h4>
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
                    {blockTypeLabels[block.type]}
                  </span>
                  {!block.enabled && (
                    <span className="text-xs text-muted-foreground">(oculto)</span>
                  )}
                </button>
              ))}
            </div>
            <GhostAddButton
              onClick={() => setAddBlockSheetOpen(true)}
              aria-label="Adicionar bloco"
            >
              Adicionar bloco
            </GhostAddButton>
          </div>
        </div>
      </BuilderProperties>
    )
  }

  // If step is selected, show step settings
  if (activeStep) {
    return (
      <>
        <BuilderProperties
          title={activeStep.label}
          actions={
            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Abrir configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          }
          className={className}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clique em um bloco na prévia para editar seu conteúdo.
            </p>

            {/* Block list */}
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Blocos nesta etapa</h4>
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
                      {blockTypeLabels[block.type]}
                    </span>
                    {!block.enabled && (
                      <span className="text-xs text-muted-foreground">(oculto)</span>
                    )}
                  </button>
                ))}
              </div>
              <GhostAddButton
                onClick={() => setAddBlockSheetOpen(true)}
                aria-label="Adicionar bloco"
              >
                Adicionar bloco
              </GhostAddButton>
            </div>
          </div>
        </BuilderProperties>

        {/* Step config sheet */}
        <StepConfigSheet
          open={isConfigOpen}
          onOpenChange={setIsConfigOpen}
          settings={activeStep.settings || {}}
          onChange={(settings) => updateStepSettings(activeStep.id, settings)}
          stepLabel={activeStep.label}
          isIntroStep={isIntroStep}
          isResultStep={isResultStep}
        />
      </>
    )
  }

  // Default empty state
  return (
    <BuilderProperties title="Propriedades" className={className}>
      <div className="text-sm text-muted-foreground">
        Selecione uma etapa ou bloco para editar suas propriedades.
      </div>
    </BuilderProperties>
  )
}
