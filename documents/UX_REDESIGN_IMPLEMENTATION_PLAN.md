# Visual Builder Implementation Plan

## The Big Picture

### What We're Doing

Think of the current quiz builder like a **text message conversation** - you chat with an AI and it builds your quiz. The new builder is more like **PowerPoint or Figma** - you see all your slides (steps) on the left, the current slide in the center, and properties on the right. You click, edit, and see changes instantly.

### The Approach: Fresh Start with Proven Parts

Imagine your builder is a house. The plumbing (auto-save, storage, AI) works great. But the floor plan is wrong for what you need.

**Our approach:** Keep the working systems (AI, storage, auth). Design a new data model from scratch (steps & blocks). Rebuild the UI to match. Since there are no customers yet, we don't need any conversion layers - just build it right the first time.

---

## Source of Truth (Frozen)

- The prototype defines UX behavior, layout, and interactions (left sidebar layout included).
- This document is the implementation plan and authoritative decisions.
- `documents/UX_REDESIGN_CHANGELOG.md` is historical/changelog-only and should not drive implementation.

---

## Why This Approach?

| Keep (It Works) | Rebuild (New Design) |
|-----------------|----------------------|
| AI assistant brain | Data model (steps & blocks) |
| Auto-save system | Three-column layout |
| Image storage | Block-based editing |
| User authentication | Live preview |
| Core services | Mobile experience |

**Clean slate:** Since there are no customers yet, we design the data model right from the start. No conversion layers, no legacy baggage. One simple model used everywhere.

---

## The Three Big Additions

### 1. Mobile-First Design
The prototype now has a beautiful mobile experience:
- **Collapsed rail**: Icon shortcuts for steps (like a vertical dock)
- **Expandable sidebar**: Swipe to see full step details
- **Bottom drawer**: Edit blocks without leaving the preview
- **Floating AI button**: Always accessible, never in the way

