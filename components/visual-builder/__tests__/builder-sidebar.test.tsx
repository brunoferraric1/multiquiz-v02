import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BuilderSidebar } from '../builder-sidebar'

describe('BuilderSidebar', () => {
  describe('Structure', () => {
    it('renders as an aside element', () => {
      render(<BuilderSidebar />)
      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('renders add step button', () => {
      render(<BuilderSidebar />)
      expect(screen.getByRole('button', { name: /add.*step|adicionar.*etapa/i })).toBeInTheDocument()
    })

    it('renders steps list section', () => {
      render(<BuilderSidebar />)
      expect(screen.getByTestId('steps-list')).toBeInTheDocument()
    })

    it('renders results section', () => {
      render(<BuilderSidebar />)
      expect(screen.getByTestId('results-section')).toBeInTheDocument()
    })
  })

  describe('Steps List', () => {
    it('renders step items when steps are provided', () => {
      const steps = [
        { id: 'intro', type: 'intro' as const, label: 'Intro', isFixed: true },
        { id: 'q1', type: 'question' as const, label: 'P1' },
      ]

      render(<BuilderSidebar steps={steps} activeStepId="intro" />)

      expect(screen.getByText(/1\. Intro/)).toBeInTheDocument()
      expect(screen.getByText(/2\. P1/)).toBeInTheDocument()
    })

    it('highlights the active step', () => {
      const steps = [
        { id: 'intro', type: 'intro' as const, label: 'Intro', isFixed: true },
        { id: 'q1', type: 'question' as const, label: 'P1' },
      ]

      render(<BuilderSidebar steps={steps} activeStepId="q1" />)

      const stepsList = screen.getByTestId('steps-list')
      // Find the div with role="button" that is pressed (active)
      const buttons = within(stepsList).getAllByRole('button')
      const activeStep = buttons.find(btn => btn.getAttribute('aria-pressed') === 'true')

      expect(activeStep).toHaveTextContent('P1')
    })
  })

  describe('Interactions', () => {
    it('calls onAddStep when clicking add step button', async () => {
      const onAddStep = vi.fn()
      const user = userEvent.setup()

      render(<BuilderSidebar onAddStep={onAddStep} />)

      await user.click(screen.getByRole('button', { name: /add.*step|adicionar.*etapa/i }))

      expect(onAddStep).toHaveBeenCalledTimes(1)
    })

    it('calls onStepSelect when clicking a step', async () => {
      const onStepSelect = vi.fn()
      const user = userEvent.setup()
      const steps = [
        { id: 'intro', type: 'intro' as const, label: 'Intro', isFixed: true },
        { id: 'q1', type: 'question' as const, label: 'P1' },
      ]

      render(<BuilderSidebar steps={steps} activeStepId="intro" onStepSelect={onStepSelect} />)

      // Find the step item by its content (using the step number and label)
      const q1StepText = screen.getByText(/2\. P1/)
      const q1Step = q1StepText.closest('[role="button"]')

      await user.click(q1Step!)

      expect(onStepSelect).toHaveBeenCalledWith('q1')
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no steps are provided', () => {
      render(<BuilderSidebar steps={[]} />)

      expect(screen.getByTestId('steps-list')).toBeInTheDocument()
    })
  })
})
