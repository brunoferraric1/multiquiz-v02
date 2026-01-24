/**
 * Firebase Admin SDK - using eval('require') to completely bypass Turbopack bundling.
 *
 * Turbopack mangles external package names even when using require().
 * We use eval() and avoid ALL string literals that reference the package.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Define types locally to avoid importing from the package
interface FirebaseApp {
    name: string;
    options?: { projectId?: string };
}

interface DocumentData {
    [field: string]: any;
}

interface DocumentSnapshot<T = DocumentData> {
    id: string;
    exists: boolean;
    data: () => T | undefined;
}

interface QueryDocumentSnapshot<T = DocumentData> {
    id: string;
    data: () => T;
}

interface QuerySnapshot<T = DocumentData> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
}

interface DocumentReference<T = DocumentData> {
    get: () => Promise<DocumentSnapshot<T>>;
    set: (data: Partial<T>, options?: { merge?: boolean }) => Promise<any>;
}

interface Query<T = DocumentData> {
    where: (field: string, op: string, value: any) => Query<T>;
    orderBy: (field: string, direction?: 'asc' | 'desc') => Query<T>;
    limit: (n: number) => Query<T>;
    get: () => Promise<QuerySnapshot<T>>;
}

interface CollectionReference<T = DocumentData> extends Query<T> {
    doc: (id: string) => DocumentReference<T>;
}

interface FirebaseFirestore {
    collection: (path: string) => CollectionReference;
}

interface FirebaseAuth {
    verifyIdToken: (token: string) => Promise<{ uid: string }>;
}

interface FirebaseServiceAccount {
    projectId?: string;
    project_id?: string;
    clientEmail?: string;
    privateKey?: string;
}

let adminApp: FirebaseApp | undefined;
let adminDb: FirebaseFirestore | undefined;
let adminAuth: FirebaseAuth | undefined;

// Build package names at runtime to completely hide from static analysis
const PKG_BASE = ['fire', 'base', '-', 'admin'].join('');
const PKG_APP = PKG_BASE + '/app';
const PKG_FIRESTORE = PKG_BASE + '/firestore';
const PKG_AUTH = PKG_BASE + '/auth';

// Use eval to hide require from bundler
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
const dynamicRequire = eval('require') as NodeRequire;

// Lazy-load modules
function getFirebaseAdmin() {
    const adminAppModule = dynamicRequire(PKG_APP);
    const adminFirestore = dynamicRequire(PKG_FIRESTORE);
    const adminAuthModule = dynamicRequire(PKG_AUTH);
    return {
        initializeApp: adminAppModule.initializeApp as (config: any) => FirebaseApp,
        getApps: adminAppModule.getApps as () => FirebaseApp[],
        cert: adminAppModule.cert as (account: FirebaseServiceAccount) => any,
        getFirestore: adminFirestore.getFirestore as (app: FirebaseApp) => FirebaseFirestore,
        getAuth: adminAuthModule.getAuth as (app: FirebaseApp) => FirebaseAuth,
    };
}

const parseServiceAccount = (raw: string): FirebaseServiceAccount => {
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
            return parsed as FirebaseServiceAccount;
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

export function getAdminApp(): FirebaseApp {
    if (adminApp) {
        return adminApp;
    }

    const { initializeApp, getApps, cert } = getFirebaseAdmin();

    const existingApps = getApps();
    if (existingApps.length > 0) {
        adminApp = existingApps[0];
        console.log('[Firebase Admin] Reusing existing app', {
            name: adminApp.name,
            projectId: adminApp.options?.projectId,
        });
        return adminApp;
    }

    // Check if running on Google Cloud (Cloud Run, Cloud Functions, etc.)
    // In this case, use Application Default Credentials (ADC) - no key needed!
    const isOnGoogleCloud = !!(process.env.K_SERVICE || process.env.FUNCTION_TARGET);
    const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

    if (isOnGoogleCloud && projectId) {
        console.log('[Firebase Admin] Running on Google Cloud, using ADC');
        console.log('[Firebase Admin] Project ID:', projectId);

        // Initialize without credentials - ADC will be used automatically
        adminApp = initializeApp({
            projectId,
        });

        console.log('[Firebase Admin] Successfully initialized with ADC');
        return adminApp;
    }

    // For local development or other platforms, use service account key
    const isStaging = process.env.GCLOUD_PROJECT?.includes('staging')
        || process.env.FIREBASE_CONFIG?.includes('staging')
        || process.env.VERCEL_ENV === 'preview';

    let serviceAccountJson: string | undefined;

    if (isStaging) {
        serviceAccountJson = process.env.STAGING_FIREBASE_SERVICE_ACCOUNT_KEY
            || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        console.log('[Firebase Admin] Staging environment detected');
    } else {
        serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            || process.env.STAGING_FIREBASE_SERVICE_ACCOUNT_KEY;
    }

    if (!serviceAccountJson) {
        console.error('[Firebase Admin] No service account key found');
        console.error('[Firebase Admin] GCLOUD_PROJECT:', process.env.GCLOUD_PROJECT);
        console.error('[Firebase Admin] K_SERVICE:', process.env.K_SERVICE);
        console.error('[Firebase Admin] FUNCTION_TARGET:', process.env.FUNCTION_TARGET);
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const serviceAccount = parseServiceAccount(serviceAccountJson);
    const parsedProjectId = serviceAccount.projectId ?? serviceAccount.project_id;
    console.log('[Firebase Admin] Parsed project_id:', parsedProjectId);

    adminApp = initializeApp({
        credential: cert(serviceAccount),
    });

    console.log('[Firebase Admin] Successfully initialized with service account');
    return adminApp;
}

export function getAdminDb(): FirebaseFirestore {
    if (adminDb) {
        return adminDb;
    }

    const { getFirestore } = getFirebaseAdmin();
    const app = getAdminApp();
    adminDb = getFirestore(app);
    return adminDb;
}

export function getAdminAuth(): FirebaseAuth {
    if (adminAuth) {
        return adminAuth;
    }

    const { getAuth } = getFirebaseAdmin();
    const app = getAdminApp();
    adminAuth = getAuth(app);
    return adminAuth;
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
