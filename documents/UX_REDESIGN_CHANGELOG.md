# Quiz Builder UX Redesign Changelog

## Status

This document is historical. The source of truth for UX behavior is the prototype and `documents/UX_REDESIGN_IMPLEMENTATION_PLAN.md`.
Keep this file only as a changelog of UX iterations and decisions that led to the current prototype.

Prototype reference: `http://localhost:3500/prototype`

---

## Changelog

This section tracks the iterations and changes made during the prototyping process.

### Post-Milestone 4: UX Polish & Enhancements
**Date:** January 2025

**What was done:**
Series of UX improvements and enhancements to the visual builder after milestone 4 completion.

**Key Enhancements:**

**1. Rich Text Editor for Text Block:**
- Integrated Tiptap editor with formatting toolbar
- Supports: bold, italic, underline, strikethrough, text alignment (left/center/right)
- Default alignment set to center
- SSR-compatible with `immediatelyRender: false`

**2. Drag-and-Drop for List Block Editor:**
- List items now support drag-and-drop reordering using @dnd-kit
- Matches the Options block editor pattern for consistency
- List block now shows 3 default items when added (instead of empty state)

**3. Block Limitations with Smart Feedback:**
- Options and Price blocks limited to one per page
- Disabled blocks show cursor-following tooltip: "Apenas um por página"
- Prevents duplicate interactive elements on same step

**4. Button Block Smart Defaults:**
- "Preço selecionado" action only appears when Price block exists on page
- When adding Button after Price block, defaults to "selected_price" action
- Context-aware options improve user experience

**5. Sidebar Restructure (Three-Section Layout):**
- **INTRODUÇÃO section**: Dedicated area for the fixed intro step
- **ETAPAS section**: Regular steps (questions, lead-gen, promo) with drag-and-drop
- **RESULTADOS section**: Outcomes list
- Single unified scroll for all sections (no independent scrolls)
- Consistent section title styling across all three sections

**6. Dotted Add Buttons:**
- "Adicionar etapa" button at bottom of Etapas section
- "Adicionar resultado" button at bottom of Resultados section
- Primary color (yellow) styling for better visibility
- Follows logical progression (content first, then add action)

**7. Live Preview Enhancements:**
- Progress bar displays in preview when enabled in step settings
- Back button displays in preview when enabled (except on intro step)
- Immediate visual feedback for step configuration changes

**Files Modified:**
- `components/visual-builder/editors/text-block-editor.tsx` - Tiptap integration
- `components/visual-builder/editors/list-block-editor.tsx` - Drag-and-drop rewrite
- `components/visual-builder/add-block-sheet.tsx` - Block limitations & tooltips
- `components/visual-builder/connected-visual-builder.tsx` - Sidebar restructure
- `components/visual-builder/sortable-steps-list.tsx` - Exclude intro step
- `components/visual-builder/step-preview.tsx` - Progress/back button preview
- `components/ui/ghost-add-button.tsx` - Primary color styling
- `types/blocks.ts` - Default list items

---

### Implementation: Milestone 4 - Properties Panel
**Date:** January 2025

**What was done:**
Implemented complete properties panel system with dynamic block editors, controls, and step settings.

**Development Approach:**
- **Test-Driven Development (TDD)** continued
- 270 tests written and passing (72 new tests for properties panel)
- Block editors created for all 9 block types
- Full integration with existing Zustand store

**Block Editors Implemented:**
1. **HeaderBlockEditor** - Title and description inputs
2. **TextBlockEditor** - Content textarea
3. **MediaBlockEditor** - Media type selector (image/video), URL input, alt text
4. **OptionsBlockEditor** - Selection type toggle, add/edit/delete options
5. **FieldsBlockEditor** - Add/edit/delete form fields with type, placeholder, required
6. **PriceBlockEditor** - Product title, price value with prefix/suffix, highlight toggle
7. **ButtonBlockEditor** - Button text, action type selector (next_step/url), URL input
8. **BannerBlockEditor** - Urgency level selector, emoji input, banner text
9. **ListBlockEditor** - Add/edit/delete list items with optional emojis

**Key Features:**
- Dynamic properties panel changes based on selection state
- Back navigation from block editor to step overview
- Block controls: enable/disable toggle, move up/down, delete
- Step settings: progress bar toggle, back button toggle
- Block list shortcuts for quick selection
- Outcome-specific block editing for result steps
- Context-aware button editor (intro disables URL, result disables next_step)

