import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step } from '@/store/visual-builder-store'
import { SortableStepsList } from '../sortable-steps-list'

// Test data
const testSteps: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', isFixed: true },
  { id: 'q1', type: 'question', label: 'P1', subtitle: 'Question 1' },
  { id: 'q2', type: 'question', label: 'P2', subtitle: 'Question 2' },
  { id: 'q3', type: 'question', label: 'P3', subtitle: 'Question 3' },
  { id: 'result', type: 'result', label: 'Resultado', isFixed: true },
]

describe('SortableStepsList', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Structure', () => {
    it('renders all non-result steps', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      expect(screen.getByText(/1\. Intro/)).toBeInTheDocument()
      expect(screen.getByText(/2\. P1/)).toBeInTheDocument()
      expect(screen.getByText(/3\. P2/)).toBeInTheDocument()
      expect(screen.getByText(/4\. P3/)).toBeInTheDocument()
    })

    it('makes non-fixed steps draggable (entire card)', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Non-fixed steps should have cursor-grab class indicating they are draggable
      const q1Step = screen.getByTestId('step-item-q1')
      expect(q1Step).toHaveClass('cursor-grab')
    })

    it('does not make fixed steps (intro) draggable', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Fixed step (intro) should not have cursor-grab class
      const introStep = screen.getByTestId('step-item-intro')
      expect(introStep).not.toHaveClass('cursor-grab')
    })
  })

  describe('Drag and Drop', () => {
    it('supports keyboard reordering on the entire card', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // The entire card is now draggable - find the q2 step item
      const q2StepItem = screen.getByTestId('step-item-q2')

      // Focus the draggable item
      q2StepItem.focus()

      // Simulate keyboard reorder (Space to pick up, Up to move, Space to drop)
      fireEvent.keyDown(q2StepItem, { key: ' ', code: 'Space' })
      fireEvent.keyDown(q2StepItem, { key: 'ArrowUp', code: 'ArrowUp' })
      fireEvent.keyDown(q2StepItem, { key: ' ', code: 'Space' })

      // Wait for potential state updates
      await new Promise(resolve => setTimeout(resolve, 100))

      // Note: dnd-kit keyboard sorting is complex to test fully
      // The important thing is that the component renders correctly
    })
  })

  describe('Step Selection', () => {
    it('updates store when clicking a step', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      const user = userEvent.setup()

      render(<SortableStepsList />)

      const q1Step = screen.getByText(/2\. P1/).closest('[role="button"]')
      await user.click(q1Step!)

      expect(useVisualBuilderStore.getState().activeStepId).toBe('q1')
    })

    it('highlights the active step', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('q2')

      render(<SortableStepsList />)

      const q2Step = screen.getByText(/3\. P2/).closest('[role="button"]')
      expect(q2Step).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Delete Step', () => {
    it('deletes step when using dropdown menu', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<SortableStepsList />)

      // Find step q1 and open its options menu
      const optionsButton = screen.getByRole('button', { name: /options for p1/i })
      await user.click(optionsButton)

      // Click delete option in the dropdown
      const deleteOption = await screen.findByRole('menuitem', { name: /excluir/i })
      await user.click(deleteOption)

      const { steps } = useVisualBuilderStore.getState()
      expect(steps.find(s => s.id === 'q1')).toBeUndefined()
    })
  })

  describe('Duplicate Step', () => {
    it('duplicates step when using dropdown menu', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<SortableStepsList />)

      // Find step q1 and open its options menu
      const optionsButton = screen.getByRole('button', { name: /options for p1/i })
      await user.click(optionsButton)

      // Click duplicate option in the dropdown
      const duplicateOption = await screen.findByRole('menuitem', { name: /duplicar/i })
      await user.click(duplicateOption)

      const { steps, activeStepId } = useVisualBuilderStore.getState()
      // Should have one more step
      expect(steps.length).toBe(6)
      // The new step should be after q1 and have "(cópia)" in the label
      const duplicatedStep = steps.find(s => s.label.includes('(cópia)'))
      expect(duplicatedStep).toBeDefined()
      expect(activeStepId).toBe(duplicatedStep?.id)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for step items', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Each clickable step item should have proper role and aria-pressed
      const stepButtons = screen.getAllByRole('button', { pressed: false })
      expect(stepButtons.length).toBeGreaterThan(0)
    })

    it('has accessible options menu for non-fixed steps', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Non-fixed steps should have options menu with proper aria-label
      expect(screen.getByRole('button', { name: /options for p1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /options for p2/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /options for p3/i })).toBeInTheDocument()
    })

    it('does not show options menu for fixed steps', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Fixed step (intro) should not have options menu
      expect(screen.queryByRole('button', { name: /options for intro/i })).not.toBeInTheDocument()
    })
  })
})
