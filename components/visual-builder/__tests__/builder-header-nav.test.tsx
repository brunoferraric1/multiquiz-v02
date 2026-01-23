import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BuilderHeaderNav } from '../builder-header-nav'

describe('BuilderHeaderNav', () => {
  const defaultProps = {
    quizName: 'Test Quiz',
    onBack: vi.fn(),
    onPublish: vi.fn(),
  }

  describe('Structure', () => {
    it('renders as a header element', () => {
      render(<BuilderHeaderNav {...defaultProps} />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('displays the quiz name', () => {
      render(<BuilderHeaderNav {...defaultProps} quizName="My Custom Quiz" />)
      expect(screen.getByText('My Custom Quiz')).toBeInTheDocument()
    })

    it('renders back and publish buttons', () => {
      render(<BuilderHeaderNav {...defaultProps} />)

      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument()
    })

    it('displays draft badge when not published', () => {
      render(<BuilderHeaderNav {...defaultProps} isPublished={false} />)
      expect(screen.getByText(/rascunho/i)).toBeInTheDocument()
    })

    it('displays published badge when published', () => {
      render(<BuilderHeaderNav {...defaultProps} isPublished={true} />)
      expect(screen.getByText(/publicado/i)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('calls onBack when clicking back button', async () => {
      const onBack = vi.fn()
      const user = userEvent.setup()

      render(<BuilderHeaderNav {...defaultProps} onBack={onBack} />)

      await user.click(screen.getByRole('button', { name: /voltar/i }))

      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it('calls onPublish when clicking publish button', async () => {
      const onPublish = vi.fn()
      const user = userEvent.setup()

      render(<BuilderHeaderNav {...defaultProps} onPublish={onPublish} />)

      await user.click(screen.getByRole('button', { name: /publicar/i }))

      expect(onPublish).toHaveBeenCalledTimes(1)
    })
  })

  describe('Publish Button States', () => {
    it('shows Publicar text when not published', () => {
      render(<BuilderHeaderNav {...defaultProps} isPublished={false} />)
      expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument()
    })

    it('shows Atualizar text when published', () => {
      render(<BuilderHeaderNav {...defaultProps} isPublished={true} />)
      expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument()
    })

    it('disables publish button when publishing', () => {
      render(<BuilderHeaderNav {...defaultProps} isPublishing={true} />)
      expect(screen.getByRole('button', { name: /publicando/i })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has accessible labels for action buttons', () => {
      render(<BuilderHeaderNav {...defaultProps} />)

      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument()
    })
  })
})
