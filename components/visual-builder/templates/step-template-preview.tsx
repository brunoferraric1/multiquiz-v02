'use client'

import { cn } from '@/lib/utils'

export type StepTemplate = 'blank' | 'intro' | 'question' | 'promo' | 'lead-gen' | 'loading'

interface StepTemplatePreviewProps {
  template: StepTemplate
  className?: string
}

/**
 * StepTemplatePreview - Wireframe preview showing block arrangement for each template
 *
 * Uses simple divs/SVG to represent blocks in a miniature layout.
 * Approximately 80x100px preview area.
 */
export function StepTemplatePreview({ template, className }: StepTemplatePreviewProps) {
  return (
    <div
      className={cn(
        'w-20 h-24 rounded-md border border-border/50 bg-muted/30 p-1.5 flex flex-col gap-1',
        className
      )}
    >
      {getPreviewBlocks(template)}
    </div>
  )
}

function getPreviewBlocks(template: StepTemplate) {
  switch (template) {
    case 'blank':
      return <BlankPreview />
    case 'intro':
      return <IntroPreview />
    case 'question':
      return <QuestionPreview />
    case 'promo':
      return <PromoPreview />
    case 'lead-gen':
      return <LeadGenPreview />
    case 'loading':
      return <LoadingPreview />
    default:
      return null
  }
}

// Wireframe block components
function HeaderBlock({ short = false }: { short?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className={cn('h-1.5 bg-foreground/20 rounded-sm', short ? 'w-1/2' : 'w-3/4')} />
      <div className="h-1 w-full bg-muted-foreground/15 rounded-sm" />
    </div>
  )
}

function MediaBlock() {
  return (
    <div className="h-6 w-full bg-primary/10 rounded-sm flex items-center justify-center">
      <div className="w-3 h-3 border border-primary/30 rounded-sm" />
    </div>
  )
}

function OptionsBlock() {
  return (
    <div className="flex flex-col gap-0.5 flex-1">
      <div className="h-2 w-full bg-muted-foreground/20 rounded-sm" />
      <div className="h-2 w-full bg-muted-foreground/20 rounded-sm" />
      <div className="h-2 w-full bg-muted-foreground/20 rounded-sm" />
    </div>
  )
}

function ButtonBlock() {
  return <div className="h-2 w-full bg-primary/40 rounded-sm" />
}

function FieldsBlock() {
  return (
    <div className="flex flex-col gap-0.5 flex-1">
      <div className="h-2 w-full bg-muted-foreground/15 rounded-sm border border-muted-foreground/20" />
      <div className="h-2 w-full bg-muted-foreground/15 rounded-sm border border-muted-foreground/20" />
    </div>
  )
}

function BannerBlock() {
  return <div className="h-1.5 w-full bg-yellow-500/30 rounded-sm" />
}

function TextBlock() {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="h-1 w-full bg-muted-foreground/15 rounded-sm" />
      <div className="h-1 w-3/4 bg-muted-foreground/15 rounded-sm" />
    </div>
  )
}

function ListBlock() {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        <div className="w-1 h-1 rounded-full bg-primary/40" />
        <div className="h-1 flex-1 bg-muted-foreground/15 rounded-sm" />
      </div>
      <div className="flex items-center gap-0.5">
        <div className="w-1 h-1 rounded-full bg-primary/40" />
        <div className="h-1 flex-1 bg-muted-foreground/15 rounded-sm" />
      </div>
    </div>
  )
}

// Template-specific previews
function BlankPreview() {
  return (
    <>
      <HeaderBlock short />
      <div className="flex-1 border border-dashed border-muted-foreground/20 rounded-sm" />
    </>
  )
}

function IntroPreview() {
  return (
    <>
      <MediaBlock />
      <HeaderBlock />
      <div className="flex-1" />
      <ButtonBlock />
    </>
  )
}

function QuestionPreview() {
  return (
    <>
      <HeaderBlock />
      <OptionsBlock />
    </>
  )
}

function PromoPreview() {
  return (
    <>
      <BannerBlock />
      <MediaBlock />
      <HeaderBlock short />
      <TextBlock />
      <ListBlock />
      <ButtonBlock />
    </>
  )
}

function LeadGenPreview() {
  return (
    <>
      <HeaderBlock />
      <FieldsBlock />
      <div className="flex-1" />
      <ButtonBlock />
    </>
  )
}

function LoadingPreview() {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        {/* Spinner circle */}
        <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary" />
        {/* Text line */}
        <div className="h-1 w-3/4 bg-muted-foreground/15 rounded-sm" />
      </div>
    </>
  )
}
