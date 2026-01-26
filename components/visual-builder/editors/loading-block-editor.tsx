'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionTitle } from '@/components/ui/section-title'
import { LoadingConfig, LoadingStyle } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Minus, Circle } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface LoadingBlockEditorProps {
  config: LoadingConfig
  onChange: (config: Partial<LoadingConfig>) => void
}

/**
 * LoadingBlockEditor - Editor for the loading indicator block
 *
 * Allows customization of:
 * - Loading message text
 * - Progress style (bar or circle)
 * - Duration in seconds
 */
export function LoadingBlockEditor({ config, onChange }: LoadingBlockEditorProps) {
  const messages = useMessages()
  const loadingCopy = messages.visualBuilder.loadingEditor

  const style = config.style ?? 'bar'
  const duration = config.duration ?? 3

  return (
    <div className="space-y-4" data-testid="loading-block-editor">
      {/* Loading text */}
      <div className="space-y-2">
        <Label htmlFor="loading-text">{loadingCopy?.textLabel || 'Texto'}</Label>
        <Input
          id="loading-text"
          type="text"
          value={config.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={loadingCopy?.textPlaceholder || 'Analisando suas respostas...'}
        />
      </div>

      {/* Style selector */}
      <div className="space-y-2">
        <SectionTitle>{loadingCopy?.styleTitle || 'Estilo do indicador'}</SectionTitle>
        <div
          role="group"
          aria-label={loadingCopy?.styleTitle || 'Loading style'}
          className="flex items-center gap-1 bg-muted rounded-lg p-1"
        >
          <StyleButton
            style="bar"
            currentStyle={style}
            label={loadingCopy?.styleBar || 'Barra'}
            icon={<Minus className="h-4 w-4" />}
            onClick={() => onChange({ style: 'bar' })}
          />
          <StyleButton
            style="circle"
            currentStyle={style}
            label={loadingCopy?.styleCircle || 'Círculo'}
            icon={<Circle className="h-4 w-4" />}
            onClick={() => onChange({ style: 'circle' })}
          />
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="loading-duration">{loadingCopy?.durationLabel || 'Duração (segundos)'}</Label>
        <Input
          id="loading-duration"
          type="number"
          min={1}
          max={30}
          value={config.duration ?? ''}
          onChange={(e) => {
            const value = e.target.value
            // Allow empty input while typing
            if (value === '') {
              onChange({ duration: undefined })
              return
            }
            const parsed = parseInt(value, 10)
            if (!isNaN(parsed)) {
              onChange({ duration: Math.max(1, Math.min(30, parsed)) })
            }
          }}
          onBlur={(e) => {
            // Set default on blur if empty
            if (!e.target.value || e.target.value === '') {
              onChange({ duration: 3 })
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          {loadingCopy?.durationHint || 'Tempo que a tela de carregamento será exibida antes de avançar.'}
        </p>
      </div>
    </div>
  )
}

interface StyleButtonProps {
  style: LoadingStyle
  currentStyle: LoadingStyle
  label: string
  icon: React.ReactNode
  onClick: () => void
}

function StyleButton({ style, currentStyle, label, icon, onClick }: StyleButtonProps) {
  const isActive = currentStyle === style

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
