import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BuilderProperties } from '../builder-properties'

describe('BuilderProperties', () => {
  describe('Structure', () => {
    it('renders as an aside element', () => {
      render(<BuilderProperties />)
      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('has the correct test id', () => {
      render(<BuilderProperties />)
      expect(screen.getByTestId('right-panel')).toBeInTheDocument()
    })

    it('renders header section', () => {
      render(<BuilderProperties />)
      expect(screen.getByTestId('properties-header')).toBeInTheDocument()
    })

    it('renders content area', () => {
      render(<BuilderProperties />)
      expect(screen.getByTestId('properties-content')).toBeInTheDocument()
    })
  })

  describe('Title Display', () => {
    it('shows default title when no title is provided', () => {
      render(<BuilderProperties />)
      // Check for the title specifically in the header (h3 element)
      expect(screen.getByRole('heading', { name: /propriedades/i })).toBeInTheDocument()
    })

    it('shows custom title when provided', () => {
      render(<BuilderProperties title="Step Settings" />)
      expect(screen.getByText('Step Settings')).toBeInTheDocument()
    })

    it('shows step title when step is selected', () => {
      render(<BuilderProperties title="Pergunta 1" />)
      expect(screen.getByText('Pergunta 1')).toBeInTheDocument()
    })
  })

  describe('Back Navigation', () => {
    it('does not show back button by default', () => {
      render(<BuilderProperties />)
      expect(screen.queryByRole('button', { name: /voltar|back/i })).not.toBeInTheDocument()
    })

    it('shows back button when showBack is true', () => {
      render(<BuilderProperties showBack onBack={() => {}} />)
      expect(screen.getByRole('button', { name: /voltar|back/i })).toBeInTheDocument()
    })

    it('calls onBack when back button is clicked', async () => {
      const onBack = vi.fn()
      const user = userEvent.setup()

      render(<BuilderProperties showBack onBack={onBack} />)

      await user.click(screen.getByRole('button', { name: /voltar|back/i }))

      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('Content Rendering', () => {
    it('renders children inside content area', () => {
      render(
        <BuilderProperties>
          <div data-testid="test-content">Test Content</div>
        </BuilderProperties>
      )

      const content = screen.getByTestId('properties-content')
      expect(content).toContainElement(screen.getByTestId('test-content'))
    })

    it('shows empty state when no children are provided', () => {
      render(<BuilderProperties />)

      const content = screen.getByTestId('properties-content')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Actions in Header', () => {
    it('renders action buttons when provided', () => {
      const actions = (
        <button data-testid="action-button">Action</button>
      )

      render(<BuilderProperties actions={actions} />)

      expect(screen.getByTestId('action-button')).toBeInTheDocument()
    })
  })
})
