import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BlockList } from '../blocks/block-list'
import { Block } from '@/types/blocks'

const testBlocks: Block[] = [
  { id: 'block-1', type: 'header', enabled: true, config: { title: 'Header 1' } },
  { id: 'block-2', type: 'text', enabled: true, config: { content: 'Text content' } },
  { id: 'block-3', type: 'button', enabled: true, config: { text: 'Click me', action: 'next_step' } },
]

describe('BlockList', () => {
  describe('Rendering', () => {
    it('renders all blocks', () => {
      render(<BlockList blocks={testBlocks} />)

      expect(screen.getByText('Header 1')).toBeInTheDocument()
      expect(screen.getByText('Text content')).toBeInTheDocument()
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders empty state when no blocks', () => {
      render(<BlockList blocks={[]} />)

      expect(screen.getByText('Nenhum bloco adicionado')).toBeInTheDocument()
    })

    it('renders with correct test id', () => {
      render(<BlockList blocks={testBlocks} />)

      expect(screen.getByTestId('block-list')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('highlights selected block', () => {
      render(<BlockList blocks={testBlocks} selectedBlockId="block-2" />)

      const selectedBlock = screen.getByTestId('block-block-2')
      expect(selectedBlock).toHaveClass('ring-2')
      expect(selectedBlock).toHaveClass('ring-primary')
    })

    it('calls onBlockSelect when a block is clicked', async () => {
      const handleSelect = vi.fn()
      const user = userEvent.setup()

      render(<BlockList blocks={testBlocks} onBlockSelect={handleSelect} />)

      await user.click(screen.getByText('Header 1'))

      expect(handleSelect).toHaveBeenCalledWith('block-1')
    })
  })

  describe('Insertion Points', () => {
    it('renders insertion points when onInsertBlock is provided', () => {
      const handleInsert = vi.fn()

      render(<BlockList blocks={testBlocks} onInsertBlock={handleInsert} />)

      // Should have 4 insertion points (before first block + after each of the 3 blocks)
      expect(screen.getByTestId('insertion-point-0')).toBeInTheDocument()
      expect(screen.getByTestId('insertion-point-1')).toBeInTheDocument()
      expect(screen.getByTestId('insertion-point-2')).toBeInTheDocument()
      expect(screen.getByTestId('insertion-point-3')).toBeInTheDocument()
    })

    it('calls onInsertBlock with correct index when insertion point is clicked', async () => {
      const handleInsert = vi.fn()
      const user = userEvent.setup()

      render(<BlockList blocks={testBlocks} onInsertBlock={handleInsert} />)

      // Click the insertion point after the second block (index 2)
      await user.click(screen.getByTestId('insertion-point-2').querySelector('button')!)

      expect(handleInsert).toHaveBeenCalledWith(2)
    })

    it('shows prominent insertion point in empty state', () => {
      const handleInsert = vi.fn()

      render(<BlockList blocks={[]} onInsertBlock={handleInsert} />)

      // Should show the always-visible insertion point
      expect(screen.getByTestId('insertion-point-0')).toBeInTheDocument()
    })
  })
})
