import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step, Outcome } from '@/store/visual-builder-store'
import { ConnectedBuilderSidebar } from '../connected-builder-sidebar'

// Test data
const testSteps: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', isFixed: true, subtitle: 'Welcome' },
  { id: 'q1', type: 'question', label: 'P1', subtitle: 'Question 1' },
  { id: 'q2', type: 'question', label: 'P2', subtitle: 'Question 2' },
  { id: 'result', type: 'result', label: 'Resultado', isFixed: true },
]

const testOutcomes: Outcome[] = [
  { id: 'outcome-1', name: 'Outcome A' },
  { id: 'outcome-2', name: 'Outcome B' },
]

describe('ConnectedBuilderSidebar', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Step Selection', () => {
    it('reads steps from the store', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<ConnectedBuilderSidebar />)

      expect(screen.getByText(/1\. Intro/)).toBeInTheDocument()
      expect(screen.getByText(/2\. P1/)).toBeInTheDocument()
      expect(screen.getByText(/3\. P2/)).toBeInTheDocument()
    })

    it('highlights the active step from store', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('q1')

      render(<ConnectedBuilderSidebar />)

      const stepsList = screen.getByTestId('steps-list')
      const buttons = within(stepsList).getAllByRole('button')
      const activeStep = buttons.find(btn => btn.getAttribute('aria-pressed') === 'true')

      expect(activeStep).toHaveTextContent('P1')
    })

    it('updates store when clicking a step', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      const user = userEvent.setup()

      render(<ConnectedBuilderSidebar />)

      // Find and click P1 step
      const q1StepText = screen.getByText(/2\. P1/)
      const q1Step = q1StepText.closest('[role="button"]')
      await user.click(q1Step!)

      expect(useVisualBuilderStore.getState().activeStepId).toBe('q1')
    })

    it('clears outcome selection when selecting non-result step', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      store.setActiveStepId('result')
      store.setSelectedOutcomeId('outcome-1')
      const user = userEvent.setup()

      render(<ConnectedBuilderSidebar />)

      // Click intro step
      const introStep = screen.getByText(/1\. Intro/).closest('[role="button"]')
      await user.click(introStep!)

      expect(useVisualBuilderStore.getState().selectedOutcomeId).toBeUndefined()
    })
  })

  describe('Outcome Selection', () => {
    it('reads outcomes from the store', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)

      render(<ConnectedBuilderSidebar />)

      expect(screen.getByText('Outcome A')).toBeInTheDocument()
      expect(screen.getByText('Outcome B')).toBeInTheDocument()
    })

    it('highlights selected outcome', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      store.setActiveStepId('result')
      store.setSelectedOutcomeId('outcome-1')

      render(<ConnectedBuilderSidebar />)

      const resultsSection = screen.getByTestId('results-section')
      const buttons = within(resultsSection).getAllByRole('button')
      const activeOutcome = buttons.find(btn => btn.getAttribute('aria-pressed') === 'true')

      expect(activeOutcome).toBeDefined()
      expect(activeOutcome).toHaveTextContent('Outcome A')
    })

    it('updates store when clicking an outcome', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      const user = userEvent.setup()

      render(<ConnectedBuilderSidebar />)

      await user.click(screen.getByText('Outcome B'))

      const state = useVisualBuilderStore.getState()
      expect(state.activeStepId).toBe('result')
      expect(state.selectedOutcomeId).toBe('outcome-2')
    })
  })

  describe('Add Step', () => {
    it('opens add step sheet when clicking add button', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<ConnectedBuilderSidebar />)

      await user.click(screen.getByRole('button', { name: /adicionar.*etapa/i }))

      expect(useVisualBuilderStore.getState().isAddStepSheetOpen).toBe(true)
    })
  })

  describe('Delete Step', () => {
    it('deletes step when clicking delete button', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<ConnectedBuilderSidebar />)

      // Find step q1 and its delete button
      const stepsList = screen.getByTestId('steps-list')
      const q1Step = within(stepsList).getByText(/2\. P1/).closest('.group') as HTMLElement
      const deleteButton = within(q1Step).getByRole('button', { name: /delete/i })

      await user.click(deleteButton)

      const { steps } = useVisualBuilderStore.getState()
      expect(steps.find(s => s.id === 'q1')).toBeUndefined()
    })

    it('does not show delete button for fixed steps', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<ConnectedBuilderSidebar />)

      const stepsList = screen.getByTestId('steps-list')
      const introStep = within(stepsList).getByText(/1\. Intro/).closest('.group') as HTMLElement

      expect(within(introStep).queryByRole('button', { name: /delete/i })).toBeNull()
    })
  })

  describe('Delete Outcome', () => {
    it('deletes outcome when clicking delete button (when more than one exists)', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      const user = userEvent.setup()

      render(<ConnectedBuilderSidebar />)

      const resultsSection = screen.getByTestId('results-section')
      const outcomeA = within(resultsSection).getByText('Outcome A').closest('[role="button"]') as HTMLElement
      const deleteButton = within(outcomeA).getByRole('button', { name: /delete/i })

      await user.click(deleteButton)

      const { outcomes } = useVisualBuilderStore.getState()
      expect(outcomes.find(o => o.id === 'outcome-1')).toBeUndefined()
      expect(outcomes).toHaveLength(1)
    })

    it('does not show delete button when only one outcome exists', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes([testOutcomes[0]])

      render(<ConnectedBuilderSidebar />)

      const resultsSection = screen.getByTestId('results-section')
      expect(within(resultsSection).queryByRole('button', { name: /delete/i })).toBeNull()
    })
  })

  describe('Add Outcome', () => {
    it('adds outcome when clicking add outcome button', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes([])
      const user = userEvent.setup()

      render(<ConnectedBuilderSidebar />)

      const addOutcomeButton = screen.getByRole('button', { name: /add outcome/i })
      await user.click(addOutcomeButton)

      const { outcomes } = useVisualBuilderStore.getState()
      expect(outcomes).toHaveLength(1)
    })
  })
})
