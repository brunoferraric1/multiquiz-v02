import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step } from '@/store/visual-builder-store'
import { SortableStepsList } from '../sortable-steps-list'

// Test data
const testSteps: Step[] = [
  { id: 'intro', type: 'intro', label: 'Intro', isFixed: true, blocks: [] },
  { id: 'q1', type: 'question', label: 'P1', subtitle: 'Question 1', blocks: [] },
  { id: 'q2', type: 'question', label: 'P2', subtitle: 'Question 2', blocks: [] },
  { id: 'q3', type: 'question', label: 'P3', subtitle: 'Question 3', blocks: [] },
  { id: 'result', type: 'result', label: 'Resultado', isFixed: true, blocks: [] },
]

describe('SortableStepsList', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Structure', () => {
    it('renders all sortable steps (excludes intro and result)', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Intro and result are filtered out, only question steps are shown
      expect(screen.getByText(/1\. P1/)).toBeInTheDocument()
      expect(screen.getByText(/2\. P2/)).toBeInTheDocument()
      expect(screen.getByText(/3\. P3/)).toBeInTheDocument()
      // Intro and result should not be in this list
      expect(screen.queryByText(/Intro/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Resultado/)).not.toBeInTheDocument()
    })

    it('makes non-fixed steps draggable via drag handle', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Non-fixed steps should have a drag handle
      const dragHandles = screen.getAllByLabelText(/arrastar/i)
      expect(dragHandles.length).toBeGreaterThan(0)
    })

    it('filters out intro and result steps from sortable list', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Intro and result steps should not be in the sortable list at all
      expect(screen.queryByTestId('step-item-intro')).not.toBeInTheDocument()
      expect(screen.queryByTestId('step-item-result')).not.toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    it('has drag handles for keyboard reordering', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Each non-fixed step should have a drag handle
      const dragHandles = screen.getAllByLabelText(/arrastar/i)
      expect(dragHandles.length).toBe(3) // 3 question steps

      // Drag handles should be keyboard focusable
      const firstHandle = dragHandles[0]
      expect(firstHandle).toHaveAttribute('type', 'button')
    })
  })

  describe('Step Selection', () => {
    it('updates store when clicking a step', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      const user = userEvent.setup()

      render(<SortableStepsList />)

      const q1Step = screen.getByText(/1\. P1/).closest('[role="button"]')
      await user.click(q1Step!)

      expect(useVisualBuilderStore.getState().activeStepId).toBe('q1')
    })

    it('highlights the active step', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('q2')

      render(<SortableStepsList />)

      const q2Step = screen.getByText(/2\. P2/).closest('[role="button"]')
      expect(q2Step).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Delete Step', () => {
    it('deletes step when using dropdown menu', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      const user = userEvent.setup()

      render(<SortableStepsList />)

      // Find step q1 and open its options menu (aria-label uses "Opções para" format)
      const optionsButton = screen.getByRole('button', { name: /opções para 1\. p1/i })
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

      // Find step q1 and open its options menu (aria-label uses "Opções para" format)
      const optionsButton = screen.getByRole('button', { name: /opções para 1\. p1/i })
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

      // Non-fixed steps should have options menu with proper aria-label (Portuguese: "Opções para")
      expect(screen.getByRole('button', { name: /opções para 1\. p1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /opções para 2\. p2/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /opções para 3\. p3/i })).toBeInTheDocument()
    })

    it('does not show options menu for fixed steps', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)

      render(<SortableStepsList />)

      // Fixed step (intro) should not have options menu - and intro is not rendered in this list
      expect(screen.queryByRole('button', { name: /opções para intro/i })).not.toBeInTheDocument()
    })
  })
})