**Files Created:**
- `components/visual-builder/editors/` - 11 component files
- `components/visual-builder/connected-properties-panel.tsx`
- `components/ui/switch.tsx` - Toggle component
- `components/ui/separator.tsx` - Divider component

**UI Components Added:**
- Switch (Radix UI) - For toggle controls
- Separator (Radix UI) - For visual dividers

---

### Implementation: Milestone 3 - Block Rendering
**Date:** January 2025

**What was done:**
Implemented complete block rendering system with all 9 block types, selection, and insertion points.

**Development Approach:**
- **Test-Driven Development (TDD)** continued
- 198 tests written and passing (53 new tests for block functionality)
- Block types defined in dedicated types file
- Store extended with comprehensive block management

**Block Types Implemented:**
1. **Header** - Title and description with placeholder states
2. **Text** - Simple text content block
3. **Media** - Image/video with upload placeholder
4. **Options** - Single/multiple choice with radio/checkbox indicators
5. **Fields** - Form fields (text, email, phone, number, textarea)
6. **Price** - Product pricing with prefix/suffix and highlight option
7. **Button** - CTA button with next_step or URL action
8. **Banner** - Urgency alerts (info/warning/danger) with icons
9. **List** - Bullet list with optional emojis

**Key Features:**
- Click any block to select it (blue ring highlight)
- Insertion points between blocks expand on hover
- Add Block sheet with 9 block type options in grid layout
- Disabled blocks show "(desativado)" indicator
- Empty blocks show appropriate placeholder content
- Outcome blocks render when result step is active

**Files Created:**
- `types/blocks.ts` - All block type definitions and helpers
- `components/visual-builder/blocks/` - 12 component files
- `components/visual-builder/step-preview.tsx`
- `components/visual-builder/add-block-sheet.tsx`

**Store Enhancements:**
- `blocks` array in Step and Outcome interfaces
- `selectedBlockId` state
- Block CRUD actions (add, update, delete, toggle, reorder)
- Default blocks per step type
- Step settings (showProgress, allowBack)

---

### Implementation: Milestone 2 - Step Navigation
**Date:** January 2025

**What was done:**
Implemented full step navigation with Zustand store integration, drag-and-drop reordering, and outcome management.

**Development Approach:**
- **Test-Driven Development (TDD)** continued
- 145 tests written and passing
- Zustand store with devtools middleware
- @dnd-kit library for drag-and-drop

**Components Implemented:**
1. **VisualBuilderStore** - Zustand store with all step/outcome actions
2. **ConnectedVisualBuilder** - Store-connected main component
3. **SortableStepsList** - Drag-and-drop enabled step list
4. **AddStepSheet** - Bottom sheet for adding new steps

**Key Features:**
- Entire step card is draggable (not just icon)
- 3-dot menu with Duplicate/Delete options
- Fixed steps (Intro, Result) protected from deletion/reorder
- Steps cannot be moved before Intro or after Result
- Outcomes section with add/delete functionality
- Auto-select first outcome when navigating to Result step

**Store Actions:**
- Step: setSteps, addStep, updateStep, deleteStep, duplicateStep, reorderSteps
- Selection: setActiveStepId, setSelectedOutcomeId
- Outcome: setOutcomes, addOutcome, updateOutcome, deleteOutcome
- UI: setAddStepSheetOpen

**UI Improvements:**
- Text truncation to prevent sidebar overflow
- Drag cursor feedback (grab/grabbing)
- Dropdown menu instead of visible delete icons

---

### Implementation: Milestone 1 - The Shell
**Date:** January 2025

**What was done:**
Implemented the three-column visual builder shell following TDD (Test-Driven Development) approach.

**Development Approach:**
- **Test-Driven Development (TDD)** adopted for all new components
- Using **Vitest + React Testing Library** for testing
- Tests focus on **structure and behavior**, not copywriting (content will iterate)
- 54 tests written and passing before implementation considered complete

