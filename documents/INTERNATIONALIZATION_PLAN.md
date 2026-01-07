# Internationalization Plan (PT-BR, EN, ES)

## Overview
This document outlines the scope, tasks, milestones, and risks for enabling multi-language support across the landing page and the product UI. The current product is PT-BR only, with hard-coded strings, fixed locale formatting, and AI prompts tuned for Portuguese. The goal is to support PT-BR (existing), English, and Spanish.

## Goals
- Provide a language selector for landing and product.
- Support PT-BR, EN, ES across all UI copy.
- Ensure locale-aware routing, metadata, dates, numbers, and currency.
- Preserve current behavior and URLs with minimal disruption.

## Non-Goals (for initial release)
- Full translation of user-generated quiz content (unless explicitly decided).
- Automatic translation of existing quizzes or AI conversation history.
- Multi-currency pricing if not required by the business.

## Key Decisions Required (Before Implementation)
1. **Routing strategy**
   - Option A: Locale-prefixed routes (`/pt-BR/...`, `/en/...`, `/es/...`) with middleware redirect.
   - Option B: Single routes with client-only translations and locale stored in cookie.
2. **Quiz content language**
   - Option A: UI-only localization; quiz content stays as authored.
   - Option B: Per-quiz language (quiz has a `language` field; player uses it).
   - Option C: Multi-language quiz variants (separate translations per quiz).
3. **Translation management**
   - Option A: Simple JSON dictionaries in repo.
   - Option B: Integrate library (e.g., next-intl) for message formatting.
4. **Pricing and currency**
   - BRL only across locales, or locale-based currency/pricing tables.
5. **SEO**
   - Landing pages localized with `lang`, `hreflang`, and localized metadata.

## Current Baseline (Impacts)
- `app/layout.tsx` sets `lang="pt-BR"` and Portuguese metadata.
- Hard-coded PT-BR UI in landing and product components.
- Locale formatting uses `ptBR` (date-fns) and `toLocaleTimeString('pt-BR')`.
- AI prompts are Portuguese-first (`lib/services/ai-service.ts`).
- Image suggestion translation assumes PT input (`app/api/image-suggestion/route.ts`).

## Proposed Approach (Recommended)
Use Next.js App Router locale segment: `app/[lang]/...` with a middleware redirect for missing locale. This aligns with App Router constraints and keeps URL state explicit for SEO and sharing.

## Milestones and Tasks

### M0. Architecture Decisions (1-2 days)
- Decide on routing strategy and locale storage (cookie + user profile).
- Decide on translation method (local JSON vs library).
- Decide on quiz content language strategy.
- Decide on pricing currency per locale.
- Produce an implementation checklist and migration plan.

### M1. i18n Infrastructure (3-5 days)
- Add `i18n-config.ts` with supported locales and default locale.
- Add middleware to redirect missing locale to preferred/default locale.
- Create `app/[lang]/layout.tsx` and move routes under `app/[lang]/...`.
- Add `generateStaticParams` for all locales to pre-render static pages.
- Add a `LocaleProvider` or translation hook with dictionary loading.
- Add locale-aware `metadata` generation for landing pages.

### M2. Translation System + Content Inventory (3-5 days)
- Inventory all PT-BR strings across `app/`, `components/`, `lib/`.
- Create base dictionary files:
  - `locales/pt-BR.json`
  - `locales/en.json`
  - `locales/es.json`
- Replace hard-coded strings with translation keys.
- Add a missing-key tracker for development (console warnings).

### M3. Landing Page Localization (3-6 days)
- Translate landing sections (`Header`, `HeroSection`, `FeaturesSection`, `HowItWorksSection`, `PricingSection`, `FAQSection`, `CTASection`, `Footer`).
- Localize CTA URLs to preserve locale in route and anchors.
- Verify layout resilience for longer EN/ES copy.
- Add language selector to header and footer.

### M4. Product UI Localization (5-10 days)
- Dashboard, Builder, Quiz Player, Reports, Leads, Modals, and Toasts.
- Replace date/time formatting with locale-aware utilities.
- Add `lang` to `html` based on active locale.
- Ensure client-side navigation preserves locale.
- Add locale-aware labels for statuses (Published/Draft), buttons, and empty states.

