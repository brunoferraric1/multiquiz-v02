import {
    collection,
    doc,
    getDoc,
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
    static async createAttempt(quizId: string, userId?: string, isOwnerAttempt: boolean = false): Promise<string> {
        const attemptId = crypto.randomUUID();
        const now = Date.now();

        const attempt: QuizAttempt = {
            id: attemptId,
            quizId,
            userId: userId || null, // Ensure undefined becomes null for Firestore
            startedAt: now,
            lastUpdatedAt: now,
            answers: {},
            status: 'started',
            isOwnerAttempt
        };

        try {
            // Create the attempt document
            await setDoc(doc(db, ATTEMPTS_COLLECTION, attemptId), {
                ...attempt,
                startedAt: serverTimestamp(),
                lastUpdatedAt: serverTimestamp(),
            });

            // Increment quiz starts ONLY if not owner
            if (!isOwnerAttempt) {
                await QuizService.incrementStat(quizId, 'starts');
            }

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

            // Sanitize updates to remove undefined values
            const cleanUpdates = JSON.parse(JSON.stringify(updates));

            const firestoreUpdates = {
                ...cleanUpdates,
                lastUpdatedAt: serverTimestamp(),
            };

            // If completing, add verified timestamp
            if (updates.status === 'completed') {
                // @ts-ignore
                firestoreUpdates.completedAt = serverTimestamp();
            }

            await updateDoc(attemptRef, firestoreUpdates);

            // If completing, increment quiz completions (only if not owner check is complex here without fetching, 
            // but we can trust the attempt creation logic or fetch it. 
            // For efficiency, we might need to know if it's an owner attempt.
            // Let's fetch the attempt first to be sure? No that's extra read.
            // Argument 'updates' doesn't necessarily have isOwnerAttempt.
            // We should pass it or check it.
            // Actually, best way is to fetch the attempt to check 'isOwnerAttempt', or trust the caller to pass it not easy.
            // Alternative: The incrementStat call should be conditional.
            // Let's just modify the updateAttempt to fetch the attempt document to check 'isOwnerAttempt'.

            // Optimization: If we just created it with isOwnerAttempt: true, we can't easily know here without reading.
            // Let's read the doc.

            let isOwnerAttempt = false;
            let targetQuizId = updates.quizId;

            // Fetch current attempt data to check ownership and getting quizId if needed
            try {
                const attemptSnap = await getDoc(attemptRef);
                if (attemptSnap.exists()) {
                    const data = attemptSnap.data() as QuizAttempt;
                    isOwnerAttempt = data.isOwnerAttempt || false;
                    if (!targetQuizId) {
                        targetQuizId = data.quizId;
                    }
                }
            } catch (err) {
                // Ignore read errors for public users
            }

            if (updates.status === 'completed' && targetQuizId && !isOwnerAttempt) {
                await QuizService.incrementStat(targetQuizId, 'completions');
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

    /**
     * Calculate accurate stats for a quiz from attempts (excludes owner attempts)
     */
    static async calculateQuizStats(quizId: string, ownerId: string): Promise<{ starts: number; completions: number }> {
        try {
            const attempts = await this.getQuizAttempts(quizId);
            const validAttempts = attempts.filter(a => !a.isOwnerAttempt && a.userId !== ownerId);

            return {
                starts: validAttempts.length,
                completions: validAttempts.filter(a => a.status === 'completed').length,
            };
        } catch (error) {
            console.error('Error calculating quiz stats:', error);
            return { starts: 0, completions: 0 };
        }
    }
}
