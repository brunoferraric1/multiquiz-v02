import { z } from 'zod';
import type { Block, StepSettings } from './blocks';

// Visual Builder types (for storing blocks in quiz format)
export interface VisualBuilderStep {
  id: string;
  type: 'intro' | 'question' | 'lead-gen' | 'promo' | 'result';
  label: string;
  isFixed?: boolean;
  subtitle?: string;
  blocks: Block[];
  settings?: StepSettings;
}

export interface VisualBuilderOutcome {
  id: string;
  name: string;
  blocks: Block[];
}

export interface VisualBuilderData {
  schemaVersion: number;
  steps: VisualBuilderStep[];
  outcomes: VisualBuilderOutcome[];
}

// Zod schemas for Visual Builder types (runtime validation)
// Using z.any() for blocks since they have complex nested structures validated elsewhere
export const VisualBuilderStepSchema = z.object({
  id: z.string(),
  type: z.enum(['intro', 'question', 'lead-gen', 'promo', 'result']),
  label: z.string(),
  isFixed: z.boolean().optional(),
  subtitle: z.string().optional(),
  blocks: z.array(z.any()),
  settings: z.object({
    showProgress: z.boolean().optional(),
    allowBack: z.boolean().optional(),
  }).optional(),
});

export const VisualBuilderOutcomeSchema = z.object({
  id: z.string(),
  name: z.string(),
  blocks: z.array(z.any()),
});

export const VisualBuilderDataSchema = z.object({
  schemaVersion: z.number().default(1),
  steps: z.array(VisualBuilderStepSchema),
  outcomes: z.array(VisualBuilderOutcomeSchema),
});

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

export const BrandKitColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
});

export const BrandKitSchema = z.object({
  name: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  colors: BrandKitColorsSchema,
});

// Snapshot of quiz content for published version (frozen state)
export const QuizSnapshotSchema = z.object({
  title: z.string(),
  description: z.string(),
  coverImageUrl: z.string().optional(),
  ctaText: z.string().optional(),
  primaryColor: z.string().optional(),
  brandKitMode: z.enum(['default', 'custom']).optional(),
  brandKit: BrandKitSchema.optional(),
  // Legacy fields - kept for backwards compatibility during migration, will be removed
  questions: z.array(QuestionSchema).optional(),
  outcomes: z.array(OutcomeSchema).optional(),
  leadGen: z.object({
    enabled: z.boolean(),
    title: z.string().optional(),
    description: z.string().optional(),
    fields: z.array(z.enum(['name', 'email', 'phone'])),
    ctaText: z.string().optional(),
  }).optional(),
  // Visual builder data - the single source of truth for quiz content
  visualBuilderData: VisualBuilderDataSchema,
});

export const QuizSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  coverImageUrl: z.string().url().optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  brandKitMode: z.enum(['default', 'custom']).optional(),
  brandKit: BrandKitSchema.optional(),
  // Legacy fields - kept for backwards compatibility during migration, will be removed
  questions: z.array(QuestionSchema).optional(),
  outcomes: z.array(OutcomeSchema).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  isPublished: z.boolean(),
  stats: QuizStatsSchema,
  leadGen: z.object({
    enabled: z.boolean(),
    title: z.string().optional(),
    description: z.string().optional(),
    fields: z.array(z.enum(['name', 'email', 'phone'])),
    ctaText: z.string().optional(),
  }).optional(),
  conversationHistory: z.array(ChatMessageSchema).optional(),
  ownerId: z.string(),
  // Draft/Live separation fields
  publishedVersion: QuizSnapshotSchema.nullable().optional(),
  publishedAt: z.number().nullable().optional(),
  // Visual builder data - the single source of truth for quiz content
  visualBuilderData: VisualBuilderDataSchema,
});

// TypeScript types inferred from Zod schemas
export type AnswerOption = z.infer<typeof AnswerOptionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type QuizStats = z.infer<typeof QuizStatsSchema>;
export type QuizSnapshot = z.infer<typeof QuizSnapshotSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

export type BrandKitMode = 'default' | 'custom';

export type BrandKitColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export type BrandKit = {
  name?: string;
  logoUrl?: string | null;
  colors: BrandKitColors;
  updatedAt?: number;
};

// Partial types for draft states
// Note: visualBuilderData is the source of truth; legacy questions/outcomes are optional for backwards compatibility
export type QuizDraft = Partial<Omit<Quiz, 'questions' | 'outcomes' | 'visualBuilderData'>> & {
  questions?: Partial<Question>[];
  outcomes?: Partial<Outcome>[];
  visualBuilderData?: VisualBuilderData;
};

export type ManualChange = {
  id: string;
  scope: 'quiz' | 'question' | 'outcome';
  field: string;
  label: string;
  valuePreview?: string;
  entityId?: string;
  entityName?: string;
  timestamp: number;
};

// AI Extraction types
export type AIExtractionResult = {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  coverImagePrompt?: string;
  ctaText?: string;
  ctaUrl?: string;
  questions?: (Partial<Question> & { imagePrompt?: string })[];
  outcomes?: (Partial<Outcome> & { imagePrompt?: string })[];
  leadGen?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    fields?: ('name' | 'email' | 'phone')[];
    ctaText?: string;
  };
};

// Analytics Schemas
export const QuizAttemptSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  userId: z.string().nullable().optional(),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  lastUpdatedAt: z.number(),
  currentQuestionId: z.string().optional(),
  answers: z.record(z.string(), z.string()), // questionId -> optionId (simplified for MVP, multiple choice might need array)
  lead: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  resultOutcomeId: z.string().optional(),
  status: z.enum(['started', 'completed', 'abandoned']),
  ctaClickedAt: z.number().optional(),
  isOwnerAttempt: z.boolean().optional(),
});

export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;

// Loading sections for sidebar card animations
export type LoadingSections = {
  introduction: boolean;
  questions: boolean;
  outcomes: boolean;
  leadGen: boolean;
};

// Store types
export type QuizBuilderState = {
  quiz: QuizDraft;
  chatHistory: ChatMessage[];
  isExtracting: boolean;
  isSaving: boolean;
  error: string | null;
  hasSeenWelcomeMessage: boolean;
  pendingManualChanges: ManualChange[];
  // Draft/Live separation
  publishedVersion: QuizSnapshot | null;
  publishedAt: number | null;
  // Loading sections for sidebar animations
  loadingSections: LoadingSections;
  // Track when user manually removes cover image (prevents auto-suggestion)
  userRemovedCoverImage: boolean;

  // Actions
  setQuiz: (quiz: QuizDraft) => void;
  updateQuizField: <K extends keyof QuizDraft>(field: K, value: QuizDraft[K]) => void;
  addQuestion: (question: Partial<Question>) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  moveQuestion: (id: string, direction: 'up' | 'down') => void;
  reorderQuestions: (sourceIndex: number, destinationIndex: number) => void;
  addOutcome: (outcome: Partial<Outcome>) => void;
  updateOutcome: (id: string, outcome: Partial<Outcome>) => void;
  deleteOutcome: (id: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  setHasSeenWelcomeMessage: (value: boolean) => void;
  consumeManualChanges: () => ManualChange[];
  setExtracting: (isExtracting: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  loadQuiz: (quiz: Quiz) => void;
  // Draft/Live separation actions
  setPublishedVersion: (version: QuizSnapshot | null, publishedAt: number | null) => void;
  loadPublishedVersion: () => void;
  // Loading sections actions
  setLoadingSections: (sections: Partial<LoadingSections>) => void;
  clearLoadingSections: () => void;
  // Cover image removal tracking
  setUserRemovedCoverImage: (value: boolean) => void;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
};
