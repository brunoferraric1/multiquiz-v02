import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step } from '@/store/visual-builder-store'
import { AddStepDialog } from '../add-step-dialog'

// Test data
const testSteps: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', isFixed: true, blocks: [] },
  { id: 'q1', type: 'question', label: 'Pergunta', subtitle: 'Question 1', blocks: [] },
  { id: 'result', type: 'result', label: 'Resultado', isFixed: true, blocks: [] },
]

describe('AddStepDialog', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Structure', () => {
    it('renders when isAddStepSheetOpen is true', () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)

      render(<AddStepDialog />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render when isAddStepSheetOpen is false', () => {
      render(<AddStepDialog />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders step template options', () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)

      render(<AddStepDialog />)

      // Template options: blank, question, promo, lead-gen (no intro - it's fixed)
      expect(screen.getByRole('button', { name: /página em branco/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pergunta/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /promoção/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /captura de dados/i })).toBeInTheDocument()
    })
  })

  describe('Step Template Selection', () => {
    it('adds a question step when clicking Pergunta template', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const { steps, isAddStepSheetOpen } = useVisualBuilderStore.getState()

      // Should have added a step
      expect(steps.length).toBe(4)

      // New step should be a question type
      const newStep = steps.find(s => s.id !== 'intro' && s.id !== 'q1' && s.id !== 'result')
      expect(newStep?.type).toBe('question')

      // Dialog should be closed
      expect(isAddStepSheetOpen).toBe(false)
    })

    it('adds a lead-gen step when clicking Captura template', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      await user.click(screen.getByRole('button', { name: /captura de dados/i }))

      const { steps } = useVisualBuilderStore.getState()
      const newStep = steps.find(s => s.type === 'lead-gen')
      expect(newStep).toBeDefined()
      expect(newStep?.label).toContain('Captura')
    })

    it('adds a promo step when clicking Promoção template', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      await user.click(screen.getByRole('button', { name: /promoção/i }))

      const { steps } = useVisualBuilderStore.getState()
      const newStep = steps.find(s => s.type === 'promo')
      expect(newStep).toBeDefined()
    })

    it('adds a blank question step when clicking Página em branco', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      await user.click(screen.getByRole('button', { name: /página em branco/i }))

      const { steps } = useVisualBuilderStore.getState()
      const newStep = steps.find(s => s.id !== 'intro' && s.id !== 'q1' && s.id !== 'result')
      expect(newStep?.type).toBe('question')
      // Should have minimal blocks (header + options)
      expect(newStep?.blocks.length).toBe(2)
    })

    it('inserts new step before result step', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const { steps } = useVisualBuilderStore.getState()

      // Result should still be last
      expect(steps[steps.length - 1].type).toBe('result')
    })

    it('selects the new step after adding', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const { activeStepId, steps } = useVisualBuilderStore.getState()
      const newStep = steps.find(s => s.id !== 'intro' && s.id !== 'q1' && s.id !== 'result')

      expect(activeStepId).toBe(newStep?.id)
    })
  })

  describe('Dialog Controls', () => {
    it('closes dialog when clicking close button', async () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      // Find and click the close button (X icon)
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(useVisualBuilderStore.getState().isAddStepSheetOpen).toBe(false)
    })
  })

  describe('Step Labels', () => {
    it('generates numbered labels for duplicate step types', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps) // Already has one question
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepDialog />)

      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const { steps } = useVisualBuilderStore.getState()
      const questionSteps = steps.filter(s => s.type === 'question')

      expect(questionSteps).toHaveLength(2)
      // Second question should have numbered label
      expect(questionSteps[1].label).toBe('Pergunta 2')
    })
  })
})
