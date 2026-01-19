'use client'

import { ListConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ListBlockPreviewProps {
  config: ListConfig
  enabled: boolean
}

/**
 * ListBlockPreview - Renders list block with items
 */
export function ListBlockPreview({ config, enabled }: ListBlockPreviewProps) {
  const { items } = config as ListConfig

  if (!items || items.length === 0) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <ul className="space-y-2">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground/50">Item da lista {i}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            {item.emoji ? (
              <span className="text-base">{item.emoji}</span>
            ) : (
              <Check className="w-4 h-4 text-primary" />
            )}
            <span className="text-sm text-foreground">{item.text || 'Item sem texto'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
