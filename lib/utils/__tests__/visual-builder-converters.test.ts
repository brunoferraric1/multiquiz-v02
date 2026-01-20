import { describe, it, expect } from 'vitest'
import {
  visualBuilderToQuiz,
  quizToVisualBuilder,
  mergeVisualBuilderIntoQuiz,
} from '../visual-builder-converters'
import type { Quiz, QuizDraft } from '@/types'
import type { Step, Outcome as VBOutcome } from '@/store/visual-builder-store'
import type { Block, OptionsConfig, HeaderConfig, TextConfig, MediaConfig, ButtonConfig, FieldsConfig } from '@/types/blocks'

describe('visual-builder-converters', () => {
  describe('visualBuilderToQuiz', () => {
    it('extracts quiz metadata from intro step', () => {
      const steps: Step[] = [
        {
          id: 'intro',
          type: 'intro',
          label: 'Intro',
          isFixed: true,
          blocks: [
            {
              id: 'h1',
              type: 'header',
              enabled: true,
              config: { title: 'My Quiz Title', description: 'Quiz description' },
            },
            {
              id: 'm1',
              type: 'media',
              enabled: true,
              config: { type: 'image', url: 'https://example.com/cover.jpg' },
            },
          ],
        },
        {
          id: 'result',
          type: 'result',
          label: 'Resultado',
          isFixed: true,
          blocks: [],
        },
      ]

      const outcomes: VBOutcome[] = [
        { id: 'o1', name: 'Outcome 1', blocks: [] },
      ]

      const result = visualBuilderToQuiz({ steps, outcomes })

      expect(result.title).toBe('My Quiz Title')
      expect(result.description).toBe('Quiz description')
      expect(result.coverImageUrl).toBe('https://example.com/cover.jpg')
    })

    it('converts question steps to questions', () => {
      const steps: Step[] = [
        {
          id: 'intro',
          type: 'intro',
          label: 'Intro',
          isFixed: true,
          blocks: [],
        },
        {
          id: 'q1',
          type: 'question',
          label: 'P1',
          blocks: [
            {
              id: 'h1',
              type: 'header',
              enabled: true,
              config: { title: 'What is your skin type?', description: '' },
            },
            {
              id: 'm1',
              type: 'media',
              enabled: true,
              config: { type: 'image', url: 'https://example.com/question.jpg' },
            },
            {
              id: 'o1',
              type: 'options',
              enabled: true,
              config: {
                items: [
                  { id: 'opt1', text: 'Dry', outcomeId: 'outcome-dry' },
                  { id: 'opt2', text: 'Oily', outcomeId: 'outcome-oily' },
                ],
                selectionType: 'single',
              } as OptionsConfig,
            },
          ],
        },
        {
          id: 'result',
          type: 'result',
          label: 'Resultado',
          isFixed: true,
          blocks: [],
        },
      ]

      const outcomes: VBOutcome[] = []

      const result = visualBuilderToQuiz({ steps, outcomes })

      expect(result.questions).toHaveLength(1)
      expect(result.questions[0].id).toBe('q1')
      expect(result.questions[0].text).toBe('What is your skin type?')
      expect(result.questions[0].imageUrl).toBe('https://example.com/question.jpg')
      expect(result.questions[0].options).toHaveLength(2)
      expect(result.questions[0].options[0].text).toBe('Dry')
      expect(result.questions[0].options[0].targetOutcomeId).toBe('outcome-dry')
    })

    it('extracts lead gen config from lead-gen step', () => {
      const steps: Step[] = [
        {
          id: 'intro',
          type: 'intro',
          label: 'Intro',
          isFixed: true,
          blocks: [],
        },
        {
          id: 'lead',
          type: 'lead-gen',
          label: 'Captura',
          blocks: [
            {
              id: 'h1',
              type: 'header',
              enabled: true,
              config: { title: 'Almost there!', description: 'Enter your info' },
            },
            {
              id: 'f1',
              type: 'fields',
              enabled: true,
              config: {
                items: [
                  { id: 'f1', label: 'Nome', type: 'text', required: true },
                  { id: 'f2', label: 'Email', type: 'email', required: true },
                ],
              } as FieldsConfig,
            },
            {
              id: 'b1',
              type: 'button',
              enabled: true,
              config: { text: 'See results', action: 'next_step' },
            },
          ],
        },
        {
          id: 'result',
          type: 'result',
          label: 'Resultado',
          isFixed: true,
          blocks: [],
        },
      ]

      const result = visualBuilderToQuiz({ steps, outcomes: [] })

      expect(result.leadGen).toBeDefined()
      expect(result.leadGen?.enabled).toBe(true)
      expect(result.leadGen?.title).toBe('Almost there!')
      expect(result.leadGen?.description).toBe('Enter your info')
      expect(result.leadGen?.ctaText).toBe('See results')
      expect(result.leadGen?.fields).toContain('name')
      expect(result.leadGen?.fields).toContain('email')
    })

    it('converts outcomes to quiz outcomes', () => {
      const outcomes: VBOutcome[] = [
        {
          id: 'o1',
          name: 'Dry Skin',
          blocks: [
            {
              id: 'h1',
              type: 'header',
              enabled: true,
              config: { title: 'You have Dry Skin', description: '' },
            },
            {
              id: 't1',
              type: 'text',
              enabled: true,
              config: { content: 'Here is what you need...' },
            },
            {
              id: 'm1',
              type: 'media',
              enabled: true,
              config: { type: 'image', url: 'https://example.com/outcome.jpg' },
            },
            {
              id: 'b1',
              type: 'button',
              enabled: true,
              config: { text: 'Learn more', action: 'url', url: 'https://example.com' },
            },
          ],
        },
      ]

      const result = visualBuilderToQuiz({ steps: [], outcomes })

      expect(result.outcomes).toHaveLength(1)
      expect(result.outcomes[0].id).toBe('o1')
      expect(result.outcomes[0].title).toBe('You have Dry Skin')
      expect(result.outcomes[0].description).toBe('Here is what you need...')
      expect(result.outcomes[0].imageUrl).toBe('https://example.com/outcome.jpg')
      expect(result.outcomes[0].ctaText).toBe('Learn more')
      expect(result.outcomes[0].ctaUrl).toBe('https://example.com')
    })
  })

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
      expect((textBlock?.config as TextConfig).content).toBe('Your skin needs hydration')
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

  describe('mergeVisualBuilderIntoQuiz', () => {
    it('preserves quiz metadata not managed by visual builder', () => {
      const existingQuiz: QuizDraft = {
        id: 'quiz-1',
        title: 'Old Title',
        description: 'Old desc',
        ownerId: 'user-123',
        isPublished: true,
        stats: { views: 100, starts: 50, completions: 25 },
        createdAt: 1000,
        updatedAt: 2000,
        publishedVersion: { title: 'Published Title', description: '', questions: [], outcomes: [] },
        publishedAt: 3000,
        questions: [],
        outcomes: [],
      }

      const vbData = {
        steps: [
          {
            id: 'intro',
            type: 'intro' as const,
            label: 'Intro',
            isFixed: true,
            blocks: [
              {
                id: 'h1',
                type: 'header' as const,
                enabled: true,
                config: { title: 'New Title', description: 'New desc' },
              },
            ],
          },
          {
            id: 'result',
            type: 'result' as const,
            label: 'Result',
            isFixed: true,
            blocks: [],
          },
        ],
        outcomes: [],
      }

      const result = mergeVisualBuilderIntoQuiz(existingQuiz, vbData)

      // Visual builder fields should be updated
      expect(result.title).toBe('New Title')
      expect(result.description).toBe('New desc')

      // Preserved fields
      expect(result.id).toBe('quiz-1')
      expect(result.ownerId).toBe('user-123')
      expect(result.isPublished).toBe(true)
      expect(result.stats).toEqual({ views: 100, starts: 50, completions: 25 })
      expect(result.createdAt).toBe(1000)
      expect(result.publishedVersion).toBeDefined()
      expect(result.publishedAt).toBe(3000)

      // updatedAt should be updated
      expect(result.updatedAt).toBeGreaterThan(2000)
    })
  })

  describe('round-trip conversion', () => {
    it('preserves data through quiz → VB → quiz conversion', () => {
      const originalQuiz: QuizDraft = {
        id: 'quiz-1',
        title: 'Skincare Quiz',
        description: 'Find your routine',
        coverImageUrl: 'https://example.com/cover.jpg',
        questions: [
          {
            id: 'q1',
            text: 'What is your skin type?',
            options: [
              { id: 'opt1', text: 'Dry', targetOutcomeId: 'o1' },
              { id: 'opt2', text: 'Oily', targetOutcomeId: 'o2' },
            ],
          },
        ],
        outcomes: [
          { id: 'o1', title: 'Dry Skin', description: 'Hydrate more' },
          { id: 'o2', title: 'Oily Skin', description: 'Use lighter products' },
        ],
      }

      // Convert quiz to VB format
      const vbData = quizToVisualBuilder(originalQuiz)

      // Convert back to quiz format
      const convertedQuiz = visualBuilderToQuiz(vbData)

      // Core data should be preserved
      expect(convertedQuiz.title).toBe(originalQuiz.title)
      expect(convertedQuiz.description).toBe(originalQuiz.description)
      expect(convertedQuiz.coverImageUrl).toBe(originalQuiz.coverImageUrl)
      expect(convertedQuiz.questions).toHaveLength(1)
      expect(convertedQuiz.questions[0].text).toBe(originalQuiz.questions![0].text)
      expect(convertedQuiz.questions[0].options).toHaveLength(2)
      expect(convertedQuiz.outcomes).toHaveLength(2)
      expect(convertedQuiz.outcomes[0].title).toBe(originalQuiz.outcomes![0].title)
      expect(convertedQuiz.outcomes[0].description).toBe(originalQuiz.outcomes![0].description)
    })
  })
})
