import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ConnectedPropertiesPanel } from '../connected-properties-panel'
import { useVisualBuilderStore } from '@/store/visual-builder-store'
import { createBlock } from '@/types/blocks'

describe('ConnectedPropertiesPanel', () => {
  beforeEach(() => {
    // Reset the store before each test
    useVisualBuilderStore.getState().reset()
  })

  describe('Empty state', () => {
    it('renders empty state when no step is selected', () => {
      useVisualBuilderStore.setState({ activeStepId: undefined })

      render(<ConnectedPropertiesPanel />)

      expect(screen.getByText(/selecione uma etapa ou bloco/i)).toBeInTheDocument()
    })
  })

  describe('Step settings view', () => {
    it('shows settings button when a step is selected', () => {
      // The store is initialized with intro step active
      render(<ConnectedPropertiesPanel />)

      expect(screen.getByRole('button', { name: /abrir configurações/i })).toBeInTheDocument()
    })

    it('opens settings sheet when clicking settings button', async () => {
      const user = userEvent.setup()
      render(<ConnectedPropertiesPanel />)

      await user.click(screen.getByRole('button', { name: /abrir configurações/i }))

      expect(screen.getByTestId('step-settings-editor')).toBeInTheDocument()
    })

    it('shows step name in title', () => {
      render(<ConnectedPropertiesPanel />)

      expect(screen.getByText('Intro')).toBeInTheDocument()
    })

    it('shows block list for the step', () => {
      render(<ConnectedPropertiesPanel />)

      // Intro step has default blocks: header, media (disabled), button
      expect(screen.getByText('Cabeçalho')).toBeInTheDocument()
      expect(screen.getByText('Botão')).toBeInTheDocument()
    })

    it('clicking a block in list selects it', async () => {
      const user = userEvent.setup()

      render(<ConnectedPropertiesPanel />)

      // Click on the header block in the list
      const headerButton = screen.getByRole('button', { name: /cabeçalho/i })
      await user.click(headerButton)

      // Should now show block editor with back button
      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
    })

    it('shows add block button', () => {
      render(<ConnectedPropertiesPanel />)

      expect(screen.getByRole('button', { name: /adicionar bloco/i })).toBeInTheDocument()
    })

    it('opens add block sheet when clicking add block button', async () => {
      const user = userEvent.setup()
      render(<ConnectedPropertiesPanel />)

      await user.click(screen.getByRole('button', { name: /adicionar bloco/i }))

      expect(useVisualBuilderStore.getState().isAddBlockSheetOpen).toBe(true)
    })
  })

  describe('Block editor view', () => {
    it('shows block editor when a block is selected', () => {
      // Set up store with a selected block
      const steps = useVisualBuilderStore.getState().steps
      const introStep = steps.find(s => s.type === 'intro')
      const firstBlock = introStep?.blocks[0]

      if (firstBlock) {
        useVisualBuilderStore.setState({ selectedBlockId: firstBlock.id })
      }

      render(<ConnectedPropertiesPanel />)

      // Should show the header block editor
      expect(screen.getByTestId('header-block-editor')).toBeInTheDocument()
    })

    it('shows back button in block editor view', () => {
      const steps = useVisualBuilderStore.getState().steps
      const introStep = steps.find(s => s.type === 'intro')
      const firstBlock = introStep?.blocks[0]

      if (firstBlock) {
        useVisualBuilderStore.setState({ selectedBlockId: firstBlock.id })
      }

      render(<ConnectedPropertiesPanel />)

      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
    })

    it('shows block controls in block editor view', () => {
      const steps = useVisualBuilderStore.getState().steps
      const introStep = steps.find(s => s.type === 'intro')
      const firstBlock = introStep?.blocks[0]

      if (firstBlock) {
        useVisualBuilderStore.setState({ selectedBlockId: firstBlock.id })
      }

      render(<ConnectedPropertiesPanel />)

      expect(screen.getByTestId('block-controls')).toBeInTheDocument()
    })

    it('clicking back button returns to step view', async () => {
      const user = userEvent.setup()

      const steps = useVisualBuilderStore.getState().steps
      const introStep = steps.find(s => s.type === 'intro')
      const firstBlock = introStep?.blocks[0]

      if (firstBlock) {
        useVisualBuilderStore.setState({ selectedBlockId: firstBlock.id })
      }

      render(<ConnectedPropertiesPanel />)

      await user.click(screen.getByRole('button', { name: /voltar/i }))

      // Should now show step view with settings button
      expect(screen.getByRole('button', { name: /abrir configurações/i })).toBeInTheDocument()
    })
  })

  describe('Result step with outcomes', () => {
    beforeEach(() => {
      // Set up store with result step active and an outcome
      const resultStep = useVisualBuilderStore.getState().steps.find(s => s.type === 'result')

      useVisualBuilderStore.setState({
        activeStepId: resultStep?.id,
        outcomes: [
          {
            id: 'outcome-1',
            name: 'Success Outcome',
            blocks: [
              createBlock('header'),
              createBlock('text'),
              createBlock('button'),
            ],
          },
        ],
        selectedOutcomeId: 'outcome-1',
      })
    })

    it('shows outcome name in title', () => {
      render(<ConnectedPropertiesPanel />)

      expect(screen.getByText('Success Outcome')).toBeInTheDocument()
    })

    it('shows blocks from outcome', () => {
      render(<ConnectedPropertiesPanel />)

      expect(screen.getByText('Cabeçalho')).toBeInTheDocument()
      expect(screen.getByText('Texto')).toBeInTheDocument()
      expect(screen.getByText('Botão')).toBeInTheDocument()
    })

    it('can edit outcome blocks', async () => {
      const user = userEvent.setup()

      render(<ConnectedPropertiesPanel />)

      // Click on the header block to edit
      await user.click(screen.getByRole('button', { name: /cabeçalho/i }))

      // Should show header editor
      expect(screen.getByTestId('header-block-editor')).toBeInTheDocument()
    })
  })

  describe('Block type specific editors', () => {
    it('shows header editor for header blocks', () => {
      const steps = useVisualBuilderStore.getState().steps
      const introStep = steps.find(s => s.type === 'intro')
      const headerBlock = introStep?.blocks.find(b => b.type === 'header')

      if (headerBlock) {
        useVisualBuilderStore.setState({ selectedBlockId: headerBlock.id })
      }

      render(<ConnectedPropertiesPanel />)

      expect(screen.getByTestId('header-block-editor')).toBeInTheDocument()
    })

    it('shows button editor for button blocks', () => {
      const steps = useVisualBuilderStore.getState().steps
      const introStep = steps.find(s => s.type === 'intro')
      const buttonBlock = introStep?.blocks.find(b => b.type === 'button')

      if (buttonBlock) {
        useVisualBuilderStore.setState({ selectedBlockId: buttonBlock.id })
      }

      render(<ConnectedPropertiesPanel />)

      expect(screen.getByTestId('button-block-editor')).toBeInTheDocument()
    })

    it('shows disabled indicator for disabled blocks in block list', () => {
      // Don't select any block, just show the step view with block list
      // Media is disabled by default in intro
      render(<ConnectedPropertiesPanel />)

      // The block list shows "(oculto)" for disabled blocks
      expect(screen.getByText('(oculto)')).toBeInTheDocument()
    })
  })
})
