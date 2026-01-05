import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, getTierFromPriceId } from '@/lib/stripe';
import { getAdminDb, updateUserSubscription, UserSubscription } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

type SyncRequest = {
    userId?: string;
    sessionId?: string;
};

const mapStatus = (status: Stripe.Subscription.Status): UserSubscription['status'] => {
    switch (status) {
        case 'active':
            return 'active';
        case 'trialing':
            return 'trialing';
        case 'past_due':
            return 'past_due';
        case 'canceled':
            return 'canceled';
        default:
            return 'past_due';
    }
};

const pickSubscription = (subscriptions: Stripe.Subscription[]): Stripe.Subscription | null => {
    if (subscriptions.length === 0) return null;

    const preferred = subscriptions.find((subscription) =>
        ['active', 'trialing', 'past_due'].includes(subscription.status)
    );

    return preferred || subscriptions[0];
};

export async function POST(request: NextRequest) {
    let body: SyncRequest = {};

    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userId, sessionId } = body;

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const stripe = getStripe();
    let customerId: string | undefined;
    let subscription: Stripe.Subscription | null = null;

    if (sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription', 'customer'],
        });

        if (session.customer) {
            customerId = typeof session.customer === 'string'
                ? session.customer
                : session.customer.id;
        }

        if (session.subscription) {
            subscription = typeof session.subscription === 'string'
                ? await stripe.subscriptions.retrieve(session.subscription)
                : session.subscription;
        }
    }

    if (!subscription) {
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).get();
        const storedCustomerId = userDoc.data()?.subscription?.stripeCustomerId as string | undefined;

        customerId = customerId || storedCustomerId;

        if (!customerId) {
            return NextResponse.json({ error: 'Missing stripeCustomerId' }, { status: 404 });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 5,
        });

        subscription = pickSubscription(subscriptions.data);
    }

    if (!subscription) {
        return NextResponse.json({ error: 'No subscription found for customer' }, { status: 404 });
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
    const subscriptionCustomer = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

    await updateUserSubscription(userId, {
        tier: getTierFromPriceId(priceId || ''),
        status: mapStatus(subscription.status),
        stripeCustomerId: customerId || subscriptionCustomer,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        currentPeriodEnd: periodEnd ? periodEnd * 1000 : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    return NextResponse.json({
        updated: true,
        tier: getTierFromPriceId(priceId || ''),
        status: subscription.status,
    });
}
