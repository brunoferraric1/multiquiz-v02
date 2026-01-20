'use client'

import { MediaConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Image, Video, Play } from 'lucide-react'

interface MediaBlockPreviewProps {
  config: MediaConfig
  enabled: boolean
}

/**
 * Extract video thumbnail URL from YouTube or Vimeo URLs
 */
function getVideoThumbnail(url: string): string | null {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern)
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
    }
  }

  // Vimeo pattern - we can't easily get thumbnail without API call
  // Return null and show a placeholder
  if (url.includes('vimeo.com')) {
    return null
  }

  return null
}

/**
 * Static video thumbnail preview for the visual builder
 * Shows thumbnail + play icon, clicking selects the block (not plays video)
 */
function VideoThumbnailPreview({ url }: { url: string }) {
  const thumbnailUrl = getVideoThumbnail(url)

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <Video className="w-12 h-12 text-gray-500" />
        </div>
      )}
      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
        </div>
      </div>
    </div>
  )
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
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <VideoThumbnailPreview url={url} />
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
