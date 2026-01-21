'use client'

import { useId, useState, useEffect } from 'react'
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
} from '@dnd-kit/sortable'

interface SortableSidebarListProps<T> {
  items: T[]
  getItemId: (item: T) => string
  onReorder: (fromIndex: number, toIndex: number) => void
  children: React.ReactNode
  'data-testid'?: string
}

/**
 * SortableSidebarList - Wrapper component for draggable sidebar lists
 *
 * Handles all the DndContext setup with proper sensor configuration
 * for smooth drag and drop behavior.
 */
export function SortableSidebarList<T>({
  items,
  getItemId,
  onReorder,
  children,
  'data-testid': testId,
}: SortableSidebarListProps<T>) {
  const dndId = useId()
  const [isMounted, setIsMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sensors with distance constraint for smooth, intentional dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === active.id)
      const newIndex = items.findIndex((item) => getItemId(item) === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex)
      }
    }
  }

  const itemIds = items.map(getItemId)

  // Render without D&D until mounted (SSR safety)
  if (!isMounted) {
    return (
      <div data-testid={testId} className="space-y-1">
        {children}
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
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div data-testid={testId} className="space-y-1">
          {children}
        </div>
      </SortableContext>
    </DndContext>
  )
}
