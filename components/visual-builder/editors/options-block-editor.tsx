'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { OptionsConfig, OptionItem } from '@/types/blocks'
import { Plus, Trash2, GripVertical, Circle, Square } from 'lucide-react'

interface OptionsBlockEditorProps {
  config: OptionsConfig
  onChange: (config: Partial<OptionsConfig>) => void
}

export function OptionsBlockEditor({ config, onChange }: OptionsBlockEditorProps) {
  const [newOptionText, setNewOptionText] = useState('')

  const handleAddOption = () => {
    if (!newOptionText.trim()) return

    const newOption: OptionItem = {
      id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: newOptionText.trim(),
    }

    onChange({
      items: [...(config.items || []), newOption],
    })
    setNewOptionText('')
  }

  const handleUpdateOption = (optionId: string, text: string) => {
    onChange({
      items: (config.items || []).map((item) =>
        item.id === optionId ? { ...item, text } : item
      ),
    })
  }

  const handleDeleteOption = (optionId: string) => {
    onChange({
      items: (config.items || []).filter((item) => item.id !== optionId),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddOption()
    }
  }

  return (
    <div className="space-y-4" data-testid="options-block-editor">
      {/* Selection type */}
      <div className="space-y-2">
        <Label>Tipo de seleção</Label>
        <ToggleGroup
          options={[
            { value: 'single', label: 'Única', icon: <Circle /> },
            { value: 'multiple', label: 'Múltipla', icon: <Square /> },
          ]}
          value={config.selectionType}
          onChange={(selectionType) => onChange({ selectionType })}
          aria-label="Tipo de seleção"
        />
      </div>

      {/* Options list */}
      <div className="space-y-2">
        <Label>Opções de resposta</Label>

        {/* Existing options */}
        <div className="space-y-2">
          {(config.items || []).map((option, index) => (
            <div
              key={option.id}
              className="flex items-center gap-2 group"
              data-testid={`option-item-${index}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
              <div className="flex-1">
                <Input
                  value={option.text}
                  onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                  placeholder={`Opção ${index + 1}`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteOption(option.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                aria-label={`Remover opção ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add new option */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nova opção..."
              data-testid="new-option-input"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddOption}
            disabled={!newOptionText.trim()}
            aria-label="Adicionar opção"
            data-testid="add-option-button"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {(config.items || []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma opção adicionada. Digite acima para criar opções.
          </p>
        )}
      </div>
    </div>
  )
}
