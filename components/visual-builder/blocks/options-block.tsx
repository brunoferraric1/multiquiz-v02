'use client'

import { OptionsConfig, OptionsLayout } from '@/types/blocks'
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
 *
 * Layout modes:
 * - vertical: stacked options with small inline images on the left
 * - horizontal: side-by-side options (2 cols for 2, 3 cols for 3) with images on top
 * - grid: 2x2 or 3x2 grid with images on top
 */
export function OptionsBlockPreview({ config, enabled }: OptionsBlockPreviewProps) {
  const messages = useMessages()
  const optionsCopy = messages.visualBuilder.optionsEditor
  const { items, selectionType, layout = 'vertical', showImages } = config as OptionsConfig

  // Determine grid classes based on layout and item count
  // Mobile: max 2 columns for all layouts
  // Desktop: 2-3 columns depending on item count
  const getGridClasses = () => {
    if (layout === 'vertical') {
      return 'flex flex-col gap-3'
    }
    if (layout === 'horizontal') {
      const itemCount = items?.length || 0
      if (itemCount === 2) return 'grid grid-cols-2 gap-3'
      // 3 items: 2 cols on mobile, 3 cols on desktop
      if (itemCount === 3) return 'grid grid-cols-2 sm:grid-cols-3 gap-3'
      // 4+ items: always 2 cols
      return 'grid grid-cols-2 gap-3'
    }
    if (layout === 'grid') {
      const itemCount = items?.length || 0
      // Always max 2 cols on mobile, can be 3 on desktop for 5+ items
      if (itemCount <= 4) return 'grid grid-cols-2 gap-3'
      return 'grid grid-cols-2 sm:grid-cols-3 gap-3'
    }
    return 'flex flex-col gap-3'
  }

  // Check if we should show image on top (horizontal/grid layouts)
  const isImageOnTop = layout === 'horizontal' || layout === 'grid'

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
      <div className={getGridClasses()}>
        {items.map((item, index) => {
          const hasImage = showImages && item.imageUrl

          // Card layout for horizontal/grid with image on top
          if (isImageOnTop && hasImage) {
            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col rounded-xl overflow-hidden',
                  'bg-card border border-border/50',
                  'shadow-sm hover:shadow-md',
                  'hover:scale-[1.02] hover:border-primary/30',
                  'transition-all duration-200 ease-out',
                  'cursor-[var(--cursor-interactive)]'
                )}
              >
                {/* Image on top */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Content below */}
                <div className="flex items-center gap-3 p-4">
                  {selectionType === 'multiple' && (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  {item.emoji && <span className="text-lg">{item.emoji}</span>}
                  <span className="text-sm font-medium text-foreground">
                    {item.text || optionsCopy.optionPlaceholder.replace('{{index}}', String(index + 1))}
                  </span>
                </div>
              </div>
            )
          }

          // Default vertical layout (or horizontal/grid without image)
          return (
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
                <Square className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              {/* Inline image for vertical layout - positioned after checkbox */}
              {hasImage && !isImageOnTop && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {item.emoji && <span className="text-lg">{item.emoji}</span>}
              <span className="text-sm font-medium text-foreground">
                {item.text || optionsCopy.optionPlaceholder.replace('{{index}}', String(index + 1))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
