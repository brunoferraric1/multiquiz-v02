# Quiz Builder UX Redesign Proposal

## Executive Summary

This document describes a proposed new direction for the Quiz Builder user experience. The goal is to shift from a chat-centric interface to a more visual, step-based builder that gives users better control and visibility over their quiz structure.

**Prototype available at:** `http://localhost:3500/prototype`

---

## The Problem with Current UX

### Current Layout
The existing builder has two main areas:
- **Chat (60% of screen)**: The primary way users interact with the quiz
- **Editor sidebar (40%)**: Shows cards for Introduction, Questions, Outcomes, and Lead Gen

### Pain Points

1. **Chat dominates the screen**
   - The AI chat takes most of the space, leaving limited room for actual editing
   - Users who prefer manual editing feel constrained

2. **Quiz structure is hidden**
   - Questions are collapsed in a list - hard to see the full flow
   - No visual representation of how the quiz progresses

3. **Limited flexibility**
   - Pre-defined sections (Intro → Questions → Lead Gen → Results)
   - Users can't easily reorder or visualize the funnel flow

4. **Editing happens in modals/drawers**
   - Every edit requires opening a sheet/modal
   - Context-switching between viewing and editing

5. **No live preview while editing**
   - Users have to open a separate preview to see how it looks
   - Disconnect between editing and visualizing

---

## The New Approach: Step-Based Builder

### Core Concept

Think of the quiz as a **sequence of steps** that users navigate through. Each step is a page in the funnel:
- **Intro** (fixed) - Welcome/introduction page
- **Question pages** (P1, P2, etc.) - One per question
- **Captura** - Lead capture form
- **Promocional** - Promotional/offer pages
- **Resultado** (fixed) - Outcome pages with multiple possible results

Users can see and manage these steps visually, similar to slides in a presentation or screens in a prototyping tool.

### Fixed vs. Deletable Steps

| Step Type | Behavior |
|-----------|----------|
| **Intro** | Fixed - always first, can't be deleted |
| **Pergunta** | Deletable - add/remove as needed |
| **Captura** | Deletable - add/remove as needed |
| **Promocional** | Deletable - add/remove as needed |
| **Resultado** | Fixed - always last, can't be deleted |

### New Layout (Three-Column - Typeform-Inspired)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]  │  [Editar] [Assistente IA] [Tema] [Config]  │ Publicar │
├──────────┼───────────────────────────────────────────┼──────────┤
│          │                                           │          │
│  STEPS   │           Live Preview                    │ PROPS    │
│          │                                           │          │
│ ▼ Etapas │    ┌────────────────────────────┐         │ Step     │
│ ├ Intro  │    │                            │         │ Title    │
│ ├ P1     │    │   What the user will see   │         │ ───────  │
│ ├ P2     │    │   for the selected step    │         │          │
│ └ P3     │    │                            │         │ Blocos:  │
│          │    │   Click any element to     │         │ □ Header │
│ ▼ Results│    │   select and edit it       │         │ □ Media  │
│ ├ R1     │    │                            │         │ □ Options│
│ └ + Add  │    └────────────────────────────┘         │ □ Button │
│          │                                           │          │
├──────────┴───────────────────────────────────────────┴──────────┤
│  🤖 [Ask AI anything...]                              [↑ Expand] │
└──────────────────────────────────────────────────────────────────┘

