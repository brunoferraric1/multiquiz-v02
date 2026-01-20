'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GhostAddButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  /** Size variant: default for panels/lists, compact for block detail views */
  size?: 'default' | 'compact'
}

/**
 * GhostAddButton - A reusable dotted border button for adding items
 * Used across the visual builder for adding blocks, steps, outcomes, etc.
 *
 * Sizes:
 * - default: Larger padding (p-3), for main panels like "Adicionar bloco"
 * - compact: Smaller padding (p-2), for inline use in block detail editors
 */
const GhostAddButton = React.forwardRef<HTMLButtonElement, GhostAddButtonProps>(
  ({ className, children, icon, size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-lg',
          'border-2 border-dashed border-muted-foreground/30',
          'text-primary',
          'hover:border-primary/50 hover:bg-primary/5',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-muted-foreground/30 disabled:hover:bg-transparent',
          size === 'default' && 'p-3 text-sm font-medium',
          size === 'compact' && 'p-2 text-xs font-medium',
          className
        )}
        {...props}
      >
        {icon || <Plus className={cn(size === 'default' ? 'w-4 h-4' : 'w-3.5 h-3.5')} />}
        {children}
      </button>
    )
  }
)
GhostAddButton.displayName = 'GhostAddButton'

export { GhostAddButton }
