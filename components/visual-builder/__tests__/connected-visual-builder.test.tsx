import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step, Outcome } from '@/store/visual-builder-store'
import { ConnectedVisualBuilder } from '../connected-visual-builder'

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

describe('ConnectedVisualBuilder', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Structure', () => {
    it('renders the visual builder container', () => {
      render(<ConnectedVisualBuilder />)
      expect(screen.getByTestId('visual-builder')).toBeInTheDocument()
    })

    it('renders header navigation', () => {
      render(<ConnectedVisualBuilder />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('renders left sidebar with steps', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<ConnectedVisualBuilder />)

      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
      expect(screen.getByText(/1\. Intro/)).toBeInTheDocument()
    })

    it('renders center preview area', () => {
      render(<ConnectedVisualBuilder />)
      expect(screen.getByTestId('preview-container')).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('shows active step in preview', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('q1')

      render(<ConnectedVisualBuilder />)

      // Check that Q1 is marked as active in sidebar
      const sidebar = screen.getByTestId('left-sidebar')
      const activeStep = within(sidebar).getByText(/2\. P1/)
      expect(activeStep.closest('[aria-pressed="true"]')).toBeInTheDocument()
    })

    it('updates active step when clicking a step', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<ConnectedVisualBuilder />)

      // Click on P2 step
      const sidebar = screen.getByTestId('left-sidebar')
      const q2Step = within(sidebar).getByText(/3\. P2/).closest('[role="button"]')
      await user.click(q2Step!)

      expect(useVisualBuilderStore.getState().activeStepId).toBe('q2')
    })
  })

  describe('Add Step Flow', () => {
    it('opens add step sheet when clicking add button', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<ConnectedVisualBuilder />)

      await user.click(screen.getByRole('button', { name: /adicionar.*etapa/i }))

      // Sheet should be open - dialog contains step type options
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // Check for the description text which is unique to the sheet
      expect(screen.getByText(/escolha o tipo de etapa/i)).toBeInTheDocument()
    })

    it('adds a step and selects it', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<ConnectedVisualBuilder />)

      // Open sheet
      await user.click(screen.getByRole('button', { name: /adicionar.*etapa/i }))

      // Click on "Pergunta" option
      await user.click(screen.getByRole('button', { name: /pergunta/i }))

      const state = useVisualBuilderStore.getState()
      expect(state.steps.length).toBe(5)
      expect(state.isAddStepSheetOpen).toBe(false)
    })
  })

  describe('Delete Step', () => {
    it('deletes a step when using dropdown menu', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<ConnectedVisualBuilder />)

      // Find and open options menu for q1
      const sidebar = screen.getByTestId('left-sidebar')
      const optionsButton = within(sidebar).getByRole('button', { name: /options for p1/i })
      await user.click(optionsButton)

      // Click delete option in the dropdown
      const deleteOption = await screen.findByRole('menuitem', { name: /excluir/i })
      await user.click(deleteOption)

      const { steps } = useVisualBuilderStore.getState()
      expect(steps.find(s => s.id === 'q1')).toBeUndefined()
    })

    it('protects fixed steps from deletion', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<ConnectedVisualBuilder />)

      const sidebar = screen.getByTestId('left-sidebar')

      // Intro step should not have an options menu
      expect(within(sidebar).queryByRole('button', { name: /options for intro/i })).not.toBeInTheDocument()
    })
  })

  describe('Outcome Management', () => {
    it('shows outcomes in sidebar', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)

      render(<ConnectedVisualBuilder />)

      expect(screen.getByText('Outcome A')).toBeInTheDocument()
      expect(screen.getByText('Outcome B')).toBeInTheDocument()
    })

    it('selects outcome when clicking', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      const user = userEvent.setup()

      render(<ConnectedVisualBuilder />)

      await user.click(screen.getByText('Outcome B'))

      const state = useVisualBuilderStore.getState()
      expect(state.activeStepId).toBe('result')
      expect(state.selectedOutcomeId).toBe('outcome-2')
    })

    it('adds new outcome when clicking add button', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      const user = userEvent.setup()

      render(<ConnectedVisualBuilder />)

      const addOutcomeButton = screen.getByRole('button', { name: /add outcome/i })
      await user.click(addOutcomeButton)

      expect(useVisualBuilderStore.getState().outcomes.length).toBe(3)
    })

    it('deletes outcome when more than one exists', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      const user = userEvent.setup()

      render(<ConnectedVisualBuilder />)

      const resultsSection = screen.getByTestId('results-section')
      const outcomeA = within(resultsSection).getByText('Outcome A').closest('[role="button"]') as HTMLElement
      const deleteButton = within(outcomeA).getByRole('button', { name: /delete/i })

      await user.click(deleteButton)

      expect(useVisualBuilderStore.getState().outcomes.length).toBe(1)
    })
  })

  describe('Quiz Name', () => {
    it('displays the quiz name in header', () => {
      render(<ConnectedVisualBuilder quizName="My Test Quiz" />)

      expect(screen.getByText('My Test Quiz')).toBeInTheDocument()
    })

    it('uses default name when not provided', () => {
      render(<ConnectedVisualBuilder />)

      expect(screen.getByText('Meu Quiz')).toBeInTheDocument()
    })
  })
})
