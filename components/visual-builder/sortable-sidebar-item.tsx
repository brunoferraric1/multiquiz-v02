'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
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
  icon: React.ReactNode
  title: string
  subtitle?: string
  'data-testid'?: string
}

/**
 * SortableSidebarItem - Reusable draggable sidebar item
 *
 * Used for both Steps and Outcomes in the sidebar.
 * Has a dedicated drag handle separate from the click area for smooth UX.
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={testId}
      className={cn(
        'group relative rounded-lg transition-all',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 p-2 rounded-lg transition-all',
          isActive
            ? 'bg-primary/10 border border-primary/30'
            : 'hover:bg-muted/60 border border-transparent'
        )}
      >
        {/* Drag handle - separate from click area */}
        {!disabled && (
          <button
            type="button"
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 touch-none"
            {...attributes}
            {...listeners}
            aria-label={`Arrastar ${title}`}
          >
            <GripVertical className="w-4 h-4" />
          </button>
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
          className={cn(
            'flex-1 flex items-center gap-3 py-0.5 cursor-pointer min-w-0',
            disabled && 'pl-2'
          )}
        >
          {/* Icon badge */}
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

          {/* Text content */}
          <div className="flex-1 min-w-0 overflow-hidden">
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
        </div>

        {/* Actions menu */}
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 rounded hover:bg-muted"
                aria-label={`Opções para ${title}`}
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
                  className="cursor-pointer"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
              )}
              {onDelete && canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
