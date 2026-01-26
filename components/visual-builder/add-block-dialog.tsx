'use client'

import { useState } from 'react'
import { useVisualBuilderStore, createBlock } from '@/store/visual-builder-store'
import { BlockType, ButtonConfig, FieldsConfig, PriceConfig, ListConfig } from '@/types/blocks'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog'
import { SectionTitle } from '@/components/ui/section-title'
import { useMessages } from '@/lib/i18n/context'
import {
  Type,
  AlignLeft,
  Image,
  List,
  FormInput,
  DollarSign,
  MousePointerClick,
  AlertCircle,
  ListChecks,
  Loader2,
} from 'lucide-react'
import { BlockTypeCard } from './templates/block-type-card'

// Block type configurations organized by category
interface BlockConfig {
  type: BlockType
  icon: React.ReactNode
  category: 'content' | 'interaction' | 'action'
}

const blockConfigs: BlockConfig[] = [
  // Content
  { type: 'header', icon: <Type className="w-5 h-5" />, category: 'content' },
  { type: 'text', icon: <AlignLeft className="w-5 h-5" />, category: 'content' },
  { type: 'media', icon: <Image className="w-5 h-5" />, category: 'content' },
  { type: 'loading', icon: <Loader2 className="w-5 h-5" />, category: 'content' },
  // Interaction
  { type: 'options', icon: <List className="w-5 h-5" />, category: 'interaction' },
  { type: 'fields', icon: <FormInput className="w-5 h-5" />, category: 'interaction' },
  { type: 'price', icon: <DollarSign className="w-5 h-5" />, category: 'interaction' },
  // Action
  { type: 'button', icon: <MousePointerClick className="w-5 h-5" />, category: 'action' },
  { type: 'banner', icon: <AlertCircle className="w-5 h-5" />, category: 'action' },
  { type: 'list', icon: <ListChecks className="w-5 h-5" />, category: 'action' },
]

/**
 * AddBlockDialog - Dialog for selecting block type to add
 *
 * Shows blocks organized by category (Content, Interaction, Action).
 * Desktop: centered modal, Mobile: bottom drawer with slide-up animation.
 */
