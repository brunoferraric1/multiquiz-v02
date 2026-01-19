'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ButtonConfig, ButtonAction } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { ArrowRight, Link } from 'lucide-react'

interface ButtonBlockEditorProps {
  config: ButtonConfig
  onChange: (config: Partial<ButtonConfig>) => void
  /** Whether URL action is disabled (e.g., on intro step) */
  disableUrl?: boolean
  /** Whether next_step action is disabled (e.g., on result step) */
  disableNextStep?: boolean
}

export function ButtonBlockEditor({
  config,
  onChange,
  disableUrl = false,
  disableNextStep = false,
}: ButtonBlockEditorProps) {
  // Auto-switch action if current action is disabled
  const effectiveAction: ButtonAction =
    (config.action === 'url' && disableUrl) ? 'next_step' :
    (config.action === 'next_step' && disableNextStep) ? 'url' :
    config.action

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
      {!disableUrl || !disableNextStep ? (
        <div className="space-y-2">
          <Label>Ação do botão</Label>
          <div className="flex gap-2">
            {!disableNextStep && (
              <button
                type="button"
                onClick={() => onChange({ action: 'next_step' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
                  effectiveAction === 'next_step'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border hover:bg-muted'
                )}
                aria-pressed={effectiveAction === 'next_step'}
                data-testid="action-type-next"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-sm font-medium">Próxima etapa</span>
              </button>
            )}
            {!disableUrl && (
              <button
                type="button"
                onClick={() => onChange({ action: 'url' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
                  effectiveAction === 'url'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border hover:bg-muted'
                )}
                aria-pressed={effectiveAction === 'url'}
                data-testid="action-type-url"
              >
                <Link className="w-4 h-4" />
                <span className="text-sm font-medium">Abrir URL</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

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
    </div>
  )
}
