'use client'

import { useState, useEffect, useRef } from 'react'
import { LoadingConfig } from '@/types/blocks'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'

interface LoadingBlockPreviewProps {
  config: LoadingConfig
  enabled: boolean
}

/**
 * LoadingBlockPreview - Renders a loading indicator block
 *
 * Shows either a progress bar or circular progress with customizable text.
 * This is a cosmetic "thinking" animation, not actual loading state.
 * In the editor preview, it shows a looping animation.
 */
export function LoadingBlockPreview({ config, enabled }: LoadingBlockPreviewProps) {
  const messages = useMessages()
  const loadingCopy = messages.visualBuilder.loadingEditor
  const { text, style, duration = 3 } = config

  const displayText = text || loadingCopy?.textPlaceholder || 'Analisando...'

  return (
    <div className={cn('p-6', !enabled && 'opacity-50')}>
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {/* Loading indicator */}
        {style === 'bar' ? (
          <BarIndicator duration={duration} />
        ) : (
          <CircleIndicator duration={duration} />
        )}

        {/* Text */}
        <p className="text-sm text-muted-foreground font-medium">{displayText}</p>
      </div>
    </div>
  )
}

/**
 * Bar progress indicator - animated horizontal bar that fills and resets
 */
function BarIndicator({ duration }: { duration: number }) {
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const durationMs = duration * 1000
    const updateInterval = 50

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = (elapsed / durationMs) * 100

      if (newProgress >= 100) {
        // Reset for looping in preview
        startTimeRef.current = Date.now()
        setProgress(0)
      } else {
        setProgress(newProgress)
      }
    }, updateInterval)

    return () => clearInterval(intervalId)
  }, [duration])

  return (
    <div className="w-full max-w-xs">
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${Math.max(progress, 2)}%`,
            backgroundColor: 'hsl(var(--primary))',
          }}
        />
      </div>
    </div>
  )
}

/**
 * Circle progress indicator - animated circular progress that fills and resets
 */
function CircleIndicator({ duration }: { duration: number }) {
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const circumference = 2 * Math.PI * 20

  useEffect(() => {
    const durationMs = duration * 1000
    const updateInterval = 50

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = (elapsed / durationMs) * 100

      if (newProgress >= 100) {
        // Reset for looping in preview
        startTimeRef.current = Date.now()
        setProgress(0)
      } else {
        setProgress(newProgress)
      }
    }, updateInterval)

    return () => clearInterval(intervalId)
  }, [duration])

  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative w-12 h-12">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 100ms linear' }}
        />
      </svg>
    </div>
  )
}
