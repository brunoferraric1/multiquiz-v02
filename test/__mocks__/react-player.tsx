/**
 * Mock for react-player/lazy used in tests
 */
import React from 'react'

interface ReactPlayerProps {
  url?: string
  playing?: boolean
  controls?: boolean
  width?: string | number
  height?: string | number
  onPlay?: () => void
  onPause?: () => void
  config?: any
}

const MockReactPlayer: React.FC<ReactPlayerProps> = () => {
  return <div data-testid="mock-react-player" />
}

export default MockReactPlayer
