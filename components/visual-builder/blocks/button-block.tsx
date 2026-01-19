'use client'

import { ButtonConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { ArrowRight, ExternalLink } from 'lucide-react'

interface ButtonBlockPreviewProps {
  config: ButtonConfig
  enabled: boolean
}

/**
 * ButtonBlockPreview - Renders button/CTA block
 */
export function ButtonBlockPreview({ config, enabled }: ButtonBlockPreviewProps) {
  const { text, action } = config as ButtonConfig

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        disabled
      >
        {text || 'Botão'}
        {action === 'url' ? (
          <ExternalLink className="w-4 h-4" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
