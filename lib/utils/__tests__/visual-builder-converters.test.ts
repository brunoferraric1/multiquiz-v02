import { describe, it, expect } from 'vitest'
import { quizToVisualBuilder } from '../visual-builder-converters'
import type { QuizDraft } from '@/types'
import type { HeaderConfig, MediaConfig, OptionsConfig, ButtonConfig, FieldsConfig } from '@/types/blocks'

/**
 * Tests for visual-builder-converters
 *
 * Note: visualBuilderToQuiz and mergeVisualBuilderIntoQuiz were removed during
 * the migration to use visualBuilderData as the single source of truth.
 * Only quizToVisualBuilder remains for migrating legacy quizzes.
 */
describe('visual-builder-converters', () => {
  describe('quizToVisualBuilder', () => {
    it('creates intro step from quiz metadata', () => {
      const quiz: QuizDraft = {
        id: 'quiz-1',
        title: 'Skincare Quiz',
        description: 'Find your perfect routine',
        coverImageUrl: 'https://example.com/cover.jpg',
        questions: [],
        outcomes: [],
      }

      const result = quizToVisualBuilder(quiz)

      expect(result.steps).toHaveLength(2) // intro + result
      expect(result.steps[0].type).toBe('intro')
      expect(result.steps[0].isFixed).toBe(true)

      const headerBlock = result.steps[0].blocks.find((b) => b.type === 'header')
      const mediaBlock = result.steps[0].blocks.find((b) => b.type === 'media')

      expect((headerBlock?.config as HeaderConfig).title).toBe('Skincare Quiz')
      expect((headerBlock?.config as HeaderConfig).description).toBe('Find your perfect routine')
      expect((mediaBlock?.config as MediaConfig).url).toBe('https://example.com/cover.jpg')
      expect(mediaBlock?.enabled).toBe(true)
    })

    it('converts questions to question steps', () => {
      const quiz: QuizDraft = {
        id: 'quiz-1',
        title: 'Quiz',
        questions: [
          {
            id: 'q1',
            text: 'What is your skin type?',
            imageUrl: 'https://example.com/q1.jpg',
            options: [
              { id: 'opt1', text: 'Dry', targetOutcomeId: 'o1' },
              { id: 'opt2', text: 'Oily', targetOutcomeId: 'o2' },
            ],
            allowMultiple: false,
          },
        ],
        outcomes: [],
      }

      const result = quizToVisualBuilder(quiz)

      // Should have intro, q1, result
      expect(result.steps).toHaveLength(3)
      expect(result.steps[1].type).toBe('question')
      expect(result.steps[1].id).toBe('q1')
      expect(result.steps[1].label).toBe('P1')

      const headerBlock = result.steps[1].blocks.find((b) => b.type === 'header')
      const optionsBlock = result.steps[1].blocks.find((b) => b.type === 'options')

      expect((headerBlock?.config as HeaderConfig).title).toBe('What is your skin type?')
      expect((optionsBlock?.config as OptionsConfig).items).toHaveLength(2)
      expect((optionsBlock?.config as OptionsConfig).items[0].text).toBe('Dry')
    })

    it('creates lead-gen step when leadGen is enabled', () => {
      const quiz: QuizDraft = {
        id: 'quiz-1',
        title: 'Quiz',
        questions: [],
        outcomes: [],
        leadGen: {
          enabled: true,
          title: 'Almost done!',
          description: 'Enter your email',
          fields: ['name', 'email'],
          ctaText: 'Get results',
        },
      }

      const result = quizToVisualBuilder(quiz)

      // Should have intro, lead-gen, result
      expect(result.steps).toHaveLength(3)

      const leadGenStep = result.steps.find((s) => s.type === 'lead-gen')
      expect(leadGenStep).toBeDefined()
      expect(leadGenStep?.label).toBe('Captura')

      const headerBlock = leadGenStep?.blocks.find((b) => b.type === 'header')
      const buttonBlock = leadGenStep?.blocks.find((b) => b.type === 'button')
      const fieldsBlock = leadGenStep?.blocks.find((b) => b.type === 'fields')

      expect((headerBlock?.config as HeaderConfig).title).toBe('Almost done!')
      expect((buttonBlock?.config as ButtonConfig).text).toBe('Get results')
      expect((fieldsBlock?.config as FieldsConfig).items).toHaveLength(2)
    })

    it('converts quiz outcomes to VB outcomes', () => {
      const quiz: QuizDraft = {
        id: 'quiz-1',
        title: 'Quiz',
        questions: [],
        outcomes: [
          {
            id: 'o1',
            title: 'Dry Skin Result',
            description: 'Your skin needs hydration',
            imageUrl: 'https://example.com/dry.jpg',
            ctaText: 'Shop now',
            ctaUrl: 'https://example.com/shop',
          },
        ],
      }

      const result = quizToVisualBuilder(quiz)

      expect(result.outcomes).toHaveLength(1)
      expect(result.outcomes[0].id).toBe('o1')
      expect(result.outcomes[0].name).toBe('Dry Skin Result')

      const headerBlock = result.outcomes[0].blocks.find((b) => b.type === 'header')
      const textBlock = result.outcomes[0].blocks.find((b) => b.type === 'text')
      const buttonBlock = result.outcomes[0].blocks.find((b) => b.type === 'button')

      expect((headerBlock?.config as HeaderConfig).title).toBe('Dry Skin Result')
      expect((textBlock?.config as { content: string }).content).toBe('Your skin needs hydration')
      expect((buttonBlock?.config as ButtonConfig).text).toBe('Shop now')
      expect((buttonBlock?.config as ButtonConfig).url).toBe('https://example.com/shop')
    })

    it('creates default outcome when quiz has no outcomes', () => {
      const quiz: QuizDraft = {
        id: 'quiz-1',
        title: 'Quiz',
        questions: [],
        outcomes: [],
      }

      const result = quizToVisualBuilder(quiz)

      expect(result.outcomes).toHaveLength(1)
      expect(result.outcomes[0].name).toBe('Resultado 1')
      expect(result.outcomes[0].blocks.length).toBeGreaterThan(0)
    })
  })
})
