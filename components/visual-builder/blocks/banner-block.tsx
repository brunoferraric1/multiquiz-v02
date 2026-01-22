'use client'

import { BannerConfig, BannerUrgency } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface BannerBlockPreviewProps {
  config: BannerConfig
  enabled: boolean
}

// Urgency level styles
const urgencyStyles: Record<BannerUrgency, { bg: string; border: string; text: string; icon: typeof Info }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: Info,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: AlertCircle,
  },
}

/**
 * BannerBlockPreview - Renders banner/alert block
 */
export function BannerBlockPreview({ config, enabled }: BannerBlockPreviewProps) {
  const messages = useMessages()
  const bannerCopy = messages.visualBuilder.bannerEditor
  const { urgency, text, emoji } = config as BannerConfig
  const style = urgencyStyles[urgency] || urgencyStyles.info
  const Icon = style.icon

  // Render icon or emoji
  const renderIcon = () => {
    if (emoji) {
      return <span className="text-lg shrink-0">{emoji}</span>
    }
    return <Icon className={cn('w-5 h-5 shrink-0', style.text)} />
  }

  if (!text) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className={cn('flex items-center justify-center gap-3 rounded-lg border p-3', style.bg, style.border)}>
          {renderIcon()}
          <p className={cn('text-sm', style.text, 'opacity-50')}>
            {bannerCopy.messagePlaceholder}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div className={cn('flex items-center justify-center gap-3 rounded-lg border p-3', style.bg, style.border)}>
        {renderIcon()}
        <p className={cn('text-sm', style.text)}>{text}</p>
      </div>
    </div>
  )
}
