'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Load Stripe.js client-side.
 * Uses the NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.
 */
export function getStripeClient(): Promise<Stripe | null> {
    if (!stripePromise) {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
            console.error('[Stripe Client] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
            return Promise.resolve(null);
        }
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
}

/**
 * Price IDs for client-side checkout.
 * These are public and safe to expose.
 */
export const STRIPE_CLIENT_PRICES = {
    pro: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
    },
} as const;

/**
 * Redirect to Stripe Checkout (client-side).
 * This bypasses the need for server-side API calls entirely.
 */
export async function redirectToStripeCheckout(options: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    clientReferenceId?: string;
}): Promise<{ error?: string }> {
    try {
        const stripe = await getStripeClient();

        if (!stripe) {
            return { error: 'Failed to load Stripe' };
        }

        // Cast to any because TS might complain about redirectToCheckout on the Stripe type
        // dependent on version, but it exists at runtime.
        const { error } = await (stripe as any).redirectToCheckout({
            lineItems: [{ price: options.priceId, quantity: 1 }],
            mode: 'subscription',
            successUrl: options.successUrl,
            cancelUrl: options.cancelUrl,
            customerEmail: options.customerEmail,
            clientReferenceId: options.clientReferenceId,
        });

        if (error) {
            console.error('[Stripe Client] Checkout error:', error.message);
            return { error: error.message };
        }

        return {};
    } catch (err) {
        console.error('[Stripe Client] Unexpected error:', err);
        return { error: 'Unexpected error during checkout' };
    }
}
