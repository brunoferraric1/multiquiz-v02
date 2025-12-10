import { NextResponse } from 'next/server';

// This endpoint helps diagnose environment variable issues in production
// Remove after debugging is complete
export async function GET() {
    const diagnostics = {
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
        }
    };

    return NextResponse.json(diagnostics);
}
