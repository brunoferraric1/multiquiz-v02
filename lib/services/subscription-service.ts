'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TIER_LIMITS, SubscriptionTier } from '@/lib/stripe';

// User subscription data type (client-side mirror)
export interface UserSubscription {
    tier: SubscriptionTier;
    status?: 'active' | 'canceled' | 'past_due' | 'trialing';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
    aiMessagesUsed?: number;
    aiMessagesResetAt?: number;
}

const DEFAULT_SUBSCRIPTION: UserSubscription = {
    tier: 'free',
    aiMessagesUsed: 0,
};

// Hook to get and subscribe to user's subscription status
export function useSubscription(userId: string | undefined) {
    const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUBSCRIPTION);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || typeof window === 'undefined' || !db) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const userRef = doc(db, 'users', userId);

        const unsubscribe = onSnapshot(
            userRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setSubscription(data?.subscription || DEFAULT_SUBSCRIPTION);
                } else {
                    setSubscription(DEFAULT_SUBSCRIPTION);
                }
                setIsLoading(false);
            },
            (err) => {
                console.error('Error fetching subscription:', err);
                setError('Failed to load subscription');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    return { subscription, isLoading, error };
}

// Get tier limits for display
export function getTierLimits(tier: SubscriptionTier) {
    return TIER_LIMITS[tier];
}

// Check if user is on Pro tier
export function isPro(subscription: UserSubscription | undefined): boolean {
    return subscription?.tier === 'pro' && subscription?.status === 'active';
}

// Check if user can publish more quizzes
export function canPublishQuiz(
    subscription: UserSubscription | undefined,
    currentPublishedCount: number
): boolean {
    const tier = subscription?.tier || 'free';
    const limit = TIER_LIMITS[tier].publishedQuizzes;
    return currentPublishedCount < limit;
}

// Check if user can use AI (has remaining messages)
export function canUseAI(subscription: UserSubscription | undefined): boolean {
    const tier = subscription?.tier || 'free';
    const limit = TIER_LIMITS[tier].aiMessagesPerMonth;

    if (limit === Infinity) return true;

    const used = subscription?.aiMessagesUsed || 0;
    const resetAt = subscription?.aiMessagesResetAt || 0;

    // Check if we need to reset the counter (new month)
    const now = Date.now();
    if (resetAt && now > resetAt) {
        // Counter should be reset by server, but allow usage
        return true;
    }

    return used < limit;
}

// Get remaining AI messages
export function getRemainingAIMessages(subscription: UserSubscription | undefined): number {
    const tier = subscription?.tier || 'free';
    const limit = TIER_LIMITS[tier].aiMessagesPerMonth;

    if (limit === Infinity) return Infinity;

    const used = subscription?.aiMessagesUsed || 0;
    return Math.max(0, limit - used);
}

// Check if user has access to reports
export function hasReportsAccess(subscription: UserSubscription | undefined): boolean {
    const tier = subscription?.tier || 'free';
    return TIER_LIMITS[tier].hasReports;
}

// Check if user has access to leads page
export function hasLeadsAccess(subscription: UserSubscription | undefined): boolean {
    const tier = subscription?.tier || 'free';
    return TIER_LIMITS[tier].hasLeadsPage;
}

// Create checkout session (server-side generation)
export async function createCheckoutSession(
    userId: string,
    userEmail: string,
    billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<string | null> {
    try {
        const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userEmail, billingPeriod }),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to create checkout session';
            try {
                const errorData = await response.json();
                console.error('[Checkout] Server error:', errorData);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.error('[Checkout] Could not parse error response', e);
                // Try text if json fails
                try {
                    const text = await response.text();
                    console.error('[Checkout] Server error text:', text);
                } catch (t) { /* ignore */ }
            }
            throw new Error(errorMessage);
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return null;
    }
}

// Create customer portal session
export async function createPortalSession(userId: string): Promise<string | null> {
    try {
        const response = await fetch('/api/stripe/portal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to create portal session');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error('Error creating portal session:', error);
        return null;
    }
}
