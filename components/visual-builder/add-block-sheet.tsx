'use client'

import { useState } from 'react'
import { useVisualBuilderStore, createBlock } from '@/store/visual-builder-store'
import { BlockType, ButtonConfig, FieldsConfig, PriceConfig, ListConfig } from '@/types/blocks'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Block type options with icons
const blockTypeOptions: { type: BlockType; icon: React.ReactNode }[] = [
  { type: 'header', icon: <Type className="w-5 h-5" /> },
  { type: 'text', icon: <AlignLeft className="w-5 h-5" /> },
  { type: 'media', icon: <Image className="w-5 h-5" /> },
  { type: 'options', icon: <List className="w-5 h-5" /> },
  { type: 'fields', icon: <FormInput className="w-5 h-5" /> },
  { type: 'price', icon: <DollarSign className="w-5 h-5" /> },
  { type: 'button', icon: <MousePointerClick className="w-5 h-5" /> },
  { type: 'banner', icon: <AlertCircle className="w-5 h-5" /> },
  { type: 'list', icon: <ListChecks className="w-5 h-5" /> },
]

/**
 * AddBlockSheet - Bottom sheet for selecting block type to add
 */
export function AddBlockSheet() {
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

  return (
    <Sheet open={isOpen} onOpenChange={setAddBlockSheetOpen}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{copy.addBlock.title}</SheetTitle>
          <SheetDescription>{copy.addBlock.description}</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 mt-6 pb-6">
          {blockTypeOptions.map(({ type, icon }) => {
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
                <button
                  onClick={() => handleSelectBlockType(type)}
                  disabled={isDisabled}
                  className={cn(
                    'w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-muted-foreground/20 transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isDisabled
                      ? 'opacity-40'
                      : 'hover:bg-muted/60 hover:border-primary/30'
                  )}
                  aria-label={copy.blockTypes[type]}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                    {icon}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {copy.blockTypes[type]}
                  </span>
                </button>
              </div>
            )
          })}
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
      </SheetContent>
    </Sheet>
  )
}
