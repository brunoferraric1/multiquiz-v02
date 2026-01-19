import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import {
  HeaderBlockEditor,
  TextBlockEditor,
  MediaBlockEditor,
  OptionsBlockEditor,
  FieldsBlockEditor,
  PriceBlockEditor,
  ButtonBlockEditor,
  BannerBlockEditor,
  ListBlockEditor,
} from '../editors'

describe('HeaderBlockEditor', () => {
  const defaultConfig = { title: '', description: '' }

  it('renders title and description inputs', () => {
    render(<HeaderBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
  })

  it('calls onChange when title is updated', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<HeaderBlockEditor config={defaultConfig} onChange={onChange} />)

    await user.type(screen.getByLabelText(/título/i), 'New Title')

    expect(onChange).toHaveBeenCalled()
  })

  it('displays existing values', () => {
    render(
      <HeaderBlockEditor
        config={{ title: 'My Title', description: 'My Description' }}
        onChange={() => {}}
      />
    )

    expect(screen.getByDisplayValue('My Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('My Description')).toBeInTheDocument()
  })
})

describe('TextBlockEditor', () => {
  const defaultConfig = { content: '' }

  it('renders content textarea', () => {
    render(<TextBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/conteúdo/i)).toBeInTheDocument()
  })

  it('calls onChange when content is updated', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<TextBlockEditor config={defaultConfig} onChange={onChange} />)

    await user.type(screen.getByLabelText(/conteúdo/i), 'New content')

    expect(onChange).toHaveBeenCalled()
  })
})

describe('MediaBlockEditor', () => {
  const defaultConfig = { type: 'image' as const, url: '' }

  it('renders media type buttons', () => {
    render(<MediaBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('media-type-image')).toBeInTheDocument()
    expect(screen.getByTestId('media-type-video')).toBeInTheDocument()
  })

  it('shows image type as selected by default', () => {
    render(<MediaBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('media-type-image')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('media-type-video')).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange when type is changed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<MediaBlockEditor config={defaultConfig} onChange={onChange} />)

    await user.click(screen.getByTestId('media-type-video'))

    expect(onChange).toHaveBeenCalledWith({ type: 'video' })
  })

  it('shows alt text input only for images', () => {
    const { rerender } = render(
      <MediaBlockEditor config={{ type: 'image', url: '' }} onChange={() => {}} />
    )

    expect(screen.getByLabelText(/texto alternativo/i)).toBeInTheDocument()

    rerender(
      <MediaBlockEditor config={{ type: 'video', url: '' }} onChange={() => {}} />
    )

    expect(screen.queryByLabelText(/texto alternativo/i)).not.toBeInTheDocument()
  })
})

describe('OptionsBlockEditor', () => {
  const defaultConfig = { items: [], selectionType: 'single' as const }

  it('renders selection type buttons', () => {
    render(<OptionsBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('selection-type-single')).toBeInTheDocument()
    expect(screen.getByTestId('selection-type-multiple')).toBeInTheDocument()
  })

  it('shows single selection as selected by default', () => {
    render(<OptionsBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('selection-type-single')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onChange when selection type is changed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<OptionsBlockEditor config={defaultConfig} onChange={onChange} />)

    await user.click(screen.getByTestId('selection-type-multiple'))

    expect(onChange).toHaveBeenCalledWith({ selectionType: 'multiple' })
  })

  it('can add new options', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<OptionsBlockEditor config={defaultConfig} onChange={onChange} />)

    const input = screen.getByTestId('new-option-input')
    await user.type(input, 'Option A')
    await user.click(screen.getByTestId('add-option-button'))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ text: 'Option A' })
        ])
      })
    )
  })

  it('renders existing options', () => {
    const config = {
      items: [
        { id: '1', text: 'Option 1' },
        { id: '2', text: 'Option 2' },
      ],
      selectionType: 'single' as const,
    }

    render(<OptionsBlockEditor config={config} onChange={() => {}} />)

    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument()
  })
})

describe('FieldsBlockEditor', () => {
  const defaultConfig = { items: [] }

  it('renders add field button', () => {
    render(<FieldsBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('add-field-button')).toBeInTheDocument()
  })

  it('can add new fields', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<FieldsBlockEditor config={defaultConfig} onChange={onChange} />)

    await user.click(screen.getByTestId('add-field-button'))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ type: 'text' })
        ])
      })
    )
  })

  it('renders existing fields', () => {
    const config = {
      items: [
        { id: '1', label: 'Name', type: 'text' as const, required: true },
        { id: '2', label: 'Email', type: 'email' as const, required: false },
      ],
    }

    render(<FieldsBlockEditor config={config} onChange={() => {}} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })
})

