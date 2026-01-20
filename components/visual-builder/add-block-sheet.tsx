'use client'

import { useVisualBuilderStore, createBlock } from '@/store/visual-builder-store'
import { BlockType, blockTypeLabels, blockTypeDescriptions } from '@/types/blocks'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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

  // Get the active step
  const activeStep = steps.find((s) => s.id === activeStepId)
  const isResultStep = activeStep?.type === 'result'

  const handleSelectBlockType = (type: BlockType) => {
    const newBlock = createBlock(type)

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
          <SheetTitle>Adicionar bloco</SheetTitle>
          <SheetDescription>
            Escolha o tipo de bloco que deseja adicionar.
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-3 mt-6 pb-6">
          {blockTypeOptions.map(({ type, icon }) => (
            <button
              key={type}
              onClick={() => handleSelectBlockType(type)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border border-muted-foreground/20',
                'hover:bg-muted/60 hover:border-primary/30 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
              )}
              aria-label={blockTypeLabels[type]}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                {icon}
              </div>
              <span className="text-xs font-medium text-foreground">
                {blockTypeLabels[type]}
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