export function AddBlockDialog() {
  const messages = useMessages()
  const copy = messages.visualBuilder
  // Custom tooltip state
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null)

  // Get state from store
  const isOpen = useVisualBuilderStore((state) => state.isAddBlockSheetOpen)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)
  const steps = useVisualBuilderStore((state) => state.steps)
  const blockInsertionIndex = useVisualBuilderStore((state) => state.blockInsertionIndex)

  // Get actions from store
  const setAddBlockSheetOpen = useVisualBuilderStore((state) => state.setAddBlockSheetOpen)
  const addBlock = useVisualBuilderStore((state) => state.addBlock)
  const addOutcomeBlock = useVisualBuilderStore((state) => state.addOutcomeBlock)

  // Get the active step and outcomes
  const activeStep = steps.find((s) => s.id === activeStepId)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const selectedOutcome = outcomes.find((o) => o.id === selectedOutcomeId)
  const isResultStep = activeStep?.type === 'result'

  const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // Get current blocks to check for existing blocks
  const currentBlocks = isResultStep && selectedOutcome
    ? (selectedOutcome.blocks || [])
    : (activeStep?.blocks || [])

  // Check for blocks that can only appear once per page
  const hasOptionsBlock = currentBlocks.some((b) => b.type === 'options')
  const hasPriceBlock = currentBlocks.some((b) => b.type === 'price')

  // Determine if a block type is disabled
  const isBlockTypeDisabled = (type: BlockType): boolean => {
    if (type === 'options' && hasOptionsBlock) return true
    if (type === 'price' && hasPriceBlock) return true
    return false
  }

  const handleSelectBlockType = (type: BlockType) => {
    // Don't allow adding if disabled
    if (isBlockTypeDisabled(type)) return
    const newBlock = createBlock(type)
    const defaults = copy.defaults
    const fieldsPlaceholders = copy.fieldsEditor.placeholders

    // If adding a button and there's a price block, default to selected_price action
    if (type === 'button') {
      const hasPriceBlock = currentBlocks.some((b) => b.type === 'price')
      const buttonConfig = newBlock.config as ButtonConfig
      buttonConfig.text = defaults.buttonContinue
      if (hasPriceBlock) {
        buttonConfig.action = 'selected_price'
      }
    }
    if (type === 'fields') {
      newBlock.config = {
        items: [
          {
            id: createId('field'),
            label: defaults.fieldNameLabel,
            type: 'text',
            required: true,
            placeholder: defaults.fieldNamePlaceholder,
          },
          {
            id: createId('field'),
            label: defaults.fieldEmailLabel,
            type: 'email',
            required: true,
            placeholder: fieldsPlaceholders.email,
          },
        ],
      } as FieldsConfig
    }
    if (type === 'price') {
      newBlock.config = {
        items: [
          {
            id: createId('price'),
            title: defaults.pricePlanTitle,
            value: defaults.pricePlanValue,
            suffix: defaults.pricePlanSuffix,
          },
        ],
        selectionType: 'single',
      } as PriceConfig
    }
    if (type === 'list') {
      newBlock.config = {
        items: [1, 2, 3].map((index) => ({
          id: createId('list'),
          text: `${defaults.listItem} ${index}`,
          emoji: copy.listEditor.emojiPlaceholder,
        })),
      } as ListConfig
    }

    if (isResultStep && selectedOutcomeId) {
      // Add to outcome at specified index
      addOutcomeBlock(selectedOutcomeId, newBlock, blockInsertionIndex)
    } else if (activeStepId) {
      // Add to step at specified index
      addBlock(activeStepId, newBlock, blockInsertionIndex)
    }

    setAddBlockSheetOpen(false)
  }

  // Group blocks by category
  const contentBlocks = blockConfigs.filter((b) => b.category === 'content')
  const interactionBlocks = blockConfigs.filter((b) => b.category === 'interaction')
  const actionBlocks = blockConfigs.filter((b) => b.category === 'action')

  const categoryCopy = copy.addBlock.categories as Record<string, string> | undefined

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setAddBlockSheetOpen}>
      <ResponsiveDialogContent
        title={copy.addBlock.title}
        description={copy.addBlock.description}
      >
        <div className="mt-4 space-y-6">
          {/* Content category */}
          <div>
            <SectionTitle>{categoryCopy?.content || 'Content'}</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {contentBlocks.map(({ type, icon }) => {
                const isDisabled = isBlockTypeDisabled(type)
                return (
                  <div
                    key={type}
                    onMouseMove={(e) => {
                      if (isDisabled) {
                        setTooltip({ x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <BlockTypeCard
                      icon={icon}
                      label={copy.blockTypes[type]}
                      disabled={isDisabled}
                      onClick={() => handleSelectBlockType(type)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Interaction category */}
          <div>
            <SectionTitle>{categoryCopy?.interaction || 'Interaction'}</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {interactionBlocks.map(({ type, icon }) => {
                const isDisabled = isBlockTypeDisabled(type)
                return (
                  <div
                    key={type}
                    onMouseMove={(e) => {
                      if (isDisabled) {
                        setTooltip({ x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <BlockTypeCard
                      icon={icon}
                      label={copy.blockTypes[type]}
                      disabled={isDisabled}
                      onClick={() => handleSelectBlockType(type)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action category */}
          <div>
            <SectionTitle>{categoryCopy?.action || 'Action'}</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {actionBlocks.map(({ type, icon }) => {
                const isDisabled = isBlockTypeDisabled(type)
                return (
                  <div
                    key={type}
                    onMouseMove={(e) => {
                      if (isDisabled) {
                        setTooltip({ x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <BlockTypeCard
                      icon={icon}
                      label={copy.blockTypes[type]}
                      disabled={isDisabled}
                      onClick={() => handleSelectBlockType(type)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Custom cursor tooltip */}
        {tooltip && (
          <div
            className="fixed z-[100] px-2 py-1 text-xs font-medium text-foreground bg-popover border border-border rounded-md shadow-md pointer-events-none"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y + 12,
            }}
          >
            {copy.addBlock.tooltip.onlyOnePerPage}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
