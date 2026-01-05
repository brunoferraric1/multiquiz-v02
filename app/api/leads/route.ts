import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminDb, getUserSubscription } from '@/lib/firebase-admin';

type LeadPreview = {
  id: string;
  quizId: string;
  startedAt: number;
  lead?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  resultOutcomeId?: string;
};

const hasLeadData = (lead?: LeadPreview['lead']) => {
  return Boolean(lead?.name || lead?.email || lead?.phone);
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
      return NextResponse.json({ totalCount: 0, lockedCount: 0, leads: [], isPro });
    }

    const attemptsSnapshots = await Promise.all(
      filteredQuizIds.map((filteredQuizId) => (
        db.collection('quiz_attempts')
          .where('quizId', '==', filteredQuizId)
          .orderBy('startedAt', 'desc')
          .get()
      ))
    );

    const allLeads: LeadPreview[] = attemptsSnapshots.flatMap((snapshot) => (
      snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          quizId: data.quizId,
          startedAt: toMillis(data.startedAt),
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
    )).filter((lead) => hasLeadData(lead.lead));

    allLeads.sort((a, b) => b.startedAt - a.startedAt);

    const totalCount = allLeads.length;

    if (!isPro) {
      return NextResponse.json({
        totalCount: 0,
        lockedCount: 0,
        leads: [],
        isPro,
      });
    }

    return NextResponse.json({
      totalCount,
      lockedCount: 0,
      leads: allLeads,
      isPro,
    });
  } catch (error) {
    console.error('[Leads API] Failed to load leads', error);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}
