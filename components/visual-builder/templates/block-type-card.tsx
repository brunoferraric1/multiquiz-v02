'use client'

import { cn } from '@/lib/utils'

interface BlockTypeCardProps {
  icon: React.ReactNode
  label: string
  description?: string
  disabled?: boolean
  onClick?: () => void
}

/**
 * BlockTypeCard - Card component for block type selection
 *
 * Shows an icon and label for each block type.
 * Used in the AddBlockDialog for categorized block selection.
 */
export function BlockTypeCard({
  icon,
  label,
  description,
  disabled = false,
  onClick,
}: BlockTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:bg-muted/60 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md'
      )}
      aria-label={label}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
      {description && (
        <span className="text-[10px] text-muted-foreground text-center line-clamp-2">
          {description}
        </span>
      )}
    </button>
  )
}
