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
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson) {
        console.error('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    // Try to decode base64 if it doesn't look like JSON (starts with {)
    if (!serviceAccountJson.trim().startsWith('{')) {
        try {
            const buffer = Buffer.from(serviceAccountJson, 'base64');
            serviceAccountJson = buffer.toString('utf-8');
            console.log('[Firebase Admin] Detected Base64 key, decoded successfully');
        } catch (e) {
            console.warn('[Firebase Admin] Failed to decode potential Base64 key', e);
        }
    }

    console.log('[Firebase Admin] Key length:', serviceAccountJson.length);
    console.log('[Firebase Admin] First 20 chars:', serviceAccountJson.substring(0, 20));

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);

        if (!serviceAccount.project_id) {
        }

        console.log('[Firebase Admin] Parsed project_id:', serviceAccount.project_id);

        adminApp = initializeApp({
            credential: cert(serviceAccount),
        });

        console.log('[Firebase Admin] Successfully initialized');
        return adminApp;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[Firebase Admin] Parse/init error:', errorMsg);
        throw new Error(`Failed to initialize Firebase Admin: ${errorMsg}. Key length: ${serviceAccountJson.length}`);
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