**Components Implemented:**
1. **VisualBuilder** - Main orchestrator that composes all sub-components
2. **BuilderHeaderNav** - Header with 5 navigation tabs (Editar, Assistente IA, Tema, Relatório, Configurações)
3. **BuilderSidebar** - Left sidebar with steps list, outcomes section, and add buttons
4. **BuilderPreview** - Center preview area with mobile/desktop device toggle
5. **BuilderProperties** - Right properties panel with title and back navigation support

**Key Features:**
- Three-column layout matching prototype design
- Tab navigation with proper accessibility (ARIA roles)
- Device toggle (375px mobile / 600px desktop preview)
- Step list with type icons, labels, and active states
- Outcomes section for result steps
- Responsive behavior: right panel hidden on mobile (`hidden md:flex`)
- All components use design system tokens from `globals.css`

**Files Created:**
- `components/visual-builder/` directory with 5 component files
- `components/visual-builder/__tests__/` with 5 test files
- `app/visual-builder/page.tsx` demo route
- `test/setup.ts` and `test/test-utils.tsx` for testing infrastructure
- `vitest.config.ts` for test configuration

**What's Next:**
Milestone 2 will wire the step list to Zustand store and implement step CRUD operations.

---

### Iteration 10 - Typeform-Inspired Layout & Options-to-Outcome Linking
**Date:** January 2025

**Changes:**

**1. Major Layout Restructure (Typeform-Inspired):**
- **Steps moved to left sidebar** instead of horizontal tabs:
  - Left sidebar shows all steps in a vertical list
  - Each step shows its number and custom label
  - Results section separated at the bottom with "+ Add resultado" button
- **Global header redesigned** with centered pill-style navigation:
  - Tabs: "Editar", "Assistente IA", "Tema", "Configurações"
  - Logo on left, Publish button on right
  - Clean, minimal aesthetic
- **Floating AI chat** at the bottom of the screen:
  - Collapsed by default (just input field)
  - Expands to show conversation history
  - Always accessible but doesn't consume layout space
- **Removed peek cards and horizontal step tabs**
- **Center preview area** now cleaner without navigation arrows

**2. Options Block - Outcome Linking:**
- Each option can now be **assigned to a Resultado**:
  - Dropdown selector next to each option text
  - Shows all available outcomes
  - "Não vinculado" for unassigned options
- **Empty state handling** when no outcomes exist:
  - Shows "Criar resultado" button instead of dropdown
  - Clicking navigates to Results section and creates an outcome
  - Better UX for new quiz creation flow
- **Preview shows linked outcome** as small badge below option text

**Architecture update:**
```typescript
interface OptionItem {
  id: string;
  text: string;
  outcomeId?: string;  // Links to outcome
}

interface OptionsConfig {
  items: OptionItem[];  // Changed from string[]
  selectionType: 'single' | 'multiple';
}
```

**3. Sidebar Header Consistency:**
- **Outcome headers now match step headers**:
  - Delete button added for outcomes (when >1 exists)
  - Same icon and interaction pattern
- **Step label editing now reflects in left sidebar**:
  - Left sidebar displays `step.label` directly
  - Right sidebar edits the same property
  - Immediate visual feedback

**4. Dashboard Page Added:**
- New `/prototype/dashboard` route for quiz management
- Empty state for no quizzes
- "Criar quiz" modal with creation options:
  - AI Assistant (coming soon)
  - Blank quiz (active)
  - Templates (coming soon)
- Quiz name and slug configuration form

**5. Block Insertion Points Refined:**
- Cleaner insertion point UI between blocks
- Better hover states and styling
- Consistent across all step types

**Rationale:**
The Typeform-inspired layout provides a more familiar editing experience. The vertical step list on the left gives better overview of quiz structure. The floating AI chat keeps the assistant accessible without dominating screen space. Option-to-outcome linking is essential for quiz logic - knowing which answer leads to which result.

---

### Iteration 9 - Navigation UX Improvements
**Date:** January 2025

**Changes:**

**1. Step Navigation Tabs - Simplified Naming:**
- All intermediate steps now display as **"Etapa 1", "Etapa 2", "Etapa 3"**, etc.
- Step type (question, lead-gen, promo) no longer affects the tab label
- Custom step titles edited in sidebar do NOT change the top navigation
- Fixed steps remain: "Intro" and "Resultado"

**2. Button Block - Context-Aware Actions:**
- **Intro step**: Button only advances to next step (no URL option)
  - Shows static message "→ Próxima etapa"
