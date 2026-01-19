'use client'

import { TextConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'

interface TextBlockPreviewProps {
  config: TextConfig
  enabled: boolean
}

/**
 * TextBlockPreview - Renders text block with content
 */
export function TextBlockPreview({ config, enabled }: TextBlockPreviewProps) {
  const { content } = config as TextConfig

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      {content ? (
        <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50">Adicione texto aqui...</p>
      )}
    </div>
  )
}
