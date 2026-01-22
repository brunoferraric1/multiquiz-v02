import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { useVisualBuilderStore } from '@/store/visual-builder-store'

// Mock Firebase auth hook
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
  }),
}))

// Mock subscription service
vi.mock('@/lib/services/subscription-service', () => ({
  useSubscription: () => ({
    subscription: null,
    isLoading: false,
    error: null,
  }),
  isPro: () => false,
}))

// Mock brand-kit service
vi.mock('@/lib/services/brand-kit-service', () => ({
  getThemeSettings: vi.fn().mockResolvedValue(null),
  saveThemeSettings: vi.fn().mockResolvedValue(undefined),
}))

// Mock storage service
vi.mock('@/lib/services/storage-service', () => ({
  uploadImage: vi.fn().mockResolvedValue('https://example.com/image.png'),
  getBrandKitLogoPath: vi.fn().mockReturnValue('/brand-kit/logo.png'),
}))

// Mock next/dynamic to handle dynamic imports in tests
vi.mock('next/dynamic', () => ({
  default: (dynamicFn: () => Promise<any>, options?: any) => {
    // Return a simple component that renders nothing (for react-player, etc.)
    const MockComponent = () => null
    MockComponent.displayName = 'DynamicMock'
    return MockComponent
  },
}))

// Mock next/navigation for components using app router hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
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
