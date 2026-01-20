'use client'

import { PriceConfig, PriceItem } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Circle, Square } from 'lucide-react'

interface PriceBlockPreviewProps {
  config: PriceConfig
  enabled: boolean
}

interface PriceCardProps {
  price: PriceItem
  selectionType: 'single' | 'multiple'
  showSelection: boolean
}

function PriceCard({ price, selectionType, showSelection }: PriceCardProps) {
  const hasHighlight = price.showHighlight && !!price.highlightText
  const hasOriginalPrice = price.showOriginalPrice && !!price.originalPrice

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        'bg-card border border-border/50',
        'shadow-sm hover:shadow-md',
        'hover:scale-[1.01] hover:border-primary/30',
        'transition-all duration-200 ease-out',
        'cursor-pointer',
        hasHighlight && 'ring-2 ring-primary'
      )}
    >
      {/* Highlight banner */}
      {hasHighlight && (
        <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-1.5 px-3">
          {price.highlightText}
        </div>
      )}

      {/* Card content */}
      <div className="flex items-center justify-between p-4 gap-4">
        {/* Left side: checkbox/radio + title */}
        <div className="flex items-center gap-3 min-w-0">
          {showSelection && (
            <div className="shrink-0">
              {selectionType === 'multiple' ? (
                <Square className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          )}
          <span className="text-base font-medium text-foreground truncate">
            {price.title || 'Plano'}
          </span>
        </div>

        {/* Right side: price info */}
        <div className="text-right shrink-0">
          {/* Prefix (e.g., "10% off") */}
          {price.prefix && (
            <p className="text-xs text-muted-foreground">{price.prefix}</p>
          )}

          {/* Original price with "de X por:" format */}
          {hasOriginalPrice && (
            <p className="text-sm text-muted-foreground">
              <span>de </span>
              <span className="line-through">{price.originalPrice}</span>
              <span> por:</span>
            </p>
          )}

          {/* Main price */}
          <p className="text-xl font-bold text-foreground">
            {price.value || 'R$ 0,00'}
          </p>

          {/* Suffix (e.g., "à vista") */}
          {price.suffix && (
            <p className="text-xs text-muted-foreground">{price.suffix}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * PriceBlockPreview - Renders price cards with selection
 * Supports multiple price options like a pricing table
 */
export function PriceBlockPreview({ config, enabled }: PriceBlockPreviewProps) {
  const items = config.items || []
  const selectionType = config.selectionType || 'single'
  // Auto show selection only when there are 2+ items
  const showSelection = items.length > 1

  if (items.length === 0) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl border border-dashed border-muted-foreground/30 bg-card/50"
            >
              <div className="flex items-center gap-3">
                <Circle className="w-5 h-5 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground/50">Plano {i}</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground/50">R$ 0,00</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div className="space-y-3">
        {items.map((price) => (
          <PriceCard
            key={price.id}
            price={price}
            selectionType={selectionType}
            showSelection={showSelection}
          />
        ))}
      </div>
    </div>
  )
}
