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
        'group flex flex-col items-center gap-3 p-5 rounded-xl border transition-all',
        'bg-primary/[0.03] border-primary/10',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:bg-primary/[0.08] hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg'
      )}
      aria-label={label}
    >
      <div
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl transition-colors',
          'bg-muted text-muted-foreground',
          !disabled && 'group-hover:bg-primary/20 group-hover:text-primary'
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground text-center line-clamp-2">
          {description}
        </span>
      )}
    </button>
  )
}
