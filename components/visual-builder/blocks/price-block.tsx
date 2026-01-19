'use client'

import { PriceConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'

interface PriceBlockPreviewProps {
  config: PriceConfig
  enabled: boolean
}

/**
 * PriceBlockPreview - Renders price display block
 */
export function PriceBlockPreview({ config, enabled }: PriceBlockPreviewProps) {
  const { productTitle, value, prefix, suffix, highlight } = config as PriceConfig

  const hasContent = productTitle || value

  if (!hasContent) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground/50">Nome do produto</p>
          <p className="mt-2 text-2xl font-bold text-muted-foreground/50">R$ 0,00</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div
        className={cn(
          'rounded-lg border p-4 text-center',
          highlight
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/20 bg-background'
        )}
      >
        {productTitle && (
          <p className={cn('text-sm', highlight ? 'text-primary font-medium' : 'text-muted-foreground')}>
            {productTitle}
          </p>
        )}
        <p className={cn('mt-2 text-2xl font-bold', highlight ? 'text-primary' : 'text-foreground')}>
          {prefix && <span className="text-lg font-normal">{prefix} </span>}
          {value || '0,00'}
          {suffix && <span className="text-lg font-normal"> {suffix}</span>}
        </p>
      </div>
    </div>
  )
}