- **Result step**: Button only supports URL action
  - Shows URL input field directly
- **Other steps**: Both options available (→ Próxima / 🔗 URL)

**3. Block Preview - "Editar" Hover Labels:**
- Each block in preview shows **"editar"** label on hover (gray)
- When selected, shows **"editando"** label (blue)
- Helps users understand blocks are editable, not interactive quiz elements

**4. Peek Cards - Visual Flow Indicator:**
- **Previous step peek**: Small sliver visible at LEFT EDGE of preview area
- **Next step peek**: Small sliver visible at RIGHT EDGE of preview area
- Clicking on peek cards navigates to that step
- Creates visual understanding of the quiz flow

**5. Add Step Button in Preview:**
- **+ button** appears between current card and next step peek
- Opens the same "Add Step" sheet as the top navigation
- Only visible when not on the Result step
- Provides contextual way to add steps while editing

**Removed:**
- Navigation arrows (users navigate by clicking peek cards)
- Dotted placeholder for "no next step" (nothing shows if no next step)

---

### Iteration 8 - Results Page Refinement & Block System Update
**Date:** January 2025

**Changes:**

**1. Results Page - Shared Layout, Individual Content:**
- **Block structure is now shared** across all results:
  - Adding a block to one result adds it to all results
  - Removing a block removes it from all results
  - Reordering blocks reorders them in all results
  - Toggling blocks (ativo/oculto) toggles in all results
- **Content is individual** per result:
  - Each result has its own text, images, URLs, etc.
  - Editing content only affects the selected result
- **Result selector** now appears above the quiz card in preview (not in device toggle area)
- **Dropdown in block editor** shows which result's content is being edited
- **New result inherits structure** from existing results automatically

**2. Block System Renamed:**
- **"Texto" renamed to "Cabeçalho"** (Header block):
  - Icon: 🏷️
  - Fields: Title + Description (both optional)
  - Preview shows placeholder text when empty (not warning)
  - Used as the main header/title block for pages
- **New "Texto" block** added for simple paragraphs:
  - Icon: 📝
  - Fields: Single textarea for content
  - Preview shows "Clique para adicionar texto..." when empty
  - Used for body text, explanations, disclaimers, etc.

**3. Fixed Steps UI:**
- **Intro and Resultado** step titles are now fixed (not editable):
  - "Introdução" displays as static header
  - "Tela de resultados" displays as static header
- Other steps (Pergunta, Captura, Promocional) remain editable

**4. Empty States Improved:**
- **Results empty state** shows dotted border container with:
  - Icon: 🎯 (dimmed)
  - Message: "Nenhum resultado criado"
  - CTA: "+ Criar tela resultado"
- **Creating new result** auto-activates name editing
- **First result** comes with placeholder content ("Título do Resultado")
- **Subsequent results** inherit block structure but with empty content

**5. Preview Warnings:**
- **Media without URL**: Shows amber warning with dashed border
- **Button without text**: Shows amber warning
- **Header without content**: Shows gray placeholder text (not warning)
- **Text block without content**: Shows gray italic placeholder

**Architecture update:**
```typescript
type BlockType = 'header' | 'text' | 'media' | 'options' | 'fields' | 'price' | 'button' | 'banner' | 'list';

interface HeaderConfig {
  title?: string;       // Optional
  description?: string; // Optional
}

interface TextConfig {
  content: string;      // Simple text content
}
```

**Rationale:**
The original "Texto" block was trying to serve two purposes: header/title and body text. Splitting into "Cabeçalho" (header) and "Texto" (body) provides clearer semantics. The shared layout approach for results ensures consistency across outcomes while allowing per-result customization of content. This matches how users think about results: "same structure, different content."

---

### Iteration 7 - Text Block, Floating Controls & UI Polish
**Date:** January 2025

**Changes:**
- **Renamed "Cabeçalho" to "Texto" block:**
  - More generic and flexible - can be used anywhere on a page, not just as a header
  - Title is now **optional** (was mandatory before)
  - Renamed "Subtítulo" to "Descrição" with textarea input for longer text
  - Empty text blocks show placeholder: "Clique para adicionar texto"
- **Preview area redesigned:**
  - Removed header toolbar completely
  - **Floating device toggle** (top-left) with proper SVG icons, larger touch targets
  - **Floating preview button** (top-right) with play icon
  - Both have white background with shadow for visibility
