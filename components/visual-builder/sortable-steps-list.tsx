'use client'

import { useMemo } from 'react'
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
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useVisualBuilderStore, Step, StepType } from '@/store/visual-builder-store'
import { Play, HelpCircle, Users, Gift, MoreVertical, Copy, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Step type icons
const stepTypeIcons: Record<StepType, React.ReactNode> = {
  intro: <Play className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  'lead-gen': <Users className="w-4 h-4" />,
  promo: <Gift className="w-4 h-4" />,
  result: null, // Result is not shown in this list
}

interface SortableStepItemProps {
  step: Step
  index: number
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SortableStepItem({ step, index, isActive, onSelect, onDelete, onDuplicate }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: step.isFixed })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const stepNumber = index + 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`step-item-${step.id}`}
      className={cn(
        'group relative rounded-lg transition-all',
        isDragging && 'opacity-50 z-50',
        !step.isFixed && 'cursor-grab active:cursor-grabbing'
      )}
      {...(!step.isFixed ? { ...attributes, ...listeners } : {})}
    >
      {/* Step content */}
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
          'flex items-start gap-3 p-2.5 rounded-lg transition-all text-left overflow-hidden',
          isActive
            ? 'bg-primary/10 border border-primary/30'
            : 'hover:bg-muted/60 border border-transparent',
          !step.isFixed && 'cursor-grab active:cursor-grabbing'
        )}
      >
        {/* Step icon badge */}
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium shrink-0',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {stepTypeIcons[step.type]}
        </div>

        {/* Step info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div
            className={cn(
              'text-sm font-medium truncate',
              isActive ? 'text-primary' : 'text-foreground'
            )}
          >
            {stepNumber}. {step.label}
          </div>
          {step.subtitle && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {step.subtitle}
            </div>
          )}
        </div>

        {/* Actions menu (not for fixed steps) */}
        {!step.isFixed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded hover:bg-muted"
                aria-label={`Options for ${step.label}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

/**
 * SortableStepsList - A drag-and-drop enabled list of steps
 *
 * Uses dnd-kit for drag and drop functionality.
 * Fixed steps (intro, result) cannot be dragged.
 * Steps cannot be moved before intro or after result.
 */
export function SortableStepsList() {
  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)

  // Get actions from store
  const setActiveStepId = useVisualBuilderStore((state) => state.setActiveStepId)
  const reorderSteps = useVisualBuilderStore((state) => state.reorderSteps)
  const deleteStep = useVisualBuilderStore((state) => state.deleteStep)
  const duplicateStep = useVisualBuilderStore((state) => state.duplicateStep)

  // Filter out result step (it's shown separately in the sidebar)
  const regularSteps = useMemo(
    () => steps.filter(s => s.type !== 'result'),
    [steps]
  )

  // Get IDs for sortable context
  const stepIds = useMemo(
    () => regularSteps.map(s => s.id),
    [regularSteps]
  )

  // Set up sensors for drag and drop
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
      const oldIndex = regularSteps.findIndex(s => s.id === active.id)
      const newIndex = regularSteps.findIndex(s => s.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        // Convert indices to full steps array indices (accounting for filtered result step)
        const fullOldIndex = steps.findIndex(s => s.id === active.id)
        const fullNewIndex = steps.findIndex(s => s.id === over.id)

        reorderSteps(fullOldIndex, fullNewIndex)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
        <div data-testid="steps-list" className="space-y-1">
          {regularSteps.map((step, index) => (
            <SortableStepItem
              key={step.id}
              step={step}
              index={index}
              isActive={activeStepId === step.id}
              onSelect={() => setActiveStepId(step.id)}
              onDelete={() => deleteStep(step.id)}
              onDuplicate={() => duplicateStep(step.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
