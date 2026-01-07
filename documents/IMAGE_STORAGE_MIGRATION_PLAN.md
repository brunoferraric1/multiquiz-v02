# Image Storage Migration Plan (Drafts + Published)

**Document Version:** 1.0  
**Created:** 2025-02-13  
**Status:** Planning Phase  
**Last Updated:** 2025-02-13

---

## Executive Summary

Move all user-uploaded images (quiz cover, outcome images, question images, brand kit logo) from base64 stored in Firestore to Firebase Storage, and store only download URLs in Firestore for both drafts and published quizzes. This avoids Firestore document size limits, reduces read/write costs, and improves performance, while preserving draft continuity across sessions.

---

## Goals
- Store image binaries in Firebase Storage and only URLs in Firestore.
- Support drafts that persist across sessions with stable image URLs.
- Keep UI behavior the same (instant previews, replace/remove images).
- Provide a safe migration path for existing base64 images.

## Non-Goals
- Rework the quiz editor UX beyond upload handling.
- Add external CDN or third-party storage beyond Firebase Storage.

---

## Current State (Summary)
- Base64 data URLs are stored directly in Firestore for:
  - Quiz cover (`coverImageUrl`)
  - Outcome images (`outcomes[].imageUrl`)
  - Question images (`questions[].imageUrl`)
  - Brand kit logo (`users/{id}.brandKit.logoUrl`)
- This inflates document size and can exceed Firestore's 1 MiB limit.

---

## Proposed Approach

### Drafts and Published Quizzes
- Upload to Firebase Storage immediately upon user selection.
- Store the resulting download URL in Firestore for drafts and published.
- Use local object URLs for instant preview while upload completes.

### Legacy Base64 Handling
- Detect `data:image/` values when loading.
- Migrate by uploading to Storage in the background and replacing the field with the URL.
- Keep a fallback path to render base64 until migration completes.

---

## Milestones and Tasks

### Milestone 1: Storage Foundations
**Outcome:** Storage is ready and paths/naming are defined.
- Define Storage paths and naming conventions:
  - `users/{userId}/brand-kit/logo.{ext}`
  - `quizzes/{quizId}/cover.{ext}`
  - `quizzes/{quizId}/outcomes/{outcomeId}.{ext}`
  - `quizzes/{quizId}/questions/{questionId}.{ext}`
- Add Firebase Storage client setup and helpers.
- Decide max file size and allowed formats (PNG/JPEG/WebP).

### Milestone 2: Upload Pipeline (Client)
**Outcome:** All uploads go to Storage and return URLs.
- Replace `compressImage()` base64 return with a Storage upload flow:
  - Client-side resize/compress to Blob.
  - Upload Blob to Storage.
  - Return `downloadURL`.
- Keep instant preview using `URL.createObjectURL(file)` while upload runs.
- Update quiz builder flows:
  - Cover upload
  - Outcome image upload
  - Question image upload
  - Brand kit logo upload
- Ensure delete/replace removes the old Storage object (or mark for cleanup).

### Milestone 3: Firestore Data Model Update
**Outcome:** Firestore stores only URLs, no base64.
- Ensure all image fields only accept `http(s)` URLs.
- Update any validation/sanitization (allow URL only, no `data:image/`).
- Update save routines to avoid persisting base64.

### Milestone 4: Legacy Data Migration
**Outcome:** Existing base64 images are migrated safely.
- Add a migration routine when loading drafts:
  - If `data:image/`, upload to Storage.
  - Replace the field with the URL in Firestore.
- Add a migration routine when publishing:
  - Enforce upload and URL replacement before publish.
- Track migration status (optional) to avoid repeated uploads.

### Milestone 5: Cleanup and Hardening
**Outcome:** Base64 is fully removed from production paths.
- Remove or deprecate base64-based helpers.
- Add Storage cleanup for orphaned images on delete.
- Update docs and team guidance.

---

## Risks and Mitigations
- **Upload latency for drafts:** Use immediate local preview + background upload.
- **Storage cost growth:** Add size limits and compression.
- **Orphaned files:** Track old URLs and delete on replace or deletion.
- **Migration errors:** Keep base64 rendering as fallback until URL is saved.
- **Unsplash compliance:** Store and display attribution for any Unsplash-sourced image.
- **Third-party dependency:** Avoid hotlinking Unsplash for published quizzes; re-host in Storage on publish.
- **Privacy concerns:** Document that Unsplash is a third-party; prefer re-hosted assets for public views.

---

## Acceptance Criteria
- Drafts can be saved and re-opened with images intact via URLs.
- No Firestore document contains base64 image data.
- Quizzes with many images remain below Firestore document limits.
- Upload/replace/remove flows work for cover, outcomes, questions, and brand kit logo.
- Unsplash-sourced images store attribution metadata and render it where required.
- Published quizzes do not depend on Unsplash hotlinks (images are re-hosted).

---

## Suggested Next Steps
1) Approve the storage path conventions and allowed formats.  
2) Implement client upload helpers and replace base64 flows.  
3) Add the legacy migration hook for existing data.  
4) Test with quizzes containing 10+ images and verify Firestore sizes.
5) Define attribution display requirements and add UI for Unsplash-sourced images.
6) Add a publish-time re-hosting step for Unsplash URLs (preserve attribution).
