'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'
import { GripVertical, MoreVertical, Copy, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SortableSidebarItemProps {
  id: string
  isActive: boolean
  onSelect: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  disabled?: boolean
  canDelete?: boolean
  icon?: React.ReactNode
  title: string
  subtitle?: string
  'data-testid'?: string
}

/**
 * SortableSidebarItem - Reusable draggable sidebar item
 *
 * Used for both Steps and Outcomes in the sidebar.
 * Has a dedicated drag handle separate from the click area for smooth UX.
 * Visual style matches list-block-editor for consistency.
 */
export function SortableSidebarItem({
  id,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  disabled = false,
  canDelete = true,
  icon,
  title,
  subtitle,
  'data-testid': testId,
}: SortableSidebarItemProps) {
  const messages = useMessages()
  const itemActions = messages.visualBuilder.itemActions
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasActions = !disabled && (onDuplicate || onDelete)
  const dragLabel = itemActions.drag.replace('{{title}}', title)
  const optionsLabel = itemActions.optionsFor.replace('{{title}}', title)

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={testId}
      className={cn(
        'p-2 rounded-lg transition-colors',
        isDragging && 'opacity-50 z-50',
        isActive
          ? 'bg-primary/10 border border-primary/30'
          : 'bg-muted/50 border border-transparent hover:bg-muted/80'
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle - always visible */}
        {!disabled && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
            {...attributes}
            {...listeners}
            aria-label={dragLabel}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Icon badge (optional) */}
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium shrink-0',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {icon}
          </div>
        )}

        {/* Clickable content area */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={isActive}
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect()
            }
          }}
          className="flex-1 min-w-0"
        >
          <div
            className={cn(
              'text-sm font-medium truncate',
              isActive ? 'text-primary' : 'text-foreground'
            )}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>

        {/* Actions menu - always visible */}
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 text-muted-foreground hover:text-foreground shrink-0 rounded hover:bg-muted/80"
                aria-label={optionsLabel}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate()
                  }}
                  className="cursor-[var(--cursor-interactive)]"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {itemActions.duplicate}
                </DropdownMenuItem>
              )}
              {onDelete && canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="cursor-[var(--cursor-interactive)] text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {itemActions.delete}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
