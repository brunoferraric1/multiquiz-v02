'use client'

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Smartphone, Monitor } from 'lucide-react'

type DeviceType = 'mobile' | 'desktop'

interface BuilderPreviewProps {
  device?: DeviceType
  onDeviceChange?: (device: DeviceType) => void
  children?: ReactNode
  onClick?: () => void
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
}: BuilderPreviewProps) {
  const [internalDevice, setInternalDevice] = useState<DeviceType>('mobile')

  const device = controlledDevice ?? internalDevice

  const handleDeviceChange = (newDevice: DeviceType) => {
    setInternalDevice(newDevice)
    onDeviceChange?.(newDevice)
  }

  return (
    <main
      data-testid="center-preview"
      className="flex-1 flex flex-col bg-muted/50 overflow-hidden relative"
    >
      {/* Device toggle */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-card rounded-lg shadow-md p-1">
        <button
          onClick={() => handleDeviceChange('mobile')}
          aria-label="Mobile view"
          aria-pressed={device === 'mobile'}
          className={cn(
            'p-2.5 rounded-md transition-all',
            device === 'mobile'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-muted/60'
          )}
        >
          <Smartphone className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleDeviceChange('desktop')}
          aria-label="Desktop view"
          aria-pressed={device === 'desktop'}
          className={cn(
            'p-2.5 rounded-md transition-all',
            device === 'desktop'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-muted/60'
          )}
        >
          <Monitor className="w-5 h-5" />
        </button>
      </div>

      {/* Preview container */}
      <div
        data-testid="preview-container"
        className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClick?.()
          }
        }}
      >
        {/* Preview card */}
        <div
          data-testid="preview-card"
          className="bg-card rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto"
          style={{ width: DEVICE_WIDTHS[device] }}
        >
          {children || (
            <div className="p-6 text-center text-muted-foreground">
              Preview content will appear here
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
