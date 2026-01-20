'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupOption } from '@/components/ui/toggle-group'
import { ButtonConfig, ButtonAction } from '@/types/blocks'
import { ArrowRight, Link } from 'lucide-react'

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
  // Auto-switch action if current action is disabled
  const effectiveAction: ButtonAction =
    (config.action === 'url' && disableUrl) ? 'next_step' :
    (config.action === 'next_step' && disableNextStep) ? 'url' :
    (config.action === 'selected_price' && disableSelectedPrice) ? 'next_step' :
    config.action

  // Build options based on what's enabled
  const actionOptions = useMemo(() => {
    const options: ToggleGroupOption<ButtonAction>[] = []
    if (!disableNextStep) {
      options.push({ value: 'next_step', label: 'Próxima', icon: <ArrowRight /> })
    }
    if (!disableUrl) {
      options.push({ value: 'url', label: 'Abrir URL', icon: <Link /> })
    }
    if (!disableSelectedPrice) {
      options.push({ value: 'selected_price', label: 'Preço selecionado' })
    }
    return options
  }, [disableNextStep, disableUrl, disableSelectedPrice])

  return (
    <div className="space-y-4" data-testid="button-block-editor">
      {/* Button text */}
      <div className="space-y-2">
        <Label htmlFor="button-text">Texto do botão</Label>
        <Input
          id="button-text"
          value={config.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Ex: Continuar"
        />
      </div>

      {/* Action type */}
      {actionOptions.length > 1 && (
        <div className="space-y-2">
          <Label>Ação do botão</Label>
          <ToggleGroup
            options={actionOptions}
            value={effectiveAction}
            onChange={(action) => onChange({ action })}
            aria-label="Ação do botão"
          />
        </div>
      )}

      {/* URL input (shown when action is url) */}
      {effectiveAction === 'url' && (
        <div className="space-y-2">
          <Label htmlFor="button-url">URL de destino</Label>
          <Input
            id="button-url"
            type="url"
            value={config.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://exemplo.com"
          />
        </div>
      )}

      {/* Info text based on action */}
      {effectiveAction === 'next_step' && (
        <p className="text-xs text-muted-foreground">
          O botão avançará para a próxima etapa do quiz.
        </p>
      )}
      {effectiveAction === 'selected_price' && (
        <p className="text-xs text-muted-foreground">
          Redireciona para a URL do preço selecionado pelo usuário.
        </p>
      )}
    </div>
  )
}
