import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step, Outcome } from '@/store/visual-builder-store'
import { StepPreview } from '../step-preview'

const testSteps: Step[] = [
  {
    id: 'intro',
    type: 'intro',
    label: 'Intro',
    isFixed: true,
    blocks: [
      { id: 'intro-header', type: 'header', enabled: true, config: { title: 'Welcome!' } },
      { id: 'intro-button', type: 'button', enabled: true, config: { text: 'Start', action: 'next_step' } },
    ],
  },
  {
    id: 'q1',
    type: 'question',
    label: 'P1',
    blocks: [
      { id: 'q1-header', type: 'header', enabled: true, config: { title: 'Question 1' } },
      { id: 'q1-options', type: 'options', enabled: true, config: { items: [], selectionType: 'single' } },
    ],
  },
  {
    id: 'result',
    type: 'result',
    label: 'Resultado',
    isFixed: true,
    blocks: [],
  },
]

const testOutcomes: Outcome[] = [
  {
    id: 'outcome-1',
    name: 'Outcome A',
    blocks: [
      { id: 'outcome-1-header', type: 'header', enabled: true, config: { title: 'Result A' } },
      { id: 'outcome-1-text', type: 'text', enabled: true, config: { content: 'You got result A!' } },
    ],
  },
  {
    id: 'outcome-2',
    name: 'Outcome B',
    blocks: [
      { id: 'outcome-2-header', type: 'header', enabled: true, config: { title: 'Result B' } },
    ],
  },
]

describe('StepPreview', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Rendering step blocks', () => {
    it('renders blocks for the active step', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')

      render(<StepPreview />)

      expect(screen.getByText('Welcome!')).toBeInTheDocument()
      expect(screen.getByText('Start')).toBeInTheDocument()
    })

    it('renders blocks for question step', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('q1')

      render(<StepPreview />)

      expect(screen.getByText('Question 1')).toBeInTheDocument()
    })

    it('shows empty state when no step is selected', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId(undefined)

      render(<StepPreview />)

      expect(screen.getByText('Selecione uma etapa para ver o preview')).toBeInTheDocument()
    })
  })

  describe('Rendering outcome blocks (result step)', () => {
    it('renders blocks for selected outcome when result step is active', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      store.setActiveStepId('result')
      store.setSelectedOutcomeId('outcome-1')

      render(<StepPreview />)

      expect(screen.getByText('Result A')).toBeInTheDocument()
      expect(screen.getByText('You got result A!')).toBeInTheDocument()
    })

    it('switches outcome blocks when outcome selection changes', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      store.setActiveStepId('result')
      store.setSelectedOutcomeId('outcome-2')

      render(<StepPreview />)

      expect(screen.getByText('Result B')).toBeInTheDocument()
      expect(screen.queryByText('Result A')).not.toBeInTheDocument()
    })

    it('shows empty state for result step without outcomes', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('result')

      render(<StepPreview />)

      expect(screen.getByText('Adicione um resultado para começar')).toBeInTheDocument()
    })
  })

  describe('Block selection', () => {
    it('highlights selected block', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      store.setSelectedBlockId('intro-header')

      render(<StepPreview />)

      const selectedBlock = screen.getByTestId('block-intro-header')
      expect(selectedBlock).toHaveClass('ring-2')
    })

    it('updates selection when clicking a block', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      const user = userEvent.setup()

      render(<StepPreview />)

      await user.click(screen.getByText('Welcome!'))

      expect(useVisualBuilderStore.getState().selectedBlockId).toBe('intro-header')
    })
  })
})
