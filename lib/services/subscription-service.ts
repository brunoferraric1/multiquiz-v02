'use client';

import { useState, useEffect, useRef } from 'react';
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

const SUBSCRIPTION_CACHE_PREFIX = 'mq:subscription:';
const SUBSCRIPTION_CACHE_TTL_MS = 1000 * 60 * 30;
const NON_PRO_HOLD_WITH_PRO_MS = 4000;
const NON_PRO_HOLD_DEFAULT_MS = 800;

const readCachedSubscription = (userId: string): UserSubscription | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { subscription?: UserSubscription; updatedAt?: number };
        if (!parsed?.subscription || typeof parsed.updatedAt !== 'number') return null;
        if (Date.now() - parsed.updatedAt > SUBSCRIPTION_CACHE_TTL_MS) return null;
        if (!isPro(parsed.subscription)) return null;
        return parsed.subscription;
    } catch {
        return null;
    }
};

const writeCachedSubscription = (userId: string, subscription: UserSubscription) => {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(
            `${SUBSCRIPTION_CACHE_PREFIX}${userId}`,
            JSON.stringify({ subscription, updatedAt: Date.now() })
        );
    } catch {
        // Ignore storage failures (private mode, quota, etc).
    }
};

const clearCachedSubscription = (userId: string) => {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`);
    } catch {
        // Ignore storage failures (private mode, quota, etc).
    }
};

// Hook to get and subscribe to user's subscription status
export function useSubscription(userId: string | undefined) {
    const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUBSCRIPTION);
    const [isLoadingInternal, setIsLoadingInternal] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadedUserId, setLoadedUserId] = useState<string | undefined>(undefined);
    const pendingDowngradeRef = useRef<UserSubscription | null>(null);
    const downgradeTimerRef = useRef<number | null>(null);
    const hadProRef = useRef(false);
    const syncAttemptRef = useRef<string | null>(null);

    useEffect(() => {
        if (!userId || typeof window === 'undefined' || !db) {
            setSubscription(DEFAULT_SUBSCRIPTION);
            setIsLoadingInternal(false);
            setLoadedUserId(undefined);
            pendingDowngradeRef.current = null;
            if (downgradeTimerRef.current) {
                window.clearTimeout(downgradeTimerRef.current);
                downgradeTimerRef.current = null;
            }
            hadProRef.current = false;
            return;
        }

        setError(null);
        pendingDowngradeRef.current = null;
        if (downgradeTimerRef.current) {
            window.clearTimeout(downgradeTimerRef.current);
            downgradeTimerRef.current = null;
        }
        hadProRef.current = false;
        syncAttemptRef.current = null;

        const cachedPro = readCachedSubscription(userId);
        if (cachedPro) {
            setSubscription(cachedPro);
            setLoadedUserId(userId);
            setIsLoadingInternal(false);
            hadProRef.current = true;
        } else {
            setIsLoadingInternal(true);
        }

        const userRef = doc(db, 'users', userId);

        const unsubscribe = onSnapshot(
            userRef,
            { includeMetadataChanges: true },
            (snapshot) => {
                if (snapshot.metadata.fromCache) {
                    if (!snapshot.exists()) return;
                    const cached = snapshot.data()?.subscription || DEFAULT_SUBSCRIPTION;
                    if (isPro(cached)) {
                        setSubscription(cached);
                        setLoadedUserId(userId);
                        setIsLoadingInternal(false);
                        hadProRef.current = true;
                    }
                    return;
                }

                let nextSubscription = DEFAULT_SUBSCRIPTION;
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    nextSubscription = data?.subscription || DEFAULT_SUBSCRIPTION;
                }

                if (isPro(nextSubscription)) {
                    if (downgradeTimerRef.current) {
                        window.clearTimeout(downgradeTimerRef.current);
                        downgradeTimerRef.current = null;
                    }
                    pendingDowngradeRef.current = null;
                    setSubscription(nextSubscription);
                    setLoadedUserId(userId);
                    setIsLoadingInternal(false);
                    hadProRef.current = true;
                    writeCachedSubscription(userId, nextSubscription);
                    return;
                }

                const holdMs = hadProRef.current ? NON_PRO_HOLD_WITH_PRO_MS : NON_PRO_HOLD_DEFAULT_MS;
                pendingDowngradeRef.current = nextSubscription;
                // Only set loading on initial load, not on subsequent document updates
                // This prevents re-render loops when other code updates the user document
                if (!hadProRef.current && loadedUserId !== userId) {
                    setIsLoadingInternal(true);
                }

                if (hadProRef.current && syncAttemptRef.current !== userId) {
                    syncAttemptRef.current = userId;
                    void fetch('/api/stripe/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId }),
                    }).catch((syncError) => {
                        console.warn('[useSubscription] Sync failed', syncError);
                    });
                }

                if (!downgradeTimerRef.current) {
                    downgradeTimerRef.current = window.setTimeout(() => {
                        const pending = pendingDowngradeRef.current;
                        pendingDowngradeRef.current = null;
                        downgradeTimerRef.current = null;
                        if (!pending) return;
                        setSubscription(pending);
                        setLoadedUserId(userId);
                        setIsLoadingInternal(false);
                        hadProRef.current = false;
                        clearCachedSubscription(userId);
                    }, holdMs);
                }
            },
            (err) => {
                console.error('Error fetching subscription:', err);
                setError('Failed to load subscription');
                setLoadedUserId(userId);
                setIsLoadingInternal(false);
            }
        );

        return () => {
            if (downgradeTimerRef.current) {
                window.clearTimeout(downgradeTimerRef.current);
                downgradeTimerRef.current = null;
            }
            pendingDowngradeRef.current = null;
            unsubscribe();
        };
    }, [userId]);

    const isLoading = Boolean(userId) && userId !== loadedUserId ? true : isLoadingInternal;
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

// Check if user is on Plus tier
export function isPlus(subscription: UserSubscription | undefined): boolean {
    return subscription?.tier === 'plus' && subscription?.status === 'active';
}

// Check if user is on a paid tier (Plus or Pro)
export function isPaidTier(subscription: UserSubscription | undefined): boolean {
    return (subscription?.tier === 'plus' || subscription?.tier === 'pro') && subscription?.status === 'active';
}

// Check if user has access to external URLs
export function hasExternalUrlAccess(subscription: UserSubscription | undefined): boolean {
    const tier = subscription?.tier || 'free';
    return TIER_LIMITS[tier].hasExternalUrls;
}

// Check if user has access to CRM integration
export function hasCrmAccess(subscription: UserSubscription | undefined): boolean {
    const tier = subscription?.tier || 'free';
    return TIER_LIMITS[tier].hasCrmIntegration;
}

// Get leads limit for the tier
export function getLeadsLimit(subscription: UserSubscription | undefined): number {
    const tier = subscription?.tier || 'free';
    return TIER_LIMITS[tier].leadsLimit;
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

// AI functions removed - AI features not included in initial launch

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
    billingPeriod: 'monthly' | 'yearly' = 'monthly',
    tier: 'plus' | 'pro' = 'plus'
): Promise<string | null> {
    try {
        const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userEmail, billingPeriod, tier }),
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
