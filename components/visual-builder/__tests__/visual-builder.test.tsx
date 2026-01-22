import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { VisualBuilder } from '../visual-builder'

describe('VisualBuilder', () => {
  describe('Structure', () => {
    it('renders without crashing', () => {
      render(<VisualBuilder />)
      expect(screen.getByTestId('visual-builder')).toBeInTheDocument()
    })

    it('renders header section', () => {
      render(<VisualBuilder />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('renders three-column layout with left sidebar, center preview, and right panel', () => {
      render(<VisualBuilder />)

      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('center-preview')).toBeInTheDocument()
      expect(screen.getByTestId('right-panel')).toBeInTheDocument()
    })

    it('renders navigation tabs in the header', () => {
      render(<VisualBuilder />)

      const header = screen.getByRole('banner')
      const tablist = within(header).getByRole('tablist')

      // Verify tab group exists with two tabs (Editar and Assistente)
      const tabs = within(tablist).getAllByRole('tab')
      expect(tabs).toHaveLength(2)
    })
  })

  describe('Tab Navigation', () => {
    it('has first tab (Editar) active by default', () => {
      render(<VisualBuilder />)

      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    })

    it('changes active tab when clicking a different tab', async () => {
      const user = userEvent.setup()
      render(<VisualBuilder />)

      const tabs = screen.getAllByRole('tab')
      const secondTab = tabs[1]

      await user.click(secondTab)

      expect(secondTab).toHaveAttribute('aria-selected', 'true')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
    })

    it('calls onTabChange callback when tab is clicked', async () => {
      const onTabChange = vi.fn()
      const user = userEvent.setup()

      render(<VisualBuilder onTabChange={onTabChange} />)

      const tabs = screen.getAllByRole('tab')
      await user.click(tabs[1])

      expect(onTabChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Header Actions', () => {
    it('renders back button', () => {
      render(<VisualBuilder />)

      expect(screen.getByRole('button', { name: /back|voltar/i })).toBeInTheDocument()
    })

    it('renders publish button', () => {
      render(<VisualBuilder />)

      expect(screen.getByRole('button', { name: /publish|publicar/i })).toBeInTheDocument()
    })

    it('renders preview button', () => {
      render(<VisualBuilder />)

      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('right panel has responsive visibility classes (hidden on mobile, visible on md+)', () => {
      render(<VisualBuilder />)

      const rightPanel = screen.getByTestId('right-panel')
      // The panel should have responsive classes: hidden by default, flex on md breakpoint
      expect(rightPanel).toHaveClass('hidden')
      expect(rightPanel).toHaveClass('md:flex')
    })
  })
})
