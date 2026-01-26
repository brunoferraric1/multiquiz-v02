'use client'

import { PriceConfig, PriceItem } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Circle, Square } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface PriceBlockPreviewProps {
  config: PriceConfig
  enabled: boolean
}

interface PriceCardProps {
  price: PriceItem
  selectionType: 'single' | 'multiple'
  showSelection: boolean
  fallbackTitle: string
  fallbackValue: string
}

function PriceCard({
  price,
  selectionType,
  showSelection,
  fallbackTitle,
  fallbackValue,
}: PriceCardProps) {
  const hasHighlight = price.showHighlight && !!price.highlightText
  const hasOriginalPrice = price.showOriginalPrice && !!price.originalPrice
  const hasRedirectUrl = !!price.redirectUrl

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        'bg-card border border-border/50',
        'shadow-sm transition-all duration-200 ease-out',
        hasRedirectUrl && [
          'hover:shadow-md',
          'hover:scale-[1.01] hover:border-primary/30',
          'cursor-[var(--cursor-interactive)]',
        ],
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
            {price.title || fallbackTitle}
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
            <p className="text-sm">
              <span className="text-muted-foreground">de </span>
              <span className="line-through text-red-600/80 dark:text-red-300/60">{price.originalPrice}</span>
              <span className="text-muted-foreground"> por:</span>
            </p>
          )}

          {/* Main price */}
          <p className={cn(
            "text-xl font-bold",
            hasOriginalPrice ? "text-green-600 dark:text-green-400" : "text-foreground"
          )}>
            {price.value || fallbackValue}
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
  const messages = useMessages()
  const priceCopy = messages.visualBuilder.priceEditor
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
                <span className="text-sm text-muted-foreground/50">
                  {priceCopy.priceFallbackTitle.replace('{{index}}', String(i))}
                </span>
              </div>
              <span className="text-lg font-bold text-muted-foreground/50">
                {priceCopy.priceFallbackValue}
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
        {items.map((price, index) => (
          <PriceCard
            key={price.id}
            price={price}
            selectionType={selectionType}
            showSelection={showSelection}
            fallbackTitle={priceCopy.priceFallbackTitle.replace('{{index}}', String(index + 1))}
            fallbackValue={priceCopy.priceFallbackValue}
          />
        ))}
      </div>
    </div>
  )
}
