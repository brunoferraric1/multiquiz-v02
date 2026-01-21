# Feature Access Policy (Free vs Pro)

Source of truth for how we gate features between the free and paid plans. This version folds in the newly requested limits (draft cap, question/outcome caps, lead visibility, single publish) and the current Stripe implementation.

---

## Current State (from code/product)
- Stripe checkout/portal/webhook flows exist (`app/api/stripe/*`, `lib/stripe.ts`, `lib/services/subscription-service.ts`) and write subscription data to `users/{userId}.subscription`.
- `TIER_LIMITS` today: free → `publishedQuizzes: 1`, `aiMessagesPerMonth: 20`, `hasReports: false`, `hasLeadsPage: false`, `hasBranding: true`; pro → unlimited quizzes/AI, reports/leads allowed, no branding.
- `useSubscription` hook reads subscription status live from Firestore.
- Gating is **not enforced** yet: `canUseAI`, `canPublishQuiz`, `hasReportsAccess`, `hasLeadsAccess` are unused; leads/report pages are open; AI usage is not tracked (`aiMessagesUsed` never incremented); publish flow ignores limits; questions/outcomes have no cap.
- Leads are stored via `AnalyticsService.getQuizLeads` and fully visible in the UI; reports show starts/completions/funnel to everyone.

---

## Tier Matrix (what we want)
| Capability | Free | Pro |
| --- | --- | --- |
| AI chatbot | Allowed (no message/token metering); constrained by draft limit below | Unlimited |
| Quiz structure | Up to **5 questions** and **3 outcomes/results** | Unlimited |
| Lead capture screen | Can enable and collect data | Full access |
| Lead data access/export | **Blocked** (data stored but redacted in UI/API) | Full access + CSV |
| Reports | See visits only (views) on overall page; hide starts/completions/funnel/outcomes | Full reports |
| Published quizzes | **One-ever publish** (after first publish, block further publishes until upgrade) | Unlimited |
| Drafts | Up to **3 drafts** (including unpublished quizzes) | Unlimited |
| Branding | MultiQuiz logo always present (small) and no custom palette/logo | MultiQuiz logo still present for now, but can add custom logo + color palette for live quiz |
| Shareable URL | Allowed for the one published quiz | Allowed |

Notes:
- “One-ever publish” differs from “one active at a time”: once a free user publishes a quiz, they cannot publish another quiz unless they upgrade (even if they delete/unpublish the first). We should persist a `publishedQuotaUsed` flag/count on the user.
- Draft cap assumes **3** free drafts; adjust if we see friction, but keep it explicit in `TIER_LIMITS`.

---

## Enforcement Rules (what to build)
- **Draft limit**
  - Track draft count per user (quizzes where `isPublished === false`); for free users block new draft creation beyond 3 and show upgrade CTA.
  - Allow editing existing drafts; allow deleting to free up a slot.
  - Optionally reserve one slot for AI-generated starter so users aren’t blocked on the first experience.
- **Quiz building caps**
  - Block adding beyond 5 questions / 3 outcomes in the builder (UI) and validate on save/publish (service + schema guard).
  - When at limit, show inline upgrade CTA instead of silent failure.
- **Publishing limit**
  - Before `publishQuiz`, check `subscription.tier` plus a durable counter (`publishedQuotaUsed` or `publishedCount >= 1`) rather than just “currently published”.
  - If a free user has already published once, deny additional publishes with upgrade CTA; still allow editing/unpublishing the existing one.
- **Leads visibility**
  - Always store leads, but on the Leads page/API return only counts for free users; mask PII fields and disable CSV export.
  - Show “unlock leads” upgrade state with the total lead count to prove value.
- **Reports**
  - For free users, display only views (and optionally total attempts count), hide funnel, starts, completions, and result distribution; gate deep links to `/dashboard/reports/[quizId]`.
  - Pro users get full charts; if a pro user downgrades, keep historical data but gate access.
- **Branding**
  - Public quiz should always show a small MultiQuiz logo (temporary requirement for both tiers).
  - Pro: allow uploading logo + selecting color palette for the live quiz (keep MultiQuiz logo present for now).
  - Free: lock logo upload and palette customization; use default brand palette.
- **Downgrade behavior**
  - On downgrade to free: keep published quizzes live but prevent publishing new ones; hide leads/reports; keep stored data for when they re-upgrade.

---

## Milestones & Tasks
1) **Config & Data Prep**
   - Extend `TIER_LIMITS` with question/outcome caps, draft cap, and lead/report visibility flags.
   - Add durable usage fields on user doc: `publishedQuotaUsed` (or `publishedCount`), `leadsCount` (for paywall copy), `draftCount` (or derive server-side).
2) **Backend Enforcement**
   - Guard draft creation endpoint/service: block when at cap for free users.
   - Guard `publishQuiz` with tier checks + published quota, and add a server-side count of published quizzes to prevent client bypass.
   - Add lead/report APIs that redact or deny data for free users.
3) **UI Gating**
   - Builder: enforce question/outcome limits and draft cap with clear upgrade prompts; disable publish CTA when over limits.
   - Leads page: show total leads + upgrade card; disable table/export for free.
   - Reports: show visits-only card for free; block detailed charts with upgrade CTA.
   - Public player: ensure branding toggle respects tier.
4) **Billing/Reset Automation**
   - Handle downgrade events from Stripe webhooks to flip access flags and show toasts in-app.
5) **QA & Analytics**
   - Add integration tests (or manual checklist) covering gating paths.
   - Track upgrade CTA impressions/conversions from gated surfaces.

---

## Risks / Open Questions
- Do we want a grace preview (e.g., show first 3 leads unredacted) to increase conversions?
- Should the publish limit be “1 total ever” or “1 concurrently”? The spec here assumes total-ever; if we relax to concurrent, we can rely on `publishedQuizzes` count only.
- How should we treat existing users who already have multiple published quizzes before gating ships? (Grandfather or require downgrade? Recommend grandfather with warning.)
- Draft cap number (currently 3): monitor activation vs conversion; consider raising if onboarding friction is high.
