'use client'

import {
  Block,
  HeaderConfig,
  TextConfig,
  MediaConfig,
  OptionsConfig,
  FieldsConfig,
  PriceConfig,
  ButtonConfig,
  BannerConfig,
  ListConfig,
  LoadingConfig,
} from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'
import { HeaderBlockPreview } from './header-block'
import { TextBlockPreview } from './text-block'
import { MediaBlockPreview } from './media-block'
import { OptionsBlockPreview } from './options-block'
import { FieldsBlockPreview } from './fields-block'
import { PriceBlockPreview } from './price-block'
import { ButtonBlockPreview } from './button-block'
import { BannerBlockPreview } from './banner-block'
import { ListBlockPreview } from './list-block'
import { LoadingBlockPreview } from './loading-block'

interface BlockRendererProps {
  block: Block
  isSelected?: boolean
  onClick?: () => void
  onDelete?: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  isDragging?: boolean
}

/**
 * BlockRenderer - Renders a block based on its type
 *
 * This component acts as a switch to render the appropriate block preview
 * based on the block type. It handles selection state and click events.
 */
export function BlockRenderer({ block, isSelected, onClick, onDelete, dragHandleProps, isDragging }: BlockRendererProps) {
  const messages = useMessages()
  const copy = messages.visualBuilder
  // Check if media block has no content (show placeholder styling)
  const isEmptyMedia = block.type === 'media' && !(block.config as MediaConfig).url

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }

  // Render the appropriate block component based on type
  const renderBlockContent = () => {
    switch (block.type) {
      case 'header':
        return <HeaderBlockPreview config={block.config as HeaderConfig} enabled={block.enabled} />
      case 'text':
        return <TextBlockPreview config={block.config as TextConfig} enabled={block.enabled} />
      case 'media':
        return <MediaBlockPreview config={block.config as MediaConfig} enabled={block.enabled} />
      case 'options':
        return <OptionsBlockPreview config={block.config as OptionsConfig} enabled={block.enabled} />
      case 'fields':
        return <FieldsBlockPreview config={block.config as FieldsConfig} enabled={block.enabled} />
      case 'price':
        return <PriceBlockPreview config={block.config as PriceConfig} enabled={block.enabled} />
      case 'button':
        return <ButtonBlockPreview config={block.config as ButtonConfig} enabled={block.enabled} />
      case 'banner':
        return <BannerBlockPreview config={block.config as BannerConfig} enabled={block.enabled} />
      case 'list':
        return <ListBlockPreview config={block.config as ListConfig} enabled={block.enabled} />
      case 'loading':
        return <LoadingBlockPreview config={block.config as LoadingConfig} enabled={block.enabled} />
      default:
        return <div className="p-4 text-muted-foreground">Unknown block type</div>
    }
  }

  // For disabled blocks, show the actual content with reduced opacity
  // This allows blocks like media to show their proper placeholder
  if (!block.enabled) {
    return (
      <div
        data-testid={`block-${block.id}`}
        data-block-type={block.type}
        data-block-enabled="false"
        className={cn(
          'relative rounded-lg border border-dashed transition-all group',
          isDragging && 'opacity-50',
          isSelected
            ? 'ring-2 ring-primary border-primary/30'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/20'
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        {/* Drag handle - top left */}
        {dragHandleProps && (
          <div
            className={cn(
              'absolute -top-2 -left-2 z-10',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              isSelected && 'opacity-100'
            )}
          >
            <button
              type="button"
              className="p-1.5 rounded-md bg-muted-foreground/80 text-background hover:bg-muted-foreground transition-colors shadow-sm cursor-grab active:cursor-grabbing"
              aria-label={copy.itemActions.dragBlock}
              {...dragHandleProps}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Hover action buttons for disabled blocks too */}
        <div
          className={cn(
            'absolute -top-2 -right-2 flex items-center gap-1 z-10',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isSelected && 'opacity-100'
          )}
        >
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            aria-label={copy.itemActions.edit}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
              aria-label={copy.itemActions.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {renderBlockContent()}
      </div>
    )
  }

  return (
    <div
      data-testid={`block-${block.id}`}
      data-block-type={block.type}
      data-block-enabled="true"
      className={cn(
        'relative rounded-lg border transition-all group',
        isDragging && 'opacity-50',
        isSelected
          ? 'ring-2 ring-primary border-primary bg-primary/5'
          : isEmptyMedia
            ? 'border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/20'
            : 'border-transparent hover:border-muted-foreground/50 hover:bg-muted/20'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* Drag handle - top left */}
      {dragHandleProps && (
        <div
          className={cn(
            'absolute -top-2 -left-2 z-10',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isSelected && 'opacity-100'
          )}
        >
          <button
            type="button"
            className="p-1.5 rounded-md bg-muted-foreground/80 text-background hover:bg-muted-foreground transition-colors shadow-sm cursor-grab active:cursor-grabbing"
            aria-label={copy.itemActions.dragBlock}
            {...dragHandleProps}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hover action buttons */}
      <div
        className={cn(
          'absolute -top-2 -right-2 flex items-center gap-1 z-10',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        <button
          onClick={handleEdit}
          className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          aria-label={copy.itemActions.edit}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
            aria-label={copy.itemActions.delete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {renderBlockContent()}
    </div>
  )
}
