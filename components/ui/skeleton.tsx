'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton loading placeholder with pulse animation.
 * Use for indicating loading states in cards, text, and other UI elements.
 *
 * @example
 * <Skeleton className="h-4 w-[200px]" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      className={cn(
        'inline-block animate-pulse rounded-md bg-muted',
        className
      )}
    />
  )
}
