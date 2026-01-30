import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BrandKit, Quiz, QuizDraft, QuizSnapshot, Question, Outcome, VisualBuilderData } from '@/types';
import { QuizSchema } from '@/types';
import { TIER_LIMITS } from '@/lib/stripe';
import {
  isBase64DataUrl,
  migrateBase64ToStorage,
  getQuizCoverPath,
  getOutcomeImagePath,
  getQuestionImagePath,
} from '@/lib/services/storage-service';
import { quizToVisualBuilder } from '@/lib/utils/visual-builder-converters';

const QUIZZES_COLLECTION = 'quizzes';
const LIMIT_ERRORS = {
  DRAFT: 'DRAFT_LIMIT_REACHED',
  PUBLISH: 'PUBLISH_LIMIT_REACHED',
} as const;

/**
 * Recursively removes all undefined values from an object
 * This is necessary because Firestore doesn't accept undefined values
 */
function removeUndefinedDeep(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedDeep(item));
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedDeep(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Check if a URL is a temporary blob URL that shouldn't be persisted
 */
function isBlobUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('blob:');
}

/**
 * Sanitize an image URL - returns undefined if it's a blob URL (to avoid persisting temporary URLs)
 */
function sanitizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (isBlobUrl(url)) {
    console.warn('[QuizService] Skipping blob URL, will not persist:', url.substring(0, 50));
    return undefined;
  }
  return url;
}

/**
 * Sanitize outcomes array - remove blob URLs from imageUrl fields
 */
function sanitizeOutcomes(outcomes: any[]): any[] {
  return outcomes.map(outcome => ({
    ...outcome,
    imageUrl: sanitizeImageUrl(outcome.imageUrl),
  }));
}

/**
 * Sanitize questions array - remove blob URLs from imageUrl fields
 */
function sanitizeQuestions(questions: any[]): any[] {
  return questions.map(question => ({
    ...question,
    imageUrl: sanitizeImageUrl(question.imageUrl),
  }));
}

/**
 * Migrate base64 images in a quiz to Firebase Storage
 * This runs in the background and updates the Firestore document
 */
async function migrateQuizImages(quiz: Quiz): Promise<Quiz> {
  if (!quiz.id) return quiz;

  let hasChanges = false;
  const updates: Record<string, unknown> = {};

  // Migrate cover image
  if (isBase64DataUrl(quiz.coverImageUrl)) {
    console.log('[QuizService] Migrating cover image for quiz:', quiz.id);
    try {
      const newUrl = await migrateBase64ToStorage(
        quiz.coverImageUrl!,
        getQuizCoverPath(quiz.id)
      );
      quiz.coverImageUrl = newUrl;
      updates.coverImageUrl = newUrl;
      hasChanges = true;
    } catch (error) {
      console.error('[QuizService] Failed to migrate cover image:', error);
    }
  }

  // Migrate outcome images
  if (quiz.outcomes?.length) {
    const migratedOutcomes = await Promise.all(
      quiz.outcomes.map(async (outcome) => {
        if (outcome.id && isBase64DataUrl(outcome.imageUrl)) {
          console.log('[QuizService] Migrating outcome image:', outcome.id);
          try {
            const newUrl = await migrateBase64ToStorage(
              outcome.imageUrl!,
              getOutcomeImagePath(quiz.id!, outcome.id)
            );
            hasChanges = true;
            return { ...outcome, imageUrl: newUrl };
          } catch (error) {
            console.error('[QuizService] Failed to migrate outcome image:', error);
          }
        }
        return outcome;
      })
    );
    if (hasChanges) {
      quiz.outcomes = migratedOutcomes as Outcome[];
      updates.outcomes = migratedOutcomes;
    }
  }

  // Migrate question images
  if (quiz.questions?.length) {
    let questionsChanged = false;
    const migratedQuestions = await Promise.all(
      quiz.questions.map(async (question) => {
        if (question.id && isBase64DataUrl(question.imageUrl)) {
          console.log('[QuizService] Migrating question image:', question.id);
          try {
            const newUrl = await migrateBase64ToStorage(
              question.imageUrl!,
              getQuestionImagePath(quiz.id!, question.id)
            );
            questionsChanged = true;
            return { ...question, imageUrl: newUrl };
          } catch (error) {
            console.error('[QuizService] Failed to migrate question image:', error);
          }
        }
        return question;
      })
    );
    if (questionsChanged) {
      quiz.questions = migratedQuestions as Question[];
      updates.questions = migratedQuestions;
      hasChanges = true;
    }
  }

  // Save migrated data to Firestore
  if (hasChanges) {
    try {
      const quizRef = doc(db, QUIZZES_COLLECTION, quiz.id);
      updates.updatedAt = Timestamp.fromMillis(Date.now());
      await updateDoc(quizRef, updates);
      console.log('[QuizService] Migration complete for quiz:', quiz.id);
    } catch (error) {
      console.error('[QuizService] Failed to save migrated quiz:', error);
    }
  }

  return quiz;
}

