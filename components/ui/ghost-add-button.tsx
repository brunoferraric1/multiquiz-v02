'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GhostAddButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
}

/**
 * GhostAddButton - A reusable dotted border button for adding items
 * Used across the visual builder for adding blocks, steps, outcomes, etc.
 */
const GhostAddButton = React.forwardRef<HTMLButtonElement, GhostAddButtonProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'w-full flex items-center justify-center gap-2 p-3 rounded-lg',
          'border-2 border-dashed border-muted-foreground/30',
          'text-sm text-muted-foreground',
          'hover:border-muted-foreground/50 hover:text-foreground hover:bg-muted/50',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-muted-foreground/30 disabled:hover:text-muted-foreground disabled:hover:bg-transparent',
          className
        )}
        {...props}
      >
        {icon || <Plus className="w-4 h-4" />}
        {children}
      </button>
    )
  }
)
GhostAddButton.displayName = 'GhostAddButton'

export { GhostAddButton }
