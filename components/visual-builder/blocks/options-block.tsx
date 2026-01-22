'use client'

import { OptionsConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Square } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface OptionsBlockPreviewProps {
  config: OptionsConfig
  enabled: boolean
}

/**
 * OptionsBlockPreview - Renders options block with selectable items
 * Uses card style with shadow and scale effect to differentiate from input fields
 * Only shows checkbox icon for multiple selection type
 */
export function OptionsBlockPreview({ config, enabled }: OptionsBlockPreviewProps) {
  const messages = useMessages()
  const optionsCopy = messages.visualBuilder.optionsEditor
  const { items, selectionType } = config as OptionsConfig

  if (!items || items.length === 0) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-muted-foreground/30 bg-card/50"
            >
              {selectionType === 'multiple' && (
                <Square className="w-4 h-4 text-muted-foreground/50" />
              )}
              <span className="text-sm text-muted-foreground/50">
                {optionsCopy.optionPlaceholder.replace('{{index}}', String(i))}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl',
              'bg-card border border-border/50',
              'shadow-sm hover:shadow-md',
              'hover:scale-[1.02] hover:border-primary/30',
              'transition-all duration-200 ease-out',
              'cursor-[var(--cursor-interactive)]'
            )}
          >
            {selectionType === 'multiple' && (
              <Square className="w-4 h-4 text-muted-foreground" />
            )}
            {item.emoji && <span className="text-lg">{item.emoji}</span>}
            <span className="text-sm font-medium text-foreground">
              {item.text || optionsCopy.optionPlaceholder.replace('{{index}}', String(index + 1))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
