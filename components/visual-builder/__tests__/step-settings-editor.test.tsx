import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { StepSettingsEditor } from '../editors'

describe('StepSettingsEditor', () => {
  const defaultSettings = { showProgress: false, allowBack: false }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Progress bar toggle', () => {
    it('renders progress bar toggle', () => {
      render(
        <StepSettingsEditor settings={defaultSettings} onChange={() => {}} />
      )

      expect(screen.getByTestId('show-progress-toggle')).toBeInTheDocument()
    })

    it('shows toggle as unchecked when showProgress is false', () => {
      render(
        <StepSettingsEditor
          settings={{ ...defaultSettings, showProgress: false }}
          onChange={() => {}}
        />
      )

      const toggle = screen.getByTestId('show-progress-toggle')
      expect(toggle).toHaveAttribute('data-state', 'unchecked')
    })

    it('shows toggle as checked when showProgress is true', () => {
      render(
        <StepSettingsEditor
          settings={{ ...defaultSettings, showProgress: true }}
          onChange={() => {}}
        />
      )

      const toggle = screen.getByTestId('show-progress-toggle')
      expect(toggle).toHaveAttribute('data-state', 'checked')
    })

    it('calls onChange when progress toggle is clicked', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<StepSettingsEditor settings={defaultSettings} onChange={onChange} />)

      await user.click(screen.getByTestId('show-progress-toggle'))

      expect(onChange).toHaveBeenCalledWith({ showProgress: true })
    })
  })

  describe('Back button toggle', () => {
    it('renders back button toggle on regular steps', () => {
      render(
        <StepSettingsEditor settings={defaultSettings} onChange={() => {}} />
      )

      expect(screen.getByTestId('allow-back-toggle')).toBeInTheDocument()
    })

    it('does not render back button toggle on intro step', () => {
      render(
        <StepSettingsEditor
          settings={defaultSettings}
          onChange={() => {}}
          isIntroStep
        />
      )

      expect(screen.queryByTestId('allow-back-toggle')).not.toBeInTheDocument()
    })

    it('shows toggle as unchecked when allowBack is false', () => {
      render(
        <StepSettingsEditor
          settings={{ ...defaultSettings, allowBack: false }}
          onChange={() => {}}
        />
      )

      const toggle = screen.getByTestId('allow-back-toggle')
      expect(toggle).toHaveAttribute('data-state', 'unchecked')
    })

    it('shows toggle as checked when allowBack is true', () => {
      render(
        <StepSettingsEditor
          settings={{ ...defaultSettings, allowBack: true }}
          onChange={() => {}}
        />
      )

      const toggle = screen.getByTestId('allow-back-toggle')
      expect(toggle).toHaveAttribute('data-state', 'checked')
    })

    it('calls onChange when back toggle is clicked', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<StepSettingsEditor settings={defaultSettings} onChange={onChange} />)

      await user.click(screen.getByTestId('allow-back-toggle'))

      expect(onChange).toHaveBeenCalledWith({ allowBack: true })
    })
  })

  describe('Step-specific messages', () => {
    it('shows intro step message when isIntroStep is true', () => {
      render(
        <StepSettingsEditor
          settings={defaultSettings}
          onChange={() => {}}
          isIntroStep
        />
      )

      expect(screen.getByText(/introdução é a primeira/i)).toBeInTheDocument()
    })

    it('shows result step message when isResultStep is true', () => {
      render(
        <StepSettingsEditor
          settings={defaultSettings}
          onChange={() => {}}
          isResultStep
        />
      )

      expect(screen.getByText(/resultados é a etapa final/i)).toBeInTheDocument()
    })
  })
})
