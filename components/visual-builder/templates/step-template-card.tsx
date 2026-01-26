'use client'

import { cn } from '@/lib/utils'
import { StepTemplatePreview, StepTemplate } from './step-template-preview'

interface StepTemplateCardProps {
  template: StepTemplate
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
}

/**
 * StepTemplateCard - Card component for step template selection
 *
 * Following the MethodCard pattern from CreateQuizModal with:
 * - Elevated card with hover:-translate-y-1 hover:shadow-lg
 * - Icon in bg-primary/10 circular container with bounce animation
 * - Title + description text
 * - Mini wireframe preview showing block arrangement
 */
export function StepTemplateCard({
  template,
  icon,
  title,
  description,
  onClick,
}: StepTemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all duration-200',
        'cursor-pointer hover:-translate-y-1 hover:border-primary/50 hover:bg-muted/50 hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      {/* Icon */}
      <div className="rounded-xl bg-primary/10 p-2.5 transition-transform duration-200 group-hover:animate-bounce-subtle">
        <div className="text-primary">{icon}</div>
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>

      {/* Wireframe preview */}
      <StepTemplatePreview template={template} />
    </button>
  )
}
