import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminDb, getUserSubscription } from '@/lib/firebase-admin';

type FieldResponse = {
  fieldId: string;
  label: string;
  type: string;
  value: string;
  stepId: string;
};

type DataCollectionPreview = {
  id: string;
  quizId: string;
  startedAt: number;
  // Primary data collection storage
  fieldResponses?: FieldResponse[];
  // Legacy lead object for backward compatibility
  lead?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  resultOutcomeId?: string;
};

// Check if attempt has any collected data (new or legacy format)
const hasCollectedData = (attempt: DataCollectionPreview) => {
  // Check new format first
  if (attempt.fieldResponses && attempt.fieldResponses.length > 0) {
    return true;
  }
  // Fallback to legacy format
  return Boolean(attempt.lead?.name || attempt.lead?.email || attempt.lead?.phone);
};

const toMillis = (value: unknown) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const quizIdFilter = requestUrl.searchParams.get('quizId');
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let userId = '';
  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const decoded = await auth.verifyIdToken(token);
    userId = decoded.uid;
  } catch (error) {
    console.error('[Leads API] Failed to authorize', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await getUserSubscription(userId);
    const isPro = subscription?.tier === 'pro' && subscription?.status === 'active';

    const db = getAdminDb();
    const quizzesSnapshot = await db.collection('quizzes').where('ownerId', '==', userId).get();
    const quizIds = quizzesSnapshot.docs.map((doc) => doc.id);
    const filteredQuizIds = quizIdFilter && quizIds.includes(quizIdFilter)
      ? [quizIdFilter]
      : quizIdFilter
        ? []
        : quizIds;

    if (filteredQuizIds.length === 0) {
      return NextResponse.json({ totalCount: 0, lockedCount: 0, collectedData: [], isPro });
    }

    const attemptsSnapshots = await Promise.all(
      filteredQuizIds.map((filteredQuizId) => (
        db.collection('quiz_attempts')
          .where('quizId', '==', filteredQuizId)
          .orderBy('startedAt', 'desc')
          .get()
      ))
    );

    const allCollectedData: DataCollectionPreview[] = attemptsSnapshots.flatMap((snapshot) => (
      snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          quizId: data.quizId,
          startedAt: toMillis(data.startedAt),
          // Include fieldResponses if present
          fieldResponses: data.fieldResponses || undefined,
          // Include legacy lead for backward compatibility
          lead: data.lead
            ? {
              name: data.lead.name,
              email: data.lead.email,
              phone: data.lead.phone,
            }
            : undefined,
          resultOutcomeId: data.resultOutcomeId,
        };
      })
    )).filter((attempt) => hasCollectedData(attempt));

    allCollectedData.sort((a, b) => b.startedAt - a.startedAt);

    const totalCount = allCollectedData.length;

    if (!isPro) {
      return NextResponse.json({
        totalCount: 0,
        lockedCount: 0,
        collectedData: [],
        isPro,
      });
    }

    return NextResponse.json({
      totalCount,
      lockedCount: 0,
      collectedData: allCollectedData,
      isPro,
    });
  } catch (error) {
    console.error('[Data Collection API] Failed to load collected data', error);
    return NextResponse.json({ error: 'Failed to load collected data' }, { status: 500 });
  }
}
