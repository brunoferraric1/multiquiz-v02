/**
 * Visual Builder Helpers
 *
 * Utility functions to extract metadata from visualBuilderData.
 * These replace the need to read from legacy questions/outcomes arrays.
 */

import type { VisualBuilderStep, VisualBuilderOutcome, VisualBuilderData } from '@/types'
import type { HeaderConfig, MediaConfig, OptionsConfig, FieldsConfig } from '@/types/blocks'

/**
 * Extract quiz title from intro step header block
 */
export function extractTitleFromSteps(steps: VisualBuilderStep[]): string {
  const introStep = steps.find((s) => s.type === 'intro')
  if (!introStep) return ''

  const headerBlock = introStep.blocks.find((b) => b.type === 'header' && b.enabled)
  const config = headerBlock?.config as HeaderConfig | undefined

  return config?.title || ''
}

/**
 * Extract quiz description from intro step header block
 */
export function extractDescriptionFromSteps(steps: VisualBuilderStep[]): string {
  const introStep = steps.find((s) => s.type === 'intro')
  if (!introStep) return ''

  const headerBlock = introStep.blocks.find((b) => b.type === 'header' && b.enabled)
  const config = headerBlock?.config as HeaderConfig | undefined

  return config?.description || ''
}

/**
 * Extract cover image URL from steps for the quiz document
 * Uses the same fallback logic as extractIntroMediaPreviewFromSteps
 * to keep the stored coverImageUrl in sync with what's displayed
 */
export function extractCoverImageFromSteps(steps: VisualBuilderStep[]): string | undefined {
  // Use the same logic as the preview extraction to keep them in sync
  return extractIntroMediaPreviewFromSteps(steps)
}

function getVideoThumbnail(url: string): string | undefined {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern)
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
    }
  }

  return undefined
}

/**
 * Extract media preview URL from a media config
 * For videos: prioritizes custom videoThumbnail over auto-extracted thumbnail
 */
function getMediaPreviewUrl(config: MediaConfig | undefined): string | undefined {
  if (!config?.url) return undefined
  if (config.type === 'image') return config.url
  if (config.type === 'video') {
    return config.videoThumbnail || getVideoThumbnail(config.url)
  }
  return undefined
}

/**
 * Media preview data including URL and focal point
 */
export interface MediaPreviewData {
  url: string
  focalPoint?: { x: number; y: number }
}

/**
 * Extract media preview data (URL + focal point) from a media config
 * For videos: uses videoThumbnailFocalPoint when custom thumbnail is set
 * For images: uses focalPoint
 */
function getMediaPreviewData(config: MediaConfig | undefined): MediaPreviewData | undefined {
  if (!config?.url) return undefined

  if (config.type === 'image') {
    return {
      url: config.url,
      focalPoint: config.focalPoint,
    }
  }

  if (config.type === 'video') {
    const thumbnailUrl = config.videoThumbnail || getVideoThumbnail(config.url)
    if (!thumbnailUrl) return undefined
    return {
      url: thumbnailUrl,
      // Only use focal point if there's a custom thumbnail
      focalPoint: config.videoThumbnail ? config.videoThumbnailFocalPoint : undefined,
    }
  }

  return undefined
}

/**
 * Extract preview media URL from steps for dashboard cards
 * Priority:
 * 1. Intro step media (image or video with thumbnail)
 * 2. First media found in any other step (fallback)
 */
export function extractIntroMediaPreviewFromSteps(
  steps: VisualBuilderStep[]
): string | undefined {
  // First, try to get media from intro step
  const introStep = steps.find((s) => s.type === 'intro')
  if (introStep) {
    const mediaBlock = introStep.blocks.find((b) => b.type === 'media' && b.enabled)
    const config = mediaBlock?.config as MediaConfig | undefined
    const previewUrl = getMediaPreviewUrl(config)
    if (previewUrl) return previewUrl
  }

  // Fallback: find first media in any other step (excluding intro and result)
  for (const step of steps) {
    if (step.type === 'intro' || step.type === 'result') continue

    const mediaBlock = step.blocks.find((b) => b.type === 'media' && b.enabled)
    const config = mediaBlock?.config as MediaConfig | undefined
    const previewUrl = getMediaPreviewUrl(config)
    if (previewUrl) return previewUrl
  }

  return undefined
}

