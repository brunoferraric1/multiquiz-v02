'use client'

import { useRef, useEffect, useState } from 'react'
import { BannerConfig, BannerUrgency, Block } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface BannerBlockPreviewProps {
  config: BannerConfig
  enabled: boolean
  isEditing?: boolean
  onEdit?: (config: Partial<Block['config']>) => void
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
 *
 * Supports inline editing of banner text when isEditing is true.
 */
export function BannerBlockPreview({ config, enabled, isEditing, onEdit }: BannerBlockPreviewProps) {
  const messages = useMessages()
  const bannerCopy = messages.visualBuilder.bannerEditor
  const { urgency, text, emoji } = config as BannerConfig
  const style = urgencyStyles[urgency] || urgencyStyles.info
  const Icon = style.icon

  const inputRef = useRef<HTMLInputElement>(null)
  const [localText, setLocalText] = useState(text || '')

  // Sync local state when config changes from external source
  useEffect(() => {
    setLocalText(text || '')
  }, [text])

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value)
  }

  const handleSave = () => {
    onEdit?.({ text: localText })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setLocalText(text || '')
    }
  }

  // Render icon or emoji
  const renderIcon = () => {
    if (emoji) {
      return <span className="text-lg shrink-0">{emoji}</span>
    }
    return <Icon className={cn('w-5 h-5 shrink-0', style.text)} />
  }

  return (
    <div
      className={cn('p-4', !enabled && 'opacity-50')}
      onClick={isEditing ? (e) => e.stopPropagation() : undefined}
      onKeyDown={isEditing ? (e) => e.stopPropagation() : undefined}
    >
      <div className={cn('flex items-center justify-center gap-3 rounded-lg border p-3', style.bg, style.border)}>
        {renderIcon()}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localText}
            onChange={handleTextChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={bannerCopy.messagePlaceholder}
            className={cn(
              'flex-1 text-sm bg-transparent border-none outline-none focus:ring-0',
              style.text,
              'placeholder:opacity-50'
            )}
          />
        ) : (
          <p className={cn('text-sm', style.text, !text && 'opacity-50')}>
            {text || bannerCopy.messagePlaceholder}
          </p>
        )}
      </div>
    </div>
  )
}
