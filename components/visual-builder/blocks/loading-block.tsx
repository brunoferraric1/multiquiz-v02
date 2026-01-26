'use client'

import { useRef, useEffect, useState } from 'react'
import { LoadingConfig, Block } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'

interface LoadingBlockPreviewProps {
  config: LoadingConfig
  enabled: boolean
  isEditing?: boolean
  onEdit?: (config: Partial<Block['config']>) => void
}

/**
 * LoadingBlockPreview - Static preview of loading indicator block for the editor
 *
 * Shows either a progress bar or circular progress with customizable text.
 * This is a static preview - animation only happens in live quiz/preview mode.
 * Supports inline editing of the loading text when isEditing is true.
 */
export function LoadingBlockPreview({ config, enabled, isEditing, onEdit }: LoadingBlockPreviewProps) {
  const messages = useMessages()
  const loadingCopy = messages.visualBuilder.loadingEditor
  const { text, style } = config

  const inputRef = useRef<HTMLInputElement>(null)
  const [localText, setLocalText] = useState(text || '')

  const displayText = text || loadingCopy?.textPlaceholder || 'Analisando...'

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

  return (
    <div
      className={cn('py-8 px-6', !enabled && 'opacity-50')}
      onClick={isEditing ? (e) => e.stopPropagation() : undefined}
      onKeyDown={isEditing ? (e) => e.stopPropagation() : undefined}
    >
      <div className="flex flex-col items-center justify-center gap-5 text-center">
        {/* Loading indicator - static at ~50% for preview */}
        {style === 'bar' ? (
          <BarIndicator />
        ) : (
          <CircleIndicator />
        )}

        {/* Text - editable or static */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localText}
            onChange={handleTextChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={loadingCopy?.textPlaceholder || 'Analisando...'}
            className="text-base text-muted-foreground font-medium text-center bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50 w-full"
          />
        ) : (
          <p className="text-base text-muted-foreground font-medium">{displayText}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Bar progress indicator - static preview at 50%
 */
function BarIndicator() {
  return (
    <div className="w-full max-w-sm">
      <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden border border-border/30">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: '50%' }}
        />
      </div>
    </div>
  )
}

/**
 * Circle progress indicator - static preview at 50%
 */
function CircleIndicator() {
  const circumference = 2 * Math.PI * 20
  const strokeDashoffset = circumference * 0.5 // 50% progress

  return (
    <div className="relative w-16 h-16">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          className="stroke-muted/50"
          strokeWidth="4"
        />
        {/* Progress circle at 50% */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    </div>
  )
}
