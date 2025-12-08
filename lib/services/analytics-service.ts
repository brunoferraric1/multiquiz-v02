import {
    collection,
    doc,
    setDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuizAttempt, QuizAttemptSchema } from '@/types';
import { QuizService } from './quiz-service';

const ATTEMPTS_COLLECTION = 'quiz_attempts';

export class AnalyticsService {
    /**
     * Create a new quiz attempt when a user starts a quiz
     */
    static async createAttempt(quizId: string, userId?: string): Promise<string> {
        const attemptId = crypto.randomUUID();
        const now = Date.now();

        const attempt: QuizAttempt = {
            id: attemptId,
            quizId,
            userId,
            startedAt: now,
            lastUpdatedAt: now,
            answers: {},
            status: 'started'
        };

        try {
            // Create the attempt document
            await setDoc(doc(db, ATTEMPTS_COLLECTION, attemptId), {
                ...attempt,
                startedAt: serverTimestamp(),
                lastUpdatedAt: serverTimestamp(),
            });

            // Increment quiz starts
            await QuizService.incrementStat(quizId, 'starts');

            return attemptId;
        } catch (error) {
            console.error('Error creating quiz attempt:', error);
            // We don't want to block the user if analytics fails
            return attemptId;
        }
    }

    /**
     * Update an existing attempt (e.g., new answer, lead info)
     */
    static async updateAttempt(
        attemptId: string,
        updates: Partial<QuizAttempt>
    ): Promise<void> {
        try {
            const attemptRef = doc(db, ATTEMPTS_COLLECTION, attemptId);

            const firestoreUpdates = {
                ...updates,
                lastUpdatedAt: serverTimestamp(),
            };

            // If completing, add verified timestamp
            if (updates.status === 'completed') {
                // @ts-ignore
                firestoreUpdates.completedAt = serverTimestamp();
            }

            await updateDoc(attemptRef, firestoreUpdates);

            // If completing, increment quiz completions
            if (updates.status === 'completed' && updates.quizId) {
                await QuizService.incrementStat(updates.quizId, 'completions');
            }

        } catch (error) {
            console.error('Error updating quiz attempt:', error);
        }
    }

    /**
     * Get all attempts for a specific quiz (for reports)
     */
    static async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
        try {
            const attemptsRef = collection(db, ATTEMPTS_COLLECTION);
            const q = query(
                attemptsRef,
                where('quizId', '==', quizId),
                orderBy('startedAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    // Convert Timestamps to numbers for client-side use
                    startedAt: data.startedAt?.toMillis?.() || Date.now(),
                    completedAt: data.completedAt?.toMillis?.() || undefined,
                    lastUpdatedAt: data.lastUpdatedAt?.toMillis?.() || Date.now(),
                } as QuizAttempt;
            });
        } catch (error) {
            console.error('Error fetching quiz attempts:', error);
            return [];
        }
    }

    /**
     * Get leads for a quiz (attempts with lead data)
     */
    static async getQuizLeads(quizId: string): Promise<QuizAttempt[]> {
        try {
            // Note: Firestore doesn't support complex "!= null" queries easily on nested objects without an index
            // For MVP, we'll fetch attempts and filter client-side or assume completed = lead if lead gen is required
            // Better approach: add a top-level 'hasLead' boolean

            const attempts = await this.getQuizAttempts(quizId);
            return attempts.filter(a => a.lead && (a.lead.email || a.lead.phone || a.lead.name));
        } catch (error) {
            console.error('Error fetching quiz leads:', error);
            return [];
        }
    }
}
