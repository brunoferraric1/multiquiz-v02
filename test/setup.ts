import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { useVisualBuilderStore } from '@/store/visual-builder-store'

// Mock next/dynamic to handle dynamic imports in tests
vi.mock('next/dynamic', () => ({
  default: (dynamicFn: () => Promise<any>, options?: any) => {
    // Return a simple component that renders nothing (for react-player, etc.)
    const MockComponent = () => null
    MockComponent.displayName = 'DynamicMock'
    return MockComponent
  },
}))

// Reset store and cleanup after each test
beforeEach(() => {
  useVisualBuilderStore.getState().reset()
})

afterEach(() => {
  cleanup()
})

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver as a class (required for dnd-kit)
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock IntersectionObserver as a class
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ''
  thresholds = []
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
