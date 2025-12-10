import { NextResponse } from 'next/server';

// This endpoint helps diagnose environment variable issues in production
// Remove after debugging is complete
export async function GET() {
    const diagnostics: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        env: {
            FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                ? `SET (length: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length}, starts with: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 10)}...)`
                : 'NOT SET',
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
                ? `SET (starts with: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...)`
                : 'NOT SET',
            STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY
                ? `SET (${process.env.STRIPE_PRICE_PRO_MONTHLY})`
                : 'NOT SET',
            STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY
                ? `SET (${process.env.STRIPE_PRICE_PRO_YEARLY})`
                : 'NOT SET',
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
        },
        base64DecodeTest: null as string | null,
        jsonParseTest: null as string | null,
        firebaseInitTest: null as string | null,
    };

    // Test 1: Base64 decode
    try {
        let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
        if (!key.trim().startsWith('{')) {
            const decoded = Buffer.from(key, 'base64').toString('utf-8');
            diagnostics.base64DecodeTest = `SUCCESS (decoded length: ${decoded.length}, starts with: ${decoded.substring(0, 20)}...)`;
            key = decoded;
        } else {
            diagnostics.base64DecodeTest = 'SKIPPED (already JSON)';
        }

        // Test 2: JSON parse
        try {
            const parsed = JSON.parse(key);
            diagnostics.jsonParseTest = `SUCCESS (project_id: ${parsed.project_id || 'MISSING'})`;
        } catch (e) {
            diagnostics.jsonParseTest = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
        }
    } catch (e) {
        diagnostics.base64DecodeTest = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test 3: Firebase Admin initialization
    try {
        const { getAdminDb } = await import('@/lib/firebase-admin');
        const db = getAdminDb();
        diagnostics.firebaseInitTest = `SUCCESS (db type: ${typeof db})`;
    } catch (e) {
        diagnostics.firebaseInitTest = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
    }

    return NextResponse.json(diagnostics);
}