/**
 * Extract preview media URL from visualBuilderData (image or video thumbnail)
 */
export function extractIntroMediaPreviewFromVisualBuilderData(
  visualBuilderData: VisualBuilderData | string | null | undefined
): string | undefined {
  if (!visualBuilderData) return undefined

  let parsedData: VisualBuilderData | undefined
  if (typeof visualBuilderData === 'string') {
    try {
      parsedData = JSON.parse(visualBuilderData) as VisualBuilderData
    } catch {
      return undefined
    }
  } else {
    parsedData = visualBuilderData
  }

  if (!parsedData?.steps || !Array.isArray(parsedData.steps)) return undefined
  return extractIntroMediaPreviewFromSteps(parsedData.steps)
}

/**
 * Extract preview media data (URL + focal point) from steps for dashboard cards
 * Priority:
 * 1. Intro step media (image or video with thumbnail)
 * 2. First media found in any other step (fallback)
 */
export function extractIntroMediaPreviewDataFromSteps(
  steps: VisualBuilderStep[]
): MediaPreviewData | undefined {
  // First, try to get media from intro step
  const introStep = steps.find((s) => s.type === 'intro')
  if (introStep) {
    const mediaBlock = introStep.blocks.find((b) => b.type === 'media' && b.enabled)
    const config = mediaBlock?.config as MediaConfig | undefined
    const previewData = getMediaPreviewData(config)
    if (previewData) return previewData
  }

  // Fallback: find first media in any other step (excluding intro and result)
  for (const step of steps) {
    if (step.type === 'intro' || step.type === 'result') continue

    const mediaBlock = step.blocks.find((b) => b.type === 'media' && b.enabled)
    const config = mediaBlock?.config as MediaConfig | undefined
    const previewData = getMediaPreviewData(config)
    if (previewData) return previewData
  }

  return undefined
}

/**
 * Extract preview media data (URL + focal point) from visualBuilderData
 */
export function extractIntroMediaPreviewDataFromVisualBuilderData(
  visualBuilderData: VisualBuilderData | string | null | undefined
): MediaPreviewData | undefined {
  if (!visualBuilderData) return undefined

  let parsedData: VisualBuilderData | undefined
  if (typeof visualBuilderData === 'string') {
    try {
      parsedData = JSON.parse(visualBuilderData) as VisualBuilderData
    } catch {
      return undefined
    }
  } else {
    parsedData = visualBuilderData
  }

  if (!parsedData?.steps || !Array.isArray(parsedData.steps)) return undefined
  return extractIntroMediaPreviewDataFromSteps(parsedData.steps)
}

/**
 * Get question metadata from steps (for reports funnel)
 * Returns question IDs and labels for use in analytics
 */
export function getQuestionMetadata(steps: VisualBuilderStep[]): Array<{ id: string; label: string }> {
  const questionSteps = steps.filter((s) => s.type === 'question')

  return questionSteps.map((step, index) => {
    const headerBlock = step.blocks.find((b) => b.type === 'header' && b.enabled)
    const config = headerBlock?.config as HeaderConfig | undefined
    const questionText = config?.title || ''

    return {
      id: step.id,
      label: `P${index + 1}`, // Pergunta 1, 2, ...
      text: questionText, // Full question text for tooltips
    }
  })
}

/**
 * Get outcome metadata from outcomes (for reports distribution)
 * Returns outcome IDs and titles for use in analytics
 */
export function getOutcomeMetadata(outcomes: VisualBuilderOutcome[]): Array<{ id: string; title: string }> {
  return outcomes.map((outcome) => {
    const headerBlock = outcome.blocks.find((b) => b.type === 'header' && b.enabled)
    const config = headerBlock?.config as HeaderConfig | undefined

    return {
      id: outcome.id,
      title: config?.title || outcome.name || 'Resultado',
    }
  })
}

