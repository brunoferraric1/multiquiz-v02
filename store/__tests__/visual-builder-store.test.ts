import { describe, it, expect, beforeEach } from 'vitest'
import {
  useVisualBuilderStore,
  DEFAULT_STEPS,
  createStep,
  createOutcome,
  getDefaultStepLabel,
  Step,
} from '../visual-builder-store'

describe('VisualBuilderStore', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Initial State', () => {
    it('has default steps (intro and result)', () => {
      const { steps } = useVisualBuilderStore.getState()
      expect(steps).toEqual(DEFAULT_STEPS)
      expect(steps).toHaveLength(2)
      expect(steps[0].type).toBe('intro')
      expect(steps[1].type).toBe('result')
    })

    it('has empty outcomes', () => {
      const { outcomes } = useVisualBuilderStore.getState()
      expect(outcomes).toEqual([])
    })

    it('has intro as active step', () => {
      const { activeStepId } = useVisualBuilderStore.getState()
      expect(activeStepId).toBe('intro')
    })

    it('has no selected outcome', () => {
      const { selectedOutcomeId } = useVisualBuilderStore.getState()
      expect(selectedOutcomeId).toBeUndefined()
    })
  })

  describe('Step Selection', () => {
    it('setActiveStepId updates the active step', () => {
      const store = useVisualBuilderStore.getState()
      store.setActiveStepId('result')
      expect(useVisualBuilderStore.getState().activeStepId).toBe('result')
    })

    it('clears outcome selection when selecting non-result step', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome' })
      store.setSelectedOutcomeId('outcome-1')
      store.setActiveStepId('intro')
      expect(useVisualBuilderStore.getState().selectedOutcomeId).toBeUndefined()
    })

    it('auto-selects first outcome when selecting result step with no outcome selected', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome' })
      store.setActiveStepId('intro') // Clear outcome selection
      store.setActiveStepId('result')
      expect(useVisualBuilderStore.getState().selectedOutcomeId).toBe('outcome-1')
    })
  })

  describe('Step Management - Add', () => {
    it('addStep inserts step before result', () => {
      const store = useVisualBuilderStore.getState()
      const newStep: Step = { id: 'q1', type: 'question', label: 'P1' }
      store.addStep(newStep)

      const { steps } = useVisualBuilderStore.getState()
      expect(steps).toHaveLength(3)
      expect(steps[1].id).toBe('q1')
      expect(steps[2].type).toBe('result')
    })

    it('addStep sets the new step as active', () => {
      const store = useVisualBuilderStore.getState()
      const newStep: Step = { id: 'q1', type: 'question', label: 'P1' }
      store.addStep(newStep)

      expect(useVisualBuilderStore.getState().activeStepId).toBe('q1')
    })

    it('addStep closes the sheet', () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)
      const newStep: Step = { id: 'q1', type: 'question', label: 'P1' }
      store.addStep(newStep)

      expect(useVisualBuilderStore.getState().isAddStepSheetOpen).toBe(false)
    })

    it('addStep can insert after a specific step', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.addStep({ id: 'q2', type: 'question', label: 'P2' }, 'q1')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps[1].id).toBe('q1')
      expect(steps[2].id).toBe('q2')
    })
  })

  describe('Step Management - Delete', () => {
    it('deleteStep removes a non-fixed step', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.deleteStep('q1')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps).toHaveLength(2)
      expect(steps.find(s => s.id === 'q1')).toBeUndefined()
    })

    it('deleteStep cannot remove fixed steps (intro)', () => {
      const store = useVisualBuilderStore.getState()
      store.deleteStep('intro')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps.find(s => s.id === 'intro')).toBeDefined()
    })

    it('deleteStep cannot remove fixed steps (result)', () => {
      const store = useVisualBuilderStore.getState()
      store.deleteStep('result')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps.find(s => s.type === 'result')).toBeDefined()
    })

    it('deleteStep selects previous step if active step is deleted', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.addStep({ id: 'q2', type: 'question', label: 'P2' })
      store.setActiveStepId('q2')
      store.deleteStep('q2')

      expect(useVisualBuilderStore.getState().activeStepId).toBe('q1')
    })
  })

  describe('Step Management - Duplicate', () => {
    it('duplicateStep creates a copy of the step', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1', subtitle: 'Original subtitle' })
      store.duplicateStep('q1')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps).toHaveLength(4) // intro, q1, duplicated, result
      const duplicated = steps.find(s => s.label.includes('(cópia)'))
      expect(duplicated).toBeDefined()
      expect(duplicated?.type).toBe('question')
      expect(duplicated?.subtitle).toBe('Original subtitle')
    })

    it('duplicateStep inserts the copy after the original', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.addStep({ id: 'q2', type: 'question', label: 'P2' })
      store.duplicateStep('q1')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps[1].id).toBe('q1')
      expect(steps[2].label).toBe('P1 (cópia)')
      expect(steps[3].id).toBe('q2')
    })

    it('duplicateStep sets the duplicated step as active', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.duplicateStep('q1')

      const { activeStepId, steps } = useVisualBuilderStore.getState()
      const duplicated = steps.find(s => s.label.includes('(cópia)'))
      expect(activeStepId).toBe(duplicated?.id)
    })

    it('duplicateStep cannot duplicate fixed steps (intro)', () => {
      const store = useVisualBuilderStore.getState()
      store.duplicateStep('intro')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps).toHaveLength(2) // Only intro and result
    })

    it('duplicateStep cannot duplicate fixed steps (result)', () => {
      const store = useVisualBuilderStore.getState()
      store.duplicateStep('result')

      const { steps } = useVisualBuilderStore.getState()
      expect(steps).toHaveLength(2) // Only intro and result
    })

    it('duplicateStep generates a unique ID for the copy', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.duplicateStep('q1')

      const { steps } = useVisualBuilderStore.getState()
      const original = steps.find(s => s.id === 'q1')
      const duplicated = steps.find(s => s.label.includes('(cópia)'))
      expect(original?.id).not.toBe(duplicated?.id)
    })
  })

  describe('Step Management - Update', () => {
    it('updateStep updates step properties', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.updateStep('q1', { label: 'Updated Label', subtitle: 'New subtitle' })

      const { steps } = useVisualBuilderStore.getState()
      const updatedStep = steps.find(s => s.id === 'q1')
      expect(updatedStep?.label).toBe('Updated Label')
      expect(updatedStep?.subtitle).toBe('New subtitle')
    })
  })

  describe('Step Management - Reorder', () => {
    it('reorderSteps moves a step to a new position', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.addStep({ id: 'q2', type: 'question', label: 'P2' })
      store.addStep({ id: 'q3', type: 'question', label: 'P3' })

      // Move q3 to position after intro (index 1)
      store.reorderSteps(3, 1)

      const { steps } = useVisualBuilderStore.getState()
      expect(steps[1].id).toBe('q3')
      expect(steps[2].id).toBe('q1')
      expect(steps[3].id).toBe('q2')
    })

    it('reorderSteps cannot move fixed steps', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })

      // Try to move intro (fixed)
      store.reorderSteps(0, 1)

      const { steps } = useVisualBuilderStore.getState()
      expect(steps[0].type).toBe('intro')
    })

    it('reorderSteps cannot move step to position 0 (intro position)', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })

      store.reorderSteps(1, 0)

      const { steps } = useVisualBuilderStore.getState()
      expect(steps[0].type).toBe('intro')
    })

    it('reorderSteps cannot move step after result', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.addStep({ id: 'q2', type: 'question', label: 'P2' })

      const resultIndex = useVisualBuilderStore.getState().steps.findIndex(s => s.type === 'result')
      store.reorderSteps(1, resultIndex)

      // Should not have changed
      const { steps } = useVisualBuilderStore.getState()
      expect(steps[steps.length - 1].type).toBe('result')
    })
  })

  describe('Outcome Management', () => {
    it('addOutcome adds a new outcome', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome' })

      const { outcomes } = useVisualBuilderStore.getState()
      expect(outcomes).toHaveLength(1)
      expect(outcomes[0].name).toBe('Test Outcome')
    })

    it('addOutcome selects the result step and new outcome', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome' })

      const state = useVisualBuilderStore.getState()
      expect(state.activeStepId).toBe('result')
      expect(state.selectedOutcomeId).toBe('outcome-1')
    })

    it('updateOutcome updates outcome properties', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Original Name' })
      store.updateOutcome('outcome-1', { name: 'Updated Name' })

      const { outcomes } = useVisualBuilderStore.getState()
      expect(outcomes[0].name).toBe('Updated Name')
    })

    it('deleteOutcome removes an outcome', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Outcome 1' })
      store.addOutcome({ id: 'outcome-2', name: 'Outcome 2' })
      store.deleteOutcome('outcome-1')

      const { outcomes } = useVisualBuilderStore.getState()
      expect(outcomes).toHaveLength(1)
      expect(outcomes[0].id).toBe('outcome-2')
    })

    it('deleteOutcome cannot remove the last outcome', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Only Outcome' })
      store.deleteOutcome('outcome-1')

      const { outcomes } = useVisualBuilderStore.getState()
      expect(outcomes).toHaveLength(1)
    })

    it('deleteOutcome selects first remaining outcome if selected one is deleted', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Outcome 1' })
      store.addOutcome({ id: 'outcome-2', name: 'Outcome 2' })
      store.setSelectedOutcomeId('outcome-1')
      store.deleteOutcome('outcome-1')

      expect(useVisualBuilderStore.getState().selectedOutcomeId).toBe('outcome-2')
    })
  })

  describe('UI State', () => {
    it('setAddStepSheetOpen toggles sheet state', () => {
      const store = useVisualBuilderStore.getState()
      expect(store.isAddStepSheetOpen).toBe(false)

      store.setAddStepSheetOpen(true)
      expect(useVisualBuilderStore.getState().isAddStepSheetOpen).toBe(true)

      store.setAddStepSheetOpen(false)
      expect(useVisualBuilderStore.getState().isAddStepSheetOpen).toBe(false)
    })
  })

  describe('Initialization', () => {
    it('initialize sets steps and outcomes', () => {
      const store = useVisualBuilderStore.getState()
      const steps: Step[] = [
        { id: 'intro', type: 'intro', label: 'Intro', isFixed: true },
        { id: 'q1', type: 'question', label: 'P1' },
        { id: 'result', type: 'result', label: 'Resultado', isFixed: true },
      ]
      const outcomes = [{ id: 'o1', name: 'Outcome 1' }]

      store.initialize({ steps, outcomes })

      const state = useVisualBuilderStore.getState()
      expect(state.steps).toEqual(steps)
      expect(state.outcomes).toEqual(outcomes)
      expect(state.activeStepId).toBe('intro')
    })

    it('reset returns to initial state', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'q1', type: 'question', label: 'P1' })
      store.addOutcome({ id: 'o1', name: 'Test' })

      store.reset()

      const state = useVisualBuilderStore.getState()
      expect(state.steps).toEqual(DEFAULT_STEPS)
      expect(state.outcomes).toEqual([])
      expect(state.activeStepId).toBe('intro')
    })
  })

  describe('Block Management (Steps)', () => {
    it('addBlock adds a block to a step', () => {
      const store = useVisualBuilderStore.getState()
      const block = { id: 'block-1', type: 'text' as const, enabled: true, config: { content: 'Hello' } }
      store.addBlock('intro', block)

      const { steps, selectedBlockId } = useVisualBuilderStore.getState()
      const introStep = steps.find(s => s.id === 'intro')
      expect(introStep?.blocks).toContainEqual(block)
      expect(selectedBlockId).toBe('block-1')
    })

    it('addBlock inserts at specific index', () => {
      const store = useVisualBuilderStore.getState()
      const block1 = { id: 'block-1', type: 'text' as const, enabled: true, config: { content: 'First' } }
      const block2 = { id: 'block-2', type: 'text' as const, enabled: true, config: { content: 'Second' } }
      store.addBlock('intro', block1)
      store.addBlock('intro', block2, 0) // Insert at beginning

      const { steps } = useVisualBuilderStore.getState()
      const introStep = steps.find(s => s.id === 'intro')
      // block2 should be at index 0 of user-added blocks (after default blocks)
      expect(introStep?.blocks.find(b => b.id === 'block-2')).toBeDefined()
    })

    it('updateBlock updates block config', () => {
      const store = useVisualBuilderStore.getState()
      const block = { id: 'block-1', type: 'text' as const, enabled: true, config: { content: 'Original' } }
      store.addBlock('intro', block)
      store.updateBlock('intro', 'block-1', { content: 'Updated' })

      const { steps } = useVisualBuilderStore.getState()
      const introStep = steps.find(s => s.id === 'intro')
      const updatedBlock = introStep?.blocks.find(b => b.id === 'block-1')
      expect(updatedBlock?.config).toEqual({ content: 'Updated' })
    })

    it('deleteBlock removes a block', () => {
      const store = useVisualBuilderStore.getState()
      const block = { id: 'block-1', type: 'text' as const, enabled: true, config: { content: 'Delete me' } }
      store.addBlock('intro', block)
      store.deleteBlock('intro', 'block-1')

      const { steps, selectedBlockId } = useVisualBuilderStore.getState()
      const introStep = steps.find(s => s.id === 'intro')
      expect(introStep?.blocks.find(b => b.id === 'block-1')).toBeUndefined()
      expect(selectedBlockId).toBeUndefined()
    })

    it('toggleBlock toggles enabled state', () => {
      const store = useVisualBuilderStore.getState()
      const block = { id: 'block-1', type: 'text' as const, enabled: true, config: { content: 'Toggle me' } }
      store.addBlock('intro', block)
      store.toggleBlock('intro', 'block-1')

      let { steps } = useVisualBuilderStore.getState()
      let introStep = steps.find(s => s.id === 'intro')
      expect(introStep?.blocks.find(b => b.id === 'block-1')?.enabled).toBe(false)

      store.toggleBlock('intro', 'block-1')
      steps = useVisualBuilderStore.getState().steps
      introStep = steps.find(s => s.id === 'intro')
      expect(introStep?.blocks.find(b => b.id === 'block-1')?.enabled).toBe(true)
    })

    it('reorderBlocks moves a block to a new position', () => {
      const store = useVisualBuilderStore.getState()
      store.addStep({ id: 'test', type: 'question', label: 'Test', blocks: [
        { id: 'b1', type: 'text', enabled: true, config: { content: '1' } },
        { id: 'b2', type: 'text', enabled: true, config: { content: '2' } },
        { id: 'b3', type: 'text', enabled: true, config: { content: '3' } },
      ] })

      store.reorderBlocks('test', 2, 0) // Move b3 to first position

      const { steps } = useVisualBuilderStore.getState()
      const testStep = steps.find(s => s.id === 'test')
      expect(testStep?.blocks[0].id).toBe('b3')
      expect(testStep?.blocks[1].id).toBe('b1')
      expect(testStep?.blocks[2].id).toBe('b2')
    })
  })

  describe('Block Management (Outcomes)', () => {
    it('addOutcomeBlock adds a block to an outcome', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome', blocks: [] })
      const block = { id: 'block-1', type: 'text' as const, enabled: true, config: { content: 'Hello' } }
      store.addOutcomeBlock('outcome-1', block)

      const { outcomes, selectedBlockId } = useVisualBuilderStore.getState()
      const outcome = outcomes.find(o => o.id === 'outcome-1')
      expect(outcome?.blocks).toContainEqual(block)
      expect(selectedBlockId).toBe('block-1')
    })

    it('updateOutcomeBlock updates block config', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome', blocks: [
        { id: 'block-1', type: 'text', enabled: true, config: { content: 'Original' } }
      ] })
      store.updateOutcomeBlock('outcome-1', 'block-1', { content: 'Updated' })

      const { outcomes } = useVisualBuilderStore.getState()
      const outcome = outcomes.find(o => o.id === 'outcome-1')
      const updatedBlock = outcome?.blocks.find(b => b.id === 'block-1')
      expect(updatedBlock?.config).toEqual({ content: 'Updated' })
    })

    it('deleteOutcomeBlock removes a block', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome', blocks: [
        { id: 'block-1', type: 'text', enabled: true, config: { content: 'Delete me' } }
      ] })
      store.setSelectedBlockId('block-1')
      store.deleteOutcomeBlock('outcome-1', 'block-1')

      const { outcomes, selectedBlockId } = useVisualBuilderStore.getState()
      const outcome = outcomes.find(o => o.id === 'outcome-1')
      expect(outcome?.blocks.find(b => b.id === 'block-1')).toBeUndefined()
      expect(selectedBlockId).toBeUndefined()
    })

    it('toggleOutcomeBlock toggles enabled state', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome', blocks: [
        { id: 'block-1', type: 'text', enabled: true, config: { content: 'Toggle me' } }
      ] })
      store.toggleOutcomeBlock('outcome-1', 'block-1')

      const { outcomes } = useVisualBuilderStore.getState()
      const outcome = outcomes.find(o => o.id === 'outcome-1')
      expect(outcome?.blocks.find(b => b.id === 'block-1')?.enabled).toBe(false)
    })

    it('reorderOutcomeBlocks moves a block to a new position', () => {
      const store = useVisualBuilderStore.getState()
      store.addOutcome({ id: 'outcome-1', name: 'Test Outcome', blocks: [
        { id: 'b1', type: 'text', enabled: true, config: { content: '1' } },
        { id: 'b2', type: 'text', enabled: true, config: { content: '2' } },
        { id: 'b3', type: 'text', enabled: true, config: { content: '3' } },
      ] })

      store.reorderOutcomeBlocks('outcome-1', 0, 2) // Move b1 to last position

      const { outcomes } = useVisualBuilderStore.getState()
      const outcome = outcomes.find(o => o.id === 'outcome-1')
      expect(outcome?.blocks[0].id).toBe('b2')
      expect(outcome?.blocks[1].id).toBe('b3')
      expect(outcome?.blocks[2].id).toBe('b1')
    })
  })

  describe('Block Selection', () => {
    it('setSelectedBlockId updates the selected block', () => {
      const store = useVisualBuilderStore.getState()
      store.setSelectedBlockId('block-1')
      expect(useVisualBuilderStore.getState().selectedBlockId).toBe('block-1')
    })

    it('clearing block selection works', () => {
      const store = useVisualBuilderStore.getState()
      store.setSelectedBlockId('block-1')
      store.setSelectedBlockId(undefined)
      expect(useVisualBuilderStore.getState().selectedBlockId).toBeUndefined()
    })

    it('changing active step clears block selection', () => {
      const store = useVisualBuilderStore.getState()
      store.setSelectedBlockId('block-1')
      store.setActiveStepId('result')
      expect(useVisualBuilderStore.getState().selectedBlockId).toBeUndefined()
    })
  })

  describe('Step Settings', () => {
    it('updateStepSettings updates settings', () => {
      const store = useVisualBuilderStore.getState()
      store.updateStepSettings('intro', { showProgress: true, allowBack: true })

      const { steps } = useVisualBuilderStore.getState()
      const introStep = steps.find(s => s.id === 'intro')
      expect(introStep?.settings?.showProgress).toBe(true)
      expect(introStep?.settings?.allowBack).toBe(true)
    })

    it('updateStepSettings partial update preserves other settings', () => {
      const store = useVisualBuilderStore.getState()
      store.updateStepSettings('intro', { showProgress: true })
      store.updateStepSettings('intro', { allowBack: true })

      const { steps } = useVisualBuilderStore.getState()
      const introStep = steps.find(s => s.id === 'intro')
      expect(introStep?.settings?.showProgress).toBe(true)
      expect(introStep?.settings?.allowBack).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    describe('createStep', () => {
      it('creates a step with default label', () => {
        const step = createStep('question', DEFAULT_STEPS)
        expect(step.type).toBe('question')
        expect(step.label).toBe('Pergunta')
        expect(step.id).toBeDefined()
        expect(step.isFixed).toBe(false)
      })

      it('creates numbered label when steps of same type exist', () => {
        const existingSteps: Step[] = [
          ...DEFAULT_STEPS.slice(0, 1),
          { id: 'q1', type: 'question', label: 'Pergunta' },
          DEFAULT_STEPS[1],
        ]
        const step = createStep('question', existingSteps)
        expect(step.label).toBe('Pergunta 2')
      })
    })

    describe('createOutcome', () => {
      it('creates an outcome with provided name', () => {
        const outcome = createOutcome('Test Outcome')
        expect(outcome.name).toBe('Test Outcome')
        expect(outcome.id).toBeDefined()
      })

      it('creates an outcome with empty name when not provided', () => {
        const outcome = createOutcome()
        expect(outcome.name).toBe('')
      })
    })

    describe('getDefaultStepLabel', () => {
      it('returns correct label for each step type', () => {
        expect(getDefaultStepLabel('intro', [])).toBe('Intro')
        expect(getDefaultStepLabel('question', [])).toBe('Pergunta')
        expect(getDefaultStepLabel('lead-gen', [])).toBe('Captura')
        expect(getDefaultStepLabel('promo', [])).toBe('Promoção')
        expect(getDefaultStepLabel('result', [])).toBe('Resultado')
      })
    })
  })
})