export type PublishResult = { status: 'published' } | { status: 'limit-reached' };

export class QuizService {
  /**
   * Save a quiz (create or update)
   */
  static async saveQuiz(
    quiz: QuizDraft,
    userId: string,
    options?: { isNewQuiz?: boolean }
  ): Promise<string> {
    const quizId = quiz.id || crypto.randomUUID();
    const now = Date.now();
    const normalizedTitle = quiz.title?.trim() || 'Sem título';

    const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
    let existingQuizSnap;
    let isNewQuiz = options?.isNewQuiz;
    if (typeof isNewQuiz !== 'boolean') {
      try {
        existingQuizSnap = await getDoc(quizRef);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[QuizService] saveQuiz getDoc failed', {
            quizId,
            userId,
            errorMessage: (error as Error)?.message,
          });
        }
        throw error;
      }
      isNewQuiz = !existingQuizSnap.exists();
    }

    if (process.env.NODE_ENV !== 'production') {
      const existingOwnerId = existingQuizSnap?.exists()
        ? (existingQuizSnap.data()?.ownerId as string | undefined)
        : undefined;
      console.log('[QuizService] saveQuiz preflight', {
        quizId,
        userId,
        isNewQuiz,
        existingOwnerId,
      });
    }

    // Enforce draft cap for free users on new quiz creation
    if (isNewQuiz && !quiz.isPublished) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const tier = (userData?.subscription?.tier as keyof typeof TIER_LIMITS) || 'free';
      const draftLimit = TIER_LIMITS[tier]?.draftLimit ?? Infinity;

      if (Number.isFinite(draftLimit)) {
        const draftsQuery = query(
          collection(db, QUIZZES_COLLECTION),
          where('ownerId', '==', userId),
          where('isPublished', '==', false)
        );
        const draftsSnapshot = await getDocs(draftsQuery);
        const existingDraftCount = draftsSnapshot.size;

        if (existingDraftCount >= draftLimit) {
          const error: any = new Error(LIMIT_ERRORS.DRAFT);
          error.code = LIMIT_ERRORS.DRAFT;
          error.limit = draftLimit;
          throw error;
        }
      }
    }

    // Handle publishedVersion - stringify visualBuilderData if it exists as an object
    let publishedVersion: any = quiz.publishedVersion ?? null;
    if (publishedVersion && publishedVersion.visualBuilderData) {
      if (typeof publishedVersion.visualBuilderData !== 'string') {
        console.log('[QuizService] Stringifying publishedVersion.visualBuilderData');
        publishedVersion = {
          ...publishedVersion,
          visualBuilderData: JSON.stringify(publishedVersion.visualBuilderData),
        };
      }
    }

    const quizData: any = {
      id: quizId,
      title: normalizedTitle,
      description: quiz.description || '',
      primaryColor: quiz.primaryColor || '#4F46E5',
      brandKitMode: quiz.brandKitMode ?? 'default',
      // Legacy questions/outcomes are no longer stored - visualBuilderData is the source of truth
      createdAt: quiz.createdAt || now,
      updatedAt: now,
      isPublished: quiz.isPublished || false,
      stats: quiz.stats || { views: 0, starts: 0, completions: 0 },
      conversationHistory: quiz.conversationHistory || [],
      ownerId: userId,
      // Preserve live snapshot metadata so auto-save doesn't drop it
      publishedVersion: publishedVersion,
      publishedAt: quiz.publishedAt ?? null,
    };

    // Add optional fields only if they have values AND are not blob URLs
    const sanitizedCoverUrl = sanitizeImageUrl(quiz.coverImageUrl);
    if (sanitizedCoverUrl) {
      quizData.coverImageUrl = sanitizedCoverUrl;
    }
    if (quiz.ctaText) {
      quizData.ctaText = quiz.ctaText;
    }
    if (quiz.ctaUrl) {
      quizData.ctaUrl = quiz.ctaUrl;
    }
    if (quiz.leadGen) {
      quizData.leadGen = quiz.leadGen;
      console.log('[QuizService] saveQuiz - leadGen being saved:', JSON.stringify(quiz.leadGen));
      if (!quiz.leadGen.enabled || !quiz.leadGen.fields?.length) {
        console.warn('[QuizService] WARNING: Saving leadGen with enabled=false or empty fields!');
        console.trace('Stack trace for disabled leadGen save:');
      }
    } else {
      console.log('[QuizService] saveQuiz - NO leadGen in quiz draft');
    }

    // Store visual builder data if provided - as JSON string to avoid Firestore nested entity limits
    if (quiz.visualBuilderData) {
      try {
        const vbDataString = JSON.stringify(quiz.visualBuilderData);
        console.log('[QuizService] visualBuilderData stringified successfully, length:', vbDataString.length);
        console.log('[QuizService] visualBuilderData preview:', vbDataString.substring(0, 200) + '...');
        quizData.visualBuilderData = vbDataString;
      } catch (e) {
        console.error('[QuizService] Failed to serialize visualBuilderData:', e);
      }
    } else {
      console.log('[QuizService] No visualBuilderData to store');
    }

    // Recursively remove all undefined values (Firestore doesn't accept them)
    const cleanedData = removeUndefinedDeep(quizData);
    console.log('[QuizService] saveQuiz - cleanedData.leadGen after removeUndefinedDeep:', JSON.stringify(cleanedData.leadGen));

    // Debug: Check visualBuilderData type
    console.log('[QuizService] visualBuilderData type:', typeof cleanedData.visualBuilderData);
    console.log('[QuizService] publishedVersion.visualBuilderData type:', typeof cleanedData.publishedVersion?.visualBuilderData);

    console.log('[QuizService] About to save to Firestore with isPublished:', cleanedData.isPublished);

    const firestorePayload: Record<string, unknown> = {
      ...cleanedData,
      createdAt: Timestamp.fromMillis(cleanedData.createdAt as number),
      updatedAt: Timestamp.fromMillis(cleanedData.updatedAt as number),
    };

    if ('publishedAt' in cleanedData) {
      firestorePayload.publishedAt =
        cleanedData.publishedAt === null
          ? null
          : Timestamp.fromMillis(cleanedData.publishedAt as number);
    }

    // Debug: Log all keys being sent to Firestore
    console.log('[QuizService] Firestore payload keys:', Object.keys(firestorePayload));
    if (firestorePayload.publishedVersion) {
      console.log('[QuizService] publishedVersion keys:', Object.keys(firestorePayload.publishedVersion as object));
    }

    try {
      await setDoc(quizRef, firestorePayload);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[QuizService] saveQuiz setDoc failed', {
          quizId,
          userId,
          isNewQuiz,
          existingOwnerId: existingQuizSnap?.exists()
            ? (existingQuizSnap.data()?.ownerId as string | undefined)
            : undefined,
          payloadOwnerId: quizData.ownerId,
          errorMessage: (error as Error)?.message,
        });
      }
      throw error;
    }

    console.log('[QuizService] Successfully saved to Firestore');

    return quizId;
  }

  /**
   * Get a quiz by ID
   * @param version - 'draft' returns current quiz state, 'published' returns frozen published version
   */
  static async getQuizById(
    quizId: string,
    userId?: string,
    version: 'draft' | 'published' = 'draft'
  ): Promise<Quiz | null> {
    try {
      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      const quizDoc = await getDoc(quizRef);

      if (!quizDoc.exists()) {
        return null;
      }

      const data = quizDoc.data();

      // Check ownership for unpublished quizzes
      if (!data.isPublished && userId && data.ownerId !== userId) {
        throw new Error('Unauthorized access to unpublished quiz');
      }

      // Parse visualBuilderData from JSON string if it exists
      let parsedVisualBuilderData = undefined;
      if (typeof data.visualBuilderData === 'string') {
        try {
          parsedVisualBuilderData = JSON.parse(data.visualBuilderData);
        } catch (e) {
          console.warn('[QuizService] Failed to parse visualBuilderData:', e);
        }
      } else if (data.visualBuilderData) {
        // Handle legacy format where it might already be an object
        parsedVisualBuilderData = data.visualBuilderData;
      }

      // Check if this is a legacy quiz that needs migration
      // (has questions/outcomes but no visualBuilderData)
      const needsLegacyMigration = !parsedVisualBuilderData &&
        (Array.isArray(data.questions) && data.questions.length > 0 ||
         Array.isArray(data.outcomes) && data.outcomes.length > 0);

      if (needsLegacyMigration) {
        console.log('[QuizService] Legacy quiz detected, converting to visualBuilderData:', quizId);
        try {
          // Convert legacy format to visualBuilderData
          const legacyQuiz = {
            title: data.title,
            description: data.description,
            coverImageUrl: data.coverImageUrl,
            questions: data.questions || [],
            outcomes: data.outcomes || [],
            leadGen: data.leadGen,
          };
          const converted = quizToVisualBuilder(legacyQuiz as any);
          parsedVisualBuilderData = {
            schemaVersion: 1,
            steps: converted.steps,
            outcomes: converted.outcomes,
          };
          console.log('[QuizService] Legacy migration complete - converted to', {
            stepsCount: converted.steps.length,
            outcomesCount: converted.outcomes.length,
          });
        } catch (err) {
          console.error('[QuizService] Failed to migrate legacy quiz:', err);
          // Return empty visualBuilderData as fallback
          parsedVisualBuilderData = {
            schemaVersion: 1,
            steps: [],
            outcomes: [],
          };
        }
      }

      let baseQuiz = {
        ...data,
        id: quizDoc.id,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        publishedAt: data.publishedAt?.toMillis?.() || data.publishedAt || null,
        visualBuilderData: parsedVisualBuilderData,
      } as Quiz;

      // If requesting published version and it exists, merge it into the quiz
      if (version === 'published' && data.publishedVersion) {
        // Also parse visualBuilderData in published version if needed
        let publishedVBData = data.publishedVersion.visualBuilderData;
        if (typeof publishedVBData === 'string') {
          try {
            publishedVBData = JSON.parse(publishedVBData);
          } catch (e) {
            console.warn('[QuizService] Failed to parse published visualBuilderData:', e);
          }
        }

        // Debug: Log video thumbnail data in published version
        if (publishedVBData?.steps) {
          for (const step of publishedVBData.steps) {
            for (const block of step.blocks || []) {
              if (block.type === 'media' && block.config?.type === 'video') {
                console.log('[QuizService] getQuizById (published) - Video block found:', {
                  stepId: step.id,
                  blockId: block.id,
                  videoThumbnail: block.config.videoThumbnail?.substring(0, 100),
                  videoThumbnailOrientation: block.config.videoThumbnailOrientation,
                  videoThumbnailFocalPoint: block.config.videoThumbnailFocalPoint,
                });
              }
            }
          }
        }

        return {
          ...baseQuiz,
          ...data.publishedVersion,
          visualBuilderData: publishedVBData,
        };
      }

      // For draft versions, trigger async migration of base64 images (if any)
      // Only migrate if user is the owner (client-side storage access requires auth)
      if (version === 'draft' && userId && data.ownerId === userId) {
        // Run migration in background - don't block the return
        migrateQuizImages(baseQuiz).then((migratedQuiz) => {
          // Note: The returned quiz is already updated in place by migrateQuizImages
          // The Firestore document is also updated, so next load will have migrated data
        }).catch((error) => {
          console.error('[QuizService] Background migration error:', error);
        });
      }

      return baseQuiz;
    } catch (error) {
      // Don't log permission errors - they're expected when checking if a quiz exists
      const isPermissionError = (error as any)?.code === 'permission-denied' ||
        (error as Error)?.message?.includes('permission');
      if (!isPermissionError) {
        console.error('Error fetching quiz:', error);
      }
      throw error;
    }
  }

  /**
   * Get all quizzes for a user
   */
  static async getUserQuizzes(userId: string): Promise<Quiz[]> {
    try {
      const quizzesRef = collection(db, QUIZZES_COLLECTION);
      const q = query(
        quizzesRef,
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          updatedAt: data.updatedAt?.toMillis() || Date.now(),
        } as Quiz;
      });
    } catch (error) {
      console.error('Error fetching user quizzes:', error);
      throw error;
    }
  }

  /**
   * Delete a quiz
   */
  static async deleteQuiz(quizId: string, userId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    try {
      // Verify ownership before deleting
      const quiz = await this.getQuizById(quizId, userId);

      if (!quiz || quiz.ownerId !== userId) {
        throw new Error('Unauthorized to delete this quiz');
      }

      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      await deleteDoc(quizRef);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  }

  /**
   * Duplicate a quiz, creating a new draft copy with fresh identifiers
   */
  static async duplicateQuiz(
    quizId: string,
    userId: string,
    titleSuffix: string = '(cópia)'
  ): Promise<string> {
    // 1. Fetch original quiz
    const original = await this.getQuizById(quizId, userId);
    if (!original || original.ownerId !== userId) {
      throw new Error('Quiz not found or unauthorized');
    }

    // 2. Deep clone visualBuilderData with new IDs
    const clonedVBData = this.deepCloneVisualBuilderData(original.visualBuilderData);

    // 3. Create new quiz draft
    const duplicate: QuizDraft = {
      title: `${original.title} ${titleSuffix}`.trim(),
      description: original.description,
      coverImageUrl: original.coverImageUrl,
      ctaText: original.ctaText,
      ctaUrl: original.ctaUrl,
      primaryColor: original.primaryColor,
      brandKitMode: original.brandKitMode,
      leadGen: original.leadGen ? { ...original.leadGen } : undefined,
      visualBuilderData: clonedVBData,
      isPublished: false,
      stats: { views: 0, starts: 0, completions: 0 },
      conversationHistory: [],
      publishedVersion: null,
      publishedAt: null,
    };

    // 4. Save and return new ID (saveQuiz handles draft limit check)
    return await this.saveQuiz(duplicate, userId, { isNewQuiz: true });
  }

  /**
   * Deep clone visual builder data with regenerated IDs
   */
  private static deepCloneVisualBuilderData(
    data: VisualBuilderData | undefined
  ): VisualBuilderData | undefined {
    if (!data) return undefined;

    const generateId = () => crypto.randomUUID();

    // Map old outcome IDs to new ones (for options that reference outcomes)
    const outcomeIdMap = new Map<string, string>();

    const clonedOutcomes = data.outcomes.map(outcome => {
      const newId = generateId();
      outcomeIdMap.set(outcome.id, newId);
      return {
        ...outcome,
        id: newId,
        blocks: outcome.blocks.map(block => ({
          ...block,
          id: generateId(),
          config: this.deepCloneBlockConfig(block.config),
        })),
      };
    });

    const clonedSteps = data.steps.map(step => ({
      ...step,
      id: generateId(),
      blocks: step.blocks.map(block => ({
        ...block,
        id: generateId(),
        config: this.deepCloneBlockConfig(block.config, outcomeIdMap),
      })),
    }));

    return {
      schemaVersion: data.schemaVersion,
      steps: clonedSteps,
      outcomes: clonedOutcomes,
    };
  }

  /**
   * Deep clone block config, regenerating item IDs and remapping outcome references
   */
  private static deepCloneBlockConfig(
    config: any,
    outcomeIdMap?: Map<string, string>
  ): any {
    const cloned = JSON.parse(JSON.stringify(config));

    // Regenerate item IDs if present
    if (cloned.items && Array.isArray(cloned.items)) {
      cloned.items = cloned.items.map((item: any) => ({
        ...item,
        id: item.id ? crypto.randomUUID() : undefined,
        // Remap outcome references in options
        outcomeId: outcomeIdMap && item.outcomeId
          ? outcomeIdMap.get(item.outcomeId) || item.outcomeId
          : item.outcomeId,
      }));
    }

    return cloned;
  }

  /**
   * Create a snapshot of the current quiz for publishing
   * Note: Legacy questions/outcomes are no longer included - visualBuilderData is the source of truth
   */
  private static createSnapshot(quiz: Quiz, brandKit?: BrandKit | null): QuizSnapshot {
    if (!quiz.visualBuilderData) {
      throw new Error('Cannot create snapshot: visualBuilderData is required');
    }

    return {
      title: quiz.title,
      description: quiz.description,
      coverImageUrl: quiz.coverImageUrl,
      ctaText: quiz.ctaText,
      primaryColor: quiz.primaryColor || '#4F46E5',
      brandKitMode: quiz.brandKitMode ?? 'default',
      brandKit: quiz.brandKitMode === 'custom' ? brandKit ?? undefined : undefined,
      leadGen: quiz.leadGen,
      // visualBuilderData is the single source of truth for quiz content
      visualBuilderData: quiz.visualBuilderData,
    };
  }

  /**
   * Publish a quiz (works for first publish and updates)
   * Creates a snapshot of current state and sets isPublished to true
   */
  static async publishQuiz(quizId: string, userId: string): Promise<PublishResult> {
    try {
      const quiz = await this.getQuizById(quizId, userId);
      if (!quiz || quiz.ownerId !== userId) {
        throw new Error('Unauthorized to publish this quiz');
      }

      // Debug: Log video thumbnail data in all media blocks
      if (quiz.visualBuilderData?.steps) {
        for (const step of quiz.visualBuilderData.steps) {
          for (const block of step.blocks || []) {
            if (block.type === 'media' && block.config?.type === 'video') {
              console.log('[QuizService] publishQuiz - Video block found:', {
                stepId: step.id,
                blockId: block.id,
                videoThumbnail: block.config.videoThumbnail?.substring(0, 100),
                videoThumbnailOrientation: block.config.videoThumbnailOrientation,
                videoThumbnailFocalPoint: block.config.videoThumbnailFocalPoint,
              });
            }
          }
        }
      }

      // Fetch subscription to enforce publish limit for free users
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const tier = (userData?.subscription?.tier as keyof typeof TIER_LIMITS) || 'free';
      const publishedLimit = TIER_LIMITS[tier]?.publishedQuizzes ?? Infinity;
      const isAlreadyPublished = Boolean(quiz.isPublished);

      if (Number.isFinite(publishedLimit)) {
        const publishedQuery = query(
          collection(db, QUIZZES_COLLECTION),
          where('ownerId', '==', userId),
          where('isPublished', '==', true)
        );
        const publishedSnapshot = await getDocs(publishedQuery);
        const publishedCount = publishedSnapshot.size;

        if (!isAlreadyPublished && publishedCount >= publishedLimit) {
          return { status: 'limit-reached' };
        }
      }

      const now = Date.now();
      const brandKit =
        quiz.brandKitMode === 'custom' && userData?.brandKit?.colors
          ? {
            name:
              typeof userData.brandKit.name === 'string' ? userData.brandKit.name : undefined,
            logoUrl: userData.brandKit.logoUrl ?? null,
            colors: {
              primary: userData.brandKit.colors.primary,
              secondary: userData.brandKit.colors.secondary,
              accent: userData.brandKit.colors.accent,
            },
          }
          : null;
      const snapshot = this.createSnapshot(quiz, brandKit);
      const cleanedSnapshot = removeUndefinedDeep(snapshot);

      // Stringify visualBuilderData within the snapshot to avoid Firestore nested entity limits
      // This matches how saveQuiz stores visualBuilderData
      const snapshotToStore = {
        ...cleanedSnapshot,
        visualBuilderData: JSON.stringify(cleanedSnapshot.visualBuilderData),
      };

      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      await updateDoc(quizRef, {
        isPublished: true,
        publishedVersion: snapshotToStore,
        publishedAt: Timestamp.fromMillis(now),
        updatedAt: Timestamp.fromMillis(now),
      });

      console.log('[QuizService] Quiz published with snapshot');
      return { status: 'published' };
    } catch (error) {
      console.error('Error publishing quiz:', error);
      throw error;
    }
  }

  /**
   * Unpublish a quiz (keeps publishedVersion intact for potential republish)
   */
  static async unpublishQuiz(quizId: string, userId: string): Promise<void> {
    try {
      const quiz = await this.getQuizById(quizId, userId);
      if (!quiz || quiz.ownerId !== userId) {
        throw new Error('Unauthorized to unpublish this quiz');
      }

      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      await updateDoc(quizRef, {
        isPublished: false,
        updatedAt: Timestamp.fromMillis(Date.now()),
      });

      console.log('[QuizService] Quiz unpublished');
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use publishQuiz and unpublishQuiz instead
   */
  static async togglePublishQuiz(quizId: string, userId: string): Promise<void> {
    const quiz = await this.getQuizById(quizId, userId);
    if (!quiz) throw new Error('Quiz not found');

    if (quiz.isPublished) {
      await this.unpublishQuiz(quizId, userId);
    } else {
      const result = await this.publishQuiz(quizId, userId);
      if (result.status === 'limit-reached') {
        return;
      }
    }
  }

  /**
   * Increment quiz stats
   */
  static async incrementStat(
    quizId: string,
    stat: 'views' | 'starts' | 'completions'
  ): Promise<void> {
    try {
      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      const quiz = await getDoc(quizRef);

      if (!quiz.exists()) {
        throw new Error('Quiz not found');
      }

      const currentStats = quiz.data().stats || { views: 0, starts: 0, completions: 0 };
      await updateDoc(quizRef, {
        [`stats.${stat}`]: currentStats[stat] + 1,
      });
    } catch (error) {
      console.error('Error updating quiz stats:', error);
      // Don't throw - stats update shouldn't break the app
    }
  }

  /**
   * Sync quiz stats from actual counts (used to fix historical data)
   * Only updates starts and completions - views are tracked separately
   */
  static async syncStats(
    quizId: string,
    counts: { starts: number; completions: number }
  ): Promise<void> {
    try {
      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      const quiz = await getDoc(quizRef);

      if (!quiz.exists()) {
        throw new Error('Quiz not found');
      }

      const currentStats = quiz.data().stats || { views: 0, starts: 0, completions: 0 };

      // Only update if the counts differ
      if (currentStats.starts !== counts.starts || currentStats.completions !== counts.completions) {
        await updateDoc(quizRef, {
          'stats.starts': counts.starts,
          'stats.completions': counts.completions,
        });
      }
    } catch (error) {
      console.error('Error syncing quiz stats:', error);
    }
  }
}
