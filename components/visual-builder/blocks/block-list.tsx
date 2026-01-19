'use client'

import { Block } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { BlockRenderer } from './block-renderer'
import { InsertionPoint } from './insertion-point'

interface BlockListProps {
  blocks: Block[]
  selectedBlockId?: string
  onBlockSelect?: (blockId: string) => void
  onDeleteBlock?: (blockId: string) => void
  onInsertBlock?: (index: number) => void
  className?: string
}

/**
 * BlockList - Renders a list of blocks with selection and insertion points
 *
 * Features:
 * - Renders all blocks using BlockRenderer
 * - Highlights selected block
 * - Shows insertion points between blocks
 * - Handles block selection via clicks
 */
export function BlockList({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onDeleteBlock,
  onInsertBlock,
  className,
}: BlockListProps) {
  if (blocks.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <p className="text-sm text-muted-foreground">Nenhum bloco adicionado</p>
        {onInsertBlock && (
          <InsertionPoint
            index={0}
            onClick={() => onInsertBlock(0)}
            className="mt-4"
            showAlways
          />
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', className)} data-testid="block-list">
      {/* Insertion point at the beginning */}
      {onInsertBlock && (
        <InsertionPoint
          index={0}
          onClick={() => onInsertBlock(0)}
        />
      )}

      {blocks.map((block, index) => (
        <div key={block.id}>
          <BlockRenderer
            block={block}
            isSelected={selectedBlockId === block.id}
            onClick={() => onBlockSelect?.(block.id)}
            onDelete={onDeleteBlock ? () => onDeleteBlock(block.id) : undefined}
          />

          {/* Insertion point after each block */}
          {onInsertBlock && (
            <InsertionPoint
              index={index + 1}
              onClick={() => onInsertBlock(index + 1)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
