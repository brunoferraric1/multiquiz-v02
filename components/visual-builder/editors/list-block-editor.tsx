'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ListConfig, ListItem } from '@/types/blocks'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface ListBlockEditorProps {
  config: ListConfig
  onChange: (config: Partial<ListConfig>) => void
}

export function ListBlockEditor({ config, onChange }: ListBlockEditorProps) {
  const [newItemText, setNewItemText] = useState('')

  const handleAddItem = () => {
    if (!newItemText.trim()) return

    const newItem: ListItem = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: newItemText.trim(),
    }

    onChange({
      items: [...(config.items || []), newItem],
    })
    setNewItemText('')
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    }
  }

  return (
    <div className="space-y-4" data-testid="list-block-editor">
      <Label>Itens da lista</Label>

      {/* Existing items */}
      <div className="space-y-2">
        {(config.items || []).map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 group"
            data-testid={`list-item-${index}`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

            {/* Emoji input */}
            <div className="w-12">
              <Input
                value={item.emoji || ''}
                onChange={(e) => handleUpdateItem(item.id, { emoji: e.target.value })}
                placeholder="✓"
                maxLength={4}
                className="text-center px-1"
                aria-label={`Emoji do item ${index + 1}`}
              />
            </div>

            {/* Text input */}
            <div className="flex-1">
              <Input
                value={item.text}
                onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                placeholder={`Item ${index + 1}`}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteItem(item.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              aria-label={`Remover item ${index + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="flex items-center gap-2">
        <div className="w-12" />
        <div className="flex-1">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Novo item..."
            data-testid="new-list-item-input"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          aria-label="Adicionar item"
          data-testid="add-list-item-button"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {(config.items || []).length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum item adicionado. Digite acima para criar itens.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Dica: Use emojis como ✓, •, ★ para personalizar os marcadores
      </p>
    </div>
  )
}
