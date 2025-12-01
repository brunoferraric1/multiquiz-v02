# Draft/Live Separation Implementation Plan

## Overview

This document outlines the implementation plan for separating draft and published versions of quizzes, allowing users to safely edit published quizzes without affecting live quiz-takers.

## Current Problem

- All edits to a quiz are auto-saved and immediately reflected in the live quiz
- Users editing published quizzes can break the experience for active quiz-takers
- No way to preview or test changes before making them live
- Creates stress and risk when making even minor updates to published content

## Proposed Solution

Implement a two-version system:
1. **Draft Version**: The working copy that users edit in the builder
2. **Published Version**: A frozen snapshot served to public users

Users edit the draft freely and explicitly "push" changes to make them live.

---

## Data Model Changes

### Quiz Document Structure

Each quiz document needs to track two versions of content:

**New Fields:**
- `publishedVersion` - A snapshot of the quiz content when it was last published
- `hasUnpublishedChanges` - Boolean flag indicating if draft differs from published version

**What gets versioned:**
- Title
- Description
- Cover image
- CTA text and URL
- Questions array (complete)
- Outcomes array (complete)
- Primary color

**What doesn't get versioned:**
- `isPublished` flag (applies to the quiz as a whole)
- Stats (views, starts, completions)
- Owner ID
- Created/Updated timestamps
- Conversation history

### Version Lifecycle

1. **New quiz created** → `publishedVersion` is `null`, `hasUnpublishedChanges` is `false`
2. **First publish** → Current draft becomes `publishedVersion`, `hasUnpublishedChanges` becomes `false`
3. **Edit published quiz** → Changes go to draft, `hasUnpublishedChanges` becomes `true`
4. **Push to live** → Draft snapshot replaces `publishedVersion`, `hasUnpublishedChanges` becomes `false`
5. **Unpublish** → `isPublished` becomes `false`, versions remain intact

---

## How It Works

### Builder Experience

**When editing an unpublished quiz:**
- Works exactly as today
- Auto-save updates the draft
- "Publicar" button publishes for the first time

**When editing a published quiz:**
- All edits modify the draft version only
- Auto-save continues working on draft
- Live quiz remains unchanged
- Header shows "X unpublished changes" indicator
- "Atualizar" button appears to push changes live

**When clicking "Atualizar" (Update/Push to Live):**
1. Show confirmation modal explaining changes will go live
2. Optional: Show a summary of what changed (future enhancement)
3. On confirm: Copy current draft to `publishedVersion`
4. Update `hasUnpublishedChanges` to `false`
5. Show success toast
6. Button changes back to normal state

### Public Quiz Experience

**When a user visits `/quiz/[id]`:**
1. Fetch the quiz document
2. Check if `isPublished` is `true`
3. If published AND `publishedVersion` exists → serve `publishedVersion`
4. If published but `publishedVersion` is `null` → serve current quiz (backwards compatibility)
5. If not published → show "Quiz not published" error

This ensures public users always see the stable, published version.

---

## UX Specifications

### Builder Header Layout

**Left Side:**
- Back arrow button
- Quiz title (editable inline)
- Status badge

**Right Side:**
- Preview button (eye icon)
- "Atualizar" / "Publicar" button (conditional)
- Three-dot menu (⋮)
- Copy URL button (if published)

### Status Badge

**States:**
- `Rascunho` (Draft) - Grey badge when `isPublished === false`
- `Publicado` (Published) - Green badge when `isPublished === true` and `hasUnpublishedChanges === false`
- `Publicado • X alterações` (Published • X changes) - Yellow/orange badge when `isPublished === true` and `hasUnpublishedChanges === true`

Note: The "X changes" count is optional for v1. Can just show "Publicado • Alterações pendentes" or similar.

### Primary Action Button

**States and Labels:**

| Quiz State | Published | Has Changes | Button Label | Button Variant | Action |
|------------|-----------|-------------|--------------|----------------|--------|
| New quiz | No | N/A | "Publicar" | Primary | First publish |
| Published, no changes | Yes | No | "Publicado ✓" | Secondary/Ghost | Show publish modal (info only) |
| Published, with changes | Yes | Yes | "Atualizar" | Primary/Accent | Push changes live |
| Unpublished (was published) | No | N/A | "Publicar" | Primary | Republish |

