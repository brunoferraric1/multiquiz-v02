'use client'

import { ListConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface ListBlockPreviewProps {
  config: ListConfig
  enabled: boolean
}

/**
 * ListBlockPreview - Renders list block with items
 */
export function ListBlockPreview({ config, enabled }: ListBlockPreviewProps) {
  const messages = useMessages()
  const listCopy = messages.visualBuilder.listEditor
  const { items } = config as ListConfig

  if (!items || items.length === 0) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <ul className="space-y-2">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-muted-foreground/50" />
              </span>
              <span className="text-sm text-muted-foreground/50">
                {listCopy.itemPlaceholder.replace('{{index}}', String(i))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-start gap-2">
            <span className="w-5 h-5 shrink-0 flex items-center justify-center text-base">
              {item.emoji || <Check className="w-4 h-4 text-primary" />}
            </span>
            <span className="text-sm text-foreground">
              {item.text || listCopy.itemPlaceholder.replace('{{index}}', String(index + 1))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
