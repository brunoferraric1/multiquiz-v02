'use client'

import { MediaConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Image, Video } from 'lucide-react'

interface MediaBlockPreviewProps {
  config: MediaConfig
  enabled: boolean
}

/**
 * Extract YouTube video ID from various URL formats
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Extract Vimeo video ID from URL
 */
function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

/**
 * MediaBlockPreview - Renders media block (image or video)
 */
export function MediaBlockPreview({ config, enabled }: MediaBlockPreviewProps) {
  const { type, url, alt } = config as MediaConfig

  if (!url) {
    // Placeholder state - no background to allow parent hover effects to show
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="flex flex-col items-center justify-center py-8">
          {type === 'video' ? (
            <Video className="w-8 h-8 text-muted-foreground/50" />
          ) : (
            <Image className="w-8 h-8 text-muted-foreground/50" />
          )}
          <span className="mt-2 text-sm text-muted-foreground/50">
            Adicionar mídia
          </span>
        </div>
      </div>
    )
  }

  if (type === 'video') {
    // Check for YouTube
    const youtubeId = getYouTubeVideoId(url)
    if (youtubeId) {
      return (
        <div className={cn('p-4', !enabled && 'opacity-50')}>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )
    }

    // Check for Vimeo
    const vimeoId = getVimeoVideoId(url)
    if (vimeoId) {
      return (
        <div className={cn('p-4', !enabled && 'opacity-50')}>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title="Vimeo video"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )
    }

    // Fallback to native video for direct video URLs
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <video
            src={url}
            className="w-full h-full object-contain bg-black"
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
