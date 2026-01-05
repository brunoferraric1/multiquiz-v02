import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';
import { getAdminApp, getAdminDb } from '@/lib/firebase-admin';

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
    console.log('[Checkout] Starting checkout session creation');

    let step = 'init';

    try {
        step = 'parse_body';
        const body = await request.json();
        const { userId, userEmail, priceId, billingPeriod = 'monthly' } = body;

        console.log('[Checkout] Request body:', { userId, userEmail, billingPeriod });

        if (!userId || !userEmail) {
            console.error('[Checkout] Missing userId or userEmail');
            return NextResponse.json(
                { error: 'Missing userId or userEmail', step },
                { status: 400 }
            );
        }

        step = 'get_price';
        // Get price ID from billing period if not provided
        const selectedPriceId = priceId || (
            billingPeriod === 'yearly'
                ? STRIPE_PRICES.pro.yearly
                : STRIPE_PRICES.pro.monthly
        );

        console.log('[Checkout] Selected price ID:', selectedPriceId);

        if (!selectedPriceId) {
            console.error('[Checkout] Invalid price configuration - no price ID');
            return NextResponse.json(
                { error: 'Invalid price configuration. STRIPE_PRICE_PRO_MONTHLY not set.', step },
                { status: 400 }
            );
        }

        step = 'init_stripe';
        console.log('[Checkout] Initializing Stripe...');
        const stripe = getStripe();

        step = 'init_firestore';
        console.log('[Checkout] Getting Firestore...');
        const adminApp = getAdminApp();
        console.log('[Checkout] Firebase admin app', {
            name: adminApp.name,
            projectId: adminApp.options?.projectId,
        });
        const db = getAdminDb();

        step = 'fetch_user';
        console.log('[Checkout] Fetching user document...');
        let userDoc;
        try {
            userDoc = await db.collection('users').doc(userId).get();
        } catch (error) {
            const err = error as { code?: string; details?: string; message?: string };
            console.error('[Checkout] Firestore fetch error', {
                code: err.code,
                details: err.details,
                message: err.message,
            });
            throw error;
        }
        const userData = userDoc.data();
        console.log('[Checkout] User doc fetched', { exists: userDoc.exists });
        let stripeCustomerId = userData?.subscription?.stripeCustomerId;

        console.log('[Checkout] Existing customer ID:', stripeCustomerId);

        if (stripeCustomerId) {
            try {
                const customer = await stripe.customers.retrieve(stripeCustomerId);
                if ('deleted' in customer && customer.deleted) {
                    console.warn('[Checkout] Stripe customer deleted, recreating');
                    stripeCustomerId = undefined;
                }
            } catch (error) {
                console.warn('[Checkout] Stored Stripe customer invalid, recreating', {
                    stripeCustomerId,
                });
                stripeCustomerId = undefined;
            }
        }

        // Create Stripe customer if doesn't exist or is invalid
        if (!stripeCustomerId) {
            step = 'create_customer';
            console.log('[Checkout] Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    firebaseUserId: userId,
                },
            });
            stripeCustomerId = customer.id;
            console.log('[Checkout] Created customer:', stripeCustomerId);

            step = 'save_customer';
            // Save customer ID to Firestore
            await db.collection('users').doc(userId).set(
                { subscription: { stripeCustomerId } },
                { merge: true }
            );
            console.log('[Checkout] Saved customer ID to Firestore');
        }

        step = 'create_session';
        console.log('[Checkout] Creating checkout session...');
        const baseUrl = resolveBaseUrl(request);
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: selectedPriceId,
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
            metadata: {
                firebaseUserId: userId,
            },
            subscription_data: {
                metadata: {
                    firebaseUserId: userId,
                },
            },
            allow_promotion_codes: true,
        });

        console.log('[Checkout] Session created:', session.id, 'URL:', session.url);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[Checkout] Error at step', step, ':', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed at step: ${step}. ${errorMessage}` },
            { status: 500 }
        );
    }
}