- **Sidebar improvements:**
  - Step names now show full Portuguese names: "Introdução", "Pergunta 1", "Pergunta 2", "Captura", "Promocional"
  - No more abbreviations like "Intro", "P1", "P2"
  - **Delete button** (🗑) moved from preview toolbar to sidebar header, aligned right
  - Edit pencil still available for renaming steps
- **Options block preview:**
  - Single selection ("única"): No radio button indicator, cleaner look
  - Multiple selection ("múltipla"): Checkbox indicator shown

**Architecture update:**
```typescript
type BlockType = 'text' | 'media' | 'options' | 'fields' | 'price' | 'button' | 'banner' | 'list';

interface TextConfig {
  title?: string;      // Optional
  description?: string; // Optional (was "subtitle")
}
```

**Step template defaults updated:**
- Intro: text, media, fields, button
- Pergunta: text, media, options
- Captura: text, media, fields, button
- Promocional: banner, text, media, list, button
- Resultado: text, media, price, list, button (per outcome)

**Rationale:**
The "Cabeçalho" (Header) block implied it should be at the top of a page. Renaming to "Texto" makes it clear users can add text blocks anywhere - for explanations, disclaimers, or additional context in the middle of a step. The floating controls give more space to the preview and create a cleaner interface.

---

### Iteration 6 - Universal Block-Based Architecture
**Date:** January 2025

**Changes:**
- **All step types now use blocks** - Unified editing model across the entire builder:
  - Intro: text, media, fields, button blocks
  - Pergunta: text, media, options blocks
  - Captura: text, media, fields, button blocks
  - Promocional: banner, text, media, list, button blocks
  - Resultado: text, media, price, list, button blocks (per outcome)
- **Block types introduced:**
  - `text` - Title and description (both optional)
  - `media` - Image or video with type selector
  - `options` - Answer options with single/multiple choice toggle
  - `fields` - Dynamic form fields with label, type, placeholder, required
  - `price` - Product pricing with title, value, prefix, suffix, highlight badge
  - `button` - CTA button with text, action type, destination URL
  - `banner` - Urgency/alert banner with style selector (info/warning/alert) and emoji
  - `list` - Bullet point list items
- **Block management features:**
  - Reorder blocks with up/down arrows
  - Toggle blocks active/hidden (oculto)
  - Add new blocks from available types per step template
  - Remove blocks (click when selected)
- **Config tab removed entirely** - All configuration now happens within block-specific views
- **Click-to-select in preview** - Click any block to edit its configuration
- **Properties panel redesigned:**
  - Single "Blocos" view showing all blocks with status
  - Block-specific configuration when a block is selected
  - "← Voltar" navigation to return to block list

**Rationale:**
The Config tab was inconsistent across step types - some showed toggles, some showed summaries, some were empty. By adopting the block-based approach from Resultado across all step types, we achieve:
1. **Consistency** - Same editing pattern everywhere
2. **Flexibility** - Users can add/remove/reorder blocks as needed
3. **Extensibility** - Easy to add new block types in the future
4. **Simplicity** - One mental model for all editing

**Architecture:**
```typescript
type BlockType = 'text' | 'media' | 'options' | 'fields' | 'price' | 'button' | 'banner' | 'list';

interface Block {
  id: string;
  type: BlockType;
  enabled: boolean;
  config: BlockConfig;
}

interface Step {
  id: string;
  type: StepType;
  label: string;
  isFixed?: boolean;
  blocks: Block[];
}
```

**Templates provide default blocks:**
- Each step type starts with sensible defaults
- Users can then customize by adding/removing/reordering blocks
- Available blocks are filtered by step type

---

### Iteration 5 - Flexible Captura Template & Step Tabs UI
**Date:** January 2025

**Changes:**
- **Flexible Captura template** - No longer limited to name/email/phone:
  - Users can add unlimited custom fields
  - Each field has: label, type, placeholder, required toggle
  - Field types: Text, Email, Phone, Number, Textarea (long text)
  - Add/remove fields dynamically
  - Customizable CTA button text
- **Step tabs UI improvements:**
  - Tabs are now centered on the page
  - "+ Etapa" button has primary color (blue) and text label
  - Button positioned before Resultado (which is always last)
  - Visual order: `[Intro] [P1] [P2] ... [+ Etapa] [Resultado]`
