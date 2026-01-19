'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleGroupOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

export interface ToggleGroupProps<T extends string> {
  options: ToggleGroupOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  'aria-label'?: string
}

/**
 * ToggleGroup - A compact segmented control for selecting between options
 * Used for media type, selection type, and other binary/ternary choices
 */
export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: ToggleGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('flex gap-1 p-1 rounded-lg bg-muted', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          data-testid={`toggle-${option.value}`}
        >
          {option.icon && (
            <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
              {option.icon}
            </span>
          )}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
