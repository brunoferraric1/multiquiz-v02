'use client'

import { HeaderConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'

interface HeaderBlockPreviewProps {
  config: HeaderConfig
  enabled: boolean
}

/**
 * HeaderBlockPreview - Renders header block with title and description
 */
export function HeaderBlockPreview({ config, enabled }: HeaderBlockPreviewProps) {
  const { title, description } = config as HeaderConfig

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      {title ? (
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      ) : (
        <h2 className="text-xl font-semibold text-muted-foreground/50">Título do cabeçalho</h2>
      )}
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground/50">Descrição opcional</p>
      )}
    </div>
  )
}
