'use client'

import { MediaConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Image, Video, Play } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

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

interface VideoThumbnailPreviewProps {
  url: string
  alt: string
  customThumbnail?: string
  orientation?: 'horizontal' | 'vertical'
  focalPoint?: { x: number; y: number }
}

/**
 * Static video thumbnail preview for the visual builder
 * Shows thumbnail + play icon, clicking selects the block (not plays video)
 * Priority: customThumbnail > auto-generated thumbnail > placeholder
 */
function VideoThumbnailPreview({
  url,
  alt,
  customThumbnail,
  orientation = 'horizontal',
  focalPoint,
}: VideoThumbnailPreviewProps) {
  const autoThumbnailUrl = getVideoThumbnail(url)
  const thumbnailUrl = customThumbnail || autoThumbnailUrl
  const objectPosition = focalPoint
    ? `${focalPoint.x}% ${focalPoint.y}%`
    : 'center'

  // Only use custom orientation if there's a custom thumbnail
  const useOrientation = customThumbnail ? orientation : 'horizontal'
  const wrapperClass = cn(
    'relative rounded-lg overflow-hidden bg-muted',
    useOrientation === 'vertical'
      ? 'aspect-[3/4] w-full max-w-[var(--media-portrait-max-width)] mx-auto'
      : 'aspect-video w-full'
  )

  return (
    <div key={url} className={wrapperClass}>
      {thumbnailUrl ? (
        <img
          key={thumbnailUrl}
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ objectPosition: customThumbnail ? objectPosition : 'center' }}
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
  const messages = useMessages()
  const mediaCopy = messages.visualBuilder.mediaEditor
  const { type, url, alt, orientation, fit = 'cover', focalPoint } = config as MediaConfig
  const imageOrientation = orientation ?? 'horizontal'
  const imageFit = fit ?? 'cover'
  const imageWrapperClass = cn(
    'relative rounded-lg overflow-hidden bg-muted',
    imageOrientation === 'vertical'
      ? 'aspect-[3/4] w-full max-w-[var(--media-portrait-max-width)] mx-auto'
      : 'aspect-video w-full'
  )
  const objectPosition = focalPoint
    ? `${focalPoint.x}% ${focalPoint.y}%`
    : 'center'

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
            {mediaCopy.addMedia}
          </span>
        </div>
      </div>
    )
  }

  if (type === 'video') {
    const { videoThumbnail, videoThumbnailOrientation, videoThumbnailFocalPoint } = config as MediaConfig
    return (
      <div className={cn('p-4', !enabled && 'opacity-50')}>
        <VideoThumbnailPreview
          key={`${url}-${videoThumbnail || ''}-${videoThumbnailOrientation || ''}`}
          url={url}
          alt={mediaCopy.previewAlt}
          customThumbnail={videoThumbnail}
          orientation={videoThumbnailOrientation}
          focalPoint={videoThumbnailFocalPoint}
        />
      </div>
    )
  }

  return (
    <div className={cn('p-4', !enabled && 'opacity-50')}>
      <div className={imageWrapperClass}>
        <img
          key={url}
          src={url}
          alt={alt || mediaCopy.image}
          className={cn(
            'w-full h-full',
            imageFit === 'contain' ? 'object-contain' : 'object-cover'
          )}
          style={{ objectPosition: imageFit === 'cover' ? objectPosition : undefined }}
        />
      </div>
    </div>
  )
}
