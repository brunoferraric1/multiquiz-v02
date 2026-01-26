'use client'

import { useVisualBuilderStore, createBlock } from '@/store/visual-builder-store'
import { BlockType, ButtonConfig, FieldsConfig, PriceConfig, ListConfig } from '@/types/blocks'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog'
import { InstantTooltip } from '@/components/ui/instant-tooltip'
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

// Block type configurations - all in a single flat list
interface BlockConfig {
  type: BlockType
  icon: React.ReactNode
}

const blockConfigs: BlockConfig[] = [
  { type: 'header', icon: <Type className="w-5 h-5" /> },
  { type: 'text', icon: <AlignLeft className="w-5 h-5" /> },
  { type: 'media', icon: <Image className="w-5 h-5" /> },
  { type: 'options', icon: <List className="w-5 h-5" /> },
  { type: 'button', icon: <MousePointerClick className="w-5 h-5" /> },
  { type: 'fields', icon: <FormInput className="w-5 h-5" /> },
  { type: 'banner', icon: <AlertCircle className="w-5 h-5" /> },
  { type: 'list', icon: <ListChecks className="w-5 h-5" /> },
  { type: 'price', icon: <DollarSign className="w-5 h-5" /> },
  { type: 'loading', icon: <Loader2 className="w-5 h-5" /> },
]

/**
 * AddBlockDialog - Dialog for selecting block type to add
 *
 * Shows all available block types in a grid.
 * Desktop: centered modal, Mobile: bottom drawer with slide-up animation.
 */
export function AddBlockDialog() {
  const messages = useMessages()
  const copy = messages.visualBuilder

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

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setAddBlockSheetOpen}>
      <ResponsiveDialogContent
        title={copy.addBlock.title}
        description={copy.addBlock.description}
        className="md:max-w-2xl"
      >
        <div className="mt-4">
          {/* All blocks in a single grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {blockConfigs.map(({ type, icon }) => {
              const isDisabled = isBlockTypeDisabled(type)

              if (isDisabled) {
                return (
                  <InstantTooltip
                    key={type}
                    content={copy.addBlock.tooltip.onlyOnePerPage}
                    side="top"
                    wrapperClassName="w-full"
                  >
                    <BlockTypeCard
                      icon={icon}
                      label={copy.blockTypes[type]}
                      disabled={isDisabled}
                      onClick={() => handleSelectBlockType(type)}
                    />
                  </InstantTooltip>
                )
              }

              return (
                <BlockTypeCard
                  key={type}
                  icon={icon}
                  label={copy.blockTypes[type]}
                  disabled={isDisabled}
                  onClick={() => handleSelectBlockType(type)}
                />
              )
            })}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
