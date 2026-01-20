// react-player v3 has its own types, but we augment them here for additional safety
declare module 'react-player' {
  import { ComponentType } from 'react'

  interface ReactPlayerProps {
    url: string
    playing?: boolean
    loop?: boolean
    controls?: boolean
    light?: boolean | string
    volume?: number
    muted?: boolean
    playbackRate?: number
    width?: string | number
    height?: string | number
    style?: React.CSSProperties
    progressInterval?: number
    playsinline?: boolean
    pip?: boolean
    stopOnUnmount?: boolean
    fallback?: React.ReactNode
    wrapper?: string | ComponentType<{ children: React.ReactNode }>
    playIcon?: React.ReactNode
    previewTabIndex?: number
    config?: {
      youtube?: {
        playerVars?: {
          modestbranding?: number
          rel?: number
          showinfo?: number
          [key: string]: any
        }
      }
      vimeo?: {
        playerOptions?: {
          byline?: boolean
          portrait?: boolean
          title?: boolean
          [key: string]: any
        }
      }
      [key: string]: any
    }
    onReady?: (player: any) => void
    onStart?: () => void
    onPlay?: () => void
    onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void
    onDuration?: (duration: number) => void
    onPause?: () => void
    onBuffer?: () => void
    onBufferEnd?: () => void
    onSeek?: (seconds: number) => void
    onEnded?: () => void
    onError?: (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => void
    onClickPreview?: (event: any) => void
    onEnablePIP?: () => void
    onDisablePIP?: () => void
  }

  const ReactPlayer: ComponentType<ReactPlayerProps>
  export default ReactPlayer
}
