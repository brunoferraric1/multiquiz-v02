import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = DialogPrimitive.Root

const SheetTrigger = DialogPrimitive.Trigger

const SheetPortal = DialogPrimitive.Portal

const SheetClose = DialogPrimitive.Close

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'right' | 'bottom'
  }
>(({ className, children, side = 'right', ...props }, ref) => {
  const sideClasses = side === 'bottom'
    ? "inset-x-0 bottom-0 h-auto max-h-[85vh] w-full border-t rounded-t-2xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
    : "inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col bg-background shadow-2xl transition-all duration-200 overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          sideClasses,
          className
        )}
        {...props}
      >
        <div className="flex-1 overflow-y-auto min-h-0 px-7 py-6">
          {children}
        </div>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full border border-border bg-background p-2 sm:p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 z-10 cursor-pointer">
          <X className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="sr-only">Fechar painel</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight", className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = DialogPrimitive.Description.displayName

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col space-y-2", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
}
