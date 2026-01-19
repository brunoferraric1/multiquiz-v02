'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StepSettingsEditor } from './step-settings-editor'
import { StepSettings } from '@/types/blocks'

interface StepConfigSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: StepSettings
  onChange: (settings: Partial<StepSettings>) => void
  stepLabel: string
  isIntroStep?: boolean
  isResultStep?: boolean
}

export function StepConfigSheet({
  open,
  onOpenChange,
  settings,
  onChange,
  stepLabel,
  isIntroStep = false,
  isResultStep = false,
}: StepConfigSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Configurações: {stepLabel}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <StepSettingsEditor
            settings={settings}
            onChange={onChange}
            isIntroStep={isIntroStep}
            isResultStep={isResultStep}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
