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

### Milestone 2: Step Navigation (Week 3)
*"Adding the doors between rooms"*

**Goal:** Navigate between steps, add/delete/reorder steps

**Tasks:**
- [ ] Wire step list to Zustand store
- [ ] Click step to select it
- [ ] Add step button with type picker sheet
- [ ] Delete step (protect fixed ones: Intro, Result)
- [ ] Drag-and-drop reorder (desktop)
- [ ] Manage outcomes (add, delete, rename)

**Success:** Full step CRUD working, data persists to Firestore

---

### Milestone 3: Block Rendering (Week 4)
*"Furnishing the rooms"*

**Goal:** All block types render in preview, can click to select

**Tasks:**
- [ ] Build block renderer (switch on block type)
- [ ] Build all 9 block previews (Header, Text, Media, Options, Fields, Price, Button, Banner, List)
- [ ] Click block to select it (highlight)
- [ ] Show insertion points between blocks
- [ ] Replace all emojis with Lucide icons

**Success:** Preview looks like the prototype, clicking works

---

### Milestone 4: Properties Panel (Week 5)
*"Installing the control panels"*

**Goal:** Edit any block from the right panel

**Tasks:**
- [ ] Build dynamic properties panel (changes based on selection)
- [ ] Build all 9 block config editors
- [ ] Block controls: enable/disable, move up/down, delete
- [ ] Step settings: show progress bar, allow back button
- [ ] Back navigation (block → step list)

**Success:** Can edit every block type, changes reflect in preview instantly

---

### Milestone 5: AI Chat Integration (Week 6)
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

### Milestone 6: Mobile Layout (Week 7)
*"Making it pocket-sized"*

**Goal:** Full mobile experience from prototype

**Tasks:**
- [ ] Build collapsible step rail (icons when collapsed)
- [ ] Build expandable sidebar (70% overlay when expanded)
- [ ] Build bottom drawer for block editing
- [ ] Build overflow menu (actions dropdown)
- [ ] Touch drag-and-drop for reordering
- [ ] Test on real devices (iOS Safari, Android Chrome)

**Success:** Mobile experience matches prototype, smooth animations

---

### Milestone 7: Polish (Week 8)
*"Interior decorating and final touches"*

**Goal:** Production-ready quality

**Tasks:**
- [ ] Update auto-save for visual builder
- [ ] Update quiz loading flow
- [ ] Complete publish flow
- [ ] Keep publish/update/unpublish behavior identical to production (draft/live separation)
- [ ] Light mode CSS variables
- [ ] Theme toggle component
- [ ] Performance optimization (memoization, lazy loading)
- [ ] Accessibility pass (keyboard nav, screen readers)

**Success:** All flows work end-to-end, light/dark modes polished

---

### Milestone 8: Dashboard Rebuild (Week 9)
*"Building the new lobby"*

**Goal:** New dashboard matching prototype design

**Key Change:** Instead of "Create" going directly to the builder, it now opens a modal with options.

**Create Flow:**
1. User clicks "+ Create Quiz" button
2. Modal opens with 3 creation methods:
   - **AI Assistant** (coming soon) - Chat creates the quiz
   - **Blank Quiz** - Start from scratch
   - **Templates** (coming soon) - Pre-built structures
3. User picks "Blank Quiz" → enters name + slug
4. Redirects to visual builder

**Tasks:**
- [ ] Quiz list with cards view
- [ ] Empty state (no quizzes yet)
- [ ] "Create quiz" modal with creation method picker
- [ ] Quiz name + URL slug form (step 2 of modal)
- [ ] Slug auto-generation from name
- [ ] Keep old dashboard at `/dashboard-legacy` during transition (fallback only)
- [ ] Translate all dashboard strings

**Success:** New dashboard fully functional in all 3 languages

---

### Milestone 9: Rollout (Week 10)
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
Week 2:  Three-column layout shell
Week 3:  Step navigation + CRUD
Week 4:  Block rendering + preview
Week 5:  Properties panel + editing
Week 6:  AI chat integration
Week 7:  Mobile layout
Week 8:  Polish + themes
Week 9:  Dashboard rebuild
Week 10: Testing + rollout
```

**Total: 10 weeks**
