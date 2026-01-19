import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

// Custom render with providers (add providers here as needed)
function AllProviders({ children }: { children: ReactNode }) {
  return <>{children}</>
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
