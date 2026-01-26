'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ResponsiveDialog = DialogPrimitive.Root

const ResponsiveDialogTrigger = DialogPrimitive.Trigger

interface ResponsiveDialogContentProps {
  children: React.ReactNode
  className?: string
  title: string
  description?: string
}

/**
 * ResponsiveDialogContent - Renders as centered modal on desktop (md+) and bottom drawer on mobile
 *
 * Uses CSS-based responsive styling with Tailwind classes.
 * On mobile (<md): Full-width bottom sheet with slide-up animation
 * On desktop (md+): Centered modal with zoom animation
 */
const ResponsiveDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ResponsiveDialogContentProps
>(({ className, children, title, description }, ref) => {
  return (
    <DialogPrimitive.Portal>
      {/* Overlay */}
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

      {/* Content - responsive: bottom drawer on mobile, centered modal on desktop */}
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Base styles
          'fixed z-50 w-full bg-background shadow-lg border',
          // Mobile (default): bottom drawer
          'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-x-0',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
          'data-[state=open]:duration-300 data-[state=closed]:duration-200',
          // Desktop (md+): centered modal
          'md:inset-auto md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%]',
          'md:max-w-lg md:max-h-[90vh] md:rounded-lg md:border',
          'md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:slide-out-to-bottom-0',
          'md:data-[state=open]:fade-in-0 md:data-[state=closed]:fade-out-0',
          'md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95',
          className
        )}
      >
        {/* Mobile drag handle - hidden on desktop */}
        <div className="flex justify-center py-3 md:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Content wrapper with padding */}
        <div className="px-6 pb-8 pt-0 md:p-6 overflow-y-auto max-h-[calc(85vh-3rem)] md:max-h-[calc(90vh-3rem)]">
          {/* Header */}
          <div className="flex flex-col space-y-1.5 text-left mb-4">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>

          {/* Content */}
          {children}
        </div>

        {/* Close button */}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground md:rounded-sm md:p-0 rounded-full p-1.5 border border-border md:border-0 bg-background md:bg-transparent">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
ResponsiveDialogContent.displayName = 'ResponsiveDialogContent'

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
}
