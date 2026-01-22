'use client'

import { useVisualBuilderStore, createStep, StepType } from '@/store/visual-builder-store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/lib/i18n/context'
import { HelpCircle, Users, Gift } from 'lucide-react'

/**
 * AddStepSheet - Sheet component for selecting and adding new step types
 *
 * Opens when user clicks "Adicionar etapa" button in the sidebar.
 * Shows available step types (question, lead-gen, promo).
 * Adds the selected step type to the quiz and closes the sheet.
 */
export function AddStepSheet() {
  const messages = useMessages()
  const addStepCopy = messages.visualBuilder.addStep
  // Read state from store
  const isOpen = useVisualBuilderStore((state) => state.isAddStepSheetOpen)
  const steps = useVisualBuilderStore((state) => state.steps)

  // Get actions from store
  const setAddStepSheetOpen = useVisualBuilderStore((state) => state.setAddStepSheetOpen)
  const addStep = useVisualBuilderStore((state) => state.addStep)

  const stepTypeOptions: { type: StepType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      type: 'question',
      label: addStepCopy.types.question.label,
      description: addStepCopy.types.question.description,
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      type: 'lead-gen',
      label: addStepCopy.types.leadGen.label,
      description: addStepCopy.types.leadGen.description,
      icon: <Users className="w-5 h-5" />,
    },
    {
      type: 'promo',
      label: addStepCopy.types.promo.label,
      description: addStepCopy.types.promo.description,
      icon: <Gift className="w-5 h-5" />,
    },
  ]

  const handleAddStep = (type: StepType) => {
    const newStep = createStep(type, steps, messages.visualBuilder)
    addStep(newStep)
    // Note: addStep already closes the sheet and selects the new step
  }

  const handleOpenChange = (open: boolean) => {
    setAddStepSheetOpen(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{addStepCopy.title}</SheetTitle>
          <SheetDescription>{addStepCopy.description}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 mt-6">
          {stepTypeOptions.map((option) => (
            <Button
              key={option.type}
              variant="outline"
              className="w-full h-auto p-4 justify-start text-left"
              onClick={() => handleAddStep(option.type)}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground shrink-0">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
