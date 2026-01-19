import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { useVisualBuilderStore, Step, Outcome } from '@/store/visual-builder-store'

// Reset store between tests
export function resetVisualBuilderStore() {
  useVisualBuilderStore.getState().reset()
}

// Initialize store with test data
export function initializeVisualBuilderStore(data: { steps?: Step[]; outcomes?: Outcome[] }) {
  const store = useVisualBuilderStore.getState()
  if (data.steps) {
    store.setSteps(data.steps)
    if (data.steps.length > 0) {
      store.setActiveStepId(data.steps[0].id)
    }
  }
  if (data.outcomes) {
    store.setOutcomes(data.outcomes)
  }
}

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
