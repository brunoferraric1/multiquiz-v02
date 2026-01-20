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
import { ToggleGroup } from '@/components/ui/toggle-group'
import { PriceConfig, PriceItem } from '@/types/blocks'
import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

interface PriceBlockEditorProps {
  config: PriceConfig
  onChange: (config: Partial<PriceConfig>) => void
}

interface SortablePriceItemProps {
  price: PriceItem
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<PriceItem>) => void
  onDelete: () => void
}

function SortablePriceItem({
  price,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: SortablePriceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: price.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg overflow-hidden ${isDragging ? 'opacity-50 z-50' : ''}`}
      data-testid={`price-item-${index}`}
    >
      {/* Price item header */}
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
          aria-label={`Arrastar preço ${index + 1}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="flex-1 text-sm font-medium truncate">
          {price.title || `Preço ${index + 1}`}
        </span>
        <span className="text-sm text-muted-foreground">
          {price.value || 'R$ 0,00'}
        </span>
        {price.showHighlight && price.highlightText && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
            {price.highlightText}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
          aria-label={`Remover preço ${index + 1}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Expanded price editor */}
      {isExpanded && (
        <div className="p-3 space-y-4 border-t">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor={`price-title-${price.id}`}>Título</Label>
            <Input
              id={`price-title-${price.id}`}
              value={price.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Ex: Plano PRO"
            />
          </div>

          {/* Price value row: prefix | value | suffix */}
          <div className="space-y-2">
            <Label>Preço</Label>
            <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2">
              <div>
                <Input
                  value={price.prefix || ''}
                  onChange={(e) => onUpdate({ prefix: e.target.value })}
                  placeholder="10% off"
                  aria-label="Prefixo do preço"
                />
                <span className="text-xs text-muted-foreground">Prefixo</span>
              </div>
              <div>
                <Input
                  value={price.value}
                  onChange={(e) => onUpdate({ value: e.target.value })}
                  placeholder="R$ 89,90"
                  aria-label="Valor"
                />
                <span className="text-xs text-muted-foreground">Valor</span>
              </div>
              <div>
                <Input
                  value={price.suffix || ''}
                  onChange={(e) => onUpdate({ suffix: e.target.value })}
                  placeholder="à vista"
                  aria-label="Sufixo do preço"
                />
                <span className="text-xs text-muted-foreground">Sufixo</span>
              </div>
            </div>
          </div>

          {/* Original price (de/por format) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={`price-show-original-${price.id}`}>
                Mostrar preço original (de/por)
              </Label>
              <Switch
                id={`price-show-original-${price.id}`}
                checked={price.showOriginalPrice ?? false}
                onCheckedChange={(checked) => onUpdate({ showOriginalPrice: checked })}
              />
            </div>
            {price.showOriginalPrice && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label htmlFor={`price-original-${price.id}`}>Preço original</Label>
                <Input
                  id={`price-original-${price.id}`}
                  value={price.originalPrice || ''}
                  onChange={(e) => onUpdate({ originalPrice: e.target.value })}
                  placeholder="R$ 129,90"
                />
                <p className="text-xs text-muted-foreground">
                  Exibido como &quot;de R$ X por:&quot; acima do preço atual
                </p>
              </div>
            )}
          </div>

          {/* Highlight toggle with conditional input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={`price-show-highlight-${price.id}`}>Destacar</Label>
              <Switch
                id={`price-show-highlight-${price.id}`}
                checked={price.showHighlight ?? false}
                onCheckedChange={(checked) => onUpdate({ showHighlight: checked })}
              />
            </div>
            {price.showHighlight && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label htmlFor={`price-highlight-${price.id}`}>Texto do destaque</Label>
                <Input
                  id={`price-highlight-${price.id}`}
                  value={price.highlightText || ''}
                  onChange={(e) => onUpdate({ highlightText: e.target.value })}
                  placeholder="MAIS POPULAR"
                />
              </div>
            )}
          </div>

          {/* Redirect URL */}
          <div className="space-y-2">
            <Label htmlFor={`price-url-${price.id}`}>URL de redirecionamento</Label>
            <Input
              id={`price-url-${price.id}`}
              value={price.redirectUrl || ''}
              onChange={(e) => onUpdate({ redirectUrl: e.target.value })}
              placeholder="https://exemplo.com/checkout"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function PriceBlockEditor({ config, onChange }: PriceBlockEditorProps) {
  const [expandedPriceId, setExpandedPriceId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddPrice = () => {
    const newPrice: PriceItem = {
      id: `price-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: '',
      value: '',
    }

    onChange({
      items: [...(config.items || []), newPrice],
    })
    setExpandedPriceId(newPrice.id)
  }

  const handleUpdatePrice = (priceId: string, updates: Partial<PriceItem>) => {
    onChange({
      items: (config.items || []).map((item) =>
        item.id === priceId ? { ...item, ...updates } : item
      ),
    })
  }

  const handleDeletePrice = (priceId: string) => {
    onChange({
      items: (config.items || []).filter((item) => item.id !== priceId),
    })
    if (expandedPriceId === priceId) {
      setExpandedPriceId(null)
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
    <div className="space-y-4" data-testid="price-block-editor">
      {/* Selection type */}
      <div className="space-y-2">
        <Label>Tipo de seleção</Label>
        <ToggleGroup
          options={[
            { value: 'single', label: 'Única' },
            { value: 'multiple', label: 'Múltipla' },
          ]}
          value={config.selectionType || 'single'}
          onChange={(selectionType) => onChange({ selectionType })}
          aria-label="Tipo de seleção"
        />
      </div>

      {/* Price items list */}
      <div className="space-y-2">
        <Label>Opções de preço</Label>

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
              {items.map((price, index) => (
                <SortablePriceItem
                  key={price.id}
                  price={price}
                  index={index}
                  isExpanded={expandedPriceId === price.id}
                  onToggleExpand={() =>
                    setExpandedPriceId(expandedPriceId === price.id ? null : price.id)
                  }
                  onUpdate={(updates) => handleUpdatePrice(price.id, updates)}
                  onDelete={() => handleDeletePrice(price.id)}
                />
              ))}

              {/* Add price button */}
              <GhostAddButton
                size="compact"
                onClick={handleAddPrice}
                data-testid="add-price-button"
              >
                Adicionar preço
              </GhostAddButton>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
