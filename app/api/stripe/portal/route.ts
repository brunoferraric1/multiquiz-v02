import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const resolveBaseUrl = (request: NextRequest) => {
    const origin = request.headers.get('origin');
    if (origin) return origin;

    const referer = request.headers.get('referer');
    if (referer) {
        try {
            return new URL(referer).origin;
        } catch {
            // Fall through to env/default if referer is malformed.
        }
    }

    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500';
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId' },
                { status: 400 }
            );
        }

        // Get user's Stripe customer ID from Firestore
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const stripeCustomerId = userData?.subscription?.stripeCustomerId;

        if (!stripeCustomerId) {
            return NextResponse.json(
                { error: 'No subscription found for this user' },
                { status: 400 }
            );
        }

        const stripe = getStripe();
        const baseUrl = resolveBaseUrl(request);

        // Create customer portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${baseUrl}/dashboard`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        return NextResponse.json(
            { error: 'Failed to create portal session' },
            { status: 500 }
        );
    }
}
