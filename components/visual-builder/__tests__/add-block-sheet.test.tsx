import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { useVisualBuilderStore, Step, Outcome } from '@/store/visual-builder-store'
import { AddBlockSheet } from '../add-block-sheet'

const testSteps: Step[] = [
  {
    id: 'intro',
    type: 'intro',
    label: 'Intro',
    isFixed: true,
    blocks: [],
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
  { id: 'outcome-1', name: 'Outcome A', blocks: [] },
]

describe('AddBlockSheet', () => {
  beforeEach(() => {
    useVisualBuilderStore.getState().reset()
  })

  describe('Visibility', () => {
    it('renders when isAddBlockSheetOpen is true', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddBlockSheetOpen(true)

      render(<AddBlockSheet />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Adicionar bloco')).toBeInTheDocument()
    })

    it('does not render when isAddBlockSheetOpen is false', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddBlockSheetOpen(false)

      render(<AddBlockSheet />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Block type options', () => {
    it('shows all 9 block type options', () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setAddBlockSheetOpen(true)

      render(<AddBlockSheet />)

      expect(screen.getByRole('button', { name: /cabeçalho/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /texto/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /mídia/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /opções/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /campos/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /preço/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /botão/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /banner/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /lista/i })).toBeInTheDocument()
    })
  })

  describe('Adding blocks to steps', () => {
    it('adds a block to the active step when type is selected', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      store.setAddBlockSheetOpen(true)
      const user = userEvent.setup()

      render(<AddBlockSheet />)

      await user.click(screen.getByRole('button', { name: /texto/i }))

      const state = useVisualBuilderStore.getState()
      expect(state.isAddBlockSheetOpen).toBe(false)

      const introStep = state.steps.find(s => s.id === 'intro')
      expect(introStep?.blocks.length).toBe(1)
      expect(introStep?.blocks[0].type).toBe('text')
    })

    it('selects the newly added block', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      store.setAddBlockSheetOpen(true)
      const user = userEvent.setup()

      render(<AddBlockSheet />)

      await user.click(screen.getByRole('button', { name: /cabeçalho/i }))

      const state = useVisualBuilderStore.getState()
      const introStep = state.steps.find(s => s.id === 'intro')
      expect(state.selectedBlockId).toBe(introStep?.blocks[0].id)
    })
  })

  describe('Adding blocks to outcomes', () => {
    it('adds a block to the selected outcome when result step is active', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setOutcomes(testOutcomes)
      store.setActiveStepId('result')
      store.setSelectedOutcomeId('outcome-1')
      store.setAddBlockSheetOpen(true)
      const user = userEvent.setup()

      render(<AddBlockSheet />)

      await user.click(screen.getByRole('button', { name: /banner/i }))

      const state = useVisualBuilderStore.getState()
      expect(state.isAddBlockSheetOpen).toBe(false)

      const outcome = state.outcomes.find(o => o.id === 'outcome-1')
      expect(outcome?.blocks.length).toBe(1)
      expect(outcome?.blocks[0].type).toBe('banner')
    })
  })

  describe('Closing the sheet', () => {
    it('closes after selecting a block type', async () => {
      const store = useVisualBuilderStore.getState()
      store.setSteps(testSteps)
      store.setActiveStepId('intro')
      store.setAddBlockSheetOpen(true)
      const user = userEvent.setup()

      render(<AddBlockSheet />)

      // Selecting a block type should close the sheet
      await user.click(screen.getByRole('button', { name: /texto/i }))

      expect(useVisualBuilderStore.getState().isAddBlockSheetOpen).toBe(false)
    })
  })
})
