'use client'

import { useRef, useEffect, useState } from 'react'
import { HeaderConfig, Block } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'

interface HeaderBlockPreviewProps {
  config: HeaderConfig
  enabled: boolean
  isEditing?: boolean
  onEdit?: (config: Partial<Block['config']>) => void
}

/**
 * HeaderBlockPreview - Renders header block with title and description
 *
 * Supports inline editing when isEditing is true. Double-click the block
 * to enter edit mode, then type directly in the preview.
 */
export function HeaderBlockPreview({ config, enabled, isEditing, onEdit }: HeaderBlockPreviewProps) {
  const messages = useMessages()
  const headerCopy = messages.visualBuilder.headerEditor
  const { title, description } = config as HeaderConfig

  const titleInputRef = useRef<HTMLInputElement>(null)
  const [localTitle, setLocalTitle] = useState(title || '')
  const [localDescription, setLocalDescription] = useState(description || '')

  // Sync local state when config changes from external source (like sidebar)
  useEffect(() => {
    setLocalTitle(title || '')
    setLocalDescription(description || '')
  }, [title, description])

  // Auto-focus title input when entering edit mode
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditing])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalDescription(e.target.value)
  }

  const handleSave = () => {
    onEdit?.({ title: localTitle, description: localDescription })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      // Reset to original values
      setLocalTitle(title || '')
      setLocalDescription(description || '')
    }
  }

  // Editing mode - show input fields
  if (isEditing) {
    return (
      <div
        className={cn('p-4 text-center', !enabled && 'opacity-50')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          ref={titleInputRef}
          type="text"
          value={localTitle}
          onChange={handleTitleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={headerCopy.titlePlaceholder}
          className={cn(
            'w-full py-1 text-xl font-semibold text-center bg-transparent border-none outline-none',
            'focus:ring-0 placeholder:text-muted-foreground/50',
            localTitle ? 'text-foreground' : 'text-muted-foreground/50'
          )}
        />
        <input
          type="text"
          value={localDescription}
          onChange={handleDescriptionChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={headerCopy.descriptionPlaceholder}
          className={cn(
            'w-full py-1 mt-1 text-sm text-center bg-transparent border-none outline-none',
            'focus:ring-0 placeholder:text-muted-foreground/50',
            localDescription ? 'text-muted-foreground' : 'text-muted-foreground/50'
          )}
        />
      </div>
    )
  }

  // Read-only mode - show static text
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
