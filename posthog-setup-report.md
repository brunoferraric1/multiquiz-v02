# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into MultiQuiz. The integration includes client-side tracking via `instrumentation-client.ts` (using Next.js 15.3+ client instrumentation), server-side tracking via `lib/posthog-server.ts`, and a reverse proxy configuration to avoid ad blockers.

## Summary of Changes

1. **Core Infrastructure:**
   - `instrumentation-client.ts` - Client-side PostHog initialization with 2025 defaults
   - `lib/posthog-server.ts` - Server-side PostHog client singleton for API routes
   - `next.config.ts` - Added reverse proxy rewrites for `/ingest/*` routes
   - `.env.local` - Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`

2. **Event Tracking Implementation:**
   - User identification on sign-in with email and name properties
   - Automatic `posthog.reset()` on sign-out to unlink sessions

## Events Implemented

| Event | Description | File |
|-------|-------------|------|
| `user_signed_in` | User signs in successfully via Google OAuth | `app/(auth)/login/page.tsx` |
| `user_signed_out` | User signs out from the application | `lib/hooks/use-auth.ts` |
| `quiz_created` | User creates a new quiz in the visual builder | `app/visual-builder/[id]/page.tsx` |
| `quiz_published` | User publishes a quiz (first publish or update) | `app/visual-builder/[id]/page.tsx`, `components/dashboard/quiz-action-menu.tsx` |
| `quiz_deleted` | User deletes a quiz from dashboard | `components/dashboard/quiz-action-menu.tsx` |
| `quiz_started` | Quiz taker starts a quiz (first step viewed) | `components/quiz/blocks-quiz-player.tsx` |
| `quiz_completed` | Quiz taker completes a quiz and sees result | `components/quiz/blocks-quiz-player.tsx` |
| `lead_captured` | Quiz taker submits lead data (email, phone, name) | `components/quiz/blocks-quiz-player.tsx` |
| `checkout_initiated` | User clicks to subscribe to a paid plan | `app/pricing/page.tsx` |
| `checkout_completed` | Stripe webhook confirms successful subscription | `app/api/stripe/webhook/route.ts` |
| `subscription_canceled` | User's subscription is canceled via Stripe | `app/api/stripe/webhook/route.ts` |
| `payment_failed` | Subscription payment fails | `app/api/stripe/webhook/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- **Analytics basics**: [https://eu.posthog.com/project/121363/dashboard/506837](https://eu.posthog.com/project/121363/dashboard/506837)

### Insights
- **User Sign-ups Over Time**: [https://eu.posthog.com/project/121363/insights/d64czfXu](https://eu.posthog.com/project/121363/insights/d64czfXu)
- **Quiz Engagement Funnel** (quiz_started → lead_captured → quiz_completed): [https://eu.posthog.com/project/121363/insights/hy87A4MR](https://eu.posthog.com/project/121363/insights/hy87A4MR)
- **Subscription Conversion Funnel** (checkout_initiated → checkout_completed): [https://eu.posthog.com/project/121363/insights/RuZNgwFZ](https://eu.posthog.com/project/121363/insights/RuZNgwFZ)
- **Quizzes Created vs Published**: [https://eu.posthog.com/project/121363/insights/I9lVbD7r](https://eu.posthog.com/project/121363/insights/I9lVbD7r)
- **Churn Events** (subscription_canceled + payment_failed): [https://eu.posthog.com/project/121363/insights/vMshuzTG](https://eu.posthog.com/project/121363/insights/vMshuzTG)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

## Environment Variables

The following environment variables were added to `.env.local`:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_vx5ZZqjs4abXr0oLd1KT1zy8hNCGjyUoLE1F4WpkK9Q
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Make sure to add these to your production environment as well.
