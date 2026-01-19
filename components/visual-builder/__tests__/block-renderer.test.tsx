import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BlockRenderer } from '../blocks/block-renderer'
import { Block } from '@/types/blocks'

describe('BlockRenderer', () => {
  describe('Rendering by type', () => {
    it('renders header block', () => {
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title', description: 'Test description' },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('renders text block', () => {
      const block: Block = {
        id: 'block-1',
        type: 'text',
        enabled: true,
        config: { content: 'Test content' },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('renders media block placeholder when no url', () => {
      const block: Block = {
        id: 'block-1',
        type: 'media',
        enabled: true,
        config: { type: 'image', url: '' },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Adicionar imagem')).toBeInTheDocument()
    })

    it('renders options block with items', () => {
      const block: Block = {
        id: 'block-1',
        type: 'options',
        enabled: true,
        config: {
          items: [
            { id: 'opt-1', text: 'Option A' },
            { id: 'opt-2', text: 'Option B' },
          ],
          selectionType: 'single',
        },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Option A')).toBeInTheDocument()
      expect(screen.getByText('Option B')).toBeInTheDocument()
    })

    it('renders fields block with form inputs', () => {
      const block: Block = {
        id: 'block-1',
        type: 'fields',
        enabled: true,
        config: {
          items: [
            { id: 'field-1', label: 'Name', type: 'text', required: true },
            { id: 'field-2', label: 'Email', type: 'email', required: false },
          ],
        },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('renders price block', () => {
      const block: Block = {
        id: 'block-1',
        type: 'price',
        enabled: true,
        config: { productTitle: 'Product Name', value: '99,90', prefix: 'R$' },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Product Name')).toBeInTheDocument()
      expect(screen.getByText('99,90')).toBeInTheDocument()
    })

    it('renders button block', () => {
      const block: Block = {
        id: 'block-1',
        type: 'button',
        enabled: true,
        config: { text: 'Click me', action: 'next_step' },
      }

      render(<BlockRenderer block={block} />)

      // The button block contains a button element with the text
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders banner block', () => {
      const block: Block = {
        id: 'block-1',
        type: 'banner',
        enabled: true,
        config: { urgency: 'warning', text: 'Warning message' },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })

    it('renders list block with items', () => {
      const block: Block = {
        id: 'block-1',
        type: 'list',
        enabled: true,
        config: {
          items: [
            { id: 'item-1', text: 'Item 1' },
            { id: 'item-2', text: 'Item 2' },
          ],
        },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  describe('Disabled state', () => {
    it('shows disabled state for disabled blocks', () => {
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: false,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} />)

      const blockElement = screen.getByTestId('block-block-1')
      expect(blockElement).toHaveAttribute('data-block-enabled', 'false')
      expect(screen.getByText(/desativado/i)).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('shows selected state when isSelected is true', () => {
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} isSelected={true} />)

      const blockElement = screen.getByTestId('block-block-1')
      expect(blockElement).toHaveClass('ring-2')
      expect(blockElement).toHaveClass('ring-primary')
    })

    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} onClick={handleClick} />)

      await user.click(screen.getByTestId('block-block-1'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('calls onClick on Enter key', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} onClick={handleClick} />)

      const blockElement = screen.getByTestId('block-block-1')
      blockElement.focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Hover actions', () => {
    it('shows edit button on hover', () => {
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} onClick={vi.fn()} />)

      expect(screen.getByRole('button', { name: /editar bloco/i })).toBeInTheDocument()
    })

    it('shows delete button when onDelete is provided', () => {
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} onDelete={vi.fn()} />)

      expect(screen.getByRole('button', { name: /excluir bloco/i })).toBeInTheDocument()
    })

    it('does not show delete button when onDelete is not provided', () => {
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} />)

      expect(screen.queryByRole('button', { name: /excluir bloco/i })).not.toBeInTheDocument()
    })

    it('calls onDelete when delete button is clicked', async () => {
      const handleDelete = vi.fn()
      const user = userEvent.setup()
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} onDelete={handleDelete} />)

      await user.click(screen.getByRole('button', { name: /excluir bloco/i }))

      expect(handleDelete).toHaveBeenCalledTimes(1)
    })

    it('edit button triggers onClick', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} onClick={handleClick} />)

      await user.click(screen.getByRole('button', { name: /editar bloco/i }))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper role and tabIndex', () => {
      const block: Block = {
        id: 'block-1',
        type: 'header',
        enabled: true,
        config: { title: 'Test Title' },
      }

      render(<BlockRenderer block={block} />)

      const blockElement = screen.getByTestId('block-block-1')
      expect(blockElement).toHaveAttribute('role', 'button')
      expect(blockElement).toHaveAttribute('tabIndex', '0')
    })
  })
})
