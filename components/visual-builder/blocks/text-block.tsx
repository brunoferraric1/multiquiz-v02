'use client'

import { TextConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'

interface TextBlockPreviewProps {
  config: TextConfig
  enabled: boolean
}

/**
 * TextBlockPreview - Renders text block with rich text content
 */
export function TextBlockPreview({ config, enabled }: TextBlockPreviewProps) {
  const { content } = config as TextConfig

  // Check if content is empty or just whitespace/empty tags
  const isEmpty = !content || content === '<p></p>' || content.trim() === ''

  if (isEmpty) {
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <p className="text-sm text-muted-foreground/50">Adicione texto aqui...</p>
      </div>
    )
  }

  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['style'],
  })

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div
        className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  )
}
