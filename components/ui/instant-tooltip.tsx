'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InstantTooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

/**
 * InstantTooltip - A tooltip that appears immediately on hover (no delay)
 *
 * Unlike the browser's native title attribute, this tooltip:
 * - Appears instantly on hover
 * - Has consistent styling across browsers
 * - Supports custom positioning
 *
 * @example
 * <InstantTooltip content="Vertical layout">
 *   <button><RowsIcon /></button>
 * </InstantTooltip>
 */
export function InstantTooltip({
  content,
  children,
  side = 'top',
  className
}: InstantTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      // Center horizontally relative to trigger
      const x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2

      // Position above or below
      const y = side === 'top'
        ? triggerRect.top - tooltipRect.height - 6
        : triggerRect.bottom + 6

      setPosition({ x, y })
    }
  }, [isVisible, side])

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-2 py-1 text-xs font-medium rounded-md',
            'bg-foreground text-background',
            'shadow-md pointer-events-none',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            className
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 w-0 h-0',
              'border-l-4 border-r-4 border-transparent',
              side === 'top'
                ? 'bottom-0 translate-y-full border-t-4 border-t-foreground'
                : 'top-0 -translate-y-full border-b-4 border-b-foreground'
            )}
          />
        </div>
      )}
    </div>
  )
}
