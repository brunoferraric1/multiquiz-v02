'use client'

import { useVisualBuilderStore, StepType } from '@/store/visual-builder-store'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog'
import { useMessages } from '@/lib/i18n/context'
import { FileQuestion, HelpCircle, Gift, Users, Loader2 } from 'lucide-react'
import { StepTemplateCard } from './templates/step-template-card'
import { StepTemplate } from './templates/step-template-preview'
import { getBlocksForTemplate, createStepFromTemplate } from '@/store/visual-builder-store'

interface TemplateConfig {
  template: StepTemplate
  stepType: StepType
  icon: React.ReactNode
}

const templateConfigs: TemplateConfig[] = [
  { template: 'blank', stepType: 'question', icon: <FileQuestion className="w-5 h-5" /> },
  { template: 'question', stepType: 'question', icon: <HelpCircle className="w-5 h-5" /> },
  { template: 'promo', stepType: 'promo', icon: <Gift className="w-5 h-5" /> },
  { template: 'lead-gen', stepType: 'lead-gen', icon: <Users className="w-5 h-5" /> },
  { template: 'loading', stepType: 'question', icon: <Loader2 className="w-5 h-5" /> },
]

/**
 * AddStepDialog - Dialog for selecting and adding new step templates
 *
 * Shows template cards with wireframe previews.
 * Desktop: centered modal, Mobile: bottom drawer with slide-up animation.
 */
export function AddStepDialog() {
  const messages = useMessages()
  const copy = messages.visualBuilder.addStep

  // Read state from store
  const isOpen = useVisualBuilderStore((state) => state.isAddStepSheetOpen)
  const steps = useVisualBuilderStore((state) => state.steps)

  // Get actions from store
  const setAddStepSheetOpen = useVisualBuilderStore((state) => state.setAddStepSheetOpen)
  const addStep = useVisualBuilderStore((state) => state.addStep)

  const handleSelectTemplate = (template: StepTemplate, stepType: StepType) => {
    const newStep = createStepFromTemplate(template, stepType, steps, messages.visualBuilder)
    addStep(newStep)
    // Note: addStep already closes the sheet and selects the new step
  }

  const handleOpenChange = (open: boolean) => {
    setAddStepSheetOpen(open)
  }

  // Get template copy
  const getTemplateCopy = (template: StepTemplate) => {
    const templateCopy = copy.templates as Record<string, { label: string; description: string }>
    return templateCopy[template] || { label: template, description: '' }
  }

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent
        title={copy.title}
        description={copy.description}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {templateConfigs.map((config) => {
            const templateCopy = getTemplateCopy(config.template)
            return (
              <StepTemplateCard
                key={config.template}
                template={config.template}
                icon={config.icon}
                title={templateCopy.label}
                description={templateCopy.description}
                onClick={() => handleSelectTemplate(config.template, config.stepType)}
              />
            )
          })}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
