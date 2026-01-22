/**
 * Visual Builder Converters
 *
 * DEPRECATED: These utilities are being phased out as we migrate to visualBuilderData
 * as the single source of truth. Only quizToVisualBuilder is still needed for
 * migrating legacy quizzes.
 *
 * For new code, use the helper functions in visual-builder-helpers.ts instead.
 */

import { v4 as uuidv4 } from 'uuid'
import type { Outcome as QuizOutcome, QuizDraft, Quiz, Question } from '@/types'
import type { Block, HeaderConfig, MediaConfig, OptionsConfig, FieldsConfig, ButtonConfig } from '@/types/blocks'
import type { Step, Outcome as VBOutcome } from '@/store/visual-builder-store'
import { createBlock } from '@/types/blocks'
import { getDefaultOutcomeBlocks } from '@/store/visual-builder-store'

// ============================================================================
// Types
// ============================================================================

export interface VisualBuilderData {
  steps: Step[]
  outcomes: VBOutcome[]
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
        orientation: 'horizontal',
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
        orientation: 'horizontal',
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
        orientation: 'horizontal',
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
 *
 * @deprecated This function is used ONLY for migrating legacy quizzes that have
 * questions/outcomes arrays but no visualBuilderData. New quizzes should always
 * use visualBuilderData directly. After all legacy quizzes are migrated, this
 * function can be removed.
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
// REMOVED: Merge Utilities (no longer needed)
// ============================================================================
// The mergeVisualBuilderIntoQuiz function has been removed.
// Auto-save now works directly with visualBuilderData and uses helper functions
// from visual-builder-helpers.ts to extract metadata when needed.
