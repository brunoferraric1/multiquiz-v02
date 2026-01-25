'use client'

import { ReactNode } from 'react'
import { Monitor, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/lib/i18n/context'

interface MobileGateProps {
  children: ReactNode
  onBack?: () => void
}

/**
 * MobileGate - Blocks mobile access to the visual builder
 *
 * Shows a friendly message on mobile screens asking users to use desktop.
 * Renders children (the actual builder) on desktop screens.
 *
 * Uses CSS-based detection with Tailwind responsive classes for
 * immediate rendering without layout shift.
 */
export function MobileGate({ children, onBack }: MobileGateProps) {
  const messages = useMessages()
  const copy = messages.visualBuilder.mobileGate

  return (
    <>
      {/* Mobile view - shown only on small screens */}
      <div className="flex md:hidden min-h-screen bg-muted">
        <div className="flex flex-col items-center justify-center p-6 text-center w-full">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full shadow-lg">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10">
              <Monitor className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-xl font-semibold text-foreground mb-3">
              {copy.title}
            </h1>

            <p className="text-muted-foreground mb-6">
              {copy.description}
            </p>

            {onBack && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {copy.backButton}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop view - hidden on small screens, shown on md+ */}
      <div className="hidden md:contents">
        {children}
      </div>
    </>
  )
}
