# Pricing Tiers v2 - Three-Tier Structure

**Date:** 2026-01-26
**Status:** Implemented
**Related Files:**
- `lib/stripe.ts` - Tier configuration
- `lib/services/subscription-service.ts` - Subscription helpers
- `lib/firebase-admin.ts` - Server-side types
- `components/landing/PricingSection.tsx` - Landing page pricing
- `app/pricing/page.tsx` - Pricing page
- `app/api/stripe/checkout/route.ts` - Checkout API

---

## Context

Previously, MultiQuiz had a simple two-tier model (Free vs Pro). As we prepared for launch, we identified the need for a middle tier to:
1. Lower the entry barrier for paying customers
2. Differentiate between small and large operations
3. Remove AI features from initial launch (to be added later)

---

## Decision

Implement a three-tier pricing structure: **Free** (Grátis), **Plus**, and **Pro**.

### Tier Matrix

| Feature | Free (R$0) | Plus (R$89,90) | Pro (R$129,90) |
|---------|------------|----------------|----------------|
| Published Quizzes | 1 | 3 | 10 |
| Leads Collected | 10 | 3,000 | 10,000 |
| Draft Quizzes | Unlimited | Unlimited | Unlimited |
| AI-powered Creation | ❌ | ✅ | ✅ |
| Lead Management & Download | ❌ | ✅ | ✅ |
| CRM Integration (Webhook) | ❌ | ✅ | ✅ |
| External Links in Buttons | ❌ | ✅ | ✅ |

### Note on AI Feature
AI-powered creation is included in paid plans. Specific usage limits (messages/tokens) will be defined later based on cost analysis.

---

## Implementation Details

### Type Definitions

```typescript
// lib/stripe.ts
type SubscriptionTier = 'free' | 'plus' | 'pro';
```

### TIER_LIMITS Configuration

```typescript
TIER_LIMITS = {
  free: {
    publishedQuizzes: 1,
    leadsLimit: 10,
    draftLimit: Infinity,
    hasReports: false,
    hasLeadsPage: false,
    hasExternalUrls: false,
    hasCrmIntegration: false,
    hasBranding: true,
  },
  plus: {
    publishedQuizzes: 3,
    leadsLimit: 3000,
    draftLimit: Infinity,
    hasReports: true,
    hasLeadsPage: true,
    hasExternalUrls: true,
    hasCrmIntegration: true,
    hasBranding: false,
  },
  pro: {
    publishedQuizzes: 10,
    leadsLimit: 10000,
    draftLimit: Infinity,
    hasReports: true,
    hasLeadsPage: true,
    hasExternalUrls: true,
    hasCrmIntegration: true,
    hasBranding: false,
  },
}
```

### Stripe Price IDs

Environment variables required:
- `STRIPE_PRICE_PLUS_MONTHLY` - Plus tier monthly price
- `STRIPE_PRICE_PLUS_YEARLY` - Plus tier yearly price (optional)
- `STRIPE_PRICE_PRO_MONTHLY` - Pro tier monthly price
- `STRIPE_PRICE_PRO_YEARLY` - Pro tier yearly price (optional)

### Subscription Service Functions

New helper functions added:
- `isPlus(subscription)` - Check if user is on Plus tier
- `isPaidTier(subscription)` - Check if user is on any paid tier (Plus or Pro)
- `hasExternalUrlAccess(subscription)` - Check external URL permission
- `hasCrmAccess(subscription)` - Check CRM integration permission
- `getLeadsLimit(subscription)` - Get leads limit for current tier

### Checkout Flow

The checkout API now accepts a `tier` parameter:
```typescript
createCheckoutSession(userId, email, 'monthly', 'plus' | 'pro')
```

Tier is stored in Stripe metadata and used by webhooks to set the correct tier in Firebase.

---

## Migration Notes

### Backwards Compatibility
- Existing `'free'` tier values in database continue to work (mapped to basic limits)
- Existing Pro users remain on Pro tier
- `getTierFromPriceId()` detects tier from Stripe price ID

### Database Schema
No migration needed. The `tier` field in `users/{uid}.subscription` now accepts:
- `'free'` (legacy, treated as basic)
- `'basic'`
- `'plus'`
- `'pro'`

---

## UI Changes

### Landing Page (`PricingSection.tsx`)
- Changed from 2-column to 3-column layout
- Plus tier marked as "MAIS POPULAR"
- Removed monthly/yearly toggle (only monthly for now)

### Pricing Page (`/pricing`)
- Three tier cards with comparison table
- Updated feature lists
- Handles current plan detection for all tiers

### Account Page
- Shows correct plan name (Grátis/Plus/Pro)
- "Ver Planos" button for free users
- "Gerenciar Assinatura" for paid users

### Upgrade Modal
- New reasons: `external-url`, `leads-limit`, `leads-management`, `crm-integration`
- Updated copy for three-tier model

---

## Future Considerations

1. **AI Features**: When AI is added back, update `TIER_LIMITS` with `aiMessagesPerMonth`
2. **Yearly Pricing**: Add yearly pricing with discount when ready
3. **Leads Enforcement**: Implement actual leads limit checking (currently just display)
4. **External URL Blocking**: Add UI blocking for Free users trying to use external URLs

---

## Testing Checklist

- [ ] Free user sees correct features on pricing pages
- [ ] Plus checkout creates subscription with `tier: 'plus'`
- [ ] Pro checkout creates subscription with `tier: 'pro'`
- [ ] Webhook correctly sets tier based on price ID
- [ ] Account page shows correct plan name
- [ ] Upgrade modal shows appropriate reasons
- [ ] Stripe portal works for both Plus and Pro users
