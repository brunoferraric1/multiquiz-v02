import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

/**
 * Get a singleton PostHog client for server-side event tracking
 * Uses flushAt: 1 and flushInterval: 0 to ensure events are sent immediately
 * since Next.js server functions can be short-lived
 */
export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      }
    );

    if (process.env.NODE_ENV === 'development') {
      posthogClient.debug(true);
    }
  }
  return posthogClient;
}

/**
 * Shutdown the PostHog client (call this when your server is shutting down)
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
