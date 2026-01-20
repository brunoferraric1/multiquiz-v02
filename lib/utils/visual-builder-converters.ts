/**
 * Visual Builder Converters
 *
 * These utilities convert between the visual builder's step/block format
 * and the legacy quiz format (questions/outcomes) used by:
 * - Firestore storage
 * - Quiz player
 * - Auto-save system
 */

import { v4 as uuidv4 } from 'uuid'
import type { Question, Outcome as QuizOutcome, QuizDraft, Quiz } from '@/types'
import type {
  Block,
  HeaderConfig,
  TextConfig,
  MediaConfig,
  OptionsConfig,
  FieldsConfig,
  ButtonConfig,
  OptionItem,
} from '@/types/blocks'
import type { Step, Outcome as VBOutcome, StepType } from '@/store/visual-builder-store'
import { createBlock } from '@/types/blocks'
import { getDefaultOutcomeBlocks } from '@/store/visual-builder-store'

// ============================================================================
// Types
// ============================================================================

export interface VisualBuilderData {
  steps: Step[]
  outcomes: VBOutcome[]
}

export interface QuizData {
  title: string
  description: string
  coverImageUrl?: string
  ctaText?: string
  ctaUrl?: string
  questions: Question[]
  outcomes: QuizOutcome[]
  leadGen?: {
    enabled: boolean
    title?: string
    description?: string
    fields: ('name' | 'email' | 'phone')[]
    ctaText?: string
  }
}

// ============================================================================
// Visual Builder → Quiz Format (for saving)
// ============================================================================

/**
 * Extract quiz-level data from visual builder steps
 */
function extractQuizMetadata(steps: Step[]): Pick<QuizData, 'title' | 'description' | 'coverImageUrl'> {
  const introStep = steps.find((s) => s.type === 'intro')
  if (!introStep) {
    return { title: '', description: '' }
  }

  const headerBlock = introStep.blocks.find((b) => b.type === 'header' && b.enabled)
  const mediaBlock = introStep.blocks.find((b) => b.type === 'media' && b.enabled)

  const headerConfig = headerBlock?.config as HeaderConfig | undefined
  const mediaConfig = mediaBlock?.config as MediaConfig | undefined

  return {
    title: headerConfig?.title || '',
    description: headerConfig?.description || '',
    coverImageUrl: mediaConfig?.type === 'image' ? mediaConfig.url : undefined,
  }
}

/**
 * Convert a question step to a Question object
 */
function stepToQuestion(step: Step, stepIndex: number): Question | null {
  if (step.type !== 'question') return null

  const headerBlock = step.blocks.find((b) => b.type === 'header' && b.enabled)
  const mediaBlock = step.blocks.find((b) => b.type === 'media' && b.enabled)
  const optionsBlock = step.blocks.find((b) => b.type === 'options' && b.enabled)

  const headerConfig = headerBlock?.config as HeaderConfig | undefined
  const mediaConfig = mediaBlock?.config as MediaConfig | undefined
  const optionsConfig = optionsBlock?.config as OptionsConfig | undefined

  // Get question text from header title
  const questionText = headerConfig?.title || `Pergunta ${stepIndex + 1}`

  // Convert option items to answer options
  const options = (optionsConfig?.items || []).map((item: OptionItem) => ({
    id: item.id || uuidv4(),
    text: item.text || '',
    icon: item.emoji,
    targetOutcomeId: item.outcomeId || '',
  }))

  // At minimum need ID and text for a valid question
  return {
    id: step.id,
    text: questionText,
    imageUrl: mediaConfig?.type === 'image' ? mediaConfig.url : undefined,
    options: options.length > 0 ? options : [{ id: uuidv4(), text: '', targetOutcomeId: '' }],
    allowMultiple: optionsConfig?.selectionType === 'multiple',
  }
}

/**
 * Extract lead generation config from steps
 */