- Settings tab for Captura shows field summary with type icons

**Rationale:**
The Captura template was too rigid with predefined fields. Users need flexibility to collect different types of data depending on their use case (feedback forms, contact info, survey data, etc.). The step tabs UI changes make the "add step" action more discoverable and maintain clear visual hierarchy with Resultado always at the end.

**Future considerations:**
- Data storage structure for custom fields
- Report/analytics display for varied field types
- Field validation rules per type

---

### Iteration 4 - Block-Based Resultado with Price Component
**Date:** January 2025

**Changes:**
- Implemented component-level editing for Resultado page
- Added block-based architecture for outcomes:
  - Header block (title, subtitle) - always visible
  - Image block (toggle, URL input)
  - Price block (product title, value, prefix, suffix, highlight with badge)
  - CTA block (text, action type, destination URL)
- Click any block in preview to edit its specific configuration
- Properties panel shows block-specific forms when block selected
- "← Voltar para blocos" navigation to return to block list
- Block status indicators (ativo/oculto) in properties panel
- Outcome selector in preview toolbar shows which block is being edited

**Rationale:**
The Resultado page structure can grow complex with components like Price that need detailed configuration. Block-based editing allows each component to have focused, relevant options without overwhelming the user.

---

### Iteration 3 - Fixed Steps, Promocional Template, and Global Styling
**Date:** January 2025

**Changes:**
- Established fixed vs. deletable step concept:
  - Intro and Resultado are fixed (can't be deleted, always present)
  - Pergunta, Captura, Promocional are deletable
  - Visual indicator (●) for fixed steps in tabs
- Bottom sheet drawer now only shows internal pages:
  - Removed Intro and Resultado from template options
  - Added Promocional template
- Added Promocional step type with:
  - Alert banner toggle
  - Image placeholder toggle
  - CTA button toggle
  - Title and description
- Replaced per-component "Estilo" tab with global Brand Kit:
  - Primary/secondary color pickers
  - Logo upload placeholder
  - Accessible via header button
- Properties panel reduced to two tabs: Conteúdo and Config

**Rationale:**
Users were confused about which steps could be deleted. Global styling via Brand Kit is faster and ensures consistency. Promocional pages enable upsells and special offers within the quiz flow.

---

### Iteration 2 - Enhanced Step Configuration
**Date:** January 2025

**Changes:**
- Added prominent selection type toggle for questions (Única/Múltipla)
- Added media toggle for questions (Nenhuma/Imagem/Vídeo)
- Added optional name/email capture on Intro step
- Intro capture fields configurable in Settings tab
- Question preview shows selection type badge
- Fixed text contrast issues throughout prototype
- All text now has proper color classes for visibility

**Rationale:**
Selection type (single vs. multiple choice) is a critical decision that was buried. Media support needed to be more discoverable. Some users want to capture leads at the start of the quiz, not just before results.

---

### Iteration 1 - Initial Prototype
**Date:** January 2025

**Changes:**
- Created `/app/prototype/page.tsx` as standalone UX validation
- Implemented three-column layout:
  - Collapsible chat panel (left, 60px collapsed / 280px expanded)
  - Live preview with mobile/desktop toggle (center)
  - Properties panel with tabs (right)
- Step tabs with horizontal navigation
- Click-to-highlight interaction between preview and properties
- Bottom sheet for adding new steps
- Right-click to delete steps
- Mobile bottom tab bar (Preview/Editar/Chat)
- Basic content editing for all step types

**Rationale:**
Needed to validate the step-based builder concept before committing to full implementation. Prototype allows rapid iteration on UX without affecting production code.

---

### Initial Planning
**Date:** January 2025

**Problem Statement:**
- Current builder is chat-centric (60% chat, 40% editor)
- Quiz structure hidden in collapsed sidebar cards
- Editing requires modals/sheets (context switching)
- No live preview while editing
- Limited flexibility in quiz flow

**Proposed Solution:**
- Three-column visual builder
- Step-based navigation (like slides in a presentation)
- Collapsible AI chat (accessible but not dominant)
- Live preview with click-to-edit
- Page templates with configurable options

**Inspiration:**
- inlead.digital builder interface
- Presentation/prototyping tools (Figma, Keynote)
