import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step } from '@/store/visual-builder-store'
import { AddStepSheet } from '../add-step-sheet'

// Test data
const testSteps: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', isFixed: true },
  { id: 'q1', type: 'question', label: 'Pergunta', subtitle: 'Question 1' },
  { id: 'result', type: 'result', label: 'Resultado', isFixed: true },
]

describe('AddStepSheet', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Structure', () => {
    it('renders when isAddStepSheetOpen is true', () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)

      render(<AddStepSheet />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render when isAddStepSheetOpen is false', () => {
      render(<AddStepSheet />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders step type options', () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)

      render(<AddStepSheet />)

      expect(screen.getByRole('button', { name: /pergunta/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /captura/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /promo/i })).toBeInTheDocument()
    })

    it('does not show intro or result as options', () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)

      render(<AddStepSheet />)

      // Use getAllByRole to check all buttons
      const buttons = screen.getAllByRole('button')
      const buttonTexts = buttons.map(b => b.textContent?.toLowerCase())

      // Should not have intro or result/resultado as options
      expect(buttonTexts).not.toContain('intro')
      expect(buttonTexts.filter(t => t?.includes('resultado'))).toHaveLength(0)
    })
  })

  describe('Step Type Selection', () => {
    it('adds a question step when clicking Pergunta', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepSheet />)

      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const { steps, isAddStepSheetOpen } = useVisualBuilderStore.getState()

      // Should have added a step
      expect(steps.length).toBe(4)

      // New step should be a question type
      const newStep = steps.find(s => s.id !== 'intro' && s.id !== 'q1' && s.id !== 'result')
      expect(newStep?.type).toBe('question')

      // Sheet should be closed
      expect(isAddStepSheetOpen).toBe(false)
    })

    it('adds a lead-gen step when clicking Captura', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepSheet />)

      await user.click(screen.getByRole('button', { name: /captura/i }))

      const { steps } = useVisualBuilderStore.getState()
      const newStep = steps.find(s => s.type === 'lead-gen')
      expect(newStep).toBeDefined()
      expect(newStep?.label).toContain('Captura')
    })

    it('adds a promo step when clicking Promoção', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepSheet />)

      await user.click(screen.getByRole('button', { name: /promo/i }))

      const { steps } = useVisualBuilderStore.getState()
      const newStep = steps.find(s => s.type === 'promo')
      expect(newStep).toBeDefined()
    })

    it('inserts new step before result step', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepSheet />)

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

      render(<AddStepSheet />)

      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const { activeStepId, steps } = useVisualBuilderStore.getState()
      const newStep = steps.find(s => s.id !== 'intro' && s.id !== 'q1' && s.id !== 'result')

      expect(activeStepId).toBe(newStep?.id)
    })
  })

  describe('Sheet Controls', () => {
    it('closes sheet when clicking close button', async () => {
      const store = useVisualBuilderStore.getState()
      store.setAddStepSheetOpen(true)
      const user = userEvent.setup()

      render(<AddStepSheet />)

      // Find and click the close button (X icon)
      const closeButton = screen.getByRole('button', { name: /fechar/i })
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

      render(<AddStepSheet />)

      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const { steps } = useVisualBuilderStore.getState()
      const questionSteps = steps.filter(s => s.type === 'question')

      expect(questionSteps).toHaveLength(2)
      // Second question should have numbered label
      expect(questionSteps[1].label).toBe('Pergunta 2')
    })
  })
})