function extractLeadGenConfig(steps: Step[]): QuizData['leadGen'] | undefined {
  const leadGenStep = steps.find((s) => s.type === 'lead-gen')
  if (!leadGenStep) return undefined

  const headerBlock = leadGenStep.blocks.find((b) => b.type === 'header' && b.enabled)
  const fieldsBlock = leadGenStep.blocks.find((b) => b.type === 'fields' && b.enabled)
  const buttonBlock = leadGenStep.blocks.find((b) => b.type === 'button' && b.enabled)

  const headerConfig = headerBlock?.config as HeaderConfig | undefined
  const fieldsConfig = fieldsBlock?.config as FieldsConfig | undefined
  const buttonConfig = buttonBlock?.config as ButtonConfig | undefined

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
 * Convert visual builder outcome to quiz outcome
 */
function vbOutcomeToQuizOutcome(outcome: VBOutcome): QuizOutcome {
  const headerBlock = outcome.blocks.find((b) => b.type === 'header' && b.enabled)
  const textBlock = outcome.blocks.find((b) => b.type === 'text' && b.enabled)
  const mediaBlock = outcome.blocks.find((b) => b.type === 'media' && b.enabled)
  const buttonBlock = outcome.blocks.find((b) => b.type === 'button' && b.enabled)

  const headerConfig = headerBlock?.config as HeaderConfig | undefined
  const textConfig = textBlock?.config as TextConfig | undefined
  const mediaConfig = mediaBlock?.config as MediaConfig | undefined
  const buttonConfig = buttonBlock?.config as ButtonConfig | undefined

  return {
    id: outcome.id,
    title: headerConfig?.title || outcome.name || 'Resultado',
    description: textConfig?.content || headerConfig?.description || '',
    imageUrl: mediaConfig?.type === 'image' ? mediaConfig.url : undefined,
    ctaText: buttonConfig?.text,
    ctaUrl: buttonConfig?.action === 'url' ? buttonConfig.url : undefined,
  }
}

/**
 * Convert visual builder data to quiz format for saving
 */
export function visualBuilderToQuiz(data: VisualBuilderData): QuizData {
  const { steps, outcomes } = data

  // Extract metadata from intro step
  const metadata = extractQuizMetadata(steps)

  // Convert question steps to questions
  const questionSteps = steps.filter((s) => s.type === 'question')
  const questions = questionSteps
    .map((step, index) => stepToQuestion(step, index))
    .filter((q): q is Question => q !== null)

  // Extract lead gen config
  const leadGen = extractLeadGenConfig(steps)

  // Convert outcomes
  const quizOutcomes = outcomes.map(vbOutcomeToQuizOutcome)

  return {
    ...metadata,
    questions,
    outcomes: quizOutcomes,
    leadGen,
  }
}

// ============================================================================
// Quiz Format → Visual Builder (for loading)
// ============================================================================

/**
 * Create intro step from quiz metadata
 */
function createIntroStep(quiz: QuizDraft | Quiz): Step {
  const blocks: Block[] = [
    {
      ...createBlock('header'),
      id: 'intro-block-header',
      config: {
        title: quiz.title || 'Bem-vindo!',
        description: quiz.description || '',
      },
    },
    {
      ...createBlock('media'),
      id: 'intro-block-media',
      enabled: !!quiz.coverImageUrl,
      config: {
        type: 'image' as const,
        url: quiz.coverImageUrl || '',
      },
    },
    {
      ...createBlock('button'),
      id: 'intro-block-button',
      config: {
        text: 'Começar',
        action: 'next_step' as const,
      },
    },
  ]

  return {
    id: 'intro',
    type: 'intro',
    label: 'Intro',
    isFixed: true,
    blocks,
    settings: { showProgress: false, allowBack: false },
  }
}

/**
 * Convert a Question to a question step
 */
function questionToStep(question: Partial<Question>, index: number): Step {
  const stepId = question.id || `question-${Date.now()}-${index}`

  const blocks: Block[] = [
    {
      ...createBlock('header'),
      id: `${stepId}-header`,
      config: {
        title: question.text || '',
        description: '',
      },
    },
    {
      ...createBlock('media'),
      id: `${stepId}-media`,
      enabled: !!question.imageUrl,
      config: {
        type: 'image' as const,
        url: question.imageUrl || '',
      },
    },
    {
      ...createBlock('options'),
      id: `${stepId}-options`,
      config: {
        items: (question.options || []).map((opt) => ({
          id: opt.id || uuidv4(),
          text: opt.text || '',
          emoji: opt.icon,
          outcomeId: opt.targetOutcomeId,
        })),
        selectionType: question.allowMultiple ? 'multiple' : 'single',
      } as OptionsConfig,
    },
  ]

  return {
    id: stepId,
    type: 'question',
    label: `P${index + 1}`,
    subtitle: question.text,
    blocks,
    settings: { showProgress: true, allowBack: true },
  }
}

/**
 * Create lead-gen step from quiz lead gen config
 */
function createLeadGenStep(leadGen: QuizDraft['leadGen']): Step | null {
  if (!leadGen?.enabled) return null

  const fieldItems = (leadGen.fields || ['email']).map((fieldType, index) => {
    const fieldConfig: { id: string; label: string; type: 'text' | 'email' | 'phone'; required: boolean } = {
      id: `field-${Date.now()}-${index}`,
      label: '',
      type: 'text',
      required: true,
    }

    switch (fieldType) {
      case 'name':
        fieldConfig.label = 'Nome'
        fieldConfig.type = 'text'
        break
      case 'email':
        fieldConfig.label = 'Email'
        fieldConfig.type = 'email'
        break
      case 'phone':
        fieldConfig.label = 'Telefone'
        fieldConfig.type = 'phone'
        break
    }

    return fieldConfig
  })

  const blocks: Block[] = [
    {
      ...createBlock('header'),
      id: 'lead-gen-header',
      config: {
        title: leadGen.title || 'Quase lá!',
        description: leadGen.description || 'Preencha seus dados para ver o resultado.',
      },
    },
    {
      ...createBlock('fields'),
      id: 'lead-gen-fields',
      config: {
        items: fieldItems,
      } as FieldsConfig,
    },
    {
      ...createBlock('button'),
      id: 'lead-gen-button',
      config: {
        text: leadGen.ctaText || 'Ver resultado',
        action: 'next_step' as const,
      },
    },
  ]

  return {
    id: 'lead-gen',
    type: 'lead-gen',
    label: 'Captura',
    blocks,
    settings: { showProgress: true, allowBack: true },
  }
}

/**
 * Create result step (always present, blocks are per-outcome)
 */
function createResultStep(): Step {
  return {
    id: 'result',
    type: 'result',
    label: 'Resultado',
    isFixed: true,
    blocks: [],
    settings: { showProgress: false, allowBack: false },
  }
}

/**
 * Convert quiz outcome to visual builder outcome
 */
function quizOutcomeToVBOutcome(outcome: Partial<QuizOutcome>): VBOutcome {
  const outcomeId = outcome.id || uuidv4()

  const blocks: Block[] = [
    {
      ...createBlock('header'),
      id: `${outcomeId}-header`,
      config: {
        title: outcome.title || 'Seu resultado',
        description: '',
      },
    },
    {
      ...createBlock('media'),
      id: `${outcomeId}-media`,
      enabled: !!outcome.imageUrl,
      config: {
        type: 'image' as const,
        url: outcome.imageUrl || '',
      },
    },
    {
      ...createBlock('text'),
      id: `${outcomeId}-text`,
      enabled: !!outcome.description,
      config: {
        content: outcome.description || '',
      },
    },
    {
      ...createBlock('button'),
      id: `${outcomeId}-button`,
      enabled: !!outcome.ctaText || !!outcome.ctaUrl,
      config: {
        text: outcome.ctaText || 'Saber mais',
        action: outcome.ctaUrl ? 'url' : 'next_step',
        url: outcome.ctaUrl,
      } as ButtonConfig,
    },
  ]

  return {
    id: outcomeId,
    name: outcome.title || '',
    blocks,
  }
}

/**
 * Convert quiz format to visual builder data for loading
 * Always reconstructs from the legacy format to ensure consistency
 */
export function quizToVisualBuilder(quiz: QuizDraft | Quiz): VisualBuilderData {
  // Always reconstruct from legacy format to ensure consistency
  const steps: Step[] = []

  // 1. Add intro step
  steps.push(createIntroStep(quiz))

  // 2. Add question steps
  const questions = quiz.questions || []
  questions.forEach((question, index) => {
    steps.push(questionToStep(question, index))
  })

  // 3. Add lead-gen step if enabled
  const leadGenStep = createLeadGenStep(quiz.leadGen)
  if (leadGenStep) {
    steps.push(leadGenStep)
  }

  // 4. Add result step (always last)
  steps.push(createResultStep())

  // 5. Convert outcomes
  const quizOutcomes = quiz.outcomes || []
  const outcomes: VBOutcome[] = quizOutcomes.length > 0
    ? quizOutcomes.map(quizOutcomeToVBOutcome)
    : [{ id: uuidv4(), name: 'Resultado 1', blocks: getDefaultOutcomeBlocks() }]

  return { steps, outcomes }
}

// ============================================================================
// Merge Utilities (for auto-save - preserve unchanged fields)
// ============================================================================

/**
 * Merge visual builder data into an existing quiz draft
 * Preserves fields not managed by the visual builder (stats, ownerId, etc.)
 */
export function mergeVisualBuilderIntoQuiz(
  existingQuiz: QuizDraft,
  vbData: VisualBuilderData
): QuizDraft {
  const converted = visualBuilderToQuiz(vbData)

  return {
    ...existingQuiz,
    title: converted.title,
    description: converted.description,
    coverImageUrl: converted.coverImageUrl,
    questions: converted.questions,
    outcomes: converted.outcomes,
    leadGen: converted.leadGen,
    updatedAt: Date.now(),
  }
}
