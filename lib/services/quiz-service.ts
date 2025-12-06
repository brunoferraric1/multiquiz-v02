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
import type { Quiz, QuizDraft, QuizSnapshot } from '@/types';
import { QuizSchema } from '@/types';

const QUIZZES_COLLECTION = 'quizzes';

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

export class QuizService {
  /**
   * Save a quiz (create or update)
   */
  static async saveQuiz(quiz: QuizDraft, userId: string): Promise<string> {
    const quizId = quiz.id || crypto.randomUUID();
    const now = Date.now();
    const normalizedTitle = quiz.title?.trim() || 'Sem título';

    const quizData: any = {
      id: quizId,
      title: normalizedTitle,
      description: quiz.description || '',
      primaryColor: quiz.primaryColor || '#4F46E5',
      questions: quiz.questions || [],
      outcomes: quiz.outcomes || [],
      createdAt: quiz.createdAt || now,
      updatedAt: now,
      isPublished: quiz.isPublished || false,
      stats: quiz.stats || { views: 0, starts: 0, completions: 0 },
      conversationHistory: quiz.conversationHistory || [],
      ownerId: userId,
    };

    // Add optional fields only if they have values
    if (quiz.coverImageUrl) {
      quizData.coverImageUrl = quiz.coverImageUrl;
    }
    if (quiz.ctaText) {
      quizData.ctaText = quiz.ctaText;
    }
    if (quiz.ctaUrl) {
      quizData.ctaUrl = quiz.ctaUrl;
    }

    // Recursively remove all undefined values (Firestore doesn't accept them)
    const cleanedData = removeUndefinedDeep(quizData);

    console.log('[QuizService] About to save to Firestore with isPublished:', cleanedData.isPublished);

    const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
    await setDoc(quizRef, {
      ...cleanedData,
      createdAt: Timestamp.fromMillis(cleanedData.createdAt as number),
      updatedAt: Timestamp.fromMillis(cleanedData.updatedAt as number),
    });

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

      const baseQuiz = {
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
  private static createSnapshot(quiz: Quiz): QuizSnapshot {
    return {
      title: quiz.title,
      description: quiz.description,
      coverImageUrl: quiz.coverImageUrl,
      ctaText: quiz.ctaText,
      primaryColor: quiz.primaryColor || '#4F46E5',
      questions: quiz.questions || [],
      outcomes: quiz.outcomes || [],
    };
  }

  /**
   * Publish a quiz (works for first publish and updates)
   * Creates a snapshot of current state and sets isPublished to true
   */
  static async publishQuiz(quizId: string, userId: string): Promise<void> {
    try {
      const quiz = await this.getQuizById(quizId, userId);
      if (!quiz || quiz.ownerId !== userId) {
        throw new Error('Unauthorized to publish this quiz');
      }

      const now = Date.now();
      const snapshot = this.createSnapshot(quiz);
      const cleanedSnapshot = removeUndefinedDeep(snapshot);

      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      await updateDoc(quizRef, {
        isPublished: true,
        publishedVersion: cleanedSnapshot,
        publishedAt: Timestamp.fromMillis(now),
        updatedAt: Timestamp.fromMillis(now),
      });

      console.log('[QuizService] Quiz published with snapshot');
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
      await this.publishQuiz(quizId, userId);
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
