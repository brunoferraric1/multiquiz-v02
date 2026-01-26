'use client'

import { useState, useEffect, useId } from 'react'
import { Block } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'
import { BlockRenderer } from './block-renderer'
import { InsertionPoint } from './insertion-point'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BlockListProps {
  blocks: Block[]
  selectedBlockId?: string
  editingBlockId?: string
  onBlockSelect?: (blockId: string) => void
  onBlockDoubleClick?: (blockId: string) => void
  onBlockEdit?: (blockId: string, config: Partial<Block['config']>) => void
  onDeleteBlock?: (blockId: string) => void
  onInsertBlock?: (index: number) => void
  onReorderBlocks?: (fromIndex: number, toIndex: number) => void
  className?: string
}

interface SortableBlockProps {
  block: Block
  index: number
  isSelected: boolean
  isEditing: boolean
  onBlockSelect?: (blockId: string) => void
  onBlockDoubleClick?: (blockId: string) => void
  onBlockEdit?: (blockId: string, config: Partial<Block['config']>) => void
  onDeleteBlock?: (blockId: string) => void
  onInsertBlock?: (index: number) => void
}

function SortableBlock({
  block,
  index,
  isSelected,
  isEditing,
  onBlockSelect,
  onBlockDoubleClick,
  onBlockEdit,
  onDeleteBlock,
  onInsertBlock,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Disable drag when editing to allow text selection
  const dragProps = isEditing ? {} : { ...attributes, ...listeners }

  return (
    <div ref={setNodeRef} style={style}>
      <BlockRenderer
        block={block}
        isSelected={isSelected}
        isEditing={isEditing}
        onClick={() => onBlockSelect?.(block.id)}
        onDoubleClick={() => onBlockDoubleClick?.(block.id)}
        onEdit={onBlockEdit ? (config) => onBlockEdit(block.id, config) : undefined}
        onDelete={onDeleteBlock ? () => onDeleteBlock(block.id) : undefined}
        dragHandleProps={dragProps}
        isDragging={isDragging}
      />

      {/* Insertion point after each block */}
      {onInsertBlock && (
        <InsertionPoint
          index={index + 1}
          onClick={() => onInsertBlock(index + 1)}
        />
      )}
    </div>
  )
}

/**
 * BlockList - Renders a list of blocks with selection and insertion points
 *
 * Features:
 * - Renders all blocks using BlockRenderer
 * - Highlights selected block
 * - Shows insertion points between blocks
 * - Handles block selection via clicks
 * - Supports drag and drop reordering
 */
export function BlockList({
  blocks,
  selectedBlockId,
  editingBlockId,
  onBlockSelect,
  onBlockDoubleClick,
  onBlockEdit,
  onDeleteBlock,
  onInsertBlock,
  onReorderBlocks,
  className,
}: BlockListProps) {
  const messages = useMessages()
  const copy = messages.visualBuilder
  // Use a stable ID for DnD context to avoid hydration mismatch
  const dndId = useId()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderBlocks?.(oldIndex, newIndex)
      }
    }
  }

  if (blocks.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <p className="text-sm text-muted-foreground">{copy.properties.emptyBlocks}</p>
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

  // Don't render DnD until client-side to avoid hydration mismatch
  if (!isMounted) {
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
              isEditing={editingBlockId === block.id}
              onClick={() => onBlockSelect?.(block.id)}
              onDoubleClick={() => onBlockDoubleClick?.(block.id)}
              onEdit={onBlockEdit ? (config) => onBlockEdit(block.id, config) : undefined}
              onDelete={onDeleteBlock ? () => onDeleteBlock(block.id) : undefined}
            />
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

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-0', className)} data-testid="block-list">
          {/* Insertion point at the beginning */}
          {onInsertBlock && (
            <InsertionPoint
              index={0}
              onClick={() => onInsertBlock(0)}
            />
          )}

          {blocks.map((block, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              index={index}
              isSelected={selectedBlockId === block.id}
              isEditing={editingBlockId === block.id}
              onBlockSelect={onBlockSelect}
              onBlockDoubleClick={onBlockDoubleClick}
              onBlockEdit={onBlockEdit}
              onDeleteBlock={onDeleteBlock}
              onInsertBlock={onInsertBlock}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
