'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface InstantTooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
  wrapperClassName?: string
}

/**
 * InstantTooltip - A tooltip that appears immediately on hover (no delay)
 *
 * Unlike the browser's native title attribute, this tooltip:
 * - Appears instantly on hover
 * - Has consistent styling across browsers
 * - Supports custom positioning
 * - Renders via portal to ensure proper positioning in modals
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
  className,
  wrapperClassName
}: InstantTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Only render portal on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        // Estimate tooltip width (will be corrected after render)
        const tooltipWidth = tooltipRef.current?.offsetWidth || 100

        // Center horizontally relative to trigger
        let x = triggerRect.left + (triggerRect.width - tooltipWidth) / 2

        // Keep tooltip within viewport
        const padding = 8
        x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding))

        // Position above or below
        const tooltipHeight = tooltipRef.current?.offsetHeight || 32
        const y = side === 'top'
          ? triggerRect.top - tooltipHeight - 8
          : triggerRect.bottom + 8

        setPosition({ x, y })
      }

      // Initial position
      updatePosition()

      // Recalculate after tooltip renders to get accurate width
      requestAnimationFrame(updatePosition)
    } else {
      setPosition(null)
    }
  }, [isVisible, side])

  const tooltip = isVisible && position && isMounted ? (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[9999] px-2.5 py-1.5 text-xs font-medium rounded-md',
        'bg-foreground text-background',
        'shadow-lg pointer-events-none',
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
  ) : null

  return (
    <div
      ref={triggerRef}
      className={cn('inline-flex', wrapperClassName)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isMounted && tooltip && createPortal(tooltip, document.body)}
    </div>
  )
}