**Button Behavior:**
- Only enabled if quiz is valid (has questions, outcomes, etc.)
- Shows loading state while publishing/updating
- On success, shows temporary success state before reverting

### Three-Dot Menu (⋮)

**Menu Items:**

When quiz is **published:**
- "Despublicar" (Unpublish)
- Divider
- "Descartar alterações" (Discard changes) - Only shown if `hasUnpublishedChanges === true`

When quiz is **not published:**
- "Deletar quiz" (Delete quiz)

**Rationale:**
- Moves destructive/less-common actions out of primary UI
- Saves header space for primary actions
- "Unpublish" is rarely needed once quiz is live

### Copy URL Button

**Visibility:**
- Only shown when `isPublished === true`

**Behavior:**
- Copies `{domain}/quiz/{quizId}` to clipboard
- Shows checkmark icon temporarily
- Shows tooltip: "Copiar link do quiz"

### Preview Button

**Behavior:**
- Shows quiz in preview mode
- When quiz is published with changes, show option to toggle between:
  - "Preview draft" (current edits)
  - "Preview published" (what users see now)
- Default to previewing current draft

---

## User Flows

### Flow 1: Publishing a Quiz for the First Time

1. User creates and edits quiz in builder
2. Quiz is auto-saved as draft (`isPublished: false`)
3. User clicks "Publicar"
4. System validates quiz (has questions, outcomes, etc.)
5. Show publish success modal with shareable link
6. System sets `isPublished: true`, copies draft to `publishedVersion`, sets `hasUnpublishedChanges: false`
7. Header updates to show "Publicado" badge and copy URL button

### Flow 2: Editing a Published Quiz

1. User opens published quiz in builder
2. Header shows "Publicado" badge, copy URL visible
3. User makes changes (e.g., fixes typo, updates image)
4. Auto-save saves changes to draft only
5. Badge updates to "Publicado • Alterações pendentes"
6. "Atualizar" button appears
7. User continues editing, all changes stay in draft
8. Public users still see the old published version

### Flow 3: Pushing Changes Live

1. User has unpublished changes (badge shows pending changes)
2. User clicks "Atualizar"
3. Modal appears:
   - Title: "Atualizar quiz publicado?"
   - Body: "As alterações serão refletidas imediatamente no quiz ao vivo. Pessoas que estiverem fazendo o quiz poderão ver as mudanças."
   - Actions: "Cancelar" / "Atualizar Quiz"
4. User confirms
5. System copies draft to `publishedVersion`, updates `hasUnpublishedChanges`
6. Success toast: "Quiz atualizado com sucesso"
7. Badge returns to "Publicado" state
8. Button changes to "Publicado ✓" state
9. Public users now see the new version

### Flow 4: Discarding Draft Changes

1. User has unpublished changes but wants to revert
2. User opens three-dot menu
3. Clicks "Descartar alterações"
4. Modal appears:
   - Title: "Descartar alterações?"
   - Body: "As alterações não publicadas serão perdidas. O quiz voltará para a última versão publicada."
   - Actions: "Cancelar" / "Descartar"
5. User confirms
6. System loads `publishedVersion` back into draft
7. Sets `hasUnpublishedChanges` to `false`
8. Builder reloads with published version
9. Success toast: "Alterações descartadas"

### Flow 5: Unpublishing a Quiz

1. User opens three-dot menu
2. Clicks "Despublicar"
3. Modal appears:
   - Title: "Despublicar quiz?"
   - Body: "O quiz ficará indisponível no link público. Você poderá republicá-lo quando quiser."
   - Actions: "Cancelar" / "Despublicar"
4. User confirms
5. System sets `isPublished: false` (keeps both versions intact)
6. Badge changes to "Rascunho"
7. Copy URL button disappears
8. Three-dot menu updates (shows "Deletar quiz" instead)
9. Public URL shows "Quiz not published" error

