'use client'

import { useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupOption } from '@/components/ui/toggle-group'
import { SectionTitle } from '@/components/ui/section-title'
import { ButtonConfig, ButtonAction } from '@/types/blocks'
import { ArrowRight, Link } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface ButtonBlockEditorProps {
  config: ButtonConfig
  onChange: (config: Partial<ButtonConfig>) => void
  /** Whether URL action is disabled (e.g., on intro step) */
  disableUrl?: boolean
  /** Whether next_step action is disabled (e.g., on result step) */
  disableNextStep?: boolean
  /** Whether selected_price action is disabled (e.g., when no price block exists) */
  disableSelectedPrice?: boolean
}

export function ButtonBlockEditor({
  config,
  onChange,
  disableUrl = false,
  disableNextStep = false,
  disableSelectedPrice = false,
}: ButtonBlockEditorProps) {
  const messages = useMessages()
  const buttonCopy = messages.visualBuilder.buttonEditor
  // Auto-switch action if current action is disabled
  const effectiveAction: ButtonAction =
    (config.action === 'url' && disableUrl) ? 'next_step' :
    (config.action === 'next_step' && disableNextStep) ? 'url' :
    (config.action === 'selected_price' && disableSelectedPrice) ? 'next_step' :
    config.action

  // Persist the auto-switched action to the config
  // This ensures the button actually uses the correct action type
  useEffect(() => {
    if (effectiveAction !== config.action) {
      onChange({ action: effectiveAction })
    }
  }, [effectiveAction, config.action, onChange])

  // Build options based on what's enabled
  const actionOptions = useMemo(() => {
    const options: ToggleGroupOption<ButtonAction>[] = []
    if (!disableNextStep) {
      options.push({ value: 'next_step', label: buttonCopy.actionNext, icon: <ArrowRight /> })
    }
    if (!disableUrl) {
      options.push({ value: 'url', label: buttonCopy.actionUrl, icon: <Link /> })
    }
    if (!disableSelectedPrice) {
      options.push({ value: 'selected_price', label: buttonCopy.actionSelectedPrice })
    }
    return options
  }, [buttonCopy, disableNextStep, disableUrl, disableSelectedPrice])

  return (
    <div className="space-y-4" data-testid="button-block-editor">
      {/* Button text */}
      <div className="space-y-2">
        <Label htmlFor="button-text">{buttonCopy.textLabel}</Label>
        <Input
          id="button-text"
          value={config.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={buttonCopy.textPlaceholder}
        />
      </div>

      {/* Action type */}
      {actionOptions.length > 1 && (
        <div>
          <SectionTitle>{buttonCopy.actionTitle}</SectionTitle>
          <ToggleGroup
            options={actionOptions}
            value={effectiveAction}
            onChange={(action) => onChange({ action })}
            aria-label={buttonCopy.actionAria}
          />
        </div>
      )}

      {/* URL input (shown when action is url) */}
      {effectiveAction === 'url' && (
        <div className="space-y-2">
          <Label htmlFor="button-url">{buttonCopy.urlLabel}</Label>
          <Input
            id="button-url"
            type="url"
            value={config.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder={buttonCopy.urlPlaceholder}
          />
        </div>
      )}

      {/* Info text based on action */}
      {effectiveAction === 'next_step' && (
        <p className="text-xs text-muted-foreground">
          {buttonCopy.infoNext}
        </p>
      )}
      {effectiveAction === 'selected_price' && (
        <p className="text-xs text-muted-foreground">
          {buttonCopy.infoSelectedPrice}
        </p>
      )}
    </div>
  )
}
