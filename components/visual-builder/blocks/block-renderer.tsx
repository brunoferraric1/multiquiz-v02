'use client'

import { Block, BlockType } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { HeaderBlockPreview } from './header-block'
import { TextBlockPreview } from './text-block'
import { MediaBlockPreview } from './media-block'
import { OptionsBlockPreview } from './options-block'
import { FieldsBlockPreview } from './fields-block'
import { PriceBlockPreview } from './price-block'
import { ButtonBlockPreview } from './button-block'
import { BannerBlockPreview } from './banner-block'
import { ListBlockPreview } from './list-block'

interface BlockRendererProps {
  block: Block
  isSelected?: boolean
  onClick?: () => void
}

/**
 * BlockRenderer - Renders a block based on its type
 *
 * This component acts as a switch to render the appropriate block preview
 * based on the block type. It handles selection state and click events.
 */
export function BlockRenderer({ block, isSelected, onClick }: BlockRendererProps) {
  // Render the appropriate block component based on type
  const renderBlockContent = () => {
    switch (block.type) {
      case 'header':
        return <HeaderBlockPreview config={block.config} enabled={block.enabled} />
      case 'text':
        return <TextBlockPreview config={block.config} enabled={block.enabled} />
      case 'media':
        return <MediaBlockPreview config={block.config} enabled={block.enabled} />
      case 'options':
        return <OptionsBlockPreview config={block.config} enabled={block.enabled} />
      case 'fields':
        return <FieldsBlockPreview config={block.config} enabled={block.enabled} />
      case 'price':
        return <PriceBlockPreview config={block.config} enabled={block.enabled} />
      case 'button':
        return <ButtonBlockPreview config={block.config} enabled={block.enabled} />
      case 'banner':
        return <BannerBlockPreview config={block.config} enabled={block.enabled} />
      case 'list':
        return <ListBlockPreview config={block.config} enabled={block.enabled} />
      default:
        return <div className="p-4 text-muted-foreground">Unknown block type</div>
    }
  }

  // Don't render disabled blocks (they show as placeholder)
  if (!block.enabled) {
    return (
      <div
        data-testid={`block-${block.id}`}
        data-block-type={block.type}
        data-block-enabled="false"
        className={cn(
          'relative rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 transition-all cursor-pointer',
          isSelected && 'ring-2 ring-primary border-primary/30'
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
        <div className="p-3 text-center text-sm text-muted-foreground/60">
          {getBlockLabel(block.type)} (desativado)
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid={`block-${block.id}`}
      data-block-type={block.type}
      data-block-enabled="true"
      className={cn(
        'relative rounded-lg border transition-all cursor-pointer group',
        isSelected
          ? 'ring-2 ring-primary border-primary/30 bg-primary/5'
          : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/30'
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
      {renderBlockContent()}
    </div>
  )
}

// Helper function to get block label
function getBlockLabel(type: BlockType): string {
  const labels: Record<BlockType, string> = {
    header: 'Cabeçalho',
    text: 'Texto',
    media: 'Mídia',
    options: 'Opções',
    fields: 'Campos',
    price: 'Preço',
    button: 'Botão',
    banner: 'Banner',
    list: 'Lista',
  }
  return labels[type]
}

export { getBlockLabel }
