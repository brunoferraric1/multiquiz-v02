import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

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
        const db = getAdminDb();

        step = 'fetch_user';
        console.log('[Checkout] Fetching user document...');
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        let stripeCustomerId = userData?.subscription?.stripeCustomerId;

        console.log('[Checkout] Existing customer ID:', stripeCustomerId);

        // Create Stripe customer if doesn't exist
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
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'}/dashboard?checkout=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'}/dashboard?checkout=canceled`,
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
