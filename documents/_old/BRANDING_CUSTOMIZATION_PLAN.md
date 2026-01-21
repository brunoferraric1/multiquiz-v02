# Branding Customization Plan (Pro)

**Document Version:** 1.2
**Created:** 2025-01-16
**Status:** Planning Phase
**Last Updated:** 2025-01-16

---

## Executive Summary

Enable Pro users to customize live quiz branding via a single account-level Brand Kit (logo + palette). There are no per-quiz overrides. The Brand Kit is applied in preview for owners and snapshotted into the published quiz for public viewing. Palette overrides are applied via CSS variables at the quiz container level, using design system tokens.

This plan follows a best-practice pattern for public content: published quizzes never read from the user profile at runtime. Instead, branding is resolved during publish (and during background syncs) and stored on the quiz document.

---

## Decisions (Resolved)

1) **Branding scope:** Account-level Brand Kit only. No per-quiz overrides. All quizzes share the same branding.
2) **Logo formats:** Prefer transparent logos. Accept PNG/WebP and discourage white-box logos via validation + guidance.
3) **Downgrade behavior:** Strip branding when Pro benefits end (after any remaining paid period).
4) **Default option:** Brand Kit selector includes a "Default" option that clears custom branding and uses design tokens.

---

## Goals
- Allow Pro users to configure one Brand Kit on their account.
- Use that Brand Kit for all quizzes by default (no per-quiz customization).
- Show the logo top-left on live quizzes and preview.
- Keep MultiQuiz branding (bottom pill) visible for now, per policy.
- Use design system tokens (`--color-*`) instead of hard-coded values.

## Non-Goals (for first iteration)
- Per-quiz branding overrides.
- Multiple themes or a theme library.
- Full theme editor (fonts, border radii, layout).
- Removing the MultiQuiz "Made with" badge.

---

## Data Model Changes

### 1) Add Brand Kit to user profile
Store the Brand Kit on the user document:

```ts
// users/{userId}
brandKit?: {
  logoUrl?: string; // base64 or hosted URL
  palette?: {
    primary?: string;   // #RRGGBB
    secondary?: string; // #RRGGBB
    tertiary?: string;  // #RRGGBB (accent)
  };
};
```

Brand Kit "Default" state is represented by `brandKit` being undefined or empty.

### 2) Add branding snapshot to published quiz
Quizzes do not store a customizable branding object. Instead, the Brand Kit is copied into the published snapshot for public access:

```ts
// QuizSnapshot
branding?: {
  logoUrl?: string;
  palette?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
};
```

### 3) Schema updates
- `types/index.ts`: extend `QuizSnapshotSchema` with `branding` and hex validation (`/^#[0-9A-F]{6}$/i`).
- Add a shared `BrandKit` type if needed for UI forms.

### 4) Firestore persistence
- Account page writes `brandKit` to `users/{userId}`.
- Publish flow resolves branding snapshot:
  - If Pro: copy `brandKit` into `publishedVersion.branding`.
  - If free: omit branding from the published snapshot.

Note: user documents are private; public quiz pages cannot read them directly, so a snapshot is required.

---

## Brand Kit Propagation (Best Practice)

### 1) On publish
- Resolve branding once and store on `publishedVersion.branding`.
- Public quizzes render from the snapshot only.

### 2) On Brand Kit change
- Use a server-side batch update to refresh `publishedVersion.branding` for all published quizzes owned by the user.
- This keeps branding consistent across all live quizzes without per-quiz controls.

### 3) On Pro expiration
- When Pro benefits end (subscription inactive after any paid period), remove branding from all published quizzes via a server-side batch update.

---

## Branding Asset Handling (Logo)

### 1) Upload pipeline
- Reuse `components/ui/upload.tsx` for logo upload UI.
- Add a logo-specific compression helper to preserve transparency (PNG/WebP). Avoid converting to JPEG.
- Add size limits (e.g., 400x120 max, <300KB) to keep Firestore payloads safe.
- Accept only PNG/WebP (transparent-friendly) and show a helper hint to avoid white-box logos.

### 2) Storage approach
- Store base64 data URL in the user doc (same approach as cover/outcome images).
- Optional future: migrate logos to Firebase Storage if payload size becomes an issue.

