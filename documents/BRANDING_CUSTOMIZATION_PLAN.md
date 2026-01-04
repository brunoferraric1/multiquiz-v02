# Branding Customization Plan (Pro)

**Document Version:** 1.0
**Created:** 2025-01-16
**Status:** Planning Phase
**Last Updated:** 2025-01-16

---

## Executive Summary

Enable Pro users to customize live quiz branding with (1) a top-left logo and (2) a custom color palette (primary, secondary, tertiary) defined via hex codes. The plan respects existing design system tokens by applying palette overrides through CSS variables at the quiz container level and gates all editing/publishing behind Pro subscription checks.

---

## Goals
- Allow Pro users to upload a brand logo that appears top-left in the live quiz (and preview).
- Allow Pro users to define primary, secondary, and tertiary (accent) colors via hex inputs.
- Keep MultiQuiz branding (bottom pill) visible for now, per policy.
- Use design system tokens (`--color-*`) instead of hard-coded values.

## Non-Goals (for first iteration)
- Full theme editor (fonts, border radii, layout).
- Per-question/per-outcome styling.
- Removing the MultiQuiz "Made with" badge.

---

## Data Model Changes

### 1) Add a branding object to quiz draft + snapshot
Add a structured `branding` block to avoid overloading `primaryColor`:

```ts
branding?: {
  logoUrl?: string; // base64 or hosted URL
  palette?: {
    primary?: string;   // #RRGGBB
    secondary?: string; // #RRGGBB
    tertiary?: string;  // #RRGGBB (accent)
  };
};
```

### 2) Schema updates
- `types/index.ts`: extend `QuizSchema` and `QuizSnapshotSchema` with `branding` and hex validation (`/^#[0-9A-F]{6}$/i`).
- Keep `primaryColor` for backward compatibility. When both are present, prefer `branding.palette.primary`.

### 3) Firestore persistence
- `lib/services/quiz-service.ts`: include `branding` in `saveQuiz`, `createSnapshot`, and publish update flows.
- Ensure undefined values are stripped (already handled by `removeUndefinedDeep`).

---

## Branding Asset Handling (Logo)

### 1) Upload pipeline
- Reuse `components/ui/upload.tsx` for logo upload UI.
- Add a logo-specific compression helper to preserve transparency (PNG/WebP). Avoid converting to JPEG.
- Add size limits (e.g., 400x120 max, <300KB) to keep Firestore payloads safe.

### 2) Storage approach
- Use existing base64 data URL storage (consistent with cover/outcome images).
- Optional future: migrate logo storage to Firebase Storage if payload size becomes an issue.

---

## UI/UX Changes (Builder)

### 1) New Branding panel in builder
Add a "Branding (Pro)" section, likely in `app/builder/builder-content.tsx`:
- **Logo upload** (preview + remove button).
- **Palette fields**: Primary, Secondary, Tertiary hex inputs with small color swatches.
- **Reset to defaults** action.

### 2) Pro gating
- Use `useSubscription` + `isPro` to enable controls for Pro users.
- For free users, show disabled fields and an upgrade CTA.
- Use cursor tokens: `var(--cursor-interactive)` for active elements and `var(--cursor-not-allowed)` for disabled states.

### 3) Validation + feedback
- Validate hex codes on input change and on save/publish.
- Inline errors for invalid hex; prevent saving invalid palette.
- Normalize input (uppercase, ensure leading `#`).

---

## Live Quiz Rendering

### 1) Apply palette via CSS variables
At the root quiz container (`components/quiz/quiz-player.tsx`), set local CSS variables:
- `--color-primary`, `--color-secondary`, `--color-accent` (for tertiary)
- Derive `--color-*-foreground` for readable text using contrast helpers.
- Optionally map `--color-ring` to primary.

This keeps Tailwind utilities (`bg-primary`, `text-primary-foreground`, etc.) in sync without hard-coded values.

### 2) Add top-left logo
- Render logo in the quiz header area when `branding.logoUrl` exists.
- Position: top-left, fixed/absolute within the quiz container; keep safe padding for mobile.
- Show in both preview and live modes to align expectations.

### 3) Fallback behavior
- If branding is missing or user is free, use default CSS variables (no overrides) and hide logo.
- Keep current `primaryColor` logic as fallback until migration is complete.

---

## Feature Gating (Pro Only)

### 1) Builder controls
- Gate branding edits behind `isPro(subscription)`.

### 2) Publish enforcement
- In `QuizService.publishQuiz`, check tier before copying branding into `publishedVersion`.
- If free, strip `branding` from the published snapshot to prevent client-only bypass.

### 3) Downgrade behavior (decision)
- Option A (simpler): keep branding on already published quizzes; remove only on republish.
- Option B (strict): remove branding from live quizzes on downgrade.

---

## Compatibility & Migration

- Continue supporting `quiz.primaryColor` for existing quizzes.
- When `branding.palette.primary` is saved, optionally backfill `primaryColor` to reduce breakage.
- Add a one-time migration path if needed (e.g., when loading a quiz with `primaryColor`, pre-fill the new palette primary).

---

## QA Checklist

- Pro users can set logo + palette; changes reflect in preview and published live quiz.
- Free users see disabled controls and cannot publish branding.
- Hex validation prevents invalid inputs from saving.
- Logo displays correctly across breakpoints and does not overlap quiz content.
- CSS variable overrides do not affect dashboard or builder outside the quiz preview.

---

## Open Questions

1) Should tertiary map to `--color-accent` or introduce a new token?
2) Do we want to allow transparent logos only, or any format?
3) Downgrade policy: strip branding immediately or only on republish?
4) Should we expose a "reset to default palette" button in the builder?
