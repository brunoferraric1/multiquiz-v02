'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HeaderConfig } from '@/types/blocks'

interface HeaderBlockEditorProps {
  config: HeaderConfig
  onChange: (config: Partial<HeaderConfig>) => void
}

export function HeaderBlockEditor({ config, onChange }: HeaderBlockEditorProps) {
  return (
    <div className="space-y-4" data-testid="header-block-editor">
      <div className="space-y-2">
        <Label htmlFor="header-title">Título</Label>
        <Input
          id="header-title"
          value={config.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Digite o título..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="header-description">Descrição</Label>
        <Textarea
          id="header-description"
          value={config.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Digite a descrição..."
          rows={3}
        />
      </div>
    </div>
  )
}