---

## UI/UX Changes

### 1) Account page Brand Kit section
Add a "Brand Kit (Pro)" panel to `app/dashboard/account/page.tsx`:
- **Branding selector**: Default / Custom.
- **Logo upload** (preview + remove button), shown only when Custom is selected.
- **Palette fields**: Primary, Secondary, Tertiary hex inputs with small color swatches.
- **Reset to defaults** action (sets selector to Default).

### 2) Builder preview (read-only)
- Use the account Brand Kit to render the preview in `QuizPlayer`.
- No per-quiz editing controls; optionally show a link to account settings.

### 3) Validation + feedback
- Validate hex codes on input change and on save.
- Inline errors for invalid hex; prevent saving invalid palette.
- Normalize input (uppercase, ensure leading `#`).

---

## Live Quiz Rendering

### 1) Apply palette via CSS variables
At the root quiz container (`components/quiz/quiz-player.tsx`), set local CSS variables from `publishedVersion.branding`:
- `--color-primary`, `--color-secondary`, `--color-accent` (for tertiary)
- Derive `--color-*-foreground` for readable text using contrast helpers.
- Optionally map `--color-ring` to primary.

This keeps Tailwind utilities (`bg-primary`, `text-primary-foreground`, etc.) in sync without hard-coded values.

### 2) Add top-left logo
- Render logo in the quiz header area when `publishedVersion.branding.logoUrl` exists.
- Position: top-left, fixed/absolute within the quiz container; keep safe padding for mobile.
- Show in both preview and live modes to align expectations.

### 3) Fallback behavior
- If branding is missing or user is free, use default CSS variables and hide the logo.
- Keep current `primaryColor` logic as a legacy fallback until fully deprecated.

---

## Feature Gating (Pro Only)

### 1) Account controls
- Gate Brand Kit edits behind `isPro(subscription)`.
- For free users, show disabled fields and an upgrade CTA.
- Use cursor tokens: `var(--cursor-interactive)` for active elements and `var(--cursor-not-allowed)` for disabled states.

### 2) Publish enforcement
- In `QuizService.publishQuiz`, only include `publishedVersion.branding` for Pro users.
- If free, strip branding from the published snapshot to prevent client-only bypass.

### 3) Downgrade handling
- Honor remaining paid time: keep branding while subscription is active or trialing.
- Strip branding when the subscription is no longer active (after the paid period ends).
- Implement via Stripe webhooks + server-side batch updates to published quizzes.

---

## Compatibility & Migration

- Existing quizzes still use `primaryColor` as a fallback.
- No per-quiz branding migration is required.
- Brand Kit defaults to the design system colors until the user sets custom values.

---

## Implementation TODOs

- [ ] Define `BrandKit` type and validation helpers (hex normalization, PNG/WebP restriction).
- [ ] Add `brandKit` read/write to `users/{userId}` (account page form + persistence).
- [ ] Add Brand Kit selector (Default vs Custom) with reset behavior.
- [ ] Extend `QuizSnapshotSchema` with `branding` and update quiz publish snapshot logic.
- [ ] Update publish flow to inject branding snapshot for Pro users only.
- [ ] Add server-side batch update for published quizzes when Brand Kit changes.
- [ ] Add server-side batch update to strip branding when Pro benefits end.
- [ ] Update preview flow to apply Brand Kit in `QuizPlayer` for the builder preview.
- [ ] Update live quiz rendering to read `publishedVersion.branding`, set CSS variables, and render the top-left logo.
- [ ] Add UI gating and upgrade CTA for free accounts on the account page.
- [ ] Add QA checks for branding, downgrade behavior, and invalid hex handling.

---

## QA Checklist

- Pro users can set logo + palette in account page; changes reflect in preview and published live quiz.
- Brand Kit "Default" option clears overrides and returns to design tokens.
- Free users see disabled controls and cannot publish branding.
- Hex validation prevents invalid inputs from saving.
- Logos with transparency render cleanly without white boxes.
- Branding remains while Pro is active (including grace period) and is stripped after expiration.
- CSS variable overrides do not affect dashboard or builder outside the quiz preview.
