'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import { SectionTitle } from '@/components/ui/section-title'
import { ListConfig, ListItem } from '@/types/blocks'
import { Trash2, GripVertical } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'
import type { Messages } from '@/lib/i18n/messages'

type ListCopy = Messages['visualBuilder']['listEditor']

interface ListBlockEditorProps {
  config: ListConfig
  onChange: (config: Partial<ListConfig>) => void
}

interface SortableListItemProps {
  item: ListItem
  index: number
  onUpdate: (updates: Partial<ListItem>) => void
  onDelete: () => void
  listCopy: ListCopy
}

function SortableListItem({
  item,
  index,
  onUpdate,
  onDelete,
  listCopy,
}: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg bg-muted/50 ${isDragging ? 'opacity-50 z-50' : ''}`}
      data-testid={`list-item-${index}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
          {...attributes}
          {...listeners}
          aria-label={listCopy.dragItem.replace('{{index}}', String(index + 1))}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Emoji input */}
        <Input
          value={item.emoji || ''}
          onChange={(e) => onUpdate({ emoji: e.target.value })}
          placeholder={listCopy.emojiPlaceholder}
          maxLength={4}
          className="w-12 text-center px-1 shrink-0"
          aria-label={listCopy.emojiAria.replace('{{index}}', String(index + 1))}
        />

        {/* Text input */}
        <div className="flex-1">
          <Input
            value={item.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder={listCopy.itemPlaceholder.replace('{{index}}', String(index + 1))}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label={listCopy.removeItem.replace('{{index}}', String(index + 1))}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function ListBlockEditor({ config, onChange }: ListBlockEditorProps) {
  const messages = useMessages()
  const listCopy = messages.visualBuilder.listEditor
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddItem = () => {
    const newItem: ListItem = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: '',
      emoji: listCopy.emojiPlaceholder,
    }

    onChange({
      items: [...(config.items || []), newItem],
    })
  }

  const handleUpdateItem = (itemId: string, updates: Partial<ListItem>) => {
    onChange({
      items: (config.items || []).map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    })
  }

  const handleDeleteItem = (itemId: string) => {
    onChange({
      items: (config.items || []).filter((item) => item.id !== itemId),
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const items = config.items || []
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      onChange({
        items: arrayMove(items, oldIndex, newIndex),
      })
    }
  }

  const items = config.items || []

  return (
    <div className="space-y-4" data-testid="list-block-editor">
      <SectionTitle>{listCopy.title}</SectionTitle>

      {/* List items with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableListItem
                key={item.id}
                item={item}
                index={index}
                onUpdate={(updates) => handleUpdateItem(item.id, updates)}
                onDelete={() => handleDeleteItem(item.id)}
                listCopy={listCopy}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add new item button */}
      <GhostAddButton
        size="compact"
        onClick={handleAddItem}
        data-testid="add-list-item-button"
      >
        {listCopy.addItem}
      </GhostAddButton>

      <p className="text-xs text-muted-foreground">
        {listCopy.hint}
      </p>
    </div>
  )
}
