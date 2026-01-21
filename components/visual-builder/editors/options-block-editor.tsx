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
import { ToggleGroup } from '@/components/ui/toggle-group'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import { SectionTitle } from '@/components/ui/section-title'
import { OptionsConfig, OptionItem } from '@/types/blocks'
import type { Outcome } from '@/store/visual-builder-store'
import { Trash2, GripVertical, ArrowRight, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OptionsBlockEditorProps {
  config: OptionsConfig
  onChange: (config: Partial<OptionsConfig>) => void
  outcomes?: Outcome[]
  onCreateOutcome?: () => void
}

interface SortableOptionItemProps {
  option: OptionItem
  index: number
  outcomes: Outcome[]
  onUpdate: (updates: Partial<OptionItem>) => void
  onDelete: () => void
  onCreateOutcome?: () => void
  getOutcomeDisplayName: (outcome: Outcome, index: number) => string
}

function SortableOptionItem({
  option,
  index,
  outcomes,
  onUpdate,
  onDelete,
  onCreateOutcome,
  getOutcomeDisplayName,
}: SortableOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`space-y-2 p-3 rounded-lg bg-muted/50 ${isDragging ? 'opacity-50 z-50' : ''}`}
      data-testid={`option-item-${index}`}
    >
      {/* Option text row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar opção ${index + 1}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <Input
            value={option.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder={`Opção ${index + 1}`}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label={`Remover opção ${index + 1}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Outcome assignment row */}
      <div className="flex items-center gap-2 pl-6">
        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          Resultado:
        </span>
        {outcomes.length === 0 ? (
          <button
            type="button"
            onClick={onCreateOutcome}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-dashed border-primary/50 rounded text-xs text-primary hover:bg-primary/10 transition-colors"
            data-testid={`create-outcome-${index}`}
          >
            <Plus className="w-3 h-3" />
            Criar resultado
          </button>
        ) : (
          <Select
            value={option.outcomeId || 'none'}
            onValueChange={(value) =>
              onUpdate({ outcomeId: value === 'none' ? undefined : value })
            }
          >
            <SelectTrigger
              className="flex-1 h-8 text-xs"
              data-testid={`outcome-select-${index}`}
            >
              <SelectValue placeholder="Não vinculado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não vinculado</SelectItem>
              {outcomes.map((outcome, idx) => (
                <SelectItem key={outcome.id} value={outcome.id}>
                  {getOutcomeDisplayName(outcome, idx)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

export function OptionsBlockEditor({
  config,
  onChange,
  outcomes = [],
  onCreateOutcome,
}: OptionsBlockEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddOption = () => {
    const newOption: OptionItem = {
      id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: '',
    }

    onChange({
      items: [...(config.items || []), newOption],
    })
  }

  const handleUpdateOption = (optionId: string, updates: Partial<OptionItem>) => {
    onChange({
      items: (config.items || []).map((item) =>
        item.id === optionId ? { ...item, ...updates } : item
      ),
    })
  }

  const handleDeleteOption = (optionId: string) => {
    onChange({
      items: (config.items || []).filter((item) => item.id !== optionId),
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

  const getOutcomeDisplayName = (outcome: Outcome, index: number): string => {
    return outcome.name?.trim() || `Resultado ${index + 1}`
  }

  const items = config.items || []

  return (
    <div className="space-y-4" data-testid="options-block-editor">
      {/* Selection type */}
      <div>
        <SectionTitle>Tipo de seleção</SectionTitle>
        <ToggleGroup
          options={[
            { value: 'single', label: 'Única' },
            { value: 'multiple', label: 'Múltipla' },
          ]}
          value={config.selectionType}
          onChange={(selectionType) => onChange({ selectionType })}
          aria-label="Tipo de seleção"
        />
      </div>

      {/* Options list */}
      <div>
        <SectionTitle>Opções de resposta</SectionTitle>

        {/* Existing options with drag and drop */}
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
              {items.map((option, index) => (
                <SortableOptionItem
                  key={option.id}
                  option={option}
                  index={index}
                  outcomes={outcomes}
                  onUpdate={(updates) => handleUpdateOption(option.id, updates)}
                  onDelete={() => handleDeleteOption(option.id)}
                  onCreateOutcome={onCreateOutcome}
                  getOutcomeDisplayName={getOutcomeDisplayName}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add new option button */}
        <GhostAddButton
          size="compact"
          onClick={handleAddOption}
          data-testid="add-option-button"
        >
          Adicionar opção
        </GhostAddButton>
      </div>
    </div>
  )
}
