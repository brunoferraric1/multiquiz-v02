'use client'

import { useState } from 'react'
import { useVisualBuilderStore, createOutcome } from '@/store/visual-builder-store'
import { BuilderHeaderNav } from './builder-header-nav'
import { BuilderPreview } from './builder-preview'
import { ConnectedPropertiesPanel } from './connected-properties-panel'
import { AddStepSheet } from './add-step-sheet'
import { AddBlockSheet } from './add-block-sheet'
import { SortableStepsList } from './sortable-steps-list'
import { SortableOutcomesList } from './sortable-outcomes-list'
import { StepPreview } from './step-preview'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/i18n/context'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import { SectionTitle } from '@/components/ui/section-title'
import { Play } from 'lucide-react'
import { HeaderConfig } from '@/types/blocks'
import type { BrandKitColors } from '@/types'

interface ConnectedVisualBuilderProps {
  quizName?: string
  quizId?: string
  onBack?: () => void
  onPreview?: () => void
  onPublish?: () => void
  onUndoChanges?: () => void
  isPublishing?: boolean
  isPublished?: boolean
  hasUnpublishedChanges?: boolean
  isPreviewing?: boolean
  isBackSaving?: boolean
  themeColors?: BrandKitColors | null
  onThemeChange?: (colors: BrandKitColors) => void
}

/**
 * ConnectedVisualBuilder - Store-connected version of the visual builder
 *
 * This is the main component that orchestrates all the visual builder pieces,
 * reading state from and dispatching actions to the Zustand store.
 */
export function ConnectedVisualBuilder({
  quizName = 'Meu Quiz',
  quizId,
  onBack,
  onPreview,
  onPublish,
  onUndoChanges,
  isPublishing = false,
  isPublished = false,
  hasUnpublishedChanges = false,
  isPreviewing = false,
  isBackSaving = false,
  themeColors,
  onThemeChange,
}: ConnectedVisualBuilderProps) {
  const messages = useMessages()
  const copy = messages.visualBuilder
  // Local UI state
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')

  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)

  // Get actions from store
  const setActiveStepId = useVisualBuilderStore((state) => state.setActiveStepId)
  const setSelectedBlockId = useVisualBuilderStore((state) => state.setSelectedBlockId)
  const setAddStepSheetOpen = useVisualBuilderStore((state) => state.setAddStepSheetOpen)
  const addOutcome = useVisualBuilderStore((state) => state.addOutcome)

  // Find intro step
  const introStep = steps.find((s) => s.type === 'intro')
  const isIntroActive = activeStepId === introStep?.id

  // Compute quiz title from intro step header block (for instant updates)
  const computedQuizTitle = (() => {
    if (!introStep) return quizName
    const headerBlock = introStep.blocks?.find((b) => b.type === 'header')
    const headerTitle = headerBlock ? (headerBlock.config as HeaderConfig).title : undefined
    return headerTitle || quizName
  })()

  // Handlers
  const handleAddStep = () => {
    setAddStepSheetOpen(true)
  }

  const handleAddOutcome = () => {
    const newOutcome = createOutcome('', copy)
    addOutcome(newOutcome, copy)
  }

  return (
    <div
      data-testid="visual-builder"
      className="h-screen flex flex-col bg-muted overflow-hidden"
    >
      {/* HEADER */}
      <BuilderHeaderNav
        quizName={computedQuizTitle}
        quizId={quizId}
        onBack={onBack}
        onPublish={onPublish}
        isPublishing={isPublishing}
        isPublished={isPublished}
        hasUnpublishedChanges={hasUnpublishedChanges}
        isBackSaving={isBackSaving}
      />

      {/* MAIN CONTENT - Three column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Steps list */}
        <aside
          data-testid="left-sidebar"
          className="w-64 bg-card border-r flex flex-col overflow-hidden shrink-0"
        >
          {/* Single scrollable area for all sections */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Introdução section */}
            {introStep && (
              <div className="p-3 pb-2">
                <SectionTitle className="mb-2">{copy.sidebar.intro}</SectionTitle>
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isIntroActive}
                  onClick={() => setActiveStepId(introStep.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveStepId(introStep.id)
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                    isIntroActive
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/50 hover:bg-muted/80 border border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                      isIntroActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Play className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                      className={cn(
                        'text-sm font-medium truncate',
                        isIntroActive ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {introStep.label}
                    </div>
                    {(() => {
                      const headerBlock = introStep.blocks?.find(b => b.type === 'header')
                      const headerTitle = headerBlock ? (headerBlock.config as HeaderConfig).title : undefined
                      const subtitle = headerTitle || introStep.subtitle
                      return subtitle ? (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {subtitle}
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Etapas section */}
            <div className="px-3 pb-2">
              <SectionTitle className="mb-2">{copy.sidebar.steps}</SectionTitle>
              <SortableStepsList />
              {/* Add step button - below the list */}
              <GhostAddButton
                size="compact"
                className="mt-2"
                onClick={handleAddStep}
                aria-label={copy.sidebar.addStep}
              >
                {copy.sidebar.addStep}
              </GhostAddButton>
            </div>

            {/* Results section */}
            <div data-testid="results-section" className="px-3 pt-4 pb-3">
              <SectionTitle className="mb-2">{copy.sidebar.results}</SectionTitle>

              <SortableOutcomesList />

              {/* Add resultado button - below the list */}
              <GhostAddButton
                size="compact"
                className="mt-2"
                onClick={handleAddOutcome}
                aria-label={copy.sidebar.addOutcome}
              >
                {copy.sidebar.addOutcome}
              </GhostAddButton>
            </div>
          </div>
        </aside>

        {/* CENTER - Preview area */}
        <BuilderPreview
          device={device}
          onDeviceChange={setDevice}
          onClick={() => setSelectedBlockId(undefined)}
          onPreview={onPreview}
          isPreviewing={isPreviewing}
          themeColors={themeColors}
          onThemeChange={onThemeChange}
          hasUnpublishedChanges={hasUnpublishedChanges}
          onUndoChanges={onUndoChanges}
        >
          <StepPreview />
        </BuilderPreview>

        {/* RIGHT PANEL - Properties */}
        <ConnectedPropertiesPanel className="hidden md:flex" />
      </div>

      {/* Add Step Sheet */}
      <AddStepSheet />

      {/* Add Block Sheet */}
      <AddBlockSheet />
    </div>
  )
}
