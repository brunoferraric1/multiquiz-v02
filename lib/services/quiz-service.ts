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
import type { BrandKit, Quiz, QuizDraft, QuizSnapshot, Question, Outcome } from '@/types';
import { QuizSchema } from '@/types';
import { TIER_LIMITS } from '@/lib/stripe';
import {
  isBase64DataUrl,
  migrateBase64ToStorage,
  getQuizCoverPath,
  getOutcomeImagePath,
  getQuestionImagePath,
} from '@/lib/services/storage-service';

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

    const quizData: any = {
      id: quizId,
      title: normalizedTitle,
      description: quiz.description || '',
      primaryColor: quiz.primaryColor || '#4F46E5',
      brandKitMode: quiz.brandKitMode ?? 'default',
      questions: sanitizeQuestions(quiz.questions || []),
      outcomes: sanitizeOutcomes(quiz.outcomes || []),
      createdAt: quiz.createdAt || now,
      updatedAt: now,
      isPublished: quiz.isPublished || false,
      stats: quiz.stats || { views: 0, starts: 0, completions: 0 },
      conversationHistory: quiz.conversationHistory || [],
      ownerId: userId,
      // Preserve live snapshot metadata so auto-save doesn't drop it
      publishedVersion: quiz.publishedVersion ?? null,
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

    // Recursively remove all undefined values (Firestore doesn't accept them)
    const cleanedData = removeUndefinedDeep(quizData);
    console.log('[QuizService] saveQuiz - cleanedData.leadGen after removeUndefinedDeep:', JSON.stringify(cleanedData.leadGen));

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

      let baseQuiz = {
        ...data,
        id: quizDoc.id,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        publishedAt: data.publishedAt?.toMillis?.() || data.publishedAt || null,
      } as Quiz;

      // If requesting published version and it exists, merge it into the quiz
      if (version === 'published' && data.publishedVersion) {
        return {
          ...baseQuiz,
          ...data.publishedVersion,
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
      console.error('Error fetching quiz:', error);
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
   * Create a snapshot of the current quiz for publishing
   */
  private static createSnapshot(quiz: Quiz, brandKit?: BrandKit | null): QuizSnapshot {
    return {
      title: quiz.title,
      description: quiz.description,
      coverImageUrl: quiz.coverImageUrl,
      ctaText: quiz.ctaText,
      primaryColor: quiz.primaryColor || '#4F46E5',
      brandKitMode: quiz.brandKitMode ?? 'default',
      brandKit: quiz.brandKitMode === 'custom' ? brandKit ?? undefined : undefined,
      questions: quiz.questions || [],
      outcomes: quiz.outcomes || [],
      leadGen: quiz.leadGen,
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

      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      await updateDoc(quizRef, {
        isPublished: true,
        publishedVersion: cleanedSnapshot,
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
}
