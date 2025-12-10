import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    console.log('[Checkout] Starting checkout session creation');

    try {
        const body = await request.json();
        const { userId, userEmail, priceId, billingPeriod = 'monthly' } = body;

        console.log('[Checkout] Request body:', { userId, userEmail, billingPeriod });

        if (!userId || !userEmail) {
            console.error('[Checkout] Missing userId or userEmail');
            return NextResponse.json(
                { error: 'Missing userId or userEmail' },
                { status: 400 }
            );
        }

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
                { error: 'Invalid price configuration. Please set STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_PRO_YEARLY environment variables.' },
                { status: 400 }
            );
        }

        console.log('[Checkout] Initializing Stripe...');
        const stripe = getStripe();

        console.log('[Checkout] Getting Firestore...');
        const db = getAdminDb();

        console.log('[Checkout] Fetching user document...');
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        let stripeCustomerId = userData?.subscription?.stripeCustomerId;

        console.log('[Checkout] Existing customer ID:', stripeCustomerId);

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
            console.log('[Checkout] Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    firebaseUserId: userId,
                },
            });
            stripeCustomerId = customer.id;
            console.log('[Checkout] Created customer:', stripeCustomerId);

            // Save customer ID to Firestore
            await db.collection('users').doc(userId).set(
                { subscription: { stripeCustomerId } },
                { merge: true }
            );
            console.log('[Checkout] Saved customer ID to Firestore');
        }

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
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'}/pricing?checkout=canceled`,
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
        console.error('[Checkout] Error creating checkout session:', error);
        return NextResponse.json(
            { error: `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
