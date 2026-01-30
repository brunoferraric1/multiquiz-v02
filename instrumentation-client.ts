import posthog from 'posthog-js';

// Initialize PostHog client-side analytics
// This file is automatically loaded by Next.js 15.3+ for client-side instrumentation
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  // Use recommended defaults for 2025+
  defaults: '2025-11-30',
  // Enable automatic exception capture
  capture_exceptions: true,
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
});
