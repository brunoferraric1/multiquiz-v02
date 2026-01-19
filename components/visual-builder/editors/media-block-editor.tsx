'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MediaConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Image, Video } from 'lucide-react'

interface MediaBlockEditorProps {
  config: MediaConfig
  onChange: (config: Partial<MediaConfig>) => void
}

export function MediaBlockEditor({ config, onChange }: MediaBlockEditorProps) {
  return (
    <div className="space-y-4" data-testid="media-block-editor">
      {/* Media type selector */}
      <div className="space-y-2">
        <Label>Tipo de mídia</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ type: 'image' })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
              config.type === 'image'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:bg-muted'
            )}
            aria-pressed={config.type === 'image'}
            data-testid="media-type-image"
          >
            <Image className="w-4 h-4" />
            <span className="text-sm font-medium">Imagem</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ type: 'video' })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
              config.type === 'video'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border hover:bg-muted'
            )}
            aria-pressed={config.type === 'video'}
            data-testid="media-type-video"
          >
            <Video className="w-4 h-4" />
            <span className="text-sm font-medium">Vídeo</span>
          </button>
        </div>
      </div>

      {/* URL input */}
      <div className="space-y-2">
        <Label htmlFor="media-url">
          {config.type === 'image' ? 'URL da imagem' : 'URL do vídeo'}
        </Label>
        <Input
          id="media-url"
          type="url"
          value={config.url || ''}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder={config.type === 'image' ? 'https://exemplo.com/imagem.jpg' : 'https://youtube.com/watch?v=...'}
        />
      </div>

      {/* Alt text (for images) */}
      {config.type === 'image' && (
        <div className="space-y-2">
          <Label htmlFor="media-alt">Texto alternativo</Label>
          <Input
            id="media-alt"
            value={config.alt || ''}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Descrição da imagem para acessibilidade..."
          />
        </div>
      )}
    </div>
  )
}
