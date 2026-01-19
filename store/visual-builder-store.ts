import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  Block,
  BlockConfig,
  BlockType,
  StepSettings,
  createBlock,
  getDefaultBlockConfig,
} from '@/types/blocks'

// Step types
export type StepType = 'intro' | 'question' | 'lead-gen' | 'promo' | 'result'

export interface Step {
  id: string
  type: StepType
  label: string
  isFixed?: boolean
  subtitle?: string
  blocks: Block[]
  settings?: StepSettings
}

export interface Outcome {
  id: string
  name: string
  blocks: Block[]
}

// Store state interface
export interface VisualBuilderState {
  // State
  steps: Step[]
  outcomes: Outcome[]
  activeStepId: string | undefined
  selectedOutcomeId: string | undefined
  selectedBlockId: string | undefined
  isAddStepSheetOpen: boolean
  isAddBlockSheetOpen: boolean

  // Actions - Step management
  setSteps: (steps: Step[]) => void
  addStep: (step: Step, insertAfterStepId?: string) => void
  updateStep: (id: string, updates: Partial<Step>) => void
  deleteStep: (id: string) => void
  duplicateStep: (id: string) => void
  reorderSteps: (fromIndex: number, toIndex: number) => void

  // Actions - Step selection
  setActiveStepId: (stepId: string | undefined) => void

  // Actions - Block management (for steps)
  addBlock: (stepId: string, block: Block, insertAtIndex?: number) => void
  updateBlock: (stepId: string, blockId: string, config: Partial<Block['config']>) => void
  deleteBlock: (stepId: string, blockId: string) => void
  toggleBlock: (stepId: string, blockId: string) => void
  reorderBlocks: (stepId: string, fromIndex: number, toIndex: number) => void

  // Actions - Block management (for outcomes)
  addOutcomeBlock: (outcomeId: string, block: Block, insertAtIndex?: number) => void
  updateOutcomeBlock: (outcomeId: string, blockId: string, config: Partial<Block['config']>) => void
  deleteOutcomeBlock: (outcomeId: string, blockId: string) => void
  toggleOutcomeBlock: (outcomeId: string, blockId: string) => void
  reorderOutcomeBlocks: (outcomeId: string, fromIndex: number, toIndex: number) => void

  // Actions - Block selection
  setSelectedBlockId: (blockId: string | undefined) => void

  // Actions - Step settings
  updateStepSettings: (stepId: string, settings: Partial<StepSettings>) => void

  // Actions - Outcome management
  setOutcomes: (outcomes: Outcome[]) => void
  addOutcome: (outcome: Outcome) => void
  updateOutcome: (id: string, updates: Partial<Outcome>) => void
  deleteOutcome: (id: string) => void
  setSelectedOutcomeId: (outcomeId: string | undefined) => void

  // Actions - UI state
  setAddStepSheetOpen: (isOpen: boolean) => void
  setAddBlockSheetOpen: (isOpen: boolean) => void

  // Actions - Initialization
  initialize: (data: { steps: Step[]; outcomes: Outcome[] }) => void
  reset: () => void
}

// Helper to generate unique IDs (only use for runtime-created items, not initial state)
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Default blocks for each step type (generates new IDs each time - use for new steps)
export const getDefaultBlocksForStepType = (type: StepType): Block[] => {
  switch (type) {
    case 'intro':
      return [
        { ...createBlock('header'), config: { title: 'Bem-vindo!', description: 'Descubra o resultado ideal para você.' } },
        { ...createBlock('media'), enabled: false },
        { ...createBlock('button'), config: { text: 'Começar', action: 'next_step' } },
      ]
    case 'question':
      return [
        { ...createBlock('header'), config: { title: '', description: '' } },
        { ...createBlock('media'), enabled: false },
        { ...createBlock('options'), config: { items: [], selectionType: 'single' } },
      ]
    case 'lead-gen':
      return [
        { ...createBlock('header'), config: { title: 'Quase lá!', description: 'Preencha seus dados para ver o resultado.' } },
        { ...createBlock('fields'), config: { items: [
          { id: generateId(), label: 'Nome', type: 'text', required: true },
          { id: generateId(), label: 'Email', type: 'email', required: true },
        ] } },
        { ...createBlock('button'), config: { text: 'Ver resultado', action: 'next_step' } },
      ]
    case 'promo':
      return [
        { ...createBlock('header'), config: { title: 'Oferta especial', description: '' } },
        { ...createBlock('media'), enabled: false },
        { ...createBlock('price'), config: { productTitle: '', value: '', prefix: 'R$' } },
        { ...createBlock('button'), config: { text: 'Aproveitar', action: 'url' } },
      ]
    case 'result':
      // Result step doesn't have default blocks - they're per outcome
      return []
    default:
      return []
  }
}

