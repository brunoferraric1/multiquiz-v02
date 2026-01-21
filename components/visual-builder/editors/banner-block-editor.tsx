'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { SectionTitle } from '@/components/ui/section-title'
import { BannerConfig, BannerUrgency } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Info, AlertTriangle, AlertCircle } from 'lucide-react'

interface BannerBlockEditorProps {
  config: BannerConfig
  onChange: (config: Partial<BannerConfig>) => void
}

const urgencyConfig: Record<BannerUrgency, { icon: React.ReactNode; label: string; color: string }> = {
  info: {
    icon: <Info className="w-4 h-4" />,
    label: 'Informação',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Atenção',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  danger: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Urgente',
    color: 'bg-red-50 border-red-200 text-red-700',
  },
}

export function BannerBlockEditor({ config, onChange }: BannerBlockEditorProps) {
  return (
    <div className="space-y-4" data-testid="banner-block-editor">
      {/* Urgency level */}
      <div>
        <SectionTitle>Tipo de banner</SectionTitle>
        <ToggleGroup
          options={[
            { value: 'info' as BannerUrgency, label: 'Info', icon: <Info /> },
            { value: 'warning' as BannerUrgency, label: 'Atenção', icon: <AlertTriangle /> },
            { value: 'danger' as BannerUrgency, label: 'Urgente', icon: <AlertCircle /> },
          ]}
          value={config.urgency}
          onChange={(urgency) => onChange({ urgency })}
          aria-label="Tipo de banner"
        />
      </div>

      {/* Emoji (optional) */}
      <div className="space-y-2">
        <Label htmlFor="banner-emoji">Emoji (opcional)</Label>
        <Input
          id="banner-emoji"
          value={config.emoji || ''}
          onChange={(e) => onChange({ emoji: e.target.value })}
          placeholder="Ex: 🔥"
          maxLength={4}
          className="w-20"
        />
        <p className="text-xs text-muted-foreground">
          Adicione um emoji para destacar a mensagem
        </p>
      </div>

      {/* Banner text */}
      <div className="space-y-2">
        <Label htmlFor="banner-text">Mensagem do banner</Label>
        <Textarea
          id="banner-text"
          value={config.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Ex: Oferta válida por tempo limitado!"
          rows={2}
        />
      </div>
    </div>
  )
}
