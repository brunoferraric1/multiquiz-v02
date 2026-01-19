import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BuilderHeaderNav, HeaderTab } from '../builder-header-nav'

describe('BuilderHeaderNav', () => {
  const defaultProps = {
    quizName: 'Test Quiz',
    activeTab: 'editar' as HeaderTab,
    onTabChange: vi.fn(),
    onBack: vi.fn(),
    onPreview: vi.fn(),
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

    it('renders all five tabs', () => {
      render(<BuilderHeaderNav {...defaultProps} />)

      const tablist = screen.getByRole('tablist')
      const tabs = within(tablist).getAllByRole('tab')

      expect(tabs).toHaveLength(5)
    })

    it('renders back, preview, and publish buttons', () => {
      render(<BuilderHeaderNav {...defaultProps} />)

      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument()
    })
  })

  describe('Tab Selection', () => {
    it('marks the active tab as selected', () => {
      render(<BuilderHeaderNav {...defaultProps} activeTab="tema" />)

      const tabs = screen.getAllByRole('tab')
      const temaTab = tabs.find(tab => tab.textContent?.includes('Tema'))

      expect(temaTab).toHaveAttribute('aria-selected', 'true')
    })

    it('marks non-active tabs as not selected', () => {
      render(<BuilderHeaderNav {...defaultProps} activeTab="editar" />)

      const tabs = screen.getAllByRole('tab')
      const nonActiveTabs = tabs.filter(tab => !tab.textContent?.includes('Editar'))

      nonActiveTabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected', 'false')
      })
    })
  })

  describe('Interactions', () => {
    it('calls onTabChange when clicking a tab', async () => {
      const onTabChange = vi.fn()
      const user = userEvent.setup()

      render(<BuilderHeaderNav {...defaultProps} onTabChange={onTabChange} />)

      const tabs = screen.getAllByRole('tab')
      const temaTab = tabs.find(tab => tab.textContent?.includes('Tema'))

      await user.click(temaTab!)

      expect(onTabChange).toHaveBeenCalledWith('tema')
    })

    it('calls onBack when clicking back button', async () => {
      const onBack = vi.fn()
      const user = userEvent.setup()

      render(<BuilderHeaderNav {...defaultProps} onBack={onBack} />)

      await user.click(screen.getByRole('button', { name: /voltar/i }))

      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it('calls onPreview when clicking preview button', async () => {
      const onPreview = vi.fn()
      const user = userEvent.setup()

      render(<BuilderHeaderNav {...defaultProps} onPreview={onPreview} />)

      await user.click(screen.getByRole('button', { name: /preview/i }))

      expect(onPreview).toHaveBeenCalledTimes(1)
    })

    it('calls onPublish when clicking publish button', async () => {
      const onPublish = vi.fn()
      const user = userEvent.setup()

      render(<BuilderHeaderNav {...defaultProps} onPublish={onPublish} />)

      await user.click(screen.getByRole('button', { name: /publicar/i }))

      expect(onPublish).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has accessible labels for action buttons', () => {
      render(<BuilderHeaderNav {...defaultProps} />)

      expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /publicar/i })).toBeInTheDocument()
    })
  })
})
