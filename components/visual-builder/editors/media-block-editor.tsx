'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { SectionTitle } from '@/components/ui/section-title'
import { FocalPointSelector } from '@/components/ui/focal-point-selector'
import { MediaConfig, FocalPoint } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { Image, Video, ImageIcon, UploadCloud, Trash2, RectangleHorizontal, RectangleVertical, Film, Focus } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface MediaBlockEditorProps {
  config: MediaConfig
  onChange: (config: Partial<MediaConfig>) => void
}

export function MediaBlockEditor({ config, onChange }: MediaBlockEditorProps) {
  const messages = useMessages()
  const mediaCopy = messages.visualBuilder.mediaEditor
  const inputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const imageOrientation = config.orientation ?? 'horizontal'

  // Focal point dialog state (for images)
  const [focalPointDialogOpen, setFocalPointDialogOpen] = useState(false)
  const [tempFocalPoint, setTempFocalPoint] = useState<FocalPoint>(
    config.focalPoint ?? { x: 50, y: 50 }
  )

  // Focal point dialog state (for video thumbnails)
  const [thumbnailFocalPointDialogOpen, setThumbnailFocalPointDialogOpen] = useState(false)
  const [tempThumbnailFocalPoint, setTempThumbnailFocalPoint] = useState<FocalPoint>(
    config.videoThumbnailFocalPoint ?? { x: 50, y: 50 }
  )
  const thumbnailOrientation = config.videoThumbnailOrientation ?? 'horizontal'

  const handleOpenFocalPointDialog = () => {
    setTempFocalPoint(config.focalPoint ?? { x: 50, y: 50 })
    setFocalPointDialogOpen(true)
  }

  const handleSaveFocalPoint = () => {
    onChange({ focalPoint: tempFocalPoint })
    setFocalPointDialogOpen(false)
  }

  // Thumbnail focal point handlers
  const handleOpenThumbnailFocalPointDialog = () => {
    setTempThumbnailFocalPoint(config.videoThumbnailFocalPoint ?? { x: 50, y: 50 })
    setThumbnailFocalPointDialogOpen(true)
  }

  const handleSaveThumbnailFocalPoint = () => {
    onChange({ videoThumbnailFocalPoint: tempThumbnailFocalPoint })
    setThumbnailFocalPointDialogOpen(false)
  }

  const handleFileSelect = (files: FileList | null) => {
    const file = files && files.length > 0 ? files[0] : null
    if (file) {
      // Convert file to data URL for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        const img = new window.Image()
        img.onload = () => {
          const orientation = img.height > img.width ? 'vertical' : 'horizontal'
          onChange({ url: dataUrl, orientation })
        }
        img.onerror = () => {
          onChange({ url: dataUrl })
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleFileSelect(event.dataTransfer.files)
  }

  const handleRemoveImage = () => {
    onChange({ url: '' })
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // Thumbnail upload handlers for video
  const handleThumbnailSelect = (files: FileList | null) => {
    const file = files && files.length > 0 ? files[0] : null
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        // Auto-detect orientation from image dimensions
        const img = new window.Image()
        img.onload = () => {
          const orientation = img.height > img.width ? 'vertical' : 'horizontal'
          onChange({ videoThumbnail: dataUrl, videoThumbnailOrientation: orientation })
        }
        img.onerror = () => {
          onChange({ videoThumbnail: dataUrl })
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    }
  }

  const handleThumbnailButtonClick = () => {
    thumbnailInputRef.current?.click()
  }

  const handleThumbnailDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleThumbnailSelect(event.dataTransfer.files)
  }

  const handleRemoveThumbnail = () => {
    onChange({ videoThumbnail: '' })
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4" data-testid="media-block-editor">
      {/* Media type selector */}
      <div>
        <SectionTitle>{mediaCopy.mediaType}</SectionTitle>
        <ToggleGroup
          options={[
            { value: 'image', label: mediaCopy.image, icon: <Image /> },
            { value: 'video', label: mediaCopy.video, icon: <Video /> },
          ]}
          value={config.type}
          onChange={(type) => onChange({ type, url: '' })}
          aria-label={mediaCopy.mediaType}
        />
      </div>

      {/* Image upload area */}
      {config.type === 'image' && (
        <div className="space-y-3">
          <SectionTitle>{mediaCopy.imageSection}</SectionTitle>

          {config.url ? (
            <div className="space-y-2">
              {/* Image preview */}
              <div
                className={cn(
                  'relative rounded-lg overflow-hidden border border-border',
                  imageOrientation === 'vertical'
                    ? 'aspect-[3/4] w-full max-w-[var(--media-portrait-max-width)] mx-auto'
                    : 'aspect-video w-full'
                )}
              >
                <img
                  src={config.url}
                  alt={mediaCopy.previewAlt}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: config.focalPoint
                      ? `${config.focalPoint.x}% ${config.focalPoint.y}%`
                      : 'center',
                  }}
                />
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenFocalPointDialog}
                    className="h-8 w-8 rounded-full bg-background/90 text-foreground shadow-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"
                    aria-label={mediaCopy.focalPointSet}
                  >
                    <Focus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleButtonClick}
                    className="h-8 w-8 rounded-full bg-background/90 text-foreground shadow-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"
                    aria-label={mediaCopy.replace}
                  >
                    <UploadCloud className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="h-8 w-8 rounded-full bg-background/90 text-destructive shadow-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"
                    aria-label={mediaCopy.remove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-[var(--cursor-interactive)] hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
              onClick={handleButtonClick}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              data-testid="media-upload-area"
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {mediaCopy.drop}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleButtonClick()
                }}
              >
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                {mediaCopy.upload}
              </Button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            data-testid="media-file-input"
          />
          <div className="space-y-2 pt-1">
            <Label>{mediaCopy.imageOrientation}</Label>
            <div
              role="group"
              aria-label={mediaCopy.imageOrientation}
              className="flex items-center gap-1 bg-muted rounded-lg p-1"
            >
              <button
                type="button"
                aria-label={mediaCopy.orientationHorizontal}
                aria-pressed={imageOrientation === 'horizontal'}
                onClick={() => onChange({ orientation: 'horizontal' })}
                className={cn(
                  'flex-1 flex items-center justify-center rounded-md px-3 py-1.5 text-xs transition-colors',
                  imageOrientation === 'horizontal'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <RectangleHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={mediaCopy.orientationVertical}
                aria-pressed={imageOrientation === 'vertical'}
                onClick={() => onChange({ orientation: 'vertical' })}
                className={cn(
                  'flex-1 flex items-center justify-center rounded-md px-3 py-1.5 text-xs transition-colors',
                  imageOrientation === 'vertical'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <RectangleVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video URL input */}
      {config.type === 'video' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="media-url">{mediaCopy.videoUrlLabel}</Label>
            <Input
              id="media-url"
              type="url"
              value={config.url || ''}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder={mediaCopy.videoUrlPlaceholder}
            />
          </div>

          {/* Custom thumbnail upload */}
          <div className="space-y-2">
            <SectionTitle>{mediaCopy.thumbnailSection}</SectionTitle>
            <p className="text-xs text-muted-foreground">
              {mediaCopy.thumbnailHint}
            </p>

            {config.videoThumbnail ? (
              <div className="space-y-2">
                {/* Thumbnail preview */}
                <div
                  className={cn(
                    'relative rounded-lg overflow-hidden border border-border',
                    thumbnailOrientation === 'vertical'
                      ? 'aspect-[3/4] w-full max-w-[var(--media-portrait-max-width)] mx-auto'
                      : 'aspect-video w-full'
                  )}
                >
                  <img
                    src={config.videoThumbnail}
                    alt={mediaCopy.previewAlt}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: config.videoThumbnailFocalPoint
                        ? `${config.videoThumbnailFocalPoint.x}% ${config.videoThumbnailFocalPoint.y}%`
                        : 'center',
                    }}
                  />
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Film className="w-4 h-4 text-gray-900" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenThumbnailFocalPointDialog}
                      className="h-8 w-8 rounded-full bg-background/90 text-foreground shadow-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"
                      aria-label={mediaCopy.focalPointSet}
                    >
                      <Focus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleThumbnailButtonClick}
                      className="h-8 w-8 rounded-full bg-background/90 text-foreground shadow-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"
                      aria-label={mediaCopy.replace}
                    >
                      <UploadCloud className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="h-8 w-8 rounded-full bg-background/90 text-destructive shadow-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors"
                      aria-label={mediaCopy.remove}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail orientation toggle */}
                <div className="space-y-2 pt-1">
                  <Label>{mediaCopy.thumbnailOrientation}</Label>
                  <div
                    role="group"
                    aria-label={mediaCopy.thumbnailOrientation}
                    className="flex items-center gap-1 bg-muted rounded-lg p-1"
                  >
                    <button
                      type="button"
                      aria-label={mediaCopy.orientationHorizontal}
                      aria-pressed={thumbnailOrientation === 'horizontal'}
                      onClick={() => onChange({ videoThumbnailOrientation: 'horizontal' })}
                      className={cn(
                        'flex-1 flex items-center justify-center rounded-md px-3 py-1.5 text-xs transition-colors',
                        thumbnailOrientation === 'horizontal'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <RectangleHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={mediaCopy.orientationVertical}
                      aria-pressed={thumbnailOrientation === 'vertical'}
                      onClick={() => onChange({ videoThumbnailOrientation: 'vertical' })}
                      className={cn(
                        'flex-1 flex items-center justify-center rounded-md px-3 py-1.5 text-xs transition-colors',
                        thumbnailOrientation === 'vertical'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <RectangleVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 cursor-[var(--cursor-interactive)] hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
                onClick={handleThumbnailButtonClick}
                onDrop={handleThumbnailDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                data-testid="thumbnail-upload-area"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center">
                  {mediaCopy.thumbnailDrop}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleThumbnailButtonClick()
                  }}
                >
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                  {mediaCopy.upload}
                </Button>
              </div>
            )}

            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleThumbnailSelect(e.target.files)}
              data-testid="thumbnail-file-input"
            />
          </div>
        </div>
      )}

      {/* Focal Point Dialog (for images) */}
      <Dialog open={focalPointDialogOpen} onOpenChange={setFocalPointDialogOpen}>
        <DialogContent className="sm:max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{mediaCopy.focalPoint}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {mediaCopy.focalPointHint}
            </p>
            {config.url && (
              <FocalPointSelector
                imageUrl={config.url}
                focalPoint={tempFocalPoint}
                onChange={setTempFocalPoint}
                className="w-full h-[50vh] bg-muted/50 rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFocalPointDialogOpen(false)}
            >
              {messages.common?.buttons?.cancel || 'Cancel'}
            </Button>
            <Button onClick={handleSaveFocalPoint}>
              {messages.common?.buttons?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Focal Point Dialog (for video thumbnails) */}
      <Dialog open={thumbnailFocalPointDialogOpen} onOpenChange={setThumbnailFocalPointDialogOpen}>
        <DialogContent className="sm:max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{mediaCopy.focalPoint}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {mediaCopy.focalPointHint}
            </p>
            {config.videoThumbnail && (
              <FocalPointSelector
                imageUrl={config.videoThumbnail}
                focalPoint={tempThumbnailFocalPoint}
                onChange={setTempThumbnailFocalPoint}
                className="w-full h-[50vh] bg-muted/50 rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setThumbnailFocalPointDialogOpen(false)}
            >
              {messages.common?.buttons?.cancel || 'Cancel'}
            </Button>
            <Button onClick={handleSaveThumbnailFocalPoint}>
              {messages.common?.buttons?.save || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
