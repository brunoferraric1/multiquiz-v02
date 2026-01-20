'use client'

import { useState } from 'react'
import { useVisualBuilderStore, createOutcome } from '@/store/visual-builder-store'
import { BuilderHeaderNav, HeaderTab } from './builder-header-nav'
import { BuilderPreview } from './builder-preview'
import { ConnectedPropertiesPanel } from './connected-properties-panel'
import { AddStepSheet } from './add-step-sheet'
import { AddBlockSheet } from './add-block-sheet'
import { SortableStepsList } from './sortable-steps-list'
import { StepPreview } from './step-preview'
import { cn } from '@/lib/utils'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import { Trash2, Play } from 'lucide-react'
import { HeaderConfig } from '@/types/blocks'

interface ConnectedVisualBuilderProps {
  quizName?: string
  onBack?: () => void
  onPreview?: () => void
  onPublish?: () => void
}

/**
 * ConnectedVisualBuilder - Store-connected version of the visual builder
 *
 * This is the main component that orchestrates all the visual builder pieces,
 * reading state from and dispatching actions to the Zustand store.
 */
export function ConnectedVisualBuilder({
  quizName = 'Meu Quiz',
  onBack,
  onPreview,
  onPublish,
}: ConnectedVisualBuilderProps) {
  // Local UI state
  const [activeTab, setActiveTab] = useState<HeaderTab>('editar')
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')

  // Read state from store
  const steps = useVisualBuilderStore((state) => state.steps)
  const outcomes = useVisualBuilderStore((state) => state.outcomes)
  const activeStepId = useVisualBuilderStore((state) => state.activeStepId)
  const selectedOutcomeId = useVisualBuilderStore((state) => state.selectedOutcomeId)

  // Get actions from store
  const setActiveStepId = useVisualBuilderStore((state) => state.setActiveStepId)
  const setSelectedOutcomeId = useVisualBuilderStore((state) => state.setSelectedOutcomeId)
  const setSelectedBlockId = useVisualBuilderStore((state) => state.setSelectedBlockId)
  const setAddStepSheetOpen = useVisualBuilderStore((state) => state.setAddStepSheetOpen)
  const addOutcome = useVisualBuilderStore((state) => state.addOutcome)
  const deleteOutcome = useVisualBuilderStore((state) => state.deleteOutcome)

  // Find intro and result steps
  const introStep = steps.find((s) => s.type === 'intro')
  const resultStep = steps.find((s) => s.type === 'result')
  const isIntroActive = activeStepId === introStep?.id
  const isResultActive = activeStepId === resultStep?.id

  // Handlers
  const handleAddStep = () => {
    setAddStepSheetOpen(true)
  }

  const handleAddOutcome = () => {
    const newOutcome = createOutcome()
    addOutcome(newOutcome)
  }

  const handleOutcomeSelect = (outcomeId: string) => {
    if (resultStep) {
      setActiveStepId(resultStep.id)
    }
    setSelectedOutcomeId(outcomeId)
  }

  const handleDeleteOutcome = (outcomeId: string) => {
    deleteOutcome(outcomeId)
  }

  return (
    <div
      data-testid="visual-builder"
      className="h-screen flex flex-col bg-muted overflow-hidden"
    >
      {/* HEADER */}
      <BuilderHeaderNav
        quizName={quizName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
        onPreview={onPreview}
        onPublish={onPublish}
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
              <div className="p-2 pr-3">
                <div className="px-2.5 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Introdução
                  </span>
                </div>
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
                    'flex items-center gap-3 p-2.5 rounded-lg transition-all text-left cursor-pointer',
                    isIntroActive
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/60 border border-transparent'
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
            <div className="p-2 pr-3 pt-0">
              <div className="px-2.5 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Etapas
                </span>
              </div>
              <SortableStepsList />
              {/* Add step button - below the list */}
              <div className="mt-2">
                <GhostAddButton
                  onClick={handleAddStep}
                  aria-label="Adicionar etapa"
                >
                  Adicionar etapa
                </GhostAddButton>
              </div>
            </div>

            {/* Results section */}
            <div data-testid="results-section" className="p-2 pr-3 pt-4">
              <div className="px-2.5 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Resultados
                </span>
              </div>

            {outcomes.length > 0 && (
              <div className="space-y-1">
                {outcomes.map((outcome, index) => {
                  const isOutcomeActive =
                    isResultActive && selectedOutcomeId === outcome.id
                  const letter = String.fromCharCode(65 + index)

                  return (
                    <div
                      key={outcome.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isOutcomeActive}
                      onClick={() => handleOutcomeSelect(outcome.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleOutcomeSelect(outcome.id)
                        }
                      }}
                      className={cn(
                        'group w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left cursor-pointer',
                        isOutcomeActive
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/60 border border-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium shrink-0',
                          isOutcomeActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {letter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm truncate',
                            isOutcomeActive
                              ? 'text-primary font-medium'
                              : 'text-foreground'
                          )}
                        >
                          {outcome.name || `Resultado ${index + 1}`}
                        </div>
                      </div>
                      {outcomes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteOutcome(outcome.id)
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Delete ${outcome.name || `Resultado ${index + 1}`}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
              {/* Add resultado button - below the list */}
              <div className="mt-2">
                <GhostAddButton
                  onClick={handleAddOutcome}
                  aria-label="Adicionar resultado"
                >
                  Adicionar resultado
                </GhostAddButton>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER - Preview area */}
        <BuilderPreview
          device={device}
          onDeviceChange={setDevice}
          onClick={() => setSelectedBlockId(undefined)}
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
