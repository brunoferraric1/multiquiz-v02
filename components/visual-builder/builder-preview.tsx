'use client'

import { useState, useMemo, ReactNode, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'
import { Smartphone, Monitor, Save, Check, Loader2, Play, AlertTriangle, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSelectorDropdown } from './theme-selector-dropdown'
import type { BrandKitColors } from '@/types'
import {
  getReadableTextColor,
  getCardBorder,
  getMutedForeground,
} from '@/lib/utils/color'

type DeviceType = 'mobile' | 'desktop'
type ThemeStyle = CSSProperties & Record<`--${string}`, string>

interface BuilderPreviewProps {
  device?: DeviceType
  onDeviceChange?: (device: DeviceType) => void
  children?: ReactNode
  onClick?: () => void
  saveStatus?: 'idle' | 'saving' | 'saved'
  onPreview?: () => void
  isPreviewing?: boolean
  themeColors?: BrandKitColors | null
  onThemeChange?: (colors: BrandKitColors) => void
  hasUnpublishedChanges?: boolean
  onUndoChanges?: () => void
}

const DEVICE_WIDTHS: Record<DeviceType, number> = {
  mobile: 375,
  desktop: 600,
}

export function BuilderPreview({
  device: controlledDevice,
  onDeviceChange,
  children,
  onClick,
  saveStatus = 'idle',
  onPreview,
  isPreviewing = false,
  themeColors,
  onThemeChange,
  hasUnpublishedChanges = false,
  onUndoChanges,
}: BuilderPreviewProps) {
  const messages = useMessages()
  const previewCopy = messages.visualBuilder.preview
  const headerCopy = messages.visualBuilder.header
  const [internalDevice, setInternalDevice] = useState<DeviceType>('mobile')

  const device = controlledDevice ?? internalDevice
  const isSaving = saveStatus === 'saving'
  const isSaved = saveStatus === 'saved'
  const statusLabel = isSaving ? 'Salvando...' : isSaved ? 'Salvo' : 'Auto save'

  const handleDeviceChange = (newDevice: DeviceType) => {
    setInternalDevice(newDevice)
    onDeviceChange?.(newDevice)
  }

  // Calculate theme styles for the preview
  const themeStyle = useMemo((): ThemeStyle | undefined => {
    if (!themeColors) return undefined

    const primary = themeColors.primary
    const cardColor = themeColors.secondary
    const backgroundColor = themeColors.accent
    const cardBorder = getCardBorder(cardColor)
    const mutedForeground = getMutedForeground(backgroundColor)

    return {
      '--color-primary': primary,
      '--color-primary-foreground': getReadableTextColor(primary),
      '--color-secondary': cardColor,
      '--color-secondary-foreground': getReadableTextColor(cardColor),
      '--color-background': backgroundColor,
      '--color-foreground': getReadableTextColor(backgroundColor),
      '--color-muted-foreground': mutedForeground,
      '--color-card': cardColor,
      '--color-card-foreground': getReadableTextColor(cardColor),
      '--color-border': cardBorder,
    }
  }, [themeColors])

  return (
    <main
      data-testid="center-preview"
      className="flex-1 flex flex-col bg-muted/50 overflow-hidden relative"
    >
      {/* Unpublished changes banner - above toolbar */}
      {hasUnpublishedChanges && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-orange-100 px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-orange-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>{headerCopy.unpublishedChanges}</span>
          </div>
          <button
            onClick={onUndoChanges}
            className="flex items-center gap-1.5 text-sm text-orange-700 hover:text-orange-900 font-medium transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            {headerCopy.undoChanges}
          </button>
        </div>
      )}

      {/* Top toolbar */}
      <div className={cn(
        "absolute left-4 right-4 z-10 flex items-center justify-between",
        hasUnpublishedChanges ? "top-14" : "top-4"
      )}>
        {/* Device toggle */}
        <div className="flex items-center gap-1 bg-card rounded-lg shadow-md p-1">
          <button
            onClick={() => handleDeviceChange('mobile')}
            aria-label={previewCopy.mobile}
            aria-pressed={device === 'mobile'}
            className={cn(
              'py-1.5 px-2 rounded-md transition-all',
              device === 'mobile'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted/60'
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeviceChange('desktop')}
            aria-label={previewCopy.desktop}
            aria-pressed={device === 'desktop'}
            className={cn(
              'py-1.5 px-2 rounded-md transition-all',
              device === 'desktop'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted/60'
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme selector */}
        <ThemeSelectorDropdown onThemeChange={onThemeChange} />

        {/* Preview button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="flex items-center gap-2 bg-card shadow-md h-auto py-1.5 px-3"
          aria-label={headerCopy.aria.preview}
          disabled={isPreviewing}
        >
          {isPreviewing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span className="text-xs font-medium">
            {isPreviewing ? headerCopy.actions.previewing : headerCopy.actions.preview}
          </span>
        </Button>
      </div>

      {/* Preview container - applies theme background */}
      <div
        data-testid="preview-container"
        className={cn(
          "flex-1 flex flex-col items-center justify-center px-4 pb-14 overflow-hidden",
          hasUnpublishedChanges ? "pt-24" : "pt-16"
        )}
        style={themeStyle ? { backgroundColor: 'var(--color-background)', ...themeStyle } : undefined}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClick?.()
          }
        }}
      >
        {/* Preview card - applies theme card color */}
        <div
          data-testid="preview-card"
          className={cn(
            'rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto',
            !themeStyle && 'bg-card'
          )}
          style={{
            width: DEVICE_WIDTHS[device],
            ...(themeStyle ? {
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-card-foreground)',
            } : {})
          }}
        >
          {children || (
            <div className="p-6 text-center text-muted-foreground">
              {previewCopy.empty}
            </div>
          )}
        </div>
      </div>
      {/* Save status indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none z-10">
        {isSaving ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isSaved ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <Save className="w-3 h-3" />
        )}
        <span className="text-muted-foreground">{statusLabel}</span>
      </div>
    </main>
  )
}