- Left sidebar: Step list with Etapas and Results sections
- Center: Live preview with floating device toggle
- Right: Properties panel with block configuration
- Bottom: Floating AI chat input (expands to show history)
```

---

## Key UX Changes

### 1. Step Tabs (Horizontal Navigation)

**What it is:** A horizontal row of tabs below the header, showing all steps in the quiz.

**How it works:**
- Each tab represents one step (Intro, P1, P2, Captura, Resultado, etc.)
- Fixed steps (Intro, Resultado) have a visual indicator (●)
- Click a tab to select that step
- Drag tabs to reorder the flow (except fixed steps)
- Right-click for options (delete, duplicate) - only for non-fixed steps
- [+] button at the end to add new internal pages

**Why it's better:**
- Full visibility of quiz structure at a glance
- Easy to understand the user journey
- Quick navigation between any step
- Clear distinction between fixed and editable steps

---

### 2. Collapsible Chat Panel

**What it is:** The AI assistant moves to a narrow left panel that can expand or collapse.

**How it works:**
- Collapsed state: Shows just an icon (~60px wide)
- Expanded state: Full chat interface (~280px wide)
- Click to toggle between states
- Chat history and input remain functional

**Why it's better:**
- AI is still accessible when needed
- Doesn't dominate the screen
- Users can choose how much space to dedicate to chat
- More room for the actual content

---

### 3. Live Preview (Center Panel)

**What it is:** A real-time preview of the currently selected step, exactly as users will see it.

**How it works:**
- Shows the selected step rendered as it will appear
- Toggle between mobile and desktop preview sizes
- Click on any element or block to select it
- Clicking an element highlights the corresponding field in the properties panel
- For Resultado: Shows outcome selector to preview different results

**Why it's better:**
- Always see what you're building
- No need to open a separate preview
- Direct manipulation - click what you want to edit
- Instant feedback on changes

---

### 4. Properties Panel (Right Side)

**What it is:** A dedicated panel for editing the selected step's content and settings.

**How it works:**
- Two tabs: **Conteúdo** (Content), **Config** (Settings)
- Content tab: Edit text, options, media, blocks
- Settings tab: Behavior options (fields to collect, capture toggles, etc.)
- When you click an element in the preview, the corresponding field gets highlighted

**Why it's better:**
- All editing in one place, no modals needed
- Organized in logical tabs
- Direct connection to the preview
- Always visible while you work

---

### 5. Global Styling (Brand Kit)

**What it is:** Instead of per-component styling, all visual branding is managed through a centralized Brand Kit.

**How it works:**
- Access via "🎨 Brand Kit" button in header
- Configure primary color, secondary color, and logo
- Changes apply globally to all steps and components
- Consistent look across the entire quiz

**Why it's better:**
- Faster to configure - set once, applies everywhere
- Consistent branding throughout the quiz
- Simpler interface - no style tabs on each component
- Professional results without design skills

---

### 6. Add Step Flow (Bottom Sheet)

**What it is:** When users click [+] to add a new step, a bottom sheet slides up with template options.

**Available templates (internal pages only):**
- **Pergunta** (Question): Multiple choice question page
- **Captura** (Lead Gen): Lead capture form
- **Promocional** (Promo): Promotional/offer page with image, alert, and CTA

**Note:** Intro and Resultado are not shown because they are fixed steps that are always present.

**How it works:**
- Click [+] button in the step tabs
- Bottom sheet slides up with template cards
- Select a template
- New step is created and inserted before Resultado
- Step is automatically selected for editing

**Why it's better:**
- Clean, focused selection interface
- Only shows relevant, addable templates
- Works well on both desktop and mobile
- Doesn't confuse users with fixed steps

---

### 7. Component-Level Editing (Block System)

**What it is:** Complex pages like Resultado use a block-based approach where users click individual components to configure them.

**How it works:**
- Resultado page is composed of configurable blocks
- Click any block in the preview to select it
- Properties panel shows that block's specific configuration
- Toggle blocks on/off, configure their content and appearance

**Why it's better:**
- Scales to complex page structures
- Intuitive direct manipulation
- Each block has focused, relevant options
- Easy to enable/disable features per result

---

## Page Templates and Configuration

### Philosophy: Templates + Block Configuration

Simple pages use configurable templates. Complex pages (like Resultado) use a block-based system for component-level control.

| Step Type | Configuration Approach |
|-----------|------------------------|
| **Intro** | Template with toggles (title, description, optional name/email capture) |
| **Pergunta** | Template with options (question text, options, single/multiple, media toggle) |
| **Captura** | Flexible form builder (custom fields with label, type, placeholder, required) |
| **Promocional** | Template with toggles (image, alert banner, CTA, text content) |
| **Resultado** | Block-based with multiple outcomes (header, image, price, CTA blocks) |

### Resultado: Block-Based Configuration

The Resultado step is special because:
1. It can have **multiple outcomes** (different results based on quiz answers)
2. Each outcome has **configurable blocks** that can be enabled/disabled

**Outcome Management:**
- Select which outcome to preview/edit from dropdown in preview toolbar
- Add/remove outcomes in properties panel
- Each outcome has its own block configuration

**Available Blocks:**

| Block | Configuration Options |
|-------|----------------------|
| **Header** | Title, subtitle (always visible) |
| **Image** | Toggle on/off, image URL |
| **Price** | Toggle on/off, product title, value, prefix (e.g., "20% off"), suffix (e.g., "à vista"), highlight toggle, highlight text (e.g., "RECOMENDADO") |
| **CTA** | Toggle on/off, button text, action type (URL or next step), destination URL |

**Block Editing Flow:**
1. Navigate to Resultado step
2. Select an outcome from dropdown (if multiple)
3. Click a block in the preview OR click block name in properties panel
4. Properties panel shows that block's specific settings
5. Edit and see changes instantly in preview
6. Click "← Voltar para blocos" to return to block list

---

## Step-Specific Configuration

### Intro Step

**Content Tab:**
- Title (text input)
- Description (textarea)

**Settings Tab:**
- Capture name checkbox (shows name field on intro)
- Capture email checkbox (shows email field on intro)

### Pergunta (Question) Step

**Content Tab:**
- Selection type toggle (Única / Múltipla) - prominently displayed
- Media toggle (Nenhuma / Imagem / Vídeo)
- Question text (input)
- Answer options (list with add/remove)

**Settings Tab:**
- (Selection and media options are in Content for quick access)

### Captura Step

**Content Tab:**
- Title (text input)
- Description (textarea)
- **Custom fields** (dynamic list):
  - Each field has: Label, Type, Placeholder, Required toggle
  - Field types: Text, Email, Phone, Number, Textarea
  - Add/remove fields with "+ Adicionar campo" button
- CTA button text

**Settings Tab:**
- Summary view of configured fields with type icons
- Redirects user to Content tab for field management

### Promocional Step

**Content Tab:**
- Title (text input)
- Description (textarea)
- CTA text (if CTA enabled)
- Alert text (if alert enabled)

**Settings Tab:**
- Show image (checkbox)
- Show CTA button (checkbox)
- Show alert banner (checkbox)

### Resultado Step

**Content Tab (no block selected):**
- Outcome cards (click to select, add/remove outcomes)
- Block list with status indicators (ativo/oculto)

**Content Tab (block selected):**
- Back button to return to block list
- Block type indicator
- Block-specific configuration fields

---

## AI Integration

The AI assistant remains fully integrated but works within the step-based model:

### What AI Can Do

1. **Populate content**: "Preencha as perguntas sobre skincare"
2. **Add multiple steps**: "Adicione 5 perguntas sobre tipo de pele"
3. **Navigate**: "Vá para a pergunta 2"
4. **Configure**: "Faça essa pergunta ser múltipla escolha"
5. **Guide users**: "Me ajude a criar um quiz completo"
6. **Configure blocks**: "Adicione um preço no resultado 1"

### How It Works With Steps

- AI knows which step is currently selected
- Commands like "mude o título" work on the current step
- AI can create multiple steps at once
- AI can navigate to specific steps after creating them
- AI understands block structure for Resultado configuration

---

## Mobile Experience

The three-column layout adapts to mobile with a tab-based approach:

```
┌─────────────────────────┐
│  ← Voltar     Publicar  │
├─────────────────────────┤
│   ◀ [P1] [P2] [P3] ▶    │  ← Step carousel
├─────────────────────────┤
│                         │
│                         │
│   Full-screen content   │
│   based on selected     │
│   bottom tab            │
│                         │
│                         │
├─────────────────────────┤
│ Preview │ Editar │ Chat │  ← Bottom tab bar
└─────────────────────────┘
```

- **Preview tab**: See the current step
- **Editar tab**: Edit properties for current step
- **Chat tab**: Full chat interface

---

## Comparison: Current vs Proposed

| Aspect | Current UX | Proposed UX |
|--------|------------|-------------|
| **Primary focus** | AI Chat | Visual builder |
| **Quiz structure** | Hidden in sidebar cards | Visible in step tabs |
| **Fixed steps** | Not explicit | Clear visual indicator |
| **Editing** | Modals/sheets | Inline properties panel |
| **Preview** | Separate modal | Always visible, live |
| **Adding content** | AI-driven or sidebar buttons | Step tabs + bottom sheet |
| **Reordering** | Drag in collapsed list | Drag tabs |
| **Styling** | Per-component (complex) | Global Brand Kit (simple) |
| **Resultado config** | Single card in sidebar | Block-based with outcomes |
| **Mobile** | Toggle chat/editor | Tab bar navigation |
| **Screen usage** | 60% chat, 40% sidebar | Balanced three columns |

---

## What We Need to Validate

### With the Prototype

1. **Does the block-based Resultado work well?**
   - Is click-to-edit intuitive for blocks?
   - Is the price component useful?
   - Is outcome management clear?

2. **Is the fixed/deletable step distinction clear?**
   - Do users understand they can't delete Intro/Resultado?
   - Is the visual indicator sufficient?

3. **Does the Brand Kit approach work?**
   - Is global styling sufficient?
   - Do users miss per-component styling?

4. **Is the bottom sheet template selection good?**
   - Is it clear which templates are available?
   - Is the Promocional template useful?

### Questions to Discuss

1. Should the chat start expanded or collapsed by default?
2. What additional blocks might Resultado need? (testimonials, features list, etc.)
3. Should we allow multiple Price blocks for comparison?
4. How should the Promocional step integrate with quiz logic?
5. What happens when there are many steps (10+ questions)?

---

## Next Steps

1. **Test the prototype** at `http://localhost:3500/prototype`
2. **Gather feedback** from the team on block-based editing
3. **Decide** if this direction is worth pursuing
4. **Refine** based on feedback
5. **Plan implementation** in phases

