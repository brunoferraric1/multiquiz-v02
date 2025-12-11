# Adding New Bot-Editable Sections

When adding a new section to the quiz that the AI bot can edit (like `leadGen`), you must update several files to ensure proper functionality. Follow this checklist to avoid issues.

---

## Checklist

### 1. Types (`types/index.ts`)
- [ ] Add the field to `QuizSchema`
- [ ] Add the field to `QuizSnapshotSchema` (for published versions)
- [ ] Add the field to `AIExtractionResult` type (for AI extraction)

### 2. AI Service (`lib/services/ai-service.ts`)
- [ ] Add to `update_quiz` tool schema in `sendMessageWithExtraction()` (~line 440)
- [ ] Add to fallback extraction system prompt in `extractQuizStructure()` (~line 670)
- [ ] Add example usage in the extraction prompt
- [ ] Handle in `normalizeExtraction()` method (~line 985)

### 3. Quiz Store (`store/quiz-builder-store.ts`)
- [ ] Add to `initialQuizState`
- [ ] Add to `loadQuiz()` action with fallback default
- [ ] Add to `loadPublishedVersion()` action

### 4. Auto-Save Hook (`lib/hooks/use-auto-save.ts`)
- [ ] Add to `quizToSave` object in `saveToFirestore()` (~line 57)

### 5. Quiz Service (`lib/services/quiz-service.ts`)
- [ ] Add to `saveQuiz()` method (~line 70)
- [ ] Add to `createSnapshot()` method (~line 203)

### 6. Builder Content (`app/builder/builder-content.tsx`)
- [ ] Add to `currentSnapshot` in `hasUnpublishedChanges` useMemo (~line 184)
- [ ] Add to useMemo dependency array (~line 196)
- [ ] Add to both publish snapshot locations (`handlePublish`, `handlePublishUpdateConfirm`)

### 7. Chat Interface (`components/chat/chat-interface.tsx`)
- [ ] Add to `applyExtractionResult()` function to apply AI changes to store

---

## Quick Reference: File Purposes

| File | Purpose |
|------|---------|
| `types/index.ts` | TypeScript types and Zod schemas |
| `lib/services/ai-service.ts` | AI tool definitions and extraction |
| `store/quiz-builder-store.ts` | Zustand store for quiz state |
| `lib/hooks/use-auto-save.ts` | Auto-save to Firestore |
| `lib/services/quiz-service.ts` | Firestore CRUD operations |
| `app/builder/builder-content.tsx` | Change detection & publish snapshots |
| `components/chat/chat-interface.tsx` | Apply AI extractions to store |

---

## Common Issues & Causes

| Issue | Missing Update |
|-------|----------------|
| Bot says it updated but sidebar doesn't change | `applyExtractionResult()` or AI tool schema |
| Changes don't persist after refresh | `use-auto-save.ts` or `quiz-service.ts` |
| False "Atualizar" button on load | `hasUnpublishedChanges` snapshot or publish snapshots |
| Published quiz missing the field | `createSnapshot()` in quiz-service.ts |
