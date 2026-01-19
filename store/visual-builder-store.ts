import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Step types
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

// Store state interface
export interface VisualBuilderState {
  // State
  steps: Step[]
  outcomes: Outcome[]
  activeStepId: string | undefined
  selectedOutcomeId: string | undefined
  isAddStepSheetOpen: boolean

  // Actions - Step management
  setSteps: (steps: Step[]) => void
  addStep: (step: Step, insertAfterStepId?: string) => void
  updateStep: (id: string, updates: Partial<Step>) => void
  deleteStep: (id: string) => void
  duplicateStep: (id: string) => void
  reorderSteps: (fromIndex: number, toIndex: number) => void

  // Actions - Step selection
  setActiveStepId: (stepId: string | undefined) => void

  // Actions - Outcome management
  setOutcomes: (outcomes: Outcome[]) => void
  addOutcome: (outcome: Outcome) => void
  updateOutcome: (id: string, updates: Partial<Outcome>) => void
  deleteOutcome: (id: string) => void
  setSelectedOutcomeId: (outcomeId: string | undefined) => void

  // Actions - UI state
  setAddStepSheetOpen: (isOpen: boolean) => void

  // Actions - Initialization
  initialize: (data: { steps: Step[]; outcomes: Outcome[] }) => void
  reset: () => void
}

// Default initial steps for a new quiz
export const DEFAULT_STEPS: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', isFixed: true },
  { id: 'result', type: 'result', label: 'Resultado', isFixed: true },
]

// Initial state
const initialState = {
  steps: DEFAULT_STEPS,
  outcomes: [],
  activeStepId: 'intro' as string | undefined,
  selectedOutcomeId: undefined as string | undefined,
  isAddStepSheetOpen: false,
}

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Helper to get step label based on type and existing steps
export const getDefaultStepLabel = (type: StepType, steps: Step[]): string => {
  const typeLabels: Record<StepType, string> = {
    intro: 'Intro',
    question: 'Pergunta',
    'lead-gen': 'Captura',
    promo: 'Promoção',
    result: 'Resultado',
  }

  // Count existing steps of the same type (excluding intro and result which are fixed)
  const existingCount = steps.filter(s => s.type === type && !s.isFixed).length

  if (type === 'intro' || type === 'result') {
    return typeLabels[type]
  }

  return existingCount === 0 ? typeLabels[type] : `${typeLabels[type]} ${existingCount + 1}`
}