---

## Appendix: Prototype Features

The prototype demonstrates:

- ✅ **Typeform-inspired layout** with left sidebar step list
- ✅ **Global header** with centered pill-style navigation tabs
- ✅ **Floating AI chat** at bottom (expands on click)
- ✅ Left sidebar with step list and results section
- ✅ Fixed step indicators (Intro, Resultado)
- ✅ "+ Add resultado" button in results section
- ✅ Live preview with device toggle (floating controls)
- ✅ Click-to-select blocks in preview
- ✅ Add step bottom sheet (Pergunta, Captura, Promocional only)
- ✅ Delete button in sidebar header for non-fixed steps
- ✅ Brand Kit modal for global styling
- ✅ **Dashboard page** at `/prototype/dashboard`
- ✅ **Options-to-outcome linking** with dropdown selectors
- ✅ **Universal block-based architecture:**
  - All step types use blocks (not just Resultado)
  - Blocks: header, text, media, options, fields, price, button, banner, list
  - Click any block in preview to select and edit
  - Block-specific configuration panels
  - Reorder blocks with up/down arrows
  - Toggle blocks active/hidden (oculto)
  - Add new blocks from available types per step template
  - Remove blocks when selected
  - "← Voltar" navigation to return to block list
- ✅ **Header block (Cabeçalho):**
  - Title + Description (both optional)
  - Shows placeholder text when empty
  - Used for page titles and headers
