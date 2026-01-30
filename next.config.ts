import type { NextConfig } from "next";

const withStaging = (primary?: string, staging?: string) =>
  staging || primary;

const nextConfig: NextConfig = {
  // Empty turbopack config allows both Turbopack (dev) and webpack (prod) to coexist
  turbopack: {},
  // Firebase Hosting doesn't support Next.js image optimization API
  images: {
    unoptimized: true,
  },
  // Required for PostHog reverse proxy
  skipTrailingSlashRedirect: true,
  // PostHog reverse proxy rewrites to avoid ad blockers
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
  serverExternalPackages: [
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/auth',
    'firebase-admin/firestore',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure firebase-admin is not bundled
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        'firebase-admin/app': 'commonjs firebase-admin/app',
        'firebase-admin/auth': 'commonjs firebase-admin/auth',
        'firebase-admin/firestore': 'commonjs firebase-admin/firestore',
      });
    }
    return config;
  },
  env: {
    // Firebase (client)
    NEXT_PUBLIC_FIREBASE_API_KEY: withStaging(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      process.env.STAGING_NEXT_PUBLIC_FIREBASE_API_KEY,
    ),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: withStaging(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      process.env.STAGING_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    ),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: withStaging(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      process.env.STAGING_NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: withStaging(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      process.env.STAGING_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    ),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: withStaging(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      process.env.STAGING_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    ),
    NEXT_PUBLIC_FIREBASE_APP_ID: withStaging(
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      process.env.STAGING_NEXT_PUBLIC_FIREBASE_APP_ID,
    ),
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: withStaging(
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      process.env.STAGING_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    ),

    // Firebase Admin (server)
    FIREBASE_SERVICE_ACCOUNT_KEY: withStaging(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      process.env.STAGING_FIREBASE_SERVICE_ACCOUNT_KEY,
    ),

    // Stripe (server)
    STRIPE_SECRET_KEY: withStaging(
      process.env.STRIPE_SECRET_KEY,
      process.env.STAGING_STRIPE_SECRET_KEY,
    ),
    STRIPE_WEBHOOK_SECRET: withStaging(
      process.env.STRIPE_WEBHOOK_SECRET,
      process.env.STAGING_STRIPE_WEBHOOK_SECRET,
    ),
    STRIPE_PRICE_PRO_MONTHLY: withStaging(
      process.env.STRIPE_PRICE_PRO_MONTHLY,
      process.env.STAGING_STRIPE_PRICE_PRO_MONTHLY,
    ),
    STRIPE_PRICE_PRO_YEARLY: withStaging(
      process.env.STRIPE_PRICE_PRO_YEARLY,
      process.env.STAGING_STRIPE_PRICE_PRO_YEARLY,
    ),

    // Stripe (client)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: withStaging(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      process.env.STAGING_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    ),
    NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: withStaging(
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO_MONTHLY,
      process.env.STAGING_STRIPE_PRICE_PRO_MONTHLY,
    ),
    NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: withStaging(
      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || process.env.STRIPE_PRICE_PRO_YEARLY,
      process.env.STAGING_STRIPE_PRICE_PRO_YEARLY,
    ),

    // App URL and other public vars
    NEXT_PUBLIC_APP_URL: withStaging(
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.STAGING_NEXT_PUBLIC_APP_URL,
    ),
    NEXT_PUBLIC_AI_MODEL: withStaging(
      process.env.NEXT_PUBLIC_AI_MODEL,
      process.env.STAGING_NEXT_PUBLIC_AI_MODEL,
    ),
    NEXT_PUBLIC_AI_EXTRACTION_MODEL: withStaging(
      process.env.NEXT_PUBLIC_AI_EXTRACTION_MODEL,
      process.env.STAGING_NEXT_PUBLIC_AI_EXTRACTION_MODEL,
    ),
  },
};

export default nextConfig;
