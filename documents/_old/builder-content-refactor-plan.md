# Builder Content Refactor Plan

## Context
- Target file: app/builder/builder-content.tsx (~2000 lines)
- Goal: reduce risk and maintenance cost by isolating concerns without changing behavior

## Goals
- Keep behavior identical while reducing file size and cognitive load
- Isolate side effects (publish, autosave, brand kit, onboarding) behind hooks
- Reduce duplication (publish snapshot, image compression, CTA checks)
- Make key flows easier to test and reason about
- Keep styling aligned with design tokens and Tailwind utilities

## Non-goals
- No UI redesign or visual changes
- No data model or API changes
- No changes to business rules or product behavior

## Constraints
- Preserve all user flows and state transitions
- Follow design tokens in app/globals.css
- Use cursor variables for interactive/disabled states
- Prefer existing Tailwind/system utilities

## Current Responsibilities Map
- Builder orchestration and routing
- Autosave and publish/update flows
- CTA warning gating for publish/update
- Draft state for Introduction and Outcome sheets
- Brand kit CRUD and apply mode logic
- Onboarding gating and localStorage persistence
- Mobile view toggles and preview overlay
- Editor panel layout (intro, outcomes, questions, lead gen)
- Modal/dialog rendering for publish, brand kit, CTA warning

## Risk Areas
- Publish/update flow with pending promise handling
- Autosave timing and cancel behavior
- Brand kit apply logic (brandKitMode + primaryColor)
- Onboarding trigger conditions and persistence
- Lead gen sheet open/save behavior
- CTA warning gating before publish/update

## Target Structure (Proposed)
- components/builder/
  - builder-content.tsx (orchestrator)
  - builder-onboarding-overlay.tsx
  - builder-editor-panel.tsx
  - builder-preview-overlay.tsx
  - builder-cta-warning-dialog.tsx
  - builder-introduction-sheet.tsx
  - builder-outcome-sheet.tsx
  - builder-brand-kit-sheet.tsx
- lib/builder/
  - use-brand-kit.ts
  - use-publish-flow.ts
  - use-onboarding.ts
  - use-draft-sync.ts
  - use-loading-section-scroll.ts
  - builder-utils.ts

## Implementation Phases and Milestones

### Phase 0: Baseline and Guardrails
Milestone M0 (Baseline)
- Create a manual regression checklist for:
  - Title/description/CTA save
  - Question add/edit/reorder/delete
  - Outcome add/edit/delete and CTA warning
  - Publish, update, unpublish, discard changes
  - Brand kit save/delete/apply mode
  - Preview open/close
  - Onboarding show/dismiss
  - Lead gen sheet save
- Capture a short doc of expected UI states (screenshots optional)
- Define success criteria (no visual changes, same behavior)

### Phase 1: Utility Extraction (No UI changes)
Milestone M1 (Shared helpers)
- Move helpers into lib/builder/builder-utils.ts:
  - normalizeHexColor, isValidHexColor
  - generateUUID
  - stableStringify
  - buildQuizSnapshot (new helper used by publish/update and change detection)
  - findOutcomesMissingCtaUrl
- Remove duplication in publish/update and CTA warning checks
- Keep all behavior identical

### Phase 2: Hook Extraction (No UI changes)
Milestone M2 (Side effects isolated)
- Extract hooks with the same behavior:
  - usePublishFlow (publish/update/CTA warning + pending promises)
  - useBrandKit (load/save/delete/apply mode)
  - useOnboarding (localStorage gating)
  - useDraftSync (intro/outcome drafts + reset on sheet open)
  - useLoadingSectionScroll (auto-scroll behavior)
- Keep state shape unchanged; pass handlers to UI

### Phase 3: UI Component Extraction
Milestone M3 (Component boundaries)
- Extract UI blocks into dedicated components:
  - Onboarding overlay
  - Editor panel (intro/outcomes/questions/lead gen)
  - Intro sheet, Outcome sheet, Brand kit sheet
  - CTA warning dialog, Publish success modal wrapper, Preview overlay
- Move only rendering code; keep handlers in parent

### Phase 4: Performance and Correctness
Milestone M4 (Behavior preserved, lighter renders)
- Replace heavy stableStringify comparison with a precomputed hash/version in the store
- Ensure outcomes list keys are stable (no Math.random keys)
- Minimize re-renders by memoizing large lists or extracting list rows

### Phase 5: Cleanup and Documentation
Milestone M5 (Maintainability)
- Remove dead code and unused variables
- Add inline comments only where behavior is non-obvious
- Update documents to describe module boundaries and responsibilities

## Deliverables by Milestone
- M0: Regression checklist + success criteria
- M1: builder-utils.ts + reduced duplication in publish/update
- M2: Dedicated hooks for publish/brand kit/onboarding/drafts
- M3: UI component extraction with same behavior
- M4: Performance improvements for change detection and keys
- M5: Cleanup, docs, and final audit

## Definition of Done
- BuilderContent is primarily orchestration, < 600 lines
- No behavior changes in manual regression checklist
- No new hard-coded colors or cursor styles
- Stable and predictable component boundaries

## Open Questions
- Do we want tests (Playwright/Cypress) added now, or keep manual checklist?
- Should we move helpers into existing utils or a new builder module?
- Are there any planned product changes that should be bundled with the refactor?
