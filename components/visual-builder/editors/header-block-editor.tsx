'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HeaderConfig } from '@/types/blocks'
import { useMessages } from '@/lib/i18n/context'

interface HeaderBlockEditorProps {
  config: HeaderConfig
  onChange: (config: Partial<HeaderConfig>) => void
}

export function HeaderBlockEditor({ config, onChange }: HeaderBlockEditorProps) {
  const messages = useMessages()
  const headerCopy = messages.visualBuilder.headerEditor
  return (
    <div className="space-y-4" data-testid="header-block-editor">
      <div className="space-y-2">
        <Label htmlFor="header-title">{headerCopy.titleLabel}</Label>
        <Input
          id="header-title"
          value={config.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={headerCopy.titlePlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="header-description">{headerCopy.descriptionLabel}</Label>
        <Textarea
          id="header-description"
          value={config.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={headerCopy.descriptionPlaceholder}
          rows={3}
        />
      </div>
    </div>
  )
}
