import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, getUserSubscription } from '@/lib/firebase-admin';

const toMillis = (value: unknown) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
        return (value as { toMillis: () => number }).toMillis();
    }
    return 0;
};

const toMillisOrUndefined = (value: unknown) => {
    const millis = toMillis(value);
    return millis > 0 ? millis : undefined;
};

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const quizId = requestUrl.searchParams.get('quizId');
    if (!quizId) {
        return NextResponse.json({ error: 'Missing quizId' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    let userId = '';
    try {
        const auth = getAdminAuth();
        const decoded = await auth.verifyIdToken(token);
        userId = decoded.uid;
    } catch (error) {
        console.error('[Reports API] Failed to authorize', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const subscription = await getUserSubscription(userId);
        const isPro = subscription?.tier === 'pro' && subscription?.status === 'active';

        if (!isPro) {
            return NextResponse.json({ attempts: [], isPro: false });
        }

        const db = getAdminDb();
        const quizDoc = await db.collection('quizzes').doc(quizId).get();
        if (!quizDoc.exists) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        const quizData = quizDoc.data();
        if (!quizData || quizData.ownerId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const attemptsSnapshot = await db
            .collection('quiz_attempts')
            .where('quizId', '==', quizId)
            .orderBy('startedAt', 'desc')
            .get();

        const attempts = attemptsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                quizId: data.quizId,
                userId: data.userId ?? null,
                startedAt: toMillis(data.startedAt),
                completedAt: toMillisOrUndefined(data.completedAt),
                lastUpdatedAt: toMillis(data.lastUpdatedAt),
                currentQuestionId: data.currentQuestionId,
                answers: data.answers || {},
                // Include fieldResponses for data collection
                fieldResponses: data.fieldResponses || undefined,
                // Legacy lead object for backward compatibility
                lead: data.lead
                    ? {
                        name: data.lead.name,
                        email: data.lead.email,
                        phone: data.lead.phone,
                    }
                    : undefined,
                resultOutcomeId: data.resultOutcomeId,
                status: data.status || 'started',
                ctaClickedAt: toMillisOrUndefined(data.ctaClickedAt),
                isOwnerAttempt: data.isOwnerAttempt || false,
            };
        });

        return NextResponse.json({ attempts, isPro: true });
    } catch (error) {
        console.error('[Reports API] Failed to load reports', error);
        return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
    }
}
