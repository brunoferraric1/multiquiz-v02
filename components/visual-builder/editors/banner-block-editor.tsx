'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { SectionTitle } from '@/components/ui/section-title'
import { BannerConfig, BannerUrgency } from '@/types/blocks'
import { Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface BannerBlockEditorProps {
  config: BannerConfig
  onChange: (config: Partial<BannerConfig>) => void
}

export function BannerBlockEditor({ config, onChange }: BannerBlockEditorProps) {
  const messages = useMessages()
  const bannerCopy = messages.visualBuilder.bannerEditor
  return (
    <div className="space-y-4" data-testid="banner-block-editor">
      {/* Urgency level */}
      <div>
        <SectionTitle>{bannerCopy.title}</SectionTitle>
        <ToggleGroup
          options={[
            { value: 'info' as BannerUrgency, label: bannerCopy.info, icon: <Info /> },
            { value: 'warning' as BannerUrgency, label: bannerCopy.warning, icon: <AlertTriangle /> },
            { value: 'danger' as BannerUrgency, label: bannerCopy.danger, icon: <AlertCircle /> },
          ]}
          value={config.urgency}
          onChange={(urgency) => onChange({ urgency })}
          aria-label={bannerCopy.title}
        />
      </div>

      {/* Emoji (optional) */}
      <div className="space-y-2">
        <Label htmlFor="banner-emoji">{bannerCopy.emojiLabel}</Label>
        <Input
          id="banner-emoji"
          value={config.emoji || ''}
          onChange={(e) => onChange({ emoji: e.target.value })}
          placeholder={bannerCopy.emojiPlaceholder}
          maxLength={4}
          className="w-20"
        />
        <p className="text-xs text-muted-foreground">
          {bannerCopy.emojiHint}
        </p>
      </div>

      {/* Banner text */}
      <div className="space-y-2">
        <Label htmlFor="banner-text">{bannerCopy.messageLabel}</Label>
        <Textarea
          id="banner-text"
          value={config.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={bannerCopy.messagePlaceholder}
          rows={2}
        />
      </div>
    </div>
  )
}
