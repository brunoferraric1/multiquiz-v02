'use client'

import { useState, useMemo, ReactNode, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'
import { Smartphone, Monitor, Save, Check, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BrandKitColors } from '@/types'

type DeviceType = 'mobile' | 'desktop'
type ThemeStyle = CSSProperties & Record<`--${string}`, string>

// Color utility functions (same as blocks-quiz-player.tsx)
const DARK_TEXT = '#0f172a'
const LIGHT_TEXT = '#f8fafc'
const WHITE_HEX = '#ffffff'
const BLACK_HEX = '#000000'

const hexToRgb = (value: string) => {
  const normalized = value.trim().replace('#', '')
  if (normalized.length !== 6) return null
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null
  return { r, g, b }
}

const relativeLuminance = (value: string) => {
  const rgb = hexToRgb(value)
  if (!rgb) return 0
  const transform = (channel: number) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }
  const r = transform(rgb.r)
  const g = transform(rgb.g)
  const b = transform(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const getReadableTextColor = (value: string) => {
  return relativeLuminance(value) > 0.6 ? DARK_TEXT : LIGHT_TEXT
}

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (channel: number) => clampChannel(channel).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const mixColors = (base: string, target: string, amount: number) => {
  const baseRgb = hexToRgb(base)
  const targetRgb = hexToRgb(target)
  if (!baseRgb || !targetRgb) return base
  const mix = (from: number, to: number) => from + (to - from) * amount
  return rgbToHex(
    mix(baseRgb.r, targetRgb.r),
    mix(baseRgb.g, targetRgb.g),
    mix(baseRgb.b, targetRgb.b)
  )
}

const getCardBorder = (cardColor: string) => {
  const cardLum = relativeLuminance(cardColor)
  const target = cardLum < 0.5 ? WHITE_HEX : BLACK_HEX
  const amount = cardLum < 0.5 ? 0.12 : 0.08
  return mixColors(cardColor, target, amount)
}

interface BuilderPreviewProps {
  device?: DeviceType
  onDeviceChange?: (device: DeviceType) => void
  children?: ReactNode
  onClick?: () => void
  saveStatus?: 'idle' | 'saving' | 'saved'
  onPreview?: () => void
  isPreviewing?: boolean
  themeColors?: BrandKitColors | null
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
    const mutedForeground = mixColors(
      getReadableTextColor(backgroundColor),
      backgroundColor,
      0.45
    )

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
      {/* Top toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
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
        className="flex-1 flex flex-col items-center justify-center p-4 pb-14 overflow-hidden"
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
