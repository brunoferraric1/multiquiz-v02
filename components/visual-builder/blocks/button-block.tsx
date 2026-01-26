'use client'

import { useRef, useEffect, useState } from 'react'
import { ButtonConfig, Block } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface ButtonBlockPreviewProps {
  config: ButtonConfig
  enabled: boolean
  isEditing?: boolean
  onEdit?: (config: Partial<Block['config']>) => void
}

/**
 * ButtonBlockPreview - Renders button/CTA block
 *
 * Supports inline editing of button text when isEditing is true.
 */
export function ButtonBlockPreview({ config, enabled, isEditing, onEdit }: ButtonBlockPreviewProps) {
  const messages = useMessages()
  const buttonCopy = messages.visualBuilder.buttonEditor
  const blockTypes = messages.visualBuilder.blockTypes
  const { text, action } = config as ButtonConfig

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

  const getActionIcon = () => {
    switch (action) {
      case 'url':
        return <ExternalLink className="w-4 h-4" />
      default:
        return <ArrowRight className="w-4 h-4" />
    }
  }

  return (
    <div
      className={cn('p-4', !enabled && 'opacity-50')}
      onClick={isEditing ? (e) => e.stopPropagation() : undefined}
    >
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground pointer-events-none"
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localText}
            onChange={handleTextChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={blockTypes.button}
            className="flex-1 text-center bg-transparent border-none outline-none focus:ring-0 text-primary-foreground placeholder:text-primary-foreground/50 pointer-events-auto"
          />
        ) : (
          text || blockTypes.button
        )}
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