/**
 * Get field metadata from ALL steps for data collection table
 * Returns all fields across all steps in quiz order for dynamic column generation
 */
export function getFieldMetadata(steps: VisualBuilderStep[]): Array<{
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea'
  stepId: string
  stepLabel: string
  stepType: string
  required: boolean
}> {
  const fields: Array<{
    id: string
    label: string
    type: 'text' | 'email' | 'phone' | 'number' | 'textarea'
    stepId: string
    stepLabel: string
    stepType: string
    required: boolean
  }> = []

  // Extract fields from all steps (intro, question, lead-gen, promo, etc.)
  steps.forEach((step) => {
    const fieldsBlock = step.blocks.find((b) => b.type === 'fields' && b.enabled)
    const fieldsConfig = fieldsBlock?.config as FieldsConfig | undefined

    fieldsConfig?.items.forEach((field) => {
      fields.push({
        id: field.id,
        label: field.label,
        type: field.type,
        stepId: step.id,
        stepLabel: step.label,
        stepType: step.type,
        required: field.required ?? false,
      })
    })
  })

  return fields
}

/**
 * Check if a quiz has lead generation enabled
 */
export function hasLeadGenStep(steps: VisualBuilderStep[]): boolean {
  return steps.some((s) => s.type === 'lead-gen')
}

/**
 * Extract lead gen configuration from steps
 */
export function extractLeadGenConfig(steps: VisualBuilderStep[]): {
  enabled: boolean
  title?: string
  description?: string
  fields: ('name' | 'email' | 'phone')[]
  ctaText?: string
} | undefined {
  const leadGenStep = steps.find((s) => s.type === 'lead-gen')
  if (!leadGenStep) return undefined

  const headerBlock = leadGenStep.blocks.find((b) => b.type === 'header' && b.enabled)
  const fieldsBlock = leadGenStep.blocks.find((b) => b.type === 'fields' && b.enabled)
  const buttonBlock = leadGenStep.blocks.find((b) => b.type === 'button' && b.enabled)

  const headerConfig = headerBlock?.config as HeaderConfig | undefined
  const fieldsConfig = fieldsBlock?.config as FieldsConfig | undefined
  const buttonConfig = buttonBlock?.config as { text?: string } | undefined

  // Map field types to the expected format
  const fields: ('name' | 'email' | 'phone')[] = []
  for (const field of fieldsConfig?.items || []) {
    if (field.type === 'text' && field.label.toLowerCase().includes('nome')) {
      fields.push('name')
    } else if (field.type === 'email') {
      fields.push('email')
    } else if (field.type === 'phone') {
      fields.push('phone')
    }
  }

  return {
    enabled: true,
    title: headerConfig?.title,
    description: headerConfig?.description,
    fields: fields.length > 0 ? fields : ['email'],
    ctaText: buttonConfig?.text,
  }
}

/**
 * Get default steps for a new quiz
 */
export function getDefaultSteps(): VisualBuilderStep[] {
  return [
    {
      id: 'intro',
      type: 'intro',
      label: 'Intro',
      isFixed: true,
      blocks: [],
      settings: { showProgress: false, allowBack: false },
    },
    {
      id: 'result',
      type: 'result',
      label: 'Resultado',
      isFixed: true,
      blocks: [],
      settings: { showProgress: false, allowBack: false },
    },
  ]
}

/**
 * Get default outcomes for a new quiz
 */
export function getDefaultOutcomes(): VisualBuilderOutcome[] {
  return [
    {
      id: `outcome-${Date.now()}`,
      name: 'Resultado 1',
      blocks: [],
    },
  ]
}

/**
 * Validate visualBuilderData structure
 * Returns true if the data has the expected shape
 */
export function isValidVisualBuilderData(data: unknown): data is VisualBuilderData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>

  if (!Array.isArray(obj.steps)) return false
  if (!Array.isArray(obj.outcomes)) return false

  return true
}
