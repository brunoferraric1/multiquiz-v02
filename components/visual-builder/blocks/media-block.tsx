'use client'

import { MediaConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Image, Video } from 'lucide-react'

interface MediaBlockPreviewProps {
  config: MediaConfig
  enabled: boolean
}

/**
 * MediaBlockPreview - Renders media block (image or video)
 */
export function MediaBlockPreview({ config, enabled }: MediaBlockPreviewProps) {
  const { type, url, alt } = config as MediaConfig

  if (!url) {
    // Placeholder state
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 py-8">
          {type === 'video' ? (
            <Video className="w-8 h-8 text-muted-foreground/50" />
          ) : (
            <Image className="w-8 h-8 text-muted-foreground/50" />
          )}
          <span className="mt-2 text-sm text-muted-foreground/50">
            {type === 'video' ? 'Adicionar vídeo' : 'Adicionar imagem'}
          </span>
        </div>
      </div>
    )
  }

  if (type === 'video') {
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <video
            src={url}
            className="w-full h-full object-cover"
            controls
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={url}
          alt={alt || 'Image'}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
