import Stripe from 'stripe';

// Lazy initialization for Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeInstance) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        stripeInstance = new Stripe(secretKey, {
            typescript: true,
        });
    }
    return stripeInstance;
}

// Re-export for convenience (but use getStripe() in API routes)
export const stripe = {
    get instance() {
        return getStripe();
    },
    webhooks: {
        constructEvent: (payload: string, signature: string, secret: string) => {
            return getStripe().webhooks.constructEvent(payload, signature, secret);
        },
    },
    customers: {
        create: (...args: Parameters<Stripe['customers']['create']>) => {
            return getStripe().customers.create(...args);
        },
    },
    checkout: {
        sessions: {
            create: (...args: Parameters<Stripe['checkout']['sessions']['create']>) => {
                return getStripe().checkout.sessions.create(...args);
            },
        },
    },
    subscriptions: {
        retrieve: (...args: Parameters<Stripe['subscriptions']['retrieve']>) => {
            return getStripe().subscriptions.retrieve(...args);
        },
    },
    billingPortal: {
        sessions: {
            create: (...args: Parameters<Stripe['billingPortal']['sessions']['create']>) => {
                return getStripe().billingPortal.sessions.create(...args);
            },
        },
    },
};

// Subscription tier types
export type SubscriptionTier = 'free' | 'pro';

// Tier limits configuration
export const TIER_LIMITS = {
    free: {
        publishedQuizzes: 1,
        aiMessagesPerMonth: 20,
        draftLimit: 3,
        hasReports: false,
        hasLeadsPage: false,
        hasBranding: true, // Shows "Powered by MultiQuiz"
    },
    pro: {
        publishedQuizzes: Infinity,
        aiMessagesPerMonth: Infinity,
        draftLimit: Infinity,
        hasReports: true,
        hasLeadsPage: true,
        hasBranding: false, // No branding badge
    },
} as const;

// Price IDs from environment (accessed lazily)
export const STRIPE_PRICES = {
    pro: {
        get monthly() {
            return process.env.STRIPE_PRICE_PRO_MONTHLY || '';
        },
        get yearly() {
            return process.env.STRIPE_PRICE_PRO_YEARLY || '';
        },
    },
} as const;

// Get tier from Stripe price ID
export function getTierFromPriceId(priceId: string): SubscriptionTier {
    if (
        priceId === STRIPE_PRICES.pro.monthly ||
        priceId === STRIPE_PRICES.pro.yearly
    ) {
        return 'pro';
    }
    return 'free';
}

// Check if user can access a feature based on tier
export function canAccessFeature(
    tier: SubscriptionTier,
    feature: keyof typeof TIER_LIMITS.free
): boolean {
    const limits = TIER_LIMITS[tier];
    const value = limits[feature];

    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value > 0;
    }
    return false;
}
