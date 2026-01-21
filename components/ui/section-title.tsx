import { cn } from '@/lib/utils'

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

/**
 * SectionTitle - Consistent section header for property panels and editors
 *
 * Used for labeling groups of controls in the visual builder sidebar and editors.
 * Includes proper spacing (mb-3) below the title.
 *
 * @example
 * <SectionTitle>Opções de preço</SectionTitle>
 */
export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <div className={cn('mb-3', className)}>
      <span className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
        {children}
      </span>
    </div>
  )
}
