# Draft/Live Separation Implementation Plan

## Overview

Separate draft and published versions of quizzes so users can safely edit published quizzes without affecting live quiz-takers.

## Problem

- All edits to a quiz are auto-saved and immediately reflected in the live quiz
- Users editing published quizzes can break the experience for active quiz-takers
- Creates stress when making even minor updates to published content

## Solution

Two-version system:
1. **Draft Version**: The working copy that users edit in the builder (current quiz fields)
2. **Published Version**: A frozen snapshot served to public users (`publishedVersion` field)

Users edit the draft freely and explicitly "push" changes to make them live.

---

## Data Model Changes

### New Fields on Quiz Document

| Field | Type | Description |
|-------|------|-------------|
| `publishedVersion` | `QuizSnapshot \| null` | Frozen snapshot of quiz content when last published |
| `publishedAt` | `number \| null` | Timestamp of last publish |

### What Gets Versioned (QuizSnapshot)

```typescript
type QuizSnapshot = {
  title: string;
  description: string;
  coverImageUrl?: string;
  ctaText?: string;
  primaryColor: string;
  questions: Question[];
  outcomes: Outcome[];
}
```

### What Doesn't Get Versioned

- `isPublished` flag (applies to the quiz as a whole)
- Stats (views, starts, completions)
- Owner ID, timestamps
- Conversation history

### Computed State (NOT stored)

```typescript
// Computed in the UI / store, NOT stored in database
const hasUnpublishedChanges = quiz.isPublished && quiz.publishedVersion !== null &&
  JSON.stringify(currentDraft) !== JSON.stringify(quiz.publishedVersion);
```

---

## Version Lifecycle

1. **New quiz created** → `publishedVersion` is `null`
2. **First publish** → Current draft snapshot becomes `publishedVersion`
3. **Edit published quiz** → Changes go to draft only, `publishedVersion` unchanged
4. **Update live** → Draft snapshot replaces `publishedVersion`
5. **Unpublish** → `isPublished` becomes `false`, versions remain intact

---

## UX Specifications

### Header Badge States

| State | Badge | Color |
|-------|-------|-------|
| Draft (never published) | Rascunho | Grey |
| Published (no pending changes) | Publicado | Green |
| Published (with pending changes) | Publicado • | Yellow dot indicator |

### Primary Action Button

| Quiz State | Button Label | Action |
|------------|--------------|--------|
| Draft (never published) | "Publicar" | First publish |
| Published, no changes | (no button or "Publicado ✓") | — |
| Published, with changes | "Atualizar" | Push changes live |

### Three-Dot Menu (⋮)

**When published:**
- "Despublicar" (Unpublish)
- "Descartar alterações" (only if has changes)

**When not published:**
- "Deletar quiz" (Delete)

### Copy URL Button

Only visible when `isPublished === true`.

---

## Service Layer Changes

### `publishQuiz(quizId, userId)`

Works for both first publish and updates:
1. Validates quiz is complete
2. Creates snapshot of current quiz state
3. Sets `isPublished: true`
4. Sets `publishedVersion` to snapshot
5. Sets `publishedAt` to current timestamp

### `unpublishQuiz(quizId, userId)`

1. Sets `isPublished: false`
2. Keeps `publishedVersion` intact (can republish later)

### `saveQuiz()` (no changes)

- Continues saving to main quiz document
- Does NOT touch `publishedVersion`

### `getQuizById(quizId, userId?, version?)`

- Add optional `version` parameter: `'draft' | 'published'`
- If `version === 'published'` and `publishedVersion` exists → return published version
- Default returns draft (current quiz state)
- Public endpoint always requests `version: 'published'`

### Discard Changes (Client-side)

No separate service method needed. The store reloads from `publishedVersion` directly.

---

## Public Quiz Experience

When a user visits `/quiz/[id]`:
1. Fetch the quiz with `version: 'published'`
2. If published AND `publishedVersion` exists → serve `publishedVersion`
3. If published but `publishedVersion` is `null` → serve current quiz (backwards compatibility)
4. If not published → show "Quiz não publicado" error

---

## Backwards Compatibility

Existing published quizzes don't have `publishedVersion`. Options:
- **Graceful degradation**: If `isPublished === true` but `publishedVersion === null`, serve current quiz state
- First edit after this feature ships will create the `publishedVersion` on next publish

---

## User Flows

### Flow 1: Publishing First Time
1. User creates and edits quiz
2. Clicks "Publicar"
3. System validates, creates snapshot, sets `isPublished: true`
4. Shows success modal with shareable link

### Flow 2: Editing Published Quiz
1. User opens published quiz
2. Makes changes → auto-saves to draft only
3. Badge shows "Publicado •" (yellow indicator)
4. "Atualizar" button appears
5. Public quiz remains unchanged

### Flow 3: Pushing Changes Live
1. User clicks "Atualizar"
2. Confirmation modal: "As alterações serão refletidas imediatamente"
3. System copies draft to `publishedVersion`
4. Success toast, badge returns to green "Publicado"

### Flow 4: Discarding Changes
1. User clicks menu → "Descartar alterações"
2. Confirmation modal: "As alterações serão perdidas"
3. Store loads `publishedVersion` back into draft
4. Builder reloads with published version

### Flow 5: Unpublishing
1. User clicks menu → "Despublicar"
2. Confirmation modal
3. Sets `isPublished: false`
4. Badge changes to "Rascunho"
5. Public URL shows error

---

## Simplifications Applied

| Original Plan | Simplified |
|---------------|-----------|
| `hasUnpublishedChanges` stored field | Computed from `publishedVersion` comparison |
| 4 new service methods | 2 methods: `publishQuiz`, `unpublishQuiz` |
| Change counter in badge | Just yellow dot indicator |
| Preview toggle (draft/published) | Skipped for V1 |
| `discardDraftChanges()` service | Client-side reload from `publishedVersion` |

---

## Files to Modify

1. `types/index.ts` - Add `QuizSnapshot`, update `Quiz` type
2. `lib/services/quiz-service.ts` - Add `publishQuiz`, `unpublishQuiz`, modify `getQuizById`
3. `store/quiz-builder-store.ts` - Add computed `hasUnpublishedChanges`, `loadPublishedVersion`
4. `components/builder/builder-header.tsx` - Update button states, add three-dot menu
5. `app/quiz/[id]/page.tsx` - Serve published version to public

---

## Testing Checklist

### Manual Testing

1. **First Publish**: Create quiz → Publish → Verify public URL works
2. **Edit Published**: Publish → Edit → Verify badge shows indicator → Verify public unchanged
3. **Update Live**: Edit → Click "Atualizar" → Verify public shows new version
4. **Discard Changes**: Edit → Discard → Verify draft reverts to published
5. **Unpublish**: Unpublish → Verify public URL shows error
6. **Backwards Compatibility**: Load old published quiz (no `publishedVersion`) → Verify it works
