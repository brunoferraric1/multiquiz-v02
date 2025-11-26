import { z } from 'zod';

// Zod schemas for runtime validation
export const AnswerOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  icon: z.string().optional(),
  targetOutcomeId: z.string().uuid(),
});

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  imageUrl: z.string().url().optional(),
  options: z.array(AnswerOptionSchema).min(1),
  allowMultiple: z.boolean().optional(),
});

export const OutcomeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url().optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional(),
});

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number(),
});

export const QuizStatsSchema = z.object({
  views: z.number().int().nonnegative(),
  starts: z.number().int().nonnegative(),
  completions: z.number().int().nonnegative(),
});

export const QuizSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  coverImageUrl: z.string().url().optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  questions: z.array(QuestionSchema),
  outcomes: z.array(OutcomeSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
  isPublished: z.boolean(),
  stats: QuizStatsSchema,
  conversationHistory: z.array(ChatMessageSchema).optional(),
  ownerId: z.string(),
});

// TypeScript types inferred from Zod schemas
export type AnswerOption = z.infer<typeof AnswerOptionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type QuizStats = z.infer<typeof QuizStatsSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

// Partial types for draft states
export type QuizDraft = Partial<Omit<Quiz, 'questions' | 'outcomes'>> & {
  questions?: Partial<Question>[];
  outcomes?: Partial<Outcome>[];
};

// AI Extraction types
export type AIExtractionResult = {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  coverImagePrompt?: string;
  ctaText?: string;
  ctaUrl?: string;
  questions?: Partial<Question>[];
  outcomes?: Partial<Outcome>[];
};

// Store types
export type QuizBuilderState = {
  quiz: QuizDraft;
  chatHistory: ChatMessage[];
  isExtracting: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setQuiz: (quiz: QuizDraft) => void;
  updateQuizField: <K extends keyof QuizDraft>(field: K, value: QuizDraft[K]) => void;
  addQuestion: (question: Partial<Question>) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  moveQuestion: (id: string, direction: 'up' | 'down') => void;
  addOutcome: (outcome: Partial<Outcome>) => void;
  updateOutcome: (id: string, outcome: Partial<Outcome>) => void;
  deleteOutcome: (id: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  setExtracting: (isExtracting: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  loadQuiz: (quiz: Quiz) => void;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
};
