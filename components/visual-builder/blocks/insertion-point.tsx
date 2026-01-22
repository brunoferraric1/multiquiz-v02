'use client'

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface InsertionPointProps {
  index: number
  onClick: () => void
  className?: string
  showAlways?: boolean
}

/**
 * InsertionPoint - A clickable area to insert new blocks
 *
 * By default, shows a thin line that expands on hover to reveal the add button.
 * Use showAlways prop to always show the add button (useful for empty states).
 */
export function InsertionPoint({ index, onClick, className, showAlways }: InsertionPointProps) {
  const messages = useMessages()
  const addBlockCopy = messages.visualBuilder.addBlock
  return (
    <div
      className={cn(
        'group relative py-1',
        className
      )}
      data-testid={`insertion-point-${index}`}
    >
      {/* The clickable area */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full flex items-center justify-center transition-all',
          showAlways
            ? 'h-10 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
            : 'h-1 hover:h-6 bg-transparent hover:bg-primary/10 rounded'
        )}
        aria-label={addBlockCopy.title}
      >
        {/* Line indicator (hidden when showAlways) */}
        {!showAlways && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[80%] h-0.5 bg-transparent group-hover:bg-primary/30 transition-colors" />
        )}

        {/* Plus button */}
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-all',
            showAlways
              ? 'w-6 h-6'
              : 'w-0 h-0 opacity-0 group-hover:w-5 group-hover:h-5 group-hover:opacity-100'
          )}
        >
          <Plus className={cn(showAlways ? 'w-4 h-4' : 'w-3 h-3')} />
        </div>
      </button>
    </div>
  )
}
