'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Button } from '@/components/ui/button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import { SectionTitle } from '@/components/ui/section-title'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { InstantTooltip } from '@/components/ui/instant-tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OptionsConfig, OptionItem, OptionsLayout } from '@/types/blocks'
import type { Outcome } from '@/store/visual-builder-store'
import {
  Trash2,
  GripVertical,
  ArrowRight,
  Plus,
  Lightbulb,
  ImageIcon,
  UploadCloud,
  X,
  Rows3,
  Columns2,
  LayoutGrid,
} from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'
import type { Messages } from '@/lib/i18n/messages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type OptionsCopy = Messages['visualBuilder']['optionsEditor']

interface OptionsBlockEditorProps {
  config: OptionsConfig
  onChange: (config: Partial<OptionsConfig>) => void
  outcomes?: Outcome[]
  onCreateOutcome?: () => void
}

interface ImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageSelect: (imageUrl: string) => void
  optionsCopy: OptionsCopy
}

function ImageUploadDialog({
  open,
  onOpenChange,
  onImageSelect,
  optionsCopy,
}: ImageUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    const file = files && files.length > 0 ? files[0] : null
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        onImageSelect(dataUrl)
        onOpenChange(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleFileSelect(event.dataTransfer.files)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{optionsCopy.uploadImageTitle}</DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-[var(--cursor-interactive)] hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
          onClick={handleButtonClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {optionsCopy.dropImage}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleButtonClick()
            }}
          >
            <UploadCloud className="mr-1.5 h-4 w-4" />
            {optionsCopy.uploadImage}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface SortableOptionItemProps {
  option: OptionItem
  index: number
  outcomes: Outcome[]
  showImages: boolean
  onUpdate: (updates: Partial<OptionItem>) => void
  onDelete: () => void
  onCreateOutcome?: () => void
  getOutcomeDisplayName: (outcome: Outcome, index: number) => string
  optionsCopy: OptionsCopy
  autoFocus?: boolean
  onAutoFocused?: () => void
}

function SortableOptionItem({
  option,
  index,
  outcomes,
  showImages,
  onUpdate,
  onDelete,
  onCreateOutcome,
  getOutcomeDisplayName,
  optionsCopy,
  autoFocus,
  onAutoFocused,
}: SortableOptionItemProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
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

  // Auto-focus the input when this is a newly added option
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      onAutoFocused?.()
    }
  }, [autoFocus, onAutoFocused])

  const handleImageSelect = (imageUrl: string) => {
    onUpdate({ imageUrl })
  }

  const handleRemoveImage = () => {
    onUpdate({ imageUrl: undefined })
  }

  return (
    <>
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
            aria-label={optionsCopy.dragOption.replace('{{index}}', String(index + 1))}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={option.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder={optionsCopy.optionPlaceholder.replace('{{index}}', String(index + 1))}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={optionsCopy.removeOption.replace('{{index}}', String(index + 1))}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Image upload row - only shown when showImages is enabled */}
        {showImages && (
          <div className="flex items-center gap-2 pl-6">
            {option.imageUrl ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="relative w-8 h-8 rounded overflow-hidden border border-border shrink-0">
                  <img
                    src={option.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {optionsCopy.imageAdded}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadDialogOpen(true)}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {optionsCopy.replaceImage}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    aria-label={optionsCopy.removeImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setUploadDialogOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {optionsCopy.addImage}
              </button>
            )}
          </div>
        )}

        {/* Outcome assignment row */}
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            {optionsCopy.outcomeLabel}:
          </span>
          {outcomes.length === 0 ? (
            <button
              type="button"
              onClick={onCreateOutcome}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-dashed border-primary/50 rounded text-xs text-primary hover:bg-primary/10 transition-colors"
              data-testid={`create-outcome-${index}`}
            >
              <Plus className="w-3 h-3" />
              {optionsCopy.createOutcome}
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
                <SelectValue placeholder={optionsCopy.unlinked} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{optionsCopy.unlinked}</SelectItem>
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

      <ImageUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onImageSelect={handleImageSelect}
        optionsCopy={optionsCopy}
      />
    </>
  )
}

interface LayoutToggleProps {
  value: OptionsLayout
  onChange: (layout: OptionsLayout) => void
  optionsCopy: OptionsCopy
}

function LayoutToggle({ value, onChange, optionsCopy }: LayoutToggleProps) {
  const layouts: { value: OptionsLayout; icon: React.ReactNode; label: string }[] = [
    { value: 'vertical', icon: <Rows3 className="h-4 w-4" />, label: optionsCopy.layoutVertical },
    { value: 'horizontal', icon: <Columns2 className="h-4 w-4" />, label: optionsCopy.layoutHorizontal },
    { value: 'grid', icon: <LayoutGrid className="h-4 w-4" />, label: optionsCopy.layoutGrid },
  ]

  return (
    <div
      role="group"
      aria-label={optionsCopy.layoutTitle}
      className="flex items-center gap-1 bg-muted rounded-lg p-1"
    >
      {layouts.map((layout) => (
        <InstantTooltip key={layout.value} content={layout.label}>
          <button
            type="button"
            aria-label={layout.label}
            aria-pressed={value === layout.value}
            onClick={() => onChange(layout.value)}
            className={cn(
              'flex-1 flex items-center justify-center rounded-md px-3 py-1.5 transition-colors',
              value === layout.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {layout.icon}
          </button>
        </InstantTooltip>
      ))}
    </div>
  )
}

export function OptionsBlockEditor({
  config,
  onChange,
  outcomes = [],
  onCreateOutcome,
}: OptionsBlockEditorProps) {
  const messages = useMessages()
  const optionsCopy = messages.visualBuilder.optionsEditor
  const [newlyAddedOptionId, setNewlyAddedOptionId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const showImages = config.showImages ?? false
  const layout = config.layout ?? 'vertical'

  const handleAddOption = () => {
    const newOption: OptionItem = {
      id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: '',
    }

    onChange({
      items: [...(config.items || []), newOption],
    })
    setNewlyAddedOptionId(newOption.id)
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
    return outcome.name?.trim() || `${optionsCopy.outcomeLabel} ${index + 1}`
  }

  const handleToggleImages = (enabled: boolean) => {
    onChange({ showImages: enabled })
  }

  const handleLayoutChange = (newLayout: OptionsLayout) => {
    onChange({ layout: newLayout })
  }

  const items = config.items || []

  return (
    <div className="space-y-4" data-testid="options-block-editor">
      {/* Selection type */}
      <div>
        <SectionTitle>{optionsCopy.selectionTitle}</SectionTitle>
        <ToggleGroup
          options={[
            { value: 'single', label: optionsCopy.single },
            { value: 'multiple', label: optionsCopy.multiple },
          ]}
          value={config.selectionType}
          onChange={(selectionType) => onChange({ selectionType })}
          aria-label={optionsCopy.selectionTitle}
        />
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {config.selectionType === 'multiple'
              ? optionsCopy.multiSelectHint
              : optionsCopy.singleSelectHint}
          </span>
        </div>
      </div>

      {/* Options list */}
      <div>
        <SectionTitle>{optionsCopy.optionsTitle}</SectionTitle>

        {/* Image toggle - between title and options */}
        <div className="flex items-center justify-between py-2 mb-2">
          <Label htmlFor="show-images" className="text-sm font-normal cursor-pointer">
            {optionsCopy.enableImages}
          </Label>
          <Switch
            id="show-images"
            checked={showImages}
            onCheckedChange={handleToggleImages}
          />
        </div>

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
                  showImages={showImages}
                  onUpdate={(updates) => handleUpdateOption(option.id, updates)}
                  onDelete={() => handleDeleteOption(option.id)}
                  onCreateOutcome={onCreateOutcome}
                  getOutcomeDisplayName={getOutcomeDisplayName}
                  optionsCopy={optionsCopy}
                  autoFocus={option.id === newlyAddedOptionId}
                  onAutoFocused={() => setNewlyAddedOptionId(null)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add new option button */}
        <div className="mt-2">
          <GhostAddButton
            size="compact"
            onClick={handleAddOption}
            data-testid="add-option-button"
          >
            {optionsCopy.addOption}
          </GhostAddButton>
        </div>
      </div>

      {/* Layout toggle */}
      <div>
        <SectionTitle>{optionsCopy.layoutTitle}</SectionTitle>
        <LayoutToggle
          value={layout}
          onChange={handleLayoutChange}
          optionsCopy={optionsCopy}
        />
      </div>
    </div>
  )
}