export const useVisualBuilderStore = create<VisualBuilderState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Step management
      setSteps: (steps) => set({ steps }),

      addStep: (step, insertAfterStepId) => {
        set((state) => {
          const steps = [...state.steps]

          // Find the result step (always last)
          const resultIndex = steps.findIndex(s => s.type === 'result')

          if (insertAfterStepId) {
            // Insert after the specified step
            const insertIndex = steps.findIndex(s => s.id === insertAfterStepId)
            if (insertIndex !== -1 && insertIndex < resultIndex) {
              steps.splice(insertIndex + 1, 0, step)
              return { steps, activeStepId: step.id, isAddStepSheetOpen: false }
            }
          }

          // Default: insert before result step
          if (resultIndex !== -1) {
            steps.splice(resultIndex, 0, step)
          } else {
            // No result step found, just append
            steps.push(step)
          }

          return { steps, activeStepId: step.id, isAddStepSheetOpen: false }
        })
      },

      updateStep: (id, updates) =>
        set((state) => ({
          steps: state.steps.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteStep: (id) =>
        set((state) => {
          const stepToDelete = state.steps.find(s => s.id === id)

          // Cannot delete fixed steps (intro and result)
          if (stepToDelete?.isFixed) {
            return state
          }

          const newSteps = state.steps.filter((s) => s.id !== id)

          // If we deleted the active step, select the previous step or intro
          let newActiveStepId = state.activeStepId
          if (state.activeStepId === id) {
            const deletedIndex = state.steps.findIndex(s => s.id === id)
            if (deletedIndex > 0) {
              newActiveStepId = state.steps[deletedIndex - 1].id
            } else if (newSteps.length > 0) {
              newActiveStepId = newSteps[0].id
            } else {
              newActiveStepId = undefined
            }
          }

          return { steps: newSteps, activeStepId: newActiveStepId }
        }),

      duplicateStep: (id) =>
        set((state) => {
          const stepToDuplicate = state.steps.find(s => s.id === id)

          // Cannot duplicate fixed steps (intro and result)
          if (!stepToDuplicate || stepToDuplicate.isFixed) {
            return state
          }

          const stepIndex = state.steps.findIndex(s => s.id === id)
          const steps = [...state.steps]

          // Create a duplicate with new ID and updated label
          const duplicatedStep: Step = {
            ...stepToDuplicate,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            label: `${stepToDuplicate.label} (cópia)`,
          }

          // Insert after the original step
          steps.splice(stepIndex + 1, 0, duplicatedStep)

          return { steps, activeStepId: duplicatedStep.id }
        }),

      reorderSteps: (fromIndex, toIndex) =>
        set((state) => {
          const steps = [...state.steps]

          // Cannot move fixed steps (intro must stay first, result must stay last)
          const stepToMove = steps[fromIndex]
          if (stepToMove?.isFixed) {
            return state
          }

          // Cannot move to position 0 (intro) or after result
          const introIndex = steps.findIndex(s => s.type === 'intro')
          const resultIndex = steps.findIndex(s => s.type === 'result')

          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= steps.length ||
            toIndex >= steps.length ||
            fromIndex === toIndex ||
            toIndex <= introIndex ||
            toIndex >= resultIndex
          ) {
            return state
          }

          // Simple array reorder: remove from source, insert at destination
          const [movedStep] = steps.splice(fromIndex, 1)
          steps.splice(toIndex, 0, movedStep)

          return { steps }
        }),

      // Step selection
      setActiveStepId: (stepId) =>
        set((state) => {
          const step = state.steps.find(s => s.id === stepId)

          // If selecting a non-result step, clear outcome selection
          if (step && step.type !== 'result') {
            return { activeStepId: stepId, selectedOutcomeId: undefined }
          }

          // If selecting result step and no outcome selected, select first outcome
          if (step?.type === 'result' && !state.selectedOutcomeId && state.outcomes.length > 0) {
            return { activeStepId: stepId, selectedOutcomeId: state.outcomes[0].id }
          }

          return { activeStepId: stepId }
        }),

      // Outcome management
      setOutcomes: (outcomes) => set({ outcomes }),

      addOutcome: (outcome) =>
        set((state) => {
          const newOutcomes = [...state.outcomes, outcome]

          // Find result step and select it with the new outcome
          const resultStep = state.steps.find(s => s.type === 'result')

          return {
            outcomes: newOutcomes,
            activeStepId: resultStep?.id || state.activeStepId,
            selectedOutcomeId: outcome.id,
          }
        }),

      updateOutcome: (id, updates) =>
        set((state) => ({
          outcomes: state.outcomes.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),

      deleteOutcome: (id) =>
        set((state) => {
          // Cannot delete the last outcome
          if (state.outcomes.length <= 1) {
            return state
          }

          const newOutcomes = state.outcomes.filter((o) => o.id !== id)

          // If we deleted the selected outcome, select the first remaining one
          let newSelectedOutcomeId = state.selectedOutcomeId
          if (state.selectedOutcomeId === id) {
            newSelectedOutcomeId = newOutcomes.length > 0 ? newOutcomes[0].id : undefined
          }

          return { outcomes: newOutcomes, selectedOutcomeId: newSelectedOutcomeId }
        }),

      setSelectedOutcomeId: (outcomeId) => set({ selectedOutcomeId: outcomeId }),

      // UI state
      setAddStepSheetOpen: (isOpen) => set({ isAddStepSheetOpen: isOpen }),

      // Initialization
      initialize: (data) =>
        set({
          steps: data.steps,
          outcomes: data.outcomes,
          activeStepId: data.steps.length > 0 ? data.steps[0].id : undefined,
          selectedOutcomeId: undefined,
        }),

      reset: () => set(initialState),
    }),
    { name: 'VisualBuilderStore' }
  )
)

// Helper function to create a new step
export const createStep = (type: StepType, steps: Step[]): Step => {
  return {
    id: generateId(),
    type,
    label: getDefaultStepLabel(type, steps),
    isFixed: false,
  }
}

// Helper function to create a new outcome
export const createOutcome = (name: string = ''): Outcome => {
  return {
    id: generateId(),
    name,
  }
}
