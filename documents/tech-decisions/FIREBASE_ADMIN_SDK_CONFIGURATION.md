# Firebase Admin SDK Configuration - Technical Decision

**Date:** 2026-01-24
**Status:** Implemented
**Author:** Claude Code

---

## Context

The MultiQuiz backend uses Firebase Admin SDK for server-side authentication and Firestore access. When deploying to Firebase Hosting with Web Frameworks (frameworksBackend), the Next.js app runs on Cloud Run. This presented two challenges:

1. **Turbopack bundling issue**: Next.js 15+ uses Turbopack by default, which mangles external package names even with `serverExternalPackages` configuration
2. **Authentication on Cloud Run**: Service account keys stored in environment variables weren't available at runtime on Cloud Run

---

## Problem 1: Turbopack Mangles Package Names

### Symptoms

```
Error: Cannot find package 'firebase-admin-a14c8a5423a75469'
```

Turbopack transforms the package name `firebase-admin` into a hash, breaking the import at runtime.

### Attempted Solutions That Failed

| Approach | Result |
|----------|--------|
| `serverExternalPackages: ['firebase-admin']` in next.config.ts | Ignored by Turbopack |
| Using `require()` instead of ES imports | Still transformed |
| `eval('require')` with string literal | String still visible to static analysis |

### Solution: Runtime String Construction + eval

Hide both the `require` call and the package name from static analysis:

```typescript
// Build package names at runtime
const PKG_BASE = ['fire', 'base', '-', 'admin'].join('');
const PKG_APP = PKG_BASE + '/app';
const PKG_FIRESTORE = PKG_BASE + '/firestore';
const PKG_AUTH = PKG_BASE + '/auth';

// Use eval to hide require from bundler
const dynamicRequire = eval('require') as NodeRequire;

function getFirebaseAdmin() {
    const adminAppModule = dynamicRequire(PKG_APP);
    const adminFirestore = dynamicRequire(PKG_FIRESTORE);
    const adminAuthModule = dynamicRequire(PKG_AUTH);
    return {
        initializeApp: adminAppModule.initializeApp,
        getApps: adminAppModule.getApps,
        cert: adminAppModule.cert,
        getFirestore: adminFirestore.getFirestore,
        getAuth: adminAuthModule.getAuth,
    };
}
```

### Trade-offs

| Pros | Cons |
|------|------|
| Works with Turbopack | Uses `eval` (generally discouraged) |
| No bundler configuration needed | Types must be defined locally |
| Future-proof against bundler changes | Slightly obscure code pattern |

### Alternative: Migrate to Webpack

Disabling Turbopack in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack=false"
  }
}
```

This wasn't chosen because:
- Turbopack is the future of Next.js
- The workaround is isolated to one file
- Webpack has its own quirks with firebase-admin

---

## Problem 2: Authentication on Cloud Run

### Symptoms

After fixing the bundling issue, 401 Unauthorized errors appeared because `FIREBASE_SERVICE_ACCOUNT_KEY` wasn't available at runtime on Cloud Run.

### Root Cause

Firebase Hosting with Web Frameworks deploys to Cloud Run, but:
- Environment variables from `.env.staging` are not automatically deployed
- Firebase Hosting doesn't pass local env vars to Cloud Run

### Solution: Application Default Credentials (ADC)

On Google Cloud (Cloud Run, Cloud Functions), use ADC instead of service account keys:

```typescript
const isOnGoogleCloud = !!(process.env.K_SERVICE || process.env.FUNCTION_TARGET);
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

if (isOnGoogleCloud && projectId) {
    // Initialize without credentials - ADC used automatically
    adminApp = initializeApp({ projectId });
    return adminApp;
}

