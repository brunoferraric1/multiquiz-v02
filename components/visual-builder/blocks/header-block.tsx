'use client'

import { HeaderConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'

interface HeaderBlockPreviewProps {
  config: HeaderConfig
  enabled: boolean
}

/**
 * HeaderBlockPreview - Renders header block with title and description
 */
export function HeaderBlockPreview({ config, enabled }: HeaderBlockPreviewProps) {
  const messages = useMessages()
  const headerCopy = messages.visualBuilder.headerEditor
  const { title, description } = config as HeaderConfig

  return (
    <div className={cn('p-4 text-center', !enabled && 'opacity-50')}>
      {title ? (
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      ) : (
        <h2 className="text-xl font-semibold text-muted-foreground/50">
          {headerCopy.titlePlaceholder}
        </h2>
      )}
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground/50">
          {headerCopy.descriptionPlaceholder}
        </p>
      )}
    </div>
  )
}
