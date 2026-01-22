import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PageBreadcrumb } from '../page-breadcrumb'

describe('PageBreadcrumb', () => {
  it('renders nothing when items array is empty', () => {
    const { container } = render(<PageBreadcrumb items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders single item without separator', () => {
    render(<PageBreadcrumb items={[{ label: 'Settings' }]} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    // Should not have any separator icons
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument()
  })

  it('renders multiple items with separators', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Configurações', href: '/dashboard/settings' },
          { label: 'Temas' },
        ]}
      />
    )

    expect(screen.getByText('Configurações')).toBeInTheDocument()
    expect(screen.getByText('Temas')).toBeInTheDocument()
  })

  it('renders link for items with href', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Themes' },
        ]}
      />
    )

    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link).toHaveAttribute('href', '/settings')
  })

  it('does not render link for last item even if it has href', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Themes', href: '/settings/themes' },
        ]}
      />
    )

    // First item should be a link
    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link).toBeInTheDocument()

    // Last item should NOT be a link (should be span)
    expect(screen.queryByRole('link', { name: 'Themes' })).not.toBeInTheDocument()
    expect(screen.getByText('Themes')).toBeInTheDocument()
  })

  it('renders span for items without href', () => {
    render(<PageBreadcrumb items={[{ label: 'Current Page' }]} />)

    // Should be rendered as span, not link
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Current Page')).toBeInTheDocument()
  })

  it('marks last item as current page for accessibility', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Settings', href: '/settings' },
          { label: 'Themes' },
        ]}
      />
    )

    const currentPage = screen.getByText('Themes')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
  })

  it('applies link styling to items with href', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Themes' },
        ]}
      />
    )

    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link).toHaveClass('text-muted-foreground')
  })

  it('applies current page styling to last item', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Settings', href: '/settings' },
          { label: 'Themes' },
        ]}
      />
    )

    const currentPage = screen.getByText('Themes')
    expect(currentPage).toHaveClass('font-medium', 'text-foreground')
  })

  it('has accessible nav landmark with label', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Current' },
        ]}
      />
    )

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    const { container } = render(
      <PageBreadcrumb items={[{ label: 'Test' }]} className="mt-4 mb-2" />
    )

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('mt-4', 'mb-2')
  })
})
