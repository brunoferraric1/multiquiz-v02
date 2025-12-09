import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

function getAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    const existingApps = getApps();
    if (existingApps.length > 0) {
        adminApp = existingApps[0];
        return adminApp;
    }

    // Parse service account from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);

        adminApp = initializeApp({
            credential: cert(serviceAccount),
        });

        return adminApp;
    } catch (error) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error}`);
    }
}

export function getAdminDb(): Firestore {
    if (adminDb) {
        return adminDb;
    }

    getAdminApp();
    adminDb = getFirestore();
    return adminDb;
}

// User subscription data type
export interface UserSubscription {
    tier: 'free' | 'pro';
    status?: 'active' | 'canceled' | 'past_due' | 'trialing';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
    aiMessagesUsed?: number;
    aiMessagesResetAt?: number;
}

// Default subscription for new users
export const DEFAULT_SUBSCRIPTION: UserSubscription = {
    tier: 'free',
    aiMessagesUsed: 0,
};

// Update user subscription in Firestore
export async function updateUserSubscription(
    userId: string,
    subscription: Partial<UserSubscription>
): Promise<void> {
    const db = getAdminDb();

    await db.collection('users').doc(userId).set(
        { subscription },
        { merge: true }
    );
}

// Get user subscription from Firestore
export async function getUserSubscription(
    userId: string
): Promise<UserSubscription> {
    const db = getAdminDb();

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
        return DEFAULT_SUBSCRIPTION;
    }

    const data = userDoc.data();
    return data?.subscription || DEFAULT_SUBSCRIPTION;
}

// Find user by Stripe customer ID
export async function findUserByStripeCustomerId(
    stripeCustomerId: string
): Promise<string | null> {
    const db = getAdminDb();

    const usersSnapshot = await db
        .collection('users')
        .where('subscription.stripeCustomerId', '==', stripeCustomerId)
        .limit(1)
        .get();

    if (usersSnapshot.empty) {
        return null;
    }

    return usersSnapshot.docs[0].id;
}
