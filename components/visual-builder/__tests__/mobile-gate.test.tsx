import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileGate } from '../mobile-gate'

// Mock the i18n context
vi.mock('@/lib/i18n/context', () => ({
  useMessages: () => ({
    visualBuilder: {
      mobileGate: {
        title: 'Use desktop to edit',
        description: 'The quiz editor is designed for larger screens.',
        backButton: 'Back to dashboard',
      },
    },
  }),
}))

describe('MobileGate', () => {
  it('renders children in the hidden md:contents container', () => {
    render(
      <MobileGate>
        <div data-testid="child-content">Builder Content</div>
      </MobileGate>
    )

    // Children should be rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Builder Content')).toBeInTheDocument()
  })

  it('renders the mobile gate message', () => {
    render(
      <MobileGate>
        <div>Builder Content</div>
      </MobileGate>
    )

    // Mobile gate content should be present
    expect(screen.getByText('Use desktop to edit')).toBeInTheDocument()
    expect(screen.getByText('The quiz editor is designed for larger screens.')).toBeInTheDocument()
  })

  it('renders back button when onBack is provided', () => {
    const onBack = vi.fn()

    render(
      <MobileGate onBack={onBack}>
        <div>Builder Content</div>
      </MobileGate>
    )

    expect(screen.getByRole('button', { name: 'Back to dashboard' })).toBeInTheDocument()
  })

  it('does not render back button when onBack is not provided', () => {
    render(
      <MobileGate>
        <div>Builder Content</div>
      </MobileGate>
    )

    expect(screen.queryByRole('button', { name: 'Back to dashboard' })).not.toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    render(
      <MobileGate onBack={onBack}>
        <div>Builder Content</div>
      </MobileGate>
    )

    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('has correct CSS classes for responsive display', () => {
    const { container } = render(
      <MobileGate>
        <div>Builder Content</div>
      </MobileGate>
    )

    // Mobile view should have 'flex md:hidden' classes
    const mobileView = container.querySelector('.flex.md\\:hidden')
    expect(mobileView).toBeInTheDocument()

    // Desktop view should have 'hidden md:contents' classes
    const desktopView = container.querySelector('.hidden.md\\:contents')
    expect(desktopView).toBeInTheDocument()
  })

  it('renders the monitor icon', () => {
    render(
      <MobileGate>
        <div>Builder Content</div>
      </MobileGate>
    )

    // The Monitor icon should be present (as an SVG)
    const iconContainer = screen.getByText('Use desktop to edit').closest('.bg-card')
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument()
  })
})
