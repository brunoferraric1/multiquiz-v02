'use client'

import { cn } from '@/lib/utils'
import { Plus, Play, HelpCircle, Users, Gift, BarChart3, Trash2 } from 'lucide-react'
import { GhostAddButton } from '@/components/ui/ghost-add-button'
import { SectionTitle } from '@/components/ui/section-title'
import { useMessages } from '@/lib/i18n/context'

export type StepType = 'intro' | 'question' | 'lead-gen' | 'promo' | 'result'

export interface Step {
  id: string
  type: StepType
  label: string
  isFixed?: boolean
  subtitle?: string
}

export interface Outcome {
  id: string
  name: string
}

interface BuilderSidebarProps {
  steps?: Step[]
  outcomes?: Outcome[]
  activeStepId?: string
  selectedOutcomeId?: string
  onStepSelect?: (stepId: string) => void
  onOutcomeSelect?: (outcomeId: string) => void
  onAddStep?: () => void
  onAddOutcome?: () => void
  onDeleteStep?: (stepId: string) => void
  onDeleteOutcome?: (outcomeId: string) => void
}

const stepTypeIcons: Record<StepType, React.ReactNode> = {
  intro: <Play className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  'lead-gen': <Users className="w-4 h-4" />,
  promo: <Gift className="w-4 h-4" />,
  result: <BarChart3 className="w-4 h-4" />,
}

export function BuilderSidebar({
  steps = [],
  outcomes = [],
  activeStepId,
  selectedOutcomeId,
  onStepSelect,
  onOutcomeSelect,
  onAddStep,
  onAddOutcome,
  onDeleteStep,
  onDeleteOutcome,
}: BuilderSidebarProps) {
  const messages = useMessages()
  const copy = messages.visualBuilder
  const regularSteps = steps.filter(s => s.type !== 'result')
  const resultStep = steps.find(s => s.type === 'result')
  const isResultActive = activeStepId === resultStep?.id

  return (
    <aside
      data-testid="left-sidebar"
      className="w-64 bg-card border-r flex flex-col overflow-hidden shrink-0"
    >
      {/* Add step button */}
      <div className="p-3 border-b">
        <GhostAddButton
          onClick={onAddStep}
          aria-label={copy.sidebar.addStep}
        >
          {copy.sidebar.addStep}
        </GhostAddButton>
      </div>

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto">
        <div data-testid="steps-list" className="p-2 space-y-1">
          {regularSteps.map((step, index) => {
            const isActive = activeStepId === step.id
            const stepNumber = index + 1

            return (
              <div
                key={step.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={() => onStepSelect?.(step.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onStepSelect?.(step.id)
                  }
                }}
                className={cn(
                  'group w-full flex items-start gap-3 p-2.5 rounded-lg transition-all text-left',
                  isActive
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/60 border border-transparent'
                )}
              >
                {/* Step icon badge */}
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium shrink-0',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {stepTypeIcons[step.type]}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-sm font-medium truncate',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {stepNumber}. {step.label}
                  </div>
                  {step.subtitle && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {step.subtitle}
                    </div>
                  )}
                </div>

                {/* Delete button (not for fixed steps) */}
                {!step.isFixed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteStep?.(step.id)
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`${copy.itemActions.delete} ${step.label}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Separator */}
        <div className="mx-4 my-2 border-t" />

        {/* Results section */}
        <div data-testid="results-section" className="p-2">
          <div className="flex items-center justify-between px-2.5 mb-2">
            <SectionTitle className="mb-0">{copy.sidebar.results}</SectionTitle>
            <button
              onClick={onAddOutcome}
              className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
              aria-label={copy.sidebar.addOutcome}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {outcomes.length === 0 ? (
            <button
              onClick={() => {
                if (resultStep) onStepSelect?.(resultStep.id)
              }}
              className={cn(
                'w-full flex items-center gap-3 p-2.5 rounded-lg transition-all',
                isResultActive
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-muted/60 border border-transparent'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  isResultActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {stepTypeIcons.result}
              </div>
                <span
                  className={cn(
                    'text-sm',
                    isResultActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {copy.sidebar.emptyResults}
                </span>
              </button>
            ) : (
            <div className="space-y-1">
              {outcomes.map((outcome, index) => {
                const isOutcomeActive = isResultActive && selectedOutcomeId === outcome.id
                const letter = String.fromCharCode(65 + index)

                return (
                  <div
                    key={outcome.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isOutcomeActive}
                    onClick={() => {
                      if (resultStep) onStepSelect?.(resultStep.id)
                      onOutcomeSelect?.(outcome.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (resultStep) onStepSelect?.(resultStep.id)
                        onOutcomeSelect?.(outcome.id)
                      }
                    }}
                    className={cn(
                      'group w-full flex items-start gap-3 p-2.5 rounded-lg transition-all text-left',
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
                          isOutcomeActive ? 'text-primary font-medium' : 'text-foreground'
                        )}
                      >
                        {outcome.name || `${copy.sidebar.outcomeLabel} ${index + 1}`}
                      </div>
                    </div>
                    {outcomes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteOutcome?.(outcome.id)
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`${copy.itemActions.delete} ${outcome.name || `${copy.sidebar.outcomeLabel} ${index + 1}`}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