### M5. AI and Backend Localization (4-7 days)
- Add language context to AI system prompts and extraction.
- Update AI fallback message language based on locale.
- Update image keyword translation to handle EN/ES input; keep PT->EN fallback.
- If per-quiz language is chosen, persist it with quiz drafts and published snapshots.

### M6. SEO, Analytics, and URLs (2-4 days)
- Add `hreflang` and localized metadata for landing routes.
- Ensure canonical URLs by locale.
- Update analytics tracking to include locale dimension.
- Add server-side redirects for legacy routes if adopting locale prefixes.

### M7. QA, Rollout, and Monitoring (3-5 days)
- Manual QA for all locale routes and UI flows.
- Regression test billing/checkout and auth flows.
- Verify redirects, cookies, and language persistence.
- Staged rollout with feature flag or percentage rollout.
- Monitor errors and missing translations.

## Task Breakdown (Detailed)

### Routing and Middleware
- Create `app/[lang]/(landing)/page.tsx` and move landing content.
- Create `app/[lang]/dashboard/...` route tree.
- Add middleware to:
  - Detect locale from cookie or `Accept-Language`.
  - Redirect missing locale to `/<locale>`.
  - Skip API and static assets.

### Translation Utilities
- Add translation loader with memoization per locale.
- Add `useTranslations()` hook with typing for keys.
- Add a simple `t('key')` helper for Server Components.

### Locale Preferences
- Add `language` to user profile (Firestore user doc).
- Persist language change to cookie and profile on selection.
- Use cookie for unauthenticated sessions (landing page users).

### Date, Time, and Currency
- Centralize date formatting in a utility.
- Swap `date-fns` locale at runtime.
- Use `Intl.NumberFormat` for prices and reports.

### UI Translation Targets (Representative)
- Landing components: `components/landing/*`.
- Quiz player: `components/quiz/*`.
- Builder: `components/builder/*`, `app/builder/*`.
- Dashboard: `app/dashboard/*`, `components/dashboard/*`.
- Auth: `app/(auth)/login/page.tsx`.
- Toasts and errors: `lib/services/*`, `components/*`.

## Risks and Mitigations
- **Routing breakage**: Legacy URLs may break when using locale prefixes.
  - Mitigation: middleware redirect, retain old routes for a transition window.
- **Mixed-language UI**: Missing translation keys cause PT bleed.
  - Mitigation: missing-key dev warning and test checklist.
- **AI output language mismatch**: AI responses may ignore locale.
  - Mitigation: locale-aware system prompts and explicit language hints.
- **Layout overflow**: EN/ES text length can break UI.
  - Mitigation: QA and flexible layouts (no fixed widths for text).
- **SEO duplication**: identical content across locales may confuse crawlers.
  - Mitigation: `hreflang`, localized metadata, canonical per locale.

## Dependencies
- Access to translation resources for EN/ES copy.
- Product decisions on currency and quiz content localization.
- Agreement on i18n library vs custom dictionary approach.

## Acceptance Criteria
- User can switch between PT-BR, EN, ES on landing and product.
- Language persists across refresh and navigation.
- All visible UI strings are localized (no PT strings in EN/ES).
- Locale-aware formatting for dates and currency.
- AI responses align with selected language.
- No broken links or 404s from legacy routes.

## Testing Plan
- Smoke test: landing page, auth flow, dashboard, builder, quiz player.
- Locale routing tests: `/`, `/pt-BR`, `/en`, `/es`.
- Language persistence: cookie + profile.
- Regression: checkout, publish quiz, lead capture, reports.
- Cross-device QA: mobile + desktop layouts.

## Estimated Effort (High-Level)
- UI-only localization (landing + product): 3-5 weeks.
- AI localization adjustments: +1 week.
- Per-quiz language support: +1-2 weeks.
- Multi-language quiz variants: +3-6 weeks.

## Rollout Strategy
1. Internal dogfood (staff only).
2. Public beta behind feature flag.
3. Gradual rollout with monitoring for missing keys and routing errors.
4. Full release with localized SEO metadata and sitemap updates.
