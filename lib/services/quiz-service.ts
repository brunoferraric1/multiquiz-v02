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
import type { Quiz, QuizDraft } from '@/types';
import { QuizSchema } from '@/types';

const QUIZZES_COLLECTION = 'quizzes';

export class QuizService {
  /**
   * Save a quiz (create or update)
   */
  static async saveQuiz(quiz: QuizDraft, userId: string): Promise<string> {
    // Only require a title for saving (allow saving drafts)
    if (!quiz.title) {
      throw new Error('Quiz must have a title');
    }

    const quizId = quiz.id || crypto.randomUUID();
    const now = Date.now();

    const quizData: any = {
      id: quizId,
      title: quiz.title,
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

    // Remove undefined values (Firestore doesn't accept them)
    const cleanedData = Object.fromEntries(
      Object.entries(quizData).filter(([_, value]) => value !== undefined)
    );

    const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
    await setDoc(quizRef, {
      ...cleanedData,
      createdAt: Timestamp.fromMillis(cleanedData.createdAt as number),
      updatedAt: Timestamp.fromMillis(cleanedData.updatedAt as number),
    });

    return quizId;
  }

  /**
   * Get a quiz by ID
   */
  static async getQuizById(quizId: string, userId?: string): Promise<Quiz | null> {
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

      return {
        ...data,
        id: quizDoc.id,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
      } as Quiz;
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
   * Publish/unpublish a quiz
   */
  static async togglePublishQuiz(quizId: string, userId: string): Promise<void> {
    try {
      const quiz = await this.getQuizById(quizId, userId);
      if (!quiz || quiz.ownerId !== userId) {
        throw new Error('Unauthorized to publish this quiz');
      }

      const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
      await updateDoc(quizRef, {
        isPublished: !quiz.isPublished,
        updatedAt: Timestamp.fromMillis(Date.now()),
      });
    } catch (error) {
      console.error('Error toggling quiz publish status:', error);
      throw error;
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
