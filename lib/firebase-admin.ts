import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

const parseServiceAccount = (raw: string): ServiceAccount => {
    let current = raw;
    const seen = new Set<string>();

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const trimmed = current.trim();
        if (!trimmed || seen.has(trimmed)) break;
        seen.add(trimmed);

        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') {
                current = parsed;
                continue;
            }
            return parsed as ServiceAccount;
        } catch {
            // Continue with other parsing strategies.
        }

        if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
            current = trimmed.slice(1, -1);
            continue;
        }

        current = Buffer.from(trimmed, 'base64').toString('utf-8');
    }

    throw new Error('Failed to parse Firebase service account JSON');
};

export function getAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    const parseAndInit = (raw: string): App => {
        const serviceAccount = parseServiceAccount(raw);

        const projectId = (serviceAccount as ServiceAccount).projectId
            ?? (serviceAccount as { project_id?: string }).project_id;
        console.log('[Firebase Admin] Parsed project_id:', projectId);

        adminApp = initializeApp({
            credential: cert(serviceAccount),
        });

        console.log('[Firebase Admin] Successfully initialized');
        return adminApp;
    };

    const existingApps = getApps();
    if (existingApps.length > 0) {
        adminApp = existingApps[0];
        console.log('[Firebase Admin] Reusing existing app', {
            name: adminApp.name,
            projectId: adminApp.options?.projectId,
        });
        return adminApp;
    }

    // Parse service account from environment variable
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson) {
        serviceAccountJson = process.env.STAGING_FIREBASE_SERVICE_ACCOUNT_KEY;
    }

    if (!serviceAccountJson) {
        console.error('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    console.log('[Firebase Admin] Key length:', serviceAccountJson.length);
    console.log('[Firebase Admin] First 20 chars:', serviceAccountJson.substring(0, 20));

    try {
        return parseAndInit(serviceAccountJson);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[Firebase Admin] Parse/init error:', errorMsg);
        throw new Error(
            'Failed to initialize Firebase Admin: ' +
            `${errorMsg}. ` +
            'Ensure FIREBASE_SERVICE_ACCOUNT_KEY or STAGING_FIREBASE_SERVICE_ACCOUNT_KEY is set.'
        );
    }
}

export function getAdminDb(): Firestore {
    if (adminDb) {
        return adminDb;
    }

    const app = getAdminApp();
    adminDb = getFirestore(app);
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
    const cleaned = Object.fromEntries(
        Object.entries(subscription).filter(([, value]) => (
            value !== undefined && !(typeof value === 'number' && Number.isNaN(value))
        ))
    ) as Partial<UserSubscription>;

    if (Object.keys(cleaned).length === 0) {
        return;
    }

    await db.collection('users').doc(userId).set(
        { subscription: cleaned },
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