---

## Service Layer Changes

### QuizService Methods to Modify

**`saveQuiz()`**
- Continue saving to main quiz document
- Do NOT touch `publishedVersion` or `hasUnpublishedChanges`
- These are only updated by explicit publish/update actions

**New: `publishQuiz()`**
- Takes quiz ID and user ID
- Validates quiz is complete
- Creates snapshot of current quiz state
- Sets `isPublished: true`
- Sets `publishedVersion` to snapshot
- Sets `hasUnpublishedChanges: false`
- Returns success

**New: `updatePublishedQuiz()`**
- Takes quiz ID and user ID
- Verifies quiz is already published
- Creates snapshot of current quiz state
- Updates `publishedVersion` with snapshot
- Sets `hasUnpublishedChanges: false`
- Returns success

**New: `unpublishQuiz()`**
- Takes quiz ID and user ID
- Sets `isPublished: false`
- Keeps `publishedVersion` intact (can be republished later)
- Returns success

**New: `discardDraftChanges()`**
- Takes quiz ID and user ID
- Loads `publishedVersion` from Firestore
- Returns the published version snapshot
- Frontend loads this into the builder state
- Sets `hasUnpublishedChanges: false`

**Modify: `getQuizById()`**
- Add optional `version` parameter: `'draft' | 'published'`
- If `version === 'published'` and `publishedVersion` exists → return published version
- Default behavior returns draft (current quiz state)
- Public endpoint always requests `version: 'published'`

### Auto-Save Behavior

**No changes needed to auto-save hook**
- Auto-save continues working exactly as today
- Saves to draft version only
- After each auto-save, check if quiz is published
- If published, set `hasUnpublishedChanges: true` (if not already)

---

## State Management Changes

### QuizBuilderStore

**New State Fields:**
- `publishedVersion: Quiz | null` - The last published snapshot
- `hasUnpublishedChanges: boolean` - Whether draft differs from published

**New Actions:**
- `setPublishedVersion(version: Quiz | null)` - Update published snapshot
- `setHasUnpublishedChanges(value: boolean)` - Update flag
- `loadPublishedVersion()` - Replace draft with published version (for discard action)

**Modified Behavior:**
- When `loadQuiz()` is called, also load `publishedVersion` and `hasUnpublishedChanges` from the quiz data
- Track changes after publish by comparing draft to published version (can be debounced/throttled)

---

## UI Components to Update

### BuilderHeader Component

**Props to Add:**
- `hasUnpublishedChanges: boolean`
- `onUpdatePublished: () => void`
- `onDiscardChanges: () => void`

**Layout Changes:**
- Move unpublish action to three-dot menu
- Add three-dot menu button
- Update primary button logic to show "Atualizar" when has changes
- Show change indicator in badge

### New Components Needed

**UpdateQuizModal**
- Confirmation modal for pushing changes live
- Shows warning about immediate impact
- Future: Could show diff of changes

**DiscardChangesModal**
- Confirmation modal for reverting to published version
- Warns about losing work

**ThreeDotsMenu**
- Dropdown menu with contextual actions
- Different items based on publish state

---

## Edge Cases to Handle

### 1. Quiz Published While User is Editing
**Scenario:** User A is editing, User B publishes
**Solution:** Show toast notification, reload quiz data, ask user to review changes

### 2. Auto-save Fails During Edit
**Scenario:** Network issues prevent auto-save
**Solution:** Local state preserved, retry on reconnect, warn user of unsaved changes

### 3. User Closes Builder with Unpublished Changes
**Scenario:** User navigates away with pending changes
**Solution:** No intervention needed - changes are saved in draft, can be published later

### 4. Someone Takes Quiz While Update is Being Pushed
**Scenario:** User is mid-quiz when content updates
**Solution:** Accept this edge case (extremely rare). Future enhancement could version active quiz sessions.

### 5. Unpublish Then Republish
**Scenario:** User unpublishes, makes no changes, republishes
**Solution:** Restore from `publishedVersion`, no changes needed

