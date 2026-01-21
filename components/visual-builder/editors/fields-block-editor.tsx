'use client'

import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldsConfig, FieldItem, FieldType } from '@/types/blocks'
import { Trash2, GripVertical, Type, Mail, Phone, Hash, AlignLeft } from 'lucide-react'

interface FieldsBlockEditorProps {
  config: FieldsConfig
  onChange: (config: Partial<FieldsConfig>) => void
}

const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  textarea: <AlignLeft className="w-4 h-4" />,
}

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Texto',
  email: 'Email',
  phone: 'Telefone',
  number: 'Número',
  textarea: 'Texto longo',
}

// Default placeholders for each field type
const defaultPlaceholders: Record<FieldType, string> = {
  text: 'Digite aqui...',
  email: 'seu@email.com',
  phone: '(00) 00000-0000',
  number: '0',
  textarea: 'Digite sua mensagem...',
}

interface SortableFieldItemProps {
  field: FieldItem
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<FieldItem>) => void
  onDelete: () => void
}

function SortableFieldItem({
  field,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Check if user has customized the placeholder
  const hasCustomPlaceholder = field.placeholder !== undefined && field.placeholder !== ''
  const effectivePlaceholder = hasCustomPlaceholder
    ? field.placeholder
    : defaultPlaceholders[field.type]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg overflow-hidden ${isDragging ? 'opacity-50 z-50' : ''}`}
      data-testid={`field-item-${index}`}
    >
      {/* Field header */}
      <div
        className="flex items-center gap-2 p-3 bg-muted/50 cursor-pointer"
        onClick={onToggleExpand}
      >
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Arrastar campo ${index + 1}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-muted-foreground">{fieldTypeIcons[field.type]}</span>
        <span className="flex-1 text-sm font-medium truncate">
          {field.label || `Campo ${index + 1}`}
        </span>
        {field.required && (
          <span className="text-xs text-primary">Obrigatório</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={`Remover campo ${index + 1}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Expanded field editor */}
      {isExpanded && (
        <div className="p-3 space-y-4 border-t">
          {/* Type selector - first item */}
          <div className="space-y-2">
            <Label htmlFor={`field-type-${field.id}`}>Tipo de campo</Label>
            <Select
              value={field.type}
              onValueChange={(type: FieldType) => {
                // When changing type, clear custom placeholder so default is used
                onUpdate({ type, placeholder: undefined })
              }}
            >
              <SelectTrigger id={`field-type-${field.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(fieldTypeLabels) as FieldType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      {fieldTypeIcons[type]}
                      {fieldTypeLabels[type]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor={`field-label-${field.id}`}>Rótulo</Label>
            <Input
              id={`field-label-${field.id}`}
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Ex: Nome completo"
            />
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor={`field-required-${field.id}`}>Campo obrigatório</Label>
            <Switch
              id={`field-required-${field.id}`}
              checked={field.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>

          {/* Custom placeholder toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`field-custom-placeholder-${field.id}`}>
                Personalizar placeholder
              </Label>
              <Switch
                id={`field-custom-placeholder-${field.id}`}
                checked={hasCustomPlaceholder}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Enable custom: set to current default
                    onUpdate({ placeholder: defaultPlaceholders[field.type] })
                  } else {
                    // Disable custom: clear placeholder to use default
                    onUpdate({ placeholder: undefined })
                  }
                }}
              />
            </div>
            {hasCustomPlaceholder && (
              <Input
                id={`field-placeholder-${field.id}`}
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder={defaultPlaceholders[field.type]}
              />
            )}
            {!hasCustomPlaceholder && (
              <p className="text-xs text-muted-foreground">
                Padrão: &quot;{effectivePlaceholder}&quot;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function FieldsBlockEditor({ config, onChange }: FieldsBlockEditorProps) {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddField = () => {
    const newField: FieldItem = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: '',
      type: 'text',
      required: false,
    }

    onChange({
      items: [...(config.items || []), newField],
    })
    setExpandedFieldId(newField.id)
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FieldItem>) => {
    onChange({
      items: (config.items || []).map((item) =>
        item.id === fieldId ? { ...item, ...updates } : item
      ),
    })
  }

  const handleDeleteField = (fieldId: string) => {
    onChange({
      items: (config.items || []).filter((item) => item.id !== fieldId),
    })
    if (expandedFieldId === fieldId) {
      setExpandedFieldId(null)
    }
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
    <div className="space-y-4" data-testid="fields-block-editor">
      <div className="mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Campos do formulário
        </span>
      </div>

      {/* Fields list with drag and drop */}
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
            {items.map((field, index) => (
              <SortableFieldItem
                key={field.id}
                field={field}
                index={index}
                isExpanded={expandedFieldId === field.id}
                onToggleExpand={() =>
                  setExpandedFieldId(expandedFieldId === field.id ? null : field.id)
                }
                onUpdate={(updates) => handleUpdateField(field.id, updates)}
                onDelete={() => handleDeleteField(field.id)}
              />
            ))}

            {/* Add field button - compact style */}
            <GhostAddButton
              size="compact"
              onClick={handleAddField}
              data-testid="add-field-button"
            >
              Adicionar campo
            </GhostAddButton>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
