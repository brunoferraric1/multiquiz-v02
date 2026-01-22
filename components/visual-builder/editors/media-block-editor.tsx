'use client'

import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { SectionTitle } from '@/components/ui/section-title'
import { MediaConfig } from '@/types/blocks'
import { Image, Video, ImageIcon, UploadCloud, Trash2 } from 'lucide-react'
import { useMessages } from '@/lib/i18n/context'

interface MediaBlockEditorProps {
  config: MediaConfig
  onChange: (config: Partial<MediaConfig>) => void
}

export function MediaBlockEditor({ config, onChange }: MediaBlockEditorProps) {
  const messages = useMessages()
  const mediaCopy = messages.visualBuilder.mediaEditor
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    const file = files && files.length > 0 ? files[0] : null
    if (file) {
      // Convert file to data URL for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        // Note: We only update config here. The parent component (BuilderPropertiesPanel)
        // should auto-enable the block when media is uploaded.
        // We signal this by calling onAutoEnable if provided.
        onChange({ url: reader.result as string })
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
        <div>
          <SectionTitle>{mediaCopy.imageSection}</SectionTitle>

          {config.url ? (
            <div className="space-y-2">
              {/* Image preview */}
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={config.url}
                  alt={mediaCopy.previewAlt}
                  className="w-full h-32 object-cover"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleButtonClick}
                >
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                  {mediaCopy.replace}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs text-destructive hover:text-destructive"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {mediaCopy.remove}
                </Button>
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
        </div>
      )}

      {/* Video URL input */}
      {config.type === 'video' && (
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
      )}
    </div>
  )
}
