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

## Code Quality Principles

**Always prioritize code maintainability over shortcuts:**
- Single source of truth for data models - avoid storing the same data in multiple formats
- No "temporary" solutions that add conversion layers - they become permanent tech debt
- When suggesting architectural decisions, ALWAYS present tradeoffs to the user
- If a solution requires converters/adapters between formats, question if it's the right approach

**Before implementing workarounds, ask:**
1. Will this add a conversion/translation layer?
2. Will future features need to maintain multiple code paths?
3. Is there a cleaner approach that takes slightly longer now but saves time later?

## Design System & Reusable Components

**Always think in terms of reusable components to avoid redundancy and ensure consistency:**

- Before writing UI code, check if a component already exists in `components/ui/` that solves the need
- If you find yourself copying the same styling pattern across multiple files, **proactively propose creating a reusable component**
- When updating styles that appear in multiple places, ask: "Should this be a component instead?"

**Existing UI components to use:**
- `SectionTitle` - Uppercase muted labels for grouping controls (e.g., "TIPO DE MÍDIA", "REORDENAR")
- `Label` - Form field labels tied to specific inputs (e.g., "Texto do botão", "URL de destino")
- `GhostAddButton` - Dashed "add item" buttons with consistent styling
- `Button`, `Input`, `Switch`, `Select` - Standard form controls from shadcn/ui
- `ToggleGroup` - Segmented control for mutually exclusive options

**SectionTitle vs Label:**
- Use `SectionTitle` for section headers that group multiple controls (ToggleGroups, lists, upload areas)
- Use `Label` for individual form fields with `htmlFor` attribute linking to an input

**When to create a new component:**
1. The same pattern appears 3+ times across files
2. A style change would require updating multiple files manually
3. The pattern has clear, consistent behavior worth encapsulating

**Component guidelines:**
- Place in `components/ui/` for generic components
- Include JSDoc with `@example` for discoverability
- Add basic tests in `components/ui/__tests__/`
- Accept `className` prop for customization when appropriate
- Keep components focused - one responsibility per component

## Current Development Focus

Milestone 5A (Core Flows) is in progress: auto-save integration, quiz loading, publish flow. See the implementation plan for task breakdown.
