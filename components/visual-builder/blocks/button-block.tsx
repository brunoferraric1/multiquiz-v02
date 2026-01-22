'use client'

import { ButtonConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface ButtonBlockPreviewProps {
  config: ButtonConfig
  enabled: boolean
}

/**
 * ButtonBlockPreview - Renders button/CTA block
 */
export function ButtonBlockPreview({ config, enabled }: ButtonBlockPreviewProps) {
  const messages = useMessages()
  const buttonCopy = messages.visualBuilder.buttonEditor
  const blockTypes = messages.visualBuilder.blockTypes
  const { text, action } = config as ButtonConfig

  const getActionIcon = () => {
    switch (action) {
      case 'url':
        return <ExternalLink className="w-4 h-4" />
      default:
        return <ArrowRight className="w-4 h-4" />
    }
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        disabled
      >
        {text || blockTypes.button}
        {getActionIcon()}
      </button>
      {action === 'selected_price' && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          {buttonCopy.infoSelectedPrice}
        </p>
      )}
    </div>
  )
}
