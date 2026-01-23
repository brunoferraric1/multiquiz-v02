'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Monitor, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlocksQuizPlayer } from '@/components/quiz/blocks-quiz-player'
import { cn } from '@/lib/utils'
import type { BrandKitColors, Quiz, QuizDraft } from '@/types'

const getReadableTextColor = (hex: string) => {
  const sanitized = hex.replace('#', '')
  if (sanitized.length !== 6) return '#0f172a'
  const r = parseInt(sanitized.slice(0, 2), 16)
  const g = parseInt(sanitized.slice(2, 4), 16)
  const b = parseInt(sanitized.slice(4, 6), 16)
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return '#0f172a'
  const toLinear = (channel: number) => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return luminance > 0.6 ? '#0f172a' : '#f8fafc'
}

type PreviewOverlayProps = {
  open: boolean
  onClose: () => void
  quiz: Quiz | QuizDraft | null
  brandKitColors?: BrandKitColors | null
  brandKitLogoUrl?: string | null
  warningText?: string
}

/**
 * Full-screen preview overlay with optional amber warning banner.
 * Used for previewing quizzes from both the Visual Builder and Reports pages.
 *
 * @example
 * <PreviewOverlay
 *   open={isPreviewOpen}
 *   onClose={() => setIsPreviewOpen(false)}
 *   quiz={quiz}
 *   brandKitColors={brandKitColors}
 *   warningText="Modo Preview — Esta é uma pré-visualização do rascunho"
 * />
 */
export function PreviewOverlay({
  open,
  onClose,
  quiz,
  brandKitColors,
  brandKitLogoUrl,
  warningText,
}: PreviewOverlayProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop')
  const closeButtonStyle =
    quiz?.brandKitMode === 'custom' && brandKitColors?.primary
      ? {
          backgroundColor: brandKitColors.primary,
          color: getReadableTextColor(brandKitColors.primary),
        }
      : undefined
  const controlsOffsetClass = warningText ? 'top-14 sm:top-16' : 'top-4'

  return (
    <AnimatePresence>
      {open && quiz && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 300,
            mass: 0.8,
          }}
          className="fixed inset-0 z-50 flex bg-background/95 backdrop-blur-sm"
        >
          <div className="relative flex h-full w-full flex-col bg-background">
            <div
              className={cn(
                'absolute left-4 right-4 z-20 flex items-center justify-between',
                controlsOffsetClass
              )}
            >
              <div className="flex items-center gap-1 rounded-lg bg-card p-1 shadow-md">
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  aria-label="Visualização mobile"
                  aria-pressed={device === 'mobile'}
                  className={cn(
                    'rounded-md px-2 py-1.5 transition-all',
                    device === 'mobile'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  aria-label="Visualização desktop"
                  aria-pressed={device === 'desktop'}
                  className={cn(
                    'rounded-md px-2 py-1.5 transition-all',
                    device === 'desktop'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 focus-visible:!ring-2 focus-visible:!ring-primary/30"
                style={closeButtonStyle}
                aria-label="Fechar pré-visualização"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </Button>
            </div>

            {warningText && (
              <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium shrink-0">
                {warningText}
              </div>
            )}

            <main className="flex-1 overflow-auto bg-muted/40">
              {device === 'mobile' ? (
                <div className="flex min-h-full items-center justify-center px-4 py-10">
                  <div
                    className="flex flex-none flex-col rounded-[calc(var(--radius-lg)*2.5)] border border-border bg-card p-2 shadow-2xl"
                    style={{
                      width: '360px',
                      height: '680px',
                      maxWidth: '90vw',
                      maxHeight: '76vh',
                    }}
                  >
                    <div className="mx-auto mb-2 mt-1 h-1.5 w-14 flex-none rounded-full bg-muted" />
                    <div className="flex-1 overflow-hidden rounded-[calc(var(--radius-lg)*2)] bg-background">
                      <div className="h-full overflow-y-auto">
                        <BlocksQuizPlayer
                          quiz={quiz}
                          mode="preview"
                          onExit={onClose}
                          brandKitColors={brandKitColors}
                          brandKitLogoUrl={brandKitLogoUrl}
                          layout="embedded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <BlocksQuizPlayer
                  quiz={quiz}
                  mode="preview"
                  onExit={onClose}
                  brandKitColors={brandKitColors}
                  brandKitLogoUrl={brandKitLogoUrl}
                />
              )}
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
