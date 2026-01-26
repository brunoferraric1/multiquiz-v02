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
 * - Icon in circular container with bounce animation
 * - Soft yellow background tint
 * - Icon turns primary yellow on hover
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
        'group relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all duration-200',
        'bg-primary/[0.03] border-primary/10',
        'cursor-pointer hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/[0.08] hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'rounded-xl p-3 transition-all duration-200',
          'bg-muted text-muted-foreground',
          'group-hover:bg-primary/20 group-hover:text-primary group-hover:animate-bounce-subtle'
        )}
      >
        {icon}
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
