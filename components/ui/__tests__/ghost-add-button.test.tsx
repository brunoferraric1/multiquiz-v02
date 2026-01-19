import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { GhostAddButton } from '../ghost-add-button'
import { Plus, Star } from 'lucide-react'

describe('GhostAddButton', () => {
  it('renders with children text', () => {
    render(<GhostAddButton>Add item</GhostAddButton>)

    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
  })

  it('shows default plus icon', () => {
    render(<GhostAddButton>Add</GhostAddButton>)

    const button = screen.getByRole('button')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('shows custom icon when provided', () => {
    render(
      <GhostAddButton icon={<Star data-testid="custom-icon" />}>
        Add
      </GhostAddButton>
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<GhostAddButton onClick={onClick}>Add</GhostAddButton>)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<GhostAddButton disabled>Add</GhostAddButton>)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<GhostAddButton className="custom-class">Add</GhostAddButton>)

    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('has dashed border styling', () => {
    render(<GhostAddButton>Add</GhostAddButton>)

    expect(screen.getByRole('button')).toHaveClass('border-dashed')
  })
})
