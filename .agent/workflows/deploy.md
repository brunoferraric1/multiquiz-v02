---
description: Standardized deployment flow for MultiQuiz
---

// turbo-all
# Deployment Workflow

To ensure stability and protect the production environment, all changes MUST follow this flow:

### 1. Staging Deployment (Validation)
Any new feature or bug fix must first be pushed to the `develop` branch.
- **Action**: Commit and push your changes to the `develop` branch.
- **Validation**: Open [staging.multi-quiz.com](https://staging.multi-quiz.com) and verify the changes using **Stripe Test Mode** card (4242...).
- **Rule**: Never skip staging for features involving payments, auth, or database schema changes.

### 2. Production Deployment (Final)
Only after the feature is verified on the staging environment, it should be merged into the `master` branch.
- **Action**: Merge `develop` into `master` and push.
- **Validation**: Verify the change on [multi-quiz.com](https://multi-quiz.com).

### 3. Environment Secrets
- **Staging**: Uses secrets prefixed with `STAGING_` in GitHub.
- **Production**: Uses standard secret names in GitHub.
- **Rule**: Always verify that required secrets for new features are added to BOTH environments.

### 4. Stripe Configuration

**Required GitHub Secrets:**
| Secret | Staging | Production |
|--------|---------|------------|
| `STRIPE_SECRET_KEY` | `STAGING_STRIPE_SECRET_KEY` (test mode) | `STRIPE_SECRET_KEY` (live mode) |
| `STRIPE_WEBHOOK_SECRET` | `STAGING_STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` |
| `STRIPE_PRICE_PRO_MONTHLY` | `STAGING_STRIPE_PRICE_PRO_MONTHLY` | `STRIPE_PRICE_PRO_MONTHLY` |

**Current Pricing (as of Jan 2026):**
- Production monthly: `price_1StY4mFY0XcLgvttltJPARdB` (R$89,90/month)
- Staging: Uses test mode prices for validation

**Notes:**
- Staging uses Stripe test mode - use card `4242 4242 4242 4242` for testing
- Currently only monthly billing is active (no yearly discount plan)