- ✅ **Text block (Texto):**
  - Simple textarea for content
  - Shows placeholder when empty
  - Used for body text, explanations, etc.
- ✅ **Step template defaults:**
  - Intro: header, text, media, fields, button
  - Pergunta: header, text, media, options
  - Captura: header, text, media, fields, button
  - Promocional: banner, header, text, media, list, button
  - Resultado: header, text, media, price, list, button (per outcome)
- ✅ **Results page - shared layout:**
  - Block structure shared across all results
  - Content individual per result
  - New results inherit structure from existing ones
  - Result selector above preview card
- ✅ **Floating preview controls:**
  - Device toggle (mobile/desktop) floating top-left with SVG icons
  - Preview button floating top-right with play icon
  - No header toolbar
- ✅ **Sidebar improvements:**
  - Full step names: "Introdução", "Pergunta 1", etc.
  - Delete button in sidebar header (for non-fixed steps)
  - Edit pencil for renaming
- ✅ **Outcome management for Resultado:**
  - Multiple outcomes with selector dropdown
  - Each outcome has its own block configuration
  - Add/delete outcomes

**Not implemented in prototype:**
- Drag-and-drop reordering (uses up/down arrows instead)
- Real data persistence
- AI integration
- Actual image upload (uses URL input)
- Full Brand Kit color application

---

## Changelog

This section tracks the iterations and changes made during the prototyping process.

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