### 2. International Ready (PT-BR, EN, ES)
Every button, label, and message will work in three languages:
- URLs like `/pt-BR/dashboard` or `/en/dashboard`
- Automatic language detection
- AI responds in your language
- Your quiz content stays as you wrote it (we don't auto-translate that)
- Store a single `quizLocale` on the quiz for routing + editor defaults

### 3. Light & Dark Modes
- Toggle between themes anywhere
- Respects system preference by default

---

## Data Model Principles (Frozen)

- Steps and blocks are the only structural units in the builder.
- Resultado uses a shared block layout across outcomes; only content varies per outcome.
- Quiz content is stored once in the creator's language (`quizLocale`); UI is localized separately.
- Draft/live separation matches production: edits do not affect the live quiz until publish/update.

---

## Milestones & Tasks

### Milestone 0: Foundation (Week 1)
*"Laying the pipes before building the walls"*

**Goal:** Set up all the infrastructure for the new builder

**Tasks:**
- [ ] Design new data model (Steps, Blocks, Outcomes)
- [ ] Create Firestore schema for new format
- [ ] Define `quizLocale` storage + routing defaults
- [ ] Set up language system (dictionaries, detection, hooks)
- [ ] Create new route structure for locales
- [ ] Add feature flag to switch between builders

**Success:** New data model defined, language system working, routes ready

---

### Milestone 1: The Shell (Week 2) ✅ COMPLETED
*"Building the walls and windows"*

**Goal:** Three-column layout working with static content

**Tasks:**
- [x] Build main orchestrator component (`VisualBuilder`)
- [x] Create header with tab navigation (`BuilderHeaderNav`)
- [ ] Move Theme control from the builder sidebar to the top navigation
- [x] Build left sidebar skeleton (`BuilderSidebar` - steps list with outcomes)
- [x] Build center preview skeleton (`BuilderPreview` - device frame with toggle)
- [x] Build right panel skeleton (`BuilderProperties`)
- [x] Responsive breakpoints (right panel hidden on mobile, visible on md+)

**Development Approach:** Test-Driven Development (TDD) with Vitest + React Testing Library
- 54 tests written and passing
- Tests focus on structure, behavior, and integration (not copywriting)
- Components tested in isolation and together

**Components Created:**
- `components/visual-builder/visual-builder.tsx` - Main orchestrator
- `components/visual-builder/builder-header-nav.tsx` - Header with 5 tabs
- `components/visual-builder/builder-sidebar.tsx` - Steps list + outcomes
- `components/visual-builder/builder-preview.tsx` - Preview with device toggle
- `components/visual-builder/builder-properties.tsx` - Properties panel

**Success:** Three columns visible, tabs switch, responsive behavior works. Route available at `/visual-builder`

---

### Milestone 2: Step Navigation (Week 3) ✅ COMPLETED
*"Adding the doors between rooms"*

**Goal:** Navigate between steps, add/delete/reorder steps

**Tasks:**
- [x] Wire step list to Zustand store
- [x] Click step to select it
- [x] Add step button with type picker sheet
- [x] Delete step (protect fixed ones: Intro, Result)
- [x] Drag-and-drop reorder (desktop) using @dnd-kit
- [x] Manage outcomes (add, delete, rename)
- [x] Duplicate step functionality via 3-dot menu

**Development Approach:** Test-Driven Development (TDD) with Vitest + React Testing Library
- 145 tests written and passing
- Zustand store with devtools middleware for state management
- @dnd-kit for drag-and-drop functionality

**Components Created/Updated:**
- `store/visual-builder-store.ts` - Zustand store with step/outcome CRUD actions
- `components/visual-builder/connected-visual-builder.tsx` - Store-connected orchestrator
- `components/visual-builder/sortable-steps-list.tsx` - Drag-and-drop step list
- `components/visual-builder/add-step-sheet.tsx` - Bottom sheet for adding steps
- `components/visual-builder/connected-builder-sidebar.tsx` - Store-connected sidebar

**Key Features:**
- Steps are draggable (entire card) with visual feedback
- 3-dot menu on each step with Duplicate/Delete options
- Fixed steps (Intro, Result) cannot be deleted, duplicated, or reordered
- Outcomes section with add/delete functionality
- Result step auto-selects first outcome when navigated to

**Success:** Full step CRUD working with 145 passing tests

---

### Milestone 3: Block Rendering (Week 4) ✅ COMPLETED
*"Furnishing the rooms"*

**Goal:** All block types render in preview, can click to select

**Tasks:**
- [x] Build block renderer (switch on block type)
- [x] Build all 9 block previews (Header, Text, Media, Options, Fields, Price, Button, Banner, List)
- [x] Click block to select it (highlight with ring)
- [x] Show insertion points between blocks
- [x] Replace all emojis with Lucide icons
- [x] Add block sheet for inserting new blocks

**Development Approach:** Test-Driven Development (TDD) with Vitest + React Testing Library
- 198 tests written and passing (53 new tests for blocks)
- Block types defined in `types/blocks.ts`
- Store extended with block management actions

**Files Created:**
- `types/blocks.ts` - Block types, configs for all 9 block types, helper functions
- `components/visual-builder/blocks/` directory with:
  - `block-renderer.tsx` - Main switch component for rendering blocks by type
  - `block-list.tsx` - Renders blocks with selection and insertion points
  - `insertion-point.tsx` - Clickable area to insert new blocks
  - `header-block.tsx`, `text-block.tsx`, `media-block.tsx`
  - `options-block.tsx`, `fields-block.tsx`, `price-block.tsx`
  - `button-block.tsx`, `banner-block.tsx`, `list-block.tsx`
  - `index.ts` - Exports all block components
- `components/visual-builder/step-preview.tsx` - Renders blocks for active step/outcome
- `components/visual-builder/add-block-sheet.tsx` - Sheet to add new blocks

**Store Enhancements:**
- `blocks` array added to Step and Outcome interfaces
- `selectedBlockId` state for block selection
- Block actions: addBlock, updateBlock, deleteBlock, toggleBlock, reorderBlocks
- Separate actions for outcome blocks
- Default blocks generated per step type
- Step settings (showProgress, allowBack)

**Key Features:**
- All 9 block types render with appropriate previews
- Empty/placeholder states for blocks without content
- Disabled blocks show "(desativado)" indicator
- Click block to select (blue ring highlight)
- Insertion points appear between blocks on hover
- Add Block sheet with grid of block type options
- Outcome blocks render when result step is active

**Success:** Preview renders all block types, selection and insertion working with 198 passing tests

---

### Milestone 4: Properties Panel (Week 5) ✅ COMPLETED
*"Installing the control panels"*

**Goal:** Edit any block from the right panel

**Tasks:**
- [x] Build dynamic properties panel (changes based on selection)
- [x] Build all 9 block config editors
- [x] Block controls: enable/disable, move up/down, delete
- [x] Step settings: show progress bar, allow back button
- [x] Back navigation (block → step list)

**Development Approach:** Test-Driven Development (TDD) with Vitest + React Testing Library
- 270 tests written and passing (72 new tests for properties panel)
- Block editors for all 9 block types
- Full integration with Zustand store

**Files Created:**
- `components/visual-builder/editors/` directory with 11 component files:
  - `header-block-editor.tsx`, `text-block-editor.tsx`, `media-block-editor.tsx`
  - `options-block-editor.tsx`, `fields-block-editor.tsx`, `price-block-editor.tsx`
  - `button-block-editor.tsx`, `banner-block-editor.tsx`, `list-block-editor.tsx`
  - `block-controls.tsx` - Enable/disable, move up/down, delete
  - `step-settings-editor.tsx` - Progress bar and back button toggles
  - `index.ts` - Exports all editors
- `components/visual-builder/connected-properties-panel.tsx` - Dynamic panel orchestrator
- `components/ui/switch.tsx` - Toggle component
- `components/ui/separator.tsx` - Divider component

**Key Features:**
- Dynamic panel that changes based on selection (step, block, or outcome)
- All 9 block editors with full configuration support
- Block controls: enable/disable toggle, move up/down buttons, delete button
- Step settings: progress bar toggle, back button toggle
- Back navigation from block editor to step overview
- Block list shortcuts in step view
- Outcome-specific block editing for result steps

**Success:** Can edit every block type, changes reflect in preview instantly with 270 passing tests

---

### Milestone 4.5: UX Polish & Enhancements ✅ COMPLETED
*"Fine-tuning the experience"*

**Goal:** Polish block editors and sidebar UX after milestone 4

**Enhancements Completed:**
- [x] Rich text editor for Text block (Tiptap with bold, italic, underline, strikethrough, alignment)
- [x] Drag-and-drop reordering for List block editor (matching Options pattern)
- [x] Block limitations: Options and Price limited to one per page with tooltip feedback
- [x] Button block smart defaults (shows "Preço selecionado" only when Price exists)
- [x] Sidebar restructure: Three sections (INTRODUÇÃO, ETAPAS, RESULTADOS) with unified scroll
- [x] Dotted add buttons at bottom of Etapas and Resultados sections
- [x] Progress bar and back button now display in preview when enabled
- [x] Default list items (3 items instead of empty state)

**Key UX Improvements:**
- Single scroll for entire sidebar (no independent scrolls)
- Intro step separated into dedicated INTRODUÇÃO section
- Consistent section title styling throughout
- Primary color (yellow) for add buttons
- Logical content-first, add-action-last progression

**Success:** Polished editing experience with consistent patterns across all block types

---

### Milestone 5A: Core Flows (Week 6)
*"Making sure the engine runs"*

**Goal:** Auto-save, preview, and publish working end-to-end

**Tasks:**
- [ ] Update auto-save for visual builder (integrate with new data model)
- [ ] Update quiz loading flow (load existing quiz into visual builder)
- [ ] Complete publish flow (draft → live with explicit publish action)
- [ ] Keep publish/update/unpublish behavior identical to production (draft/live separation)
- [ ] Preview button in header opens quiz in new tab

**Success:** Can create, edit, save, preview, and publish a quiz with the new visual builder

---

### Milestone 5B: Top Navigation Tabs (Week 6-7)
*"Installing the control panels"*

**Goal:** Complete the top navigation experience (Tema, Configuração, Relatórios)

**Tasks:**
- [ ] **Tema tab** - Theme customization experience
  - Color palette selection
  - Logo upload
  - Font selection (if applicable)
  - Preview theme changes in real-time
- [ ] **Configuração tab** - Quiz settings
  - Quiz name and URL slug
  - SEO settings (title, description)
  - Analytics integration
  - Share settings
- [ ] **Relatórios tab** - Link to reports
  - Link to `/dashboard/[quizId]/report` (reuse existing reports page)
  - Show basic stats preview if available

**Success:** All top navigation tabs functional with appropriate content

---

### Milestone 5C: Quality Polish (Week 7)
*"Interior decorating and final touches"*

**Goal:** Production-ready quality and appearance

**Tasks:**
- [ ] Light mode CSS variables
- [ ] Theme toggle component (in header or settings)
- [ ] Performance optimization (memoization, lazy loading)
- [ ] Accessibility pass (keyboard nav, screen readers)

**Success:** Light/dark modes polished, smooth performance

---

### Milestone 5D: Data Collection System Refactor ✅ COMPLETED
*"Building the flexible data foundation"*

**Goal:** Evolve from fixed 3-field lead capture to flexible dynamic field collection across all quiz steps

**Context:** The previous system only captured name/email/phone from a dedicated "lead-gen" step. The new Visual Builder allows Fields blocks in ANY step type (intro, question, lead-gen, promo), requiring a complete refactor to support arbitrary custom fields.

**Architecture Decisions:**
- **No heuristics:** Removed all field-guessing logic (e.g., `if label.includes('nome')`)
- **No conversion layers:** Clean data model as single source of truth
- **Generic collection:** ALL fields from ALL steps captured uniformly
- **Terminology:** "Data Collection" / "Dados coletados" instead of "Leads"

**Tasks Completed:**
- [x] Updated data model with `FieldResponse` schema (types/index.ts)
- [x] Added `fieldResponses` array to `QuizAttempt` (primary storage)
- [x] Created `getFieldMetadata()` helper for dynamic column extraction
- [x] Refactored quiz player to collect ALL fields with full metadata
- [x] Updated API routes to return `fieldResponses` (app/api/leads, app/api/reports)
- [x] Transformed LeadsTable to fully dynamic with `DataColumn` and `DataRow` types
- [x] Updated Reports page with dynamic column generation
- [x] Built backward compatibility for legacy `lead` object format
- [x] Removed aggregate /dashboard/leads page (now quiz-specific only)
- [x] Updated navigation to remove "Leads" link
- [x] Updated i18n terminology (en, es, pt-BR)

**Files Modified:**
1. `types/index.ts` - Added FieldResponse schema, updated QuizAttempt
2. `lib/utils/visual-builder-helpers.ts` - Added getFieldMetadata()
3. `components/quiz/blocks-quiz-player.tsx` - Clean field collection from all steps
4. `app/api/leads/route.ts` - Returns collectedData with fieldResponses
5. `app/api/reports/route.ts` - Includes fieldResponses in response
6. `components/dashboard/leads-table.tsx` - Dynamic columns, exported DataColumn/DataRow types
7. `app/dashboard/reports/[quizId]/page.tsx` - Dynamic data integration, CSV export
8. `components/dashboard/dashboard-header.tsx` - Removed Leads navigation
9. `messages/{en,es,pt-BR}/common.json` - Removed navigation.leads

**Files Deleted:**
- `app/dashboard/leads/page.tsx` - Overall leads aggregation page

**Key Features:**
- Dynamic table columns generated from quiz structure (each quiz has unique columns)
- Full metadata stored per response (fieldId, label, type, value, stepId)
- CSV export with dynamic headers matching quiz fields
- Backward compatibility: handles both new `fieldResponses` and legacy `lead` formats
- Search across all field values (not just name/email/phone)
- Clean terminology: "Dados coletados" / "Respostas com dados informados"

**Success:** Production-ready dynamic data collection system with zero hacks, zero conversion layers, and full backward compatibility

---

### Milestone 6: Dashboard Update (Week 8)
*"Updating the lobby"*

**Goal:** Update dashboard with new create quiz modal

**Approach:** Reuse current dashboard UI - the main change is the "Create" flow.

**Create Flow:**
1. User clicks "+ Create Quiz" button
2. Modal opens with 3 creation methods:
   - **AI Assistant** (coming soon) - Chat creates the quiz
   - **Blank Quiz** - Start from scratch
   - **Templates** (coming soon) - Pre-built structures
3. User picks "Blank Quiz" → enters name + slug
4. Redirects to visual builder

**Tasks:**
- [ ] "Create quiz" modal with creation method picker
- [ ] Quiz name + URL slug form (step 2 of modal)
- [ ] Slug auto-generation from name
- [ ] Connect "Editar" action on quiz cards to visual builder
- [ ] Keep old builder at `/editor-legacy` during transition (fallback only)

**Success:** Dashboard creates quizzes via new modal, opens visual builder for editing

---

### Milestone 7: Mobile Layout (Week 9)
*"Making it pocket-sized"*

**Goal:** Full mobile experience from prototype

**Initial Approach - Desktop-Only Gate:**
Before building the full mobile experience, we'll first block mobile access to the quiz editor with a friendly message: "Para usar o editor de quiz, use um desktop". Other simpler pages/screens (dashboard, settings, etc.) can remain mobile-accessible.

**Tasks:**
- [ ] **Phase 1: Desktop-only gate** - Block mobile access to visual builder with friendly message
- [ ] Build collapsible step rail (icons when collapsed)
- [ ] Build expandable sidebar (70% overlay when expanded)
- [ ] Build bottom drawer for block editing
- [ ] Build overflow menu (actions dropdown)
- [ ] Touch drag-and-drop for reordering
- [ ] Test on real devices (iOS Safari, Android Chrome)

**Success:** Mobile experience matches prototype, smooth animations

---

### Milestone 8: AI Chat Integration (Week 10)
*"Connecting the smart home system"*

**Goal:** Floating AI chat works, full chat in tab

**Tasks:**
- [ ] Build floating chat pill (collapsed state)
- [ ] Build expanded chat overlay
- [ ] Extract chat logic from old builder (reuse, don't rewrite)
- [ ] Wire AI to new data model (via adapters)
- [ ] Full chat interface in "AI Assistant" tab

**Success:** AI can modify quiz through chat, both floating and full views work

---

### Milestone 9: Rollout (Week 11)
*"Grand opening"*

**Goal:** Safe transition to new builder

**Tasks:**
- [ ] Enable feature flag for internal testing
- [ ] QA all existing quiz loading
- [ ] Test complete flow: create → edit → publish
- [ ] Test all 3 locales end-to-end
- [ ] Monitor for errors
- [ ] Gradual user rollout (10% → 50% → 100%)

**Success:** All users on new builder, zero data loss

---

## Risk Mitigation

| What Could Go Wrong | How We Prevent It |
|--------------------|-------------------|
| AI chat behaves differently | Extract logic as-is, don't rewrite |
| Performance gets worse | Profile and optimize before release |
| Users are confused | Feature flag lets us rollback instantly |
| Mobile breaks on some devices | Test on real devices early and often |
| Data model needs changes later | Design thoroughly upfront, review with team |

---

## Key Decisions Made

1. **Dashboard:** Rebuild with prototype design
2. **Mobile:** Implement the collapsible rail + bottom drawer approach
3. **Reports:** Link to `/dashboard/[quizId]/report`
4. **Rollout:** Feature flag with legacy builder as temporary fallback only
5. **Languages:** Build i18n-ready from day one (PT-BR, EN, ES)
6. **Source of truth:** Prototype + this plan (left sidebar layout)
7. **Resultados:** Shared layout across outcomes, per-outcome content only
8. **Quiz language:** Store `quizLocale`, no auto-translation

---

## What Stays the Same

- **AI capabilities:** Same extraction, image generation
- **Image storage:** Same Cloud Storage service
- **Authentication:** Same user accounts
- **Pricing/billing:** Same Stripe integration
- **Core services:** Reused and extended
- **Publish behavior:** Draft/live separation with explicit update to live

## What Gets Updated

- **Quiz Player:** Updated to read new step/block format
- **Data Model:** New Firestore schema (steps + blocks)
- **Store:** New Zustand store for visual builder
- **Auto-save:** Adapted to save new format

---

## What Changes

| Before | After |
|--------|-------|
| Chat takes 60% of screen | Chat is collapsible or floating |
| Edit in modals/sheets | Edit in right panel |
| No live preview while editing | Always-visible preview |
| Questions listed in sidebar | Steps with visual timeline |
| Dark mode only | Light + dark modes |
| Portuguese only | PT-BR, EN, ES |
| Desktop-focused | Mobile-first design |
| "Create" goes to builder | "Create" opens modal with options |
| Flat data (questions array) | Structured data (steps + blocks) |

---

## UX Patterns to Implement

**Full specification:** See `UX_SPECIFICATION.md` for complete details.

### Key Interaction Patterns

| Pattern | Behavior |
|---------|----------|
| **Block hover** | Gray ring + action buttons fade in at top-right |
| **Block selected** | Blue ring + blue background, buttons always visible |
| **Insertion point** | 2px line expands to 24px on hover, shows + button |
| **Step hover** | Subtle background change |
| **Step active** | Blue background + blue icon circle |
| **Mobile rail collapse** | 56px icons → 70% full cards overlay |
| **Touch drag** | Item shrinks + fades, drop zone highlights |
| **AI chat pill** | Expands to 500px card with slide animation |
| **Toggle switch** | Thumb slides, track changes color |
| **Sheets** | Slide up from bottom with fade |

### Animations to Implement
- `transition-all` for most state changes
- `transition-opacity` for fade effects
- `duration-300` for sidebar expansion
- `slide-in-from-bottom` for sheets
- `hover:scale-110` for insertion + button

### Color Patterns
- **Selection:** `blue-50` bg, `blue-500` ring, `blue-200` border
- **Hover:** `gray-50` bg, `gray-300` ring
- **AI elements:** `purple-50` to `purple-600`
- **Warnings:** `amber-50` bg, `amber-300` border
- **Destructive:** `red-500` icons, `red-50` hover bg

---

## Timeline At a Glance

```
Week 1:  Foundation + i18n setup
Week 2:  Three-column layout shell ✅
Week 3:  Step navigation + CRUD ✅
Week 4:  Block rendering + preview ✅
Week 5:  Properties panel + editing ✅
Week 5.5: UX Polish & Enhancements ✅
Week 6:  5A - Core Flows (auto-save, preview, publish) + 5D - Data Collection Refactor ✅
Week 7:  5B - Top Nav Tabs (Tema, Configuração, Relatórios) + 5C - Quality Polish ← CURRENT
Week 8:  Dashboard update (create modal)
Week 9:  Mobile layout (desktop-only gate first)
Week 10: AI chat integration
Week 11: Testing + rollout
```

**Total: 11 weeks**
