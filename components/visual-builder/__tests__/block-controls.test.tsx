import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BlockControls } from '../editors'

describe('BlockControls', () => {
  const defaultProps = {
    enabled: true,
    onToggle: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onDelete: vi.fn(),
    canMoveUp: true,
    canMoveDown: true,
    blockTypeName: 'Cabeçalho',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Enable/Disable toggle', () => {
    it('renders enabled toggle', () => {
      render(<BlockControls {...defaultProps} />)

      expect(screen.getByTestId('block-enabled-toggle')).toBeInTheDocument()
    })

    it('shows toggle as checked when enabled', () => {
      render(<BlockControls {...defaultProps} enabled={true} />)

      const toggle = screen.getByTestId('block-enabled-toggle')
      expect(toggle).toHaveAttribute('data-state', 'checked')
    })

    it('shows toggle as unchecked when disabled', () => {
      render(<BlockControls {...defaultProps} enabled={false} />)

      const toggle = screen.getByTestId('block-enabled-toggle')
      expect(toggle).toHaveAttribute('data-state', 'unchecked')
    })

    it('calls onToggle when toggle is clicked', async () => {
      const onToggle = vi.fn()
      const user = userEvent.setup()

      render(<BlockControls {...defaultProps} onToggle={onToggle} />)

      await user.click(screen.getByTestId('block-enabled-toggle'))

      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Reorder controls', () => {
    it('renders move up button', () => {
      render(<BlockControls {...defaultProps} />)

      expect(screen.getByTestId('move-up-button')).toBeInTheDocument()
    })

    it('renders move down button', () => {
      render(<BlockControls {...defaultProps} />)

      expect(screen.getByTestId('move-down-button')).toBeInTheDocument()
    })

    it('calls onMoveUp when move up button is clicked', async () => {
      const onMoveUp = vi.fn()
      const user = userEvent.setup()

      render(<BlockControls {...defaultProps} onMoveUp={onMoveUp} />)

      await user.click(screen.getByTestId('move-up-button'))

      expect(onMoveUp).toHaveBeenCalledTimes(1)
    })

    it('calls onMoveDown when move down button is clicked', async () => {
      const onMoveDown = vi.fn()
      const user = userEvent.setup()

      render(<BlockControls {...defaultProps} onMoveDown={onMoveDown} />)

      await user.click(screen.getByTestId('move-down-button'))

      expect(onMoveDown).toHaveBeenCalledTimes(1)
    })

    it('disables move up button when canMoveUp is false', () => {
      render(<BlockControls {...defaultProps} canMoveUp={false} />)

      expect(screen.getByTestId('move-up-button')).toBeDisabled()
    })

    it('disables move down button when canMoveDown is false', () => {
      render(<BlockControls {...defaultProps} canMoveDown={false} />)

      expect(screen.getByTestId('move-down-button')).toBeDisabled()
    })
  })

  describe('Delete button', () => {
    it('renders delete button', () => {
      render(<BlockControls {...defaultProps} />)

      expect(screen.getByTestId('delete-block-button')).toBeInTheDocument()
    })

    it('calls onDelete when delete button is clicked', async () => {
      const onDelete = vi.fn()
      const user = userEvent.setup()

      render(<BlockControls {...defaultProps} onDelete={onDelete} />)

      await user.click(screen.getByTestId('delete-block-button'))

      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('includes block type name in delete button label', () => {
      render(<BlockControls {...defaultProps} blockTypeName="Banner" />)

      expect(screen.getByLabelText(/excluir bloco banner/i)).toBeInTheDocument()
    })
  })
})
