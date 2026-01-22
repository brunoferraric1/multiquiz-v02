'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface SettingsSectionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  disabled?: boolean
  badge?: string // e.g., "Em breve"
}

/**
 * SettingsSectionCard - A clickable card for navigating to settings sub-pages
 *
 * @example
 * <SettingsSectionCard
 *   icon={<Palette className="h-5 w-5" />}
 *   title="Temas"
 *   description="Personalize cores e logo para seus quizzes"
 *   href="/dashboard/settings/themes"
 * />
 */
export function SettingsSectionCard({
  icon,
  title,
  description,
  href,
  disabled = false,
  badge,
}: SettingsSectionCardProps) {
  const content = (
    <>
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
          disabled ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        )}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium',
              disabled ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {title}
          </span>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
      </div>

      {/* Arrow */}
      <ChevronRight
        className={cn(
          'h-5 w-5 shrink-0 transition-transform',
          disabled ? 'text-muted-foreground/50' : 'text-muted-foreground group-hover:translate-x-0.5'
        )}
      />
    </>
  )

  const baseClassName = cn(
    'group flex items-center gap-4 p-4 rounded-lg border transition-colors',
    disabled
      ? 'bg-muted/30 border-border cursor-not-allowed'
      : 'bg-card border-border hover:border-primary/50 hover:bg-muted/50'
  )

  if (disabled) {
    return <div className={baseClassName}>{content}</div>
  }

  return (
    <Link href={href} className={baseClassName}>
      {content}
    </Link>
  )
}