### 6. Delete Draft Changes Without Published Version
**Scenario:** User never published, tries to discard changes
**Solution:** "Discard changes" option only appears if `publishedVersion` exists

### 7. Backwards Compatibility
**Scenario:** Existing published quizzes don't have `publishedVersion`
**Solution:**
- On first load, check if `isPublished === true` but `publishedVersion === null`
- Auto-create `publishedVersion` from current state
- Set `hasUnpublishedChanges: false`
- Or simply serve current quiz if `publishedVersion` is missing (graceful degradation)

---

## Migration Strategy

### Phase 1: Schema Update
1. Update TypeScript types to include new fields
2. Update Zod schemas for validation
3. Deploy schema changes (backwards compatible)

### Phase 2: Service Layer
1. Implement new service methods
2. Update existing methods to handle new fields
3. Add unit tests for version management

### Phase 3: UI Components
1. Create new modal components
2. Update BuilderHeader with new layout
3. Add three-dot menu component

### Phase 4: State Management
1. Update quiz builder store
2. Update auto-save hook to set change flag
3. Wire up new actions

### Phase 5: Public Endpoint
1. Update `/quiz/[id]` to serve published version
2. Add backwards compatibility fallback
3. Test with existing published quizzes

### Phase 6: Migration Script (Optional)
1. Create script to populate `publishedVersion` for existing published quizzes
2. Run migration on production database
3. Verify all published quizzes have snapshot

---

## Testing Checklist

### Unit Tests
- [ ] Service methods correctly create/update versions
- [ ] Published version is isolated from draft changes
- [ ] Discard changes properly reverts to published
- [ ] Unpublish preserves versions

### Integration Tests
- [ ] Auto-save doesn't affect published version
- [ ] Publish flow creates correct snapshot
- [ ] Update flow replaces published version
- [ ] Public endpoint serves correct version

### E2E Tests
- [ ] Create quiz → Publish → Edit → Update flow
- [ ] Create quiz → Publish → Edit → Discard flow
- [ ] Publish → Unpublish → Republish flow
- [ ] Badge states update correctly
- [ ] Copy URL only shows when published

### Manual Testing
- [ ] Header layout looks good on mobile and desktop
- [ ] All modals work correctly
- [ ] Toast notifications appear at right times
- [ ] No data loss scenarios
- [ ] Backwards compatibility with old quizzes
- [ ] Public quiz shows correct version

---

## Success Metrics

After implementation, measure:
- **Safety**: Zero reports of "quiz changed while I was taking it"
- **Confidence**: User feedback on editing published quizzes
- **Adoption**: % of users who update published quizzes vs. creating new ones
- **Clarity**: Support tickets about publishing confusion

---

## Future Enhancements

### V2 Features
- Show diff view before updating (what changed)
- Change counter in badge ("3 alterações")
- Bulk updates across multiple quizzes
- Preview toggle in preview mode (draft vs. published)

### V3 Features
- Version history (keep last N published versions)
- Rollback to previous published version
- Schedule publish for future date/time
- A/B testing between versions

---

## Questions to Resolve

1. Should we track individual change count or just boolean flag?
   - **Recommendation:** Start with boolean, add count later if needed

2. What happens if user switches between quizzes with unsaved changes?
   - **Current behavior:** Auto-save + zustand persist handles this
   - **New behavior:** Same, changes tracked per quiz

3. Should "Atualizar" button always be visible or only when changes exist?
   - **Recommendation:** Only show when `hasUnpublishedChanges === true`

4. How long should success toast stay visible?
   - **Recommendation:** 3 seconds for standard actions, 5 seconds for publish/update

5. Should we show a "last published" timestamp?
   - **Recommendation:** Nice to have, but not critical for V1

---

## Conclusion

This plan provides a robust, user-friendly solution to the draft/live separation problem. By implementing this feature, users can confidently edit published quizzes without fear of breaking the live experience for quiz-takers.

The implementation is structured to be done incrementally, with each phase building on the previous one. Backwards compatibility is maintained throughout, ensuring existing quizzes continue to work seamlessly.