describe('PriceBlockEditor', () => {
  const defaultConfig = { productTitle: '', value: '', prefix: 'R$' }

  it('renders product title input', () => {
    render(<PriceBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/nome do produto/i)).toBeInTheDocument()
  })

  it('renders price inputs', () => {
    render(<PriceBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/prefixo do preço/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/valor do preço/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sufixo do preço/i)).toBeInTheDocument()
  })

  it('renders highlight toggle', () => {
    render(<PriceBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/destacar preço/i)).toBeInTheDocument()
  })

  it('displays existing values', () => {
    render(
      <PriceBlockEditor
        config={{ productTitle: 'Premium', value: '99,90', prefix: 'R$', suffix: '/mês' }}
        onChange={() => {}}
      />
    )

    expect(screen.getByDisplayValue('Premium')).toBeInTheDocument()
    expect(screen.getByDisplayValue('99,90')).toBeInTheDocument()
    expect(screen.getByDisplayValue('/mês')).toBeInTheDocument()
  })
})

describe('ButtonBlockEditor', () => {
  const defaultConfig = { text: 'Continuar', action: 'next_step' as const }

  it('renders button text input', () => {
    render(<ButtonBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/texto do botão/i)).toBeInTheDocument()
  })

  it('renders action type buttons when both are enabled', () => {
    render(<ButtonBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('action-type-next')).toBeInTheDocument()
    expect(screen.getByTestId('action-type-url')).toBeInTheDocument()
  })

  it('hides next_step button when disabled', () => {
    render(
      <ButtonBlockEditor
        config={defaultConfig}
        onChange={() => {}}
        disableNextStep
      />
    )

    expect(screen.queryByTestId('action-type-next')).not.toBeInTheDocument()
    expect(screen.getByTestId('action-type-url')).toBeInTheDocument()
  })

  it('hides url button when disabled', () => {
    render(
      <ButtonBlockEditor
        config={defaultConfig}
        onChange={() => {}}
        disableUrl
      />
    )

    expect(screen.getByTestId('action-type-next')).toBeInTheDocument()
    expect(screen.queryByTestId('action-type-url')).not.toBeInTheDocument()
  })

  it('shows URL input when action is url', () => {
    render(
      <ButtonBlockEditor
        config={{ text: 'Click', action: 'url', url: '' }}
        onChange={() => {}}
      />
    )

    expect(screen.getByLabelText(/url de destino/i)).toBeInTheDocument()
  })
})

describe('BannerBlockEditor', () => {
  const defaultConfig = { urgency: 'info' as const, text: '' }

  it('renders urgency type buttons', () => {
    render(<BannerBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('urgency-info')).toBeInTheDocument()
    expect(screen.getByTestId('urgency-warning')).toBeInTheDocument()
    expect(screen.getByTestId('urgency-danger')).toBeInTheDocument()
  })

  it('renders emoji input', () => {
    render(<BannerBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/emoji/i)).toBeInTheDocument()
  })

  it('renders banner text input', () => {
    render(<BannerBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByLabelText(/mensagem do banner/i)).toBeInTheDocument()
  })

  it('calls onChange when urgency is changed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<BannerBlockEditor config={defaultConfig} onChange={onChange} />)

    await user.click(screen.getByTestId('urgency-warning'))

    expect(onChange).toHaveBeenCalledWith({ urgency: 'warning' })
  })
})

describe('ListBlockEditor', () => {
  const defaultConfig = { items: [] }

  it('renders new item input', () => {
    render(<ListBlockEditor config={defaultConfig} onChange={() => {}} />)

    expect(screen.getByTestId('new-list-item-input')).toBeInTheDocument()
    expect(screen.getByTestId('add-list-item-button')).toBeInTheDocument()
  })

  it('can add new items', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<ListBlockEditor config={defaultConfig} onChange={onChange} />)

    const input = screen.getByTestId('new-list-item-input')
    await user.type(input, 'Item 1')
    await user.click(screen.getByTestId('add-list-item-button'))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ text: 'Item 1' })
        ])
      })
    )
  })

  it('renders existing items', () => {
    const config = {
      items: [
        { id: '1', text: 'First item' },
        { id: '2', text: 'Second item', emoji: '✓' },
      ],
    }

    render(<ListBlockEditor config={config} onChange={() => {}} />)

    expect(screen.getByDisplayValue('First item')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Second item')).toBeInTheDocument()
    expect(screen.getByDisplayValue('✓')).toBeInTheDocument()
  })
})