// For local development, use service account key
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
// ... parse and use cert()
```

### How ADC Works

1. Cloud Run containers have a default service account
2. This service account has IAM permissions for Firebase/Firestore
3. Google's client libraries automatically use these credentials
4. No secrets needed in environment variables

### Environment Detection

| Environment Variable | Meaning |
|---------------------|---------|
| `K_SERVICE` | Running on Cloud Run |
| `FUNCTION_TARGET` | Running on Cloud Functions |
| `GCLOUD_PROJECT` | Google Cloud project ID |
| `FIREBASE_PROJECT_ID` | Firebase project ID (fallback) |
| `VERCEL_ENV` | Running on Vercel (`preview` for staging) |

---

## Current Implementation

File: `lib/firebase-admin.ts`

### Initialization Flow

```
getAdminApp() called
       │
       ├── Already initialized? → Return cached app
       │
       ├── On Google Cloud (K_SERVICE or FUNCTION_TARGET)?
       │   └── Yes → Initialize with ADC (no key needed)
       │
       └── No (local/Vercel) → Parse FIREBASE_SERVICE_ACCOUNT_KEY
           ├── Check if staging (VERCEL_ENV=preview or project contains 'staging')
           │   └── Prefer STAGING_FIREBASE_SERVICE_ACCOUNT_KEY
           └── Initialize with cert(serviceAccount)
```

### Exported Functions

| Function | Purpose |
|----------|---------|
| `getAdminApp()` | Get/create Firebase Admin app instance |
| `getAdminDb()` | Get Firestore instance (calls getAdminApp) |
| `getAdminAuth()` | Get Auth instance (calls getAdminApp) |

### API Routes Using Firebase Admin

All these routes use `getAdminAuth()` and `getAdminDb()`:

- `/api/user/settings` - Webhook configuration
- `/api/webhooks/test` - Test webhook delivery
- `/api/webhooks/deliver` - Deliver webhooks on quiz completion
- `/api/leads` - Lead data export
- `/api/reports` - Quiz analytics reports
- `/api/stripe/webhook` - Stripe subscription events

---

## Staging vs Production

### Staging Environment

- **Firebase Project**: `multiquiz-staging` (or similar)
- **Hosting URL**: `staging.multi-quiz.com`
- **Detection**: `GCLOUD_PROJECT` contains 'staging' or `VERCEL_ENV=preview`
- **On Cloud Run**: Uses ADC with staging project's default service account
- **Locally**: Uses `STAGING_FIREBASE_SERVICE_ACCOUNT_KEY`

### Production Environment

- **Firebase Project**: `multiquiz-prod`
- **Hosting URL**: `multi-quiz.com`
- **On Cloud Run**: Uses ADC with production project's default service account
- **Locally**: Uses `FIREBASE_SERVICE_ACCOUNT_KEY`

---

## Security Considerations

1. **ADC is more secure**: No secrets in environment variables
2. **Service account keys for local only**: Keys should never be deployed
3. **IAM permissions**: Cloud Run's default service account needs:
   - `roles/firebase.admin` or specific Firestore/Auth permissions
   - These are usually granted automatically for Firebase projects

---

## Troubleshooting

### "Cannot find package 'firebase-admin-xxxxx'"

- Turbopack is mangling the package name
- Ensure `lib/firebase-admin.ts` uses the eval + runtime string pattern
- Check that no file imports directly from `firebase-admin/*`

### 401 Unauthorized on staging/production

1. Check Cloud Run logs for Firebase initialization errors
2. Verify `GCLOUD_PROJECT` is set (should be automatic on Cloud Run)
3. Ensure the default service account has Firebase permissions

### Works locally, fails on Cloud Run

- Local uses service account key, Cloud Run uses ADC
- Check that Cloud Run's service account has proper IAM roles
- Verify project ID is correctly detected

---

## Related Files

- `lib/firebase-admin.ts` - Main Firebase Admin configuration
- `next.config.ts` - Contains `serverExternalPackages` (for Webpack fallback)
- `.env.local` / `.env.staging` - Service account keys (local development only)

---

## References

- [Firebase Admin SDK on Cloud Run](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Next.js Turbopack](https://nextjs.org/docs/architecture/turbopack)
