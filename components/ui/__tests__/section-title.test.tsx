import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SectionTitle } from '../section-title'

describe('SectionTitle', () => {
  it('renders children text', () => {
    render(<SectionTitle>Test Title</SectionTitle>)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('applies uppercase styling', () => {
    render(<SectionTitle>Test Title</SectionTitle>)
    const span = screen.getByText('Test Title')
    expect(span).toHaveClass('uppercase')
  })

  it('applies tracking-wide for letter spacing', () => {
    render(<SectionTitle>Test Title</SectionTitle>)
    const span = screen.getByText('Test Title')
    expect(span).toHaveClass('tracking-wide')
  })

  it('applies muted foreground color', () => {
    render(<SectionTitle>Test Title</SectionTitle>)
    const span = screen.getByText('Test Title')
    expect(span).toHaveClass('text-muted-foreground')
  })

  it('includes bottom margin wrapper', () => {
    render(<SectionTitle>Test Title</SectionTitle>)
    const span = screen.getByText('Test Title')
    const wrapper = span.parentElement
    expect(wrapper).toHaveClass('mb-3')
  })

  it('accepts custom className on wrapper', () => {
    render(<SectionTitle className="mt-4">Test Title</SectionTitle>)
    const span = screen.getByText('Test Title')
    const wrapper = span.parentElement
    expect(wrapper).toHaveClass('mb-3', 'mt-4')
  })
})