// Default blocks for a new outcome (generates new IDs each time)
export const getDefaultOutcomeBlocks = (): Block[] => {
  return [
    { ...createBlock('header'), config: { title: 'Seu resultado', description: '' } },
    { ...createBlock('media'), enabled: false },
    { ...createBlock('text'), config: { content: '' } },
    { ...createBlock('button'), config: { text: 'Saber mais', action: 'url' } },
  ]
}

// Static initial blocks with deterministic IDs (for SSR hydration safety)
const INITIAL_INTRO_BLOCKS: Block[] = [
  {
    id: 'intro-block-header',
    type: 'header',
    enabled: true,
    config: { title: 'Bem-vindo!', description: 'Descubra o resultado ideal para você.' },
  },
  {
    id: 'intro-block-media',
    type: 'media',
    enabled: false,
    config: { type: 'image', url: '' },
  },
  {
    id: 'intro-block-button',
    type: 'button',
    enabled: true,
    config: { text: 'Começar', action: 'next_step' },
  },
]

// Default initial steps for a new quiz (uses deterministic IDs for SSR)
export const DEFAULT_STEPS: Step[] = [
  {
    id: 'intro',
    type: 'intro',
    label: 'Intro',
    isFixed: true,
    blocks: INITIAL_INTRO_BLOCKS,
    settings: { showProgress: false, allowBack: false },
  },
  {
    id: 'result',
    type: 'result',
    label: 'Resultado',
    isFixed: true,
    blocks: [],
    settings: { showProgress: false, allowBack: false },
  },
]

