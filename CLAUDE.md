# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MultiQuiz is a Next.js SaaS platform for creating interactive quizzes with AI assistance. The app uses Firebase (Auth, Firestore, Storage), Stripe for payments, and OpenRouter for AI features.

**Important:** The codebase is transitioning from a chat-based quiz builder to a new **Visual Builder** (v03). When the user refers to "quiz builder", "preview mode", or "editor", they mean the **new UX redesign** documented in `documents/UX_REDESIGN_IMPLEMENTATION_PLAN.md`. The legacy builder at `/editor-legacy` is being phased out.

## Commands

```bash
npm run dev          # Start dev server on port 3500
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Single test run
npm run test:coverage # Run tests with coverage
```

Single test file: `npx vitest run path/to/file.test.ts`

## Architecture

### Visual Builder (New UX - v03)

The new builder uses a **three-column layout** inspired by Typeform/Figma:
- **Left sidebar**: Steps list (vertical timeline) + Outcomes section
- **Center**: Live preview with device toggle (mobile/desktop)
- **Right panel**: Properties editor for selected step/block

**Data Model:**
- **Step**: Container with blocks (types: `intro`, `question`, `lead-gen`, `promo`, `result`)
- **Block**: Content unit (types: `header`, `text`, `media`, `options`, `fields`, `price`, `button`, `banner`, `list`)
- **Outcome**: Result page content, selected based on quiz answers

**Key files:**
- `store/visual-builder-store.ts` - Zustand store for all builder state
- `components/visual-builder/` - All new builder components
- `types/blocks.ts` - Block type definitions and configs

### Services Layer

All Firebase/external API interactions go through services in `lib/services/`:
- `quiz-service.ts` - Quiz CRUD, loading, saving
- `ai-service.ts` - OpenRouter AI integration
- `analytics-service.ts` - Quiz attempt tracking
- `storage-service.ts` - Firebase Storage for images
- `brand-kit-service.ts` - Theme/branding

### Key Patterns

**State Management:** Zustand with devtools middleware. The visual builder store manages steps, blocks, outcomes, and selection state.

**Auto-save:** Hooks in `lib/hooks/` handle debounced saves to Firestore. Draft changes don't affect the live quiz until explicit publish.

**Drag-and-drop:** Uses `@dnd-kit` for step reordering and list item reordering.

**Rich text:** Tiptap editor for text blocks with formatting toolbar.

### Route Structure

```
app/
├── (landing)/          # Public landing page
├── (auth)/login/       # Authentication
├── dashboard/          # User dashboard, leads, reports, account
├── visual-builder/     # NEW quiz editor
│   └── [id]/           # Editor for specific quiz
├── quiz/[id]/          # Quiz player (taker view)
└── api/                # Backend routes (stripe, openrouter, etc.)
```

### Testing

Tests use Vitest + React Testing Library with TDD approach. Tests focus on structure and behavior, not copywriting. Mock for react-player is at `test/__mocks__/react-player.tsx`.

## Documentation

- `documents/UX_REDESIGN_IMPLEMENTATION_PLAN.md` - Source of truth for builder UX and implementation
- `documents/UX_REDESIGN_CHANGELOG.md` - Historical UX iteration decisions
- `knowledge-base/` - Non-technical docs for co-founders/CS team (no code references)

## Current Development Focus

Milestone 5A (Core Flows) is in progress: auto-save integration, quiz loading, publish flow. See the implementation plan for task breakdown.
