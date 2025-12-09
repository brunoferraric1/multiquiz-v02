import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, userEmail, priceId, billingPeriod = 'monthly' } = body;

        if (!userId || !userEmail) {
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

        if (!selectedPriceId) {
            return NextResponse.json(
                { error: 'Invalid price configuration' },
                { status: 400 }
            );
        }

        const stripe = getStripe();

        // Check if user already has a Stripe customer ID
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        let stripeCustomerId = userData?.subscription?.stripeCustomerId;

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    firebaseUserId: userId,
                },
            });
            stripeCustomerId = customer.id;

            // Save customer ID to Firestore
            await db.collection('users').doc(userId).set(
                { subscription: { stripeCustomerId } },
                { merge: true }
            );
        }

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

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
