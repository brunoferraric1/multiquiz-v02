import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BuilderPreview } from '../builder-preview'

describe('BuilderPreview', () => {
  describe('Structure', () => {
    it('renders as a main element', () => {
      render(<BuilderPreview />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders device toggle buttons', () => {
      render(<BuilderPreview />)

      expect(screen.getByRole('button', { name: /mobile/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /desktop/i })).toBeInTheDocument()
    })

    it('renders preview container', () => {
      render(<BuilderPreview />)
      expect(screen.getByTestId('preview-container')).toBeInTheDocument()
    })

    it('renders preview card', () => {
      render(<BuilderPreview />)
      expect(screen.getByTestId('preview-card')).toBeInTheDocument()
    })
  })

  describe('Device Toggle', () => {
    it('defaults to mobile view', () => {
      render(<BuilderPreview />)

      const mobileButton = screen.getByRole('button', { name: /mobile/i })
      expect(mobileButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to desktop view when clicking desktop button', async () => {
      const user = userEvent.setup()
      render(<BuilderPreview />)

      const desktopButton = screen.getByRole('button', { name: /desktop/i })
      await user.click(desktopButton)

      expect(desktopButton).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /mobile/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('calls onDeviceChange callback when toggling', async () => {
      const onDeviceChange = vi.fn()
      const user = userEvent.setup()

      render(<BuilderPreview onDeviceChange={onDeviceChange} />)

      const desktopButton = screen.getByRole('button', { name: /desktop/i })
      await user.click(desktopButton)

      expect(onDeviceChange).toHaveBeenCalledWith('desktop')
    })
  })

  describe('Preview Card Sizing', () => {
    it('applies mobile width in mobile view', () => {
      render(<BuilderPreview device="mobile" />)

      const previewCard = screen.getByTestId('preview-card')
      expect(previewCard).toHaveStyle({ width: '375px' })
    })

    it('applies desktop width in desktop view', () => {
      render(<BuilderPreview device="desktop" />)

      const previewCard = screen.getByTestId('preview-card')
      expect(previewCard).toHaveStyle({ width: '600px' })
    })
  })

  describe('Content Rendering', () => {
    it('renders children inside preview card', () => {
      render(
        <BuilderPreview>
          <div data-testid="test-content">Test Content</div>
        </BuilderPreview>
      )

      const previewCard = screen.getByTestId('preview-card')
      expect(previewCard).toContainElement(screen.getByTestId('test-content'))
    })
  })

  describe('Preview Button', () => {
    it('renders preview button', () => {
      render(<BuilderPreview />)
      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
    })

    it('calls onPreview when clicking preview button', async () => {
      const onPreview = vi.fn()
      const user = userEvent.setup()

      render(<BuilderPreview onPreview={onPreview} />)

      await user.click(screen.getByRole('button', { name: /preview/i }))

      expect(onPreview).toHaveBeenCalledTimes(1)
    })

    it('shows loading state when isPreviewing is true', () => {
      render(<BuilderPreview isPreviewing={true} />)

      const previewButton = screen.getByRole('button', { name: /preview/i })
      expect(previewButton).toBeDisabled()
    })
  })
})
