'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TextConfig } from '@/types/blocks'

interface TextBlockEditorProps {
  config: TextConfig
  onChange: (config: Partial<TextConfig>) => void
}

export function TextBlockEditor({ config, onChange }: TextBlockEditorProps) {
  return (
    <div className="space-y-4" data-testid="text-block-editor">
      <div className="space-y-2">
        <Label htmlFor="text-content">Conteúdo</Label>
        <Textarea
          id="text-content"
          value={config.content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Digite o texto..."
          rows={5}
        />
      </div>
    </div>
  )
}