// Initial state
const initialState = {
  steps: DEFAULT_STEPS,
  outcomes: [],
  activeStepId: 'intro' as string | undefined,
  selectedOutcomeId: undefined as string | undefined,
  selectedBlockId: undefined as string | undefined,
  isAddStepSheetOpen: false,
  isAddBlockSheetOpen: false,
}

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
          // Ensure step has blocks array
          const stepWithBlocks: Step = {
            ...step,
            blocks: step.blocks || [],
          }
          const steps = [...state.steps]

          // Find the result step (always last)
          const resultIndex = steps.findIndex(s => s.type === 'result')

          if (insertAfterStepId) {
            // Insert after the specified step
            const insertIndex = steps.findIndex(s => s.id === insertAfterStepId)
            if (insertIndex !== -1 && insertIndex < resultIndex) {
              steps.splice(insertIndex + 1, 0, stepWithBlocks)
              return { steps, activeStepId: stepWithBlocks.id, selectedBlockId: undefined, isAddStepSheetOpen: false }
            }
          }

          // Default: insert before result step
          if (resultIndex !== -1) {
            steps.splice(resultIndex, 0, stepWithBlocks)
          } else {
            // No result step found, just append
            steps.push(stepWithBlocks)
          }

          return { steps, activeStepId: stepWithBlocks.id, selectedBlockId: undefined, isAddStepSheetOpen: false }
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
          let newSelectedBlockId = state.selectedBlockId

          if (state.activeStepId === id) {
            const deletedIndex = state.steps.findIndex(s => s.id === id)
            if (deletedIndex > 0) {
              newActiveStepId = state.steps[deletedIndex - 1].id
            } else if (newSteps.length > 0) {
              newActiveStepId = newSteps[0].id
            } else {
              newActiveStepId = undefined
            }
            newSelectedBlockId = undefined
          }

          return { steps: newSteps, activeStepId: newActiveStepId, selectedBlockId: newSelectedBlockId }
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

          // Create duplicated blocks with new IDs (handle steps without blocks)
          const duplicatedBlocks = (stepToDuplicate.blocks || []).map(block => ({
            ...block,
            id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          }))

          // Create a duplicate with new ID and updated label
          const duplicatedStep: Step = {
            ...stepToDuplicate,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            label: `${stepToDuplicate.label} (cópia)`,
            blocks: duplicatedBlocks,
          }

          // Insert after the original step
          steps.splice(stepIndex + 1, 0, duplicatedStep)

          return { steps, activeStepId: duplicatedStep.id, selectedBlockId: undefined }
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

          // If selecting a non-result step, clear outcome selection and block selection
          if (step && step.type !== 'result') {
            return { activeStepId: stepId, selectedOutcomeId: undefined, selectedBlockId: undefined }
          }

          // If selecting result step and no outcome selected, select first outcome
          if (step?.type === 'result' && !state.selectedOutcomeId && state.outcomes.length > 0) {
            return { activeStepId: stepId, selectedOutcomeId: state.outcomes[0].id, selectedBlockId: undefined }
          }

          return { activeStepId: stepId, selectedBlockId: undefined }
        }),

      // Block management (for steps)
      addBlock: (stepId, block, insertAtIndex) =>
        set((state) => {
          const steps = state.steps.map((step) => {
            if (step.id !== stepId) return step

            const blocks = [...(step.blocks || [])]
            if (insertAtIndex !== undefined && insertAtIndex >= 0 && insertAtIndex <= blocks.length) {
              blocks.splice(insertAtIndex, 0, block)
            } else {
              blocks.push(block)
            }

            return { ...step, blocks }
          })

          return { steps, selectedBlockId: block.id, isAddBlockSheetOpen: false }
        }),

      updateBlock: (stepId, blockId, config) =>
        set((state) => ({
          steps: state.steps.map((step) => {
            if (step.id !== stepId) return step

            return {
              ...step,
              blocks: (step.blocks || []).map((block) =>
                block.id === blockId
                  ? { ...block, config: { ...block.config, ...config } as BlockConfig }
                  : block
              ),
            }
          }),
        })),

      deleteBlock: (stepId, blockId) =>
        set((state) => {
          const steps = state.steps.map((step) => {
            if (step.id !== stepId) return step

            return {
              ...step,
              blocks: (step.blocks || []).filter((block) => block.id !== blockId),
            }
          })

          // If we deleted the selected block, clear selection
          const newSelectedBlockId = state.selectedBlockId === blockId ? undefined : state.selectedBlockId

          return { steps, selectedBlockId: newSelectedBlockId }
        }),

      toggleBlock: (stepId, blockId) =>
        set((state) => ({
          steps: state.steps.map((step) => {
            if (step.id !== stepId) return step

            return {
              ...step,
              blocks: (step.blocks || []).map((block) =>
                block.id === blockId ? { ...block, enabled: !block.enabled } : block
              ),
            }
          }),
        })),

      reorderBlocks: (stepId, fromIndex, toIndex) =>
        set((state) => {
          const steps = state.steps.map((step) => {
            if (step.id !== stepId) return step

            const blocks = [...(step.blocks || [])]
            if (
              fromIndex < 0 ||
              toIndex < 0 ||
              fromIndex >= blocks.length ||
              toIndex >= blocks.length ||
              fromIndex === toIndex
            ) {
              return step
            }

            const [movedBlock] = blocks.splice(fromIndex, 1)
            blocks.splice(toIndex, 0, movedBlock)

            return { ...step, blocks }
          })

          return { steps }
        }),

      // Block management (for outcomes)
      addOutcomeBlock: (outcomeId, block, insertAtIndex) =>
        set((state) => {
          const outcomes = state.outcomes.map((outcome) => {
            if (outcome.id !== outcomeId) return outcome

            const blocks = [...(outcome.blocks || [])]
            if (insertAtIndex !== undefined && insertAtIndex >= 0 && insertAtIndex <= blocks.length) {
              blocks.splice(insertAtIndex, 0, block)
            } else {
              blocks.push(block)
            }

            return { ...outcome, blocks }
          })

          return { outcomes, selectedBlockId: block.id, isAddBlockSheetOpen: false }
        }),

      updateOutcomeBlock: (outcomeId, blockId, config) =>
        set((state) => ({
          outcomes: state.outcomes.map((outcome) => {
            if (outcome.id !== outcomeId) return outcome

            return {
              ...outcome,
              blocks: (outcome.blocks || []).map((block) =>
                block.id === blockId
                  ? { ...block, config: { ...block.config, ...config } as BlockConfig }
                  : block
              ),
            }
          }),
        })),

      deleteOutcomeBlock: (outcomeId, blockId) =>
        set((state) => {
          const outcomes = state.outcomes.map((outcome) => {
            if (outcome.id !== outcomeId) return outcome

            return {
              ...outcome,
              blocks: (outcome.blocks || []).filter((block) => block.id !== blockId),
            }
          })

          // If we deleted the selected block, clear selection
          const newSelectedBlockId = state.selectedBlockId === blockId ? undefined : state.selectedBlockId

          return { outcomes, selectedBlockId: newSelectedBlockId }
        }),

      toggleOutcomeBlock: (outcomeId, blockId) =>
        set((state) => ({
          outcomes: state.outcomes.map((outcome) => {
            if (outcome.id !== outcomeId) return outcome

            return {
              ...outcome,
              blocks: (outcome.blocks || []).map((block) =>
                block.id === blockId ? { ...block, enabled: !block.enabled } : block
              ),
            }
          }),
        })),

      reorderOutcomeBlocks: (outcomeId, fromIndex, toIndex) =>
        set((state) => {
          const outcomes = state.outcomes.map((outcome) => {
            if (outcome.id !== outcomeId) return outcome

            const blocks = [...(outcome.blocks || [])]
            if (
              fromIndex < 0 ||
              toIndex < 0 ||
              fromIndex >= blocks.length ||
              toIndex >= blocks.length ||
              fromIndex === toIndex
            ) {
              return outcome
            }

            const [movedBlock] = blocks.splice(fromIndex, 1)
            blocks.splice(toIndex, 0, movedBlock)

            return { ...outcome, blocks }
          })

          return { outcomes }
        }),

      // Block selection
      setSelectedBlockId: (blockId) => set({ selectedBlockId: blockId }),

      // Step settings
      updateStepSettings: (stepId, settings) =>
        set((state) => ({
          steps: state.steps.map((step) =>
            step.id === stepId
              ? { ...step, settings: { ...step.settings, ...settings } }
              : step
          ),
        })),

      // Outcome management
      setOutcomes: (outcomes) => set({ outcomes }),

      addOutcome: (outcome) =>
        set((state) => {
          // Add default blocks if the outcome doesn't have any
          const outcomeWithBlocks: Outcome = {
            ...outcome,
            blocks: outcome.blocks && outcome.blocks.length > 0 ? outcome.blocks : getDefaultOutcomeBlocks(),
          }

          const newOutcomes = [...state.outcomes, outcomeWithBlocks]

          // Find result step and select it with the new outcome
          const resultStep = state.steps.find(s => s.type === 'result')

          return {
            outcomes: newOutcomes,
            activeStepId: resultStep?.id || state.activeStepId,
            selectedOutcomeId: outcome.id,
            selectedBlockId: undefined,
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

          return { outcomes: newOutcomes, selectedOutcomeId: newSelectedOutcomeId, selectedBlockId: undefined }
        }),

      setSelectedOutcomeId: (outcomeId) => set({ selectedOutcomeId: outcomeId, selectedBlockId: undefined }),

      // UI state
      setAddStepSheetOpen: (isOpen) => set({ isAddStepSheetOpen: isOpen }),
      setAddBlockSheetOpen: (isOpen) => set({ isAddBlockSheetOpen: isOpen }),

      // Initialization
      initialize: (data) =>
        set({
          steps: data.steps,
          outcomes: data.outcomes,
          activeStepId: data.steps.length > 0 ? data.steps[0].id : undefined,
          selectedOutcomeId: undefined,
          selectedBlockId: undefined,
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
    blocks: getDefaultBlocksForStepType(type),
    settings: { showProgress: true, allowBack: true },
  }
}

// Helper function to create a new outcome
export const createOutcome = (name: string = ''): Outcome => {
  return {
    id: generateId(),
    name,
    blocks: getDefaultOutcomeBlocks(),
  }
}

// Re-export block types and helpers for convenience
export { createBlock, getDefaultBlockConfig } from '@/types/blocks'
export type { Block, BlockType, BlockConfig, StepSettings } from '@/types/blocks'
