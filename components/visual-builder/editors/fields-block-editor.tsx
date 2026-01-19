'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { FieldsConfig, FieldItem, FieldType } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Plus, Trash2, GripVertical, Type, Mail, Phone, Hash, AlignLeft } from 'lucide-react'

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

export function FieldsBlockEditor({ config, onChange }: FieldsBlockEditorProps) {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null)

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

  return (
    <div className="space-y-4" data-testid="fields-block-editor">
      <div className="flex items-center justify-between">
        <Label>Campos do formulário</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddField}
          data-testid="add-field-button"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {/* Fields list */}
      <div className="space-y-2">
        {(config.items || []).map((field, index) => (
          <div
            key={field.id}
            className="border rounded-lg overflow-hidden"
            data-testid={`field-item-${index}`}
          >
            {/* Field header */}
            <div
              className="flex items-center gap-2 p-3 bg-muted/50 cursor-pointer"
              onClick={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
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
                  handleDeleteField(field.id)
                }}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label={`Remover campo ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Expanded field editor */}
            {expandedFieldId === field.id && (
              <div className="p-3 space-y-4 border-t">
                {/* Label */}
                <div className="space-y-2">
                  <Label htmlFor={`field-label-${field.id}`}>Rótulo</Label>
                  <Input
                    id={`field-label-${field.id}`}
                    value={field.label}
                    onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                    placeholder="Ex: Nome completo"
                  />
                </div>

                {/* Type selector */}
                <div className="space-y-2">
                  <Label>Tipo de campo</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(Object.keys(fieldTypeLabels) as FieldType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleUpdateField(field.id, { type })}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors',
                          field.type === type
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-card border-border hover:bg-muted'
                        )}
                        aria-pressed={field.type === type}
                      >
                        {fieldTypeIcons[type]}
                        <span>{fieldTypeLabels[type]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Placeholder */}
                <div className="space-y-2">
                  <Label htmlFor={`field-placeholder-${field.id}`}>Placeholder</Label>
                  <Input
                    id={`field-placeholder-${field.id}`}
                    value={field.placeholder || ''}
                    onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                    placeholder="Ex: Digite seu nome"
                  />
                </div>

                {/* Required toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`field-required-${field.id}`}>Campo obrigatório</Label>
                  <Switch
                    id={`field-required-${field.id}`}
                    checked={field.required || false}
                    onCheckedChange={(checked) => handleUpdateField(field.id, { required: checked })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {(config.items || []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum campo adicionado. Clique em &quot;Adicionar&quot; para criar campos.
          </p>
        )}
      </div>
    </div>
  )
}
