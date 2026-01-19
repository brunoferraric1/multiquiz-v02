'use client'

import { OptionsConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Circle, Square } from 'lucide-react'

interface OptionsBlockPreviewProps {
  config: OptionsConfig
  enabled: boolean
}

/**
 * OptionsBlockPreview - Renders options block with selectable items
 */
export function OptionsBlockPreview({ config, enabled }: OptionsBlockPreviewProps) {
  const { items, selectionType } = config as OptionsConfig

  if (!items || items.length === 0) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30"
            >
              {selectionType === 'multiple' ? (
                <Square className="w-4 h-4 text-muted-foreground/50" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/50" />
              )}
              <span className="text-sm text-muted-foreground/50">Opção {i}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors"
          >
            {selectionType === 'multiple' ? (
              <Square className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
            {item.emoji && <span className="text-lg">{item.emoji}</span>}
            <span className="text-sm text-foreground">{item.text || 'Opção sem texto'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
