# UX Specification: Visual Builder

This document captures UX behavior and interaction intent from the prototype. The prototype is a UX reference only.
Visual styling must follow the MultiQuiz design system tokens from `app/globals.css` and the current product aesthetic.
All class examples below should use token-based utilities (e.g., `bg-card`, `text-muted-foreground`, `border-border`, `ring-ring`),
never hard-coded palette values.

---

## 0. Design System Alignment (Required)

- Use design system color tokens for every surface, border, ring, and text state.
- Use radius tokens from `app/globals.css` (e.g., `rounded-[var(--radius-lg)]`).
- Interactive elements use `cursor-[var(--cursor-interactive)]`; disabled elements use `cursor-[var(--cursor-not-allowed)]`.
- Match the existing MultiQuiz UI patterns; do not replicate the prototype's exact visual styling.

---

## 1. Block Preview Interactions

### Hover State on Blocks
When hovering over a block in the preview:
- Block gets a subtle muted surface (`hover:bg-muted/30`)
- Border/ring uses token color (`hover:ring-2 hover:ring-border`)
- Action buttons fade in at top-right corner of the block

### Action Buttons (Edit/Delete)
- Position: Floating above the block, right-aligned (`absolute -top-3 right-2`)
- Hidden by default (`opacity-0`)
- Fade in on hover (`group-hover:opacity-100`)
- Styling: Tokenized buttons (`bg-secondary text-secondary-foreground`)
- On hover: Edit stays secondary, Delete uses destructive (`hover:bg-destructive hover:text-destructive-foreground`)

### Selected State on Blocks
When a block is selected:
- Primary ring around block (`ring-2 ring-ring`)
- Subtle primary tint background (`bg-primary/10`)
- Action buttons always visible (not just on hover)
- Action buttons use primary background (`bg-primary text-primary-foreground`)

### Transition Timing
- All transitions: `transition-all` with default duration
- Opacity transitions: `transition-opacity`

---

## 2. Block Insertion Points

### Between-Block Insertion
Between every two blocks, there's a hidden insertion point:

**Default State:**
- Nearly invisible: just 2px height (`h-0.5`)
- No visual elements shown

**Hover State:**
- Height expands to 24px (`hover:h-6`)
- Vertical margin appears (`hover:my-1`)
- Dashed border appears (`border-dashed border-border/60`)
- Light muted background (`bg-muted/30`)
- Primary + button fades in at center
- Button scales up slightly on hover (`hover:scale-110`)

**Click Behavior:**
- Opens Add Block sheet
- Remembers insertion position (`insertAtIndex`)
- New block added at that specific position

### Add Block Button (End of List)
At the bottom of blocks:
- Dashed border button (`border-2 border-dashed border-border/60`)
- Muted text (`text-muted-foreground`)
- On hover: Primary border and text (`hover:border-primary/60 hover:text-primary`)

---

## 3. Left Sidebar (Steps List)

### Desktop Step Items
**Default State:**
- Muted surface (`bg-muted/40`)
- Transparent border (`border-transparent`)

**Hover State:**
- Slightly stronger muted surface (`hover:bg-muted/60`)

**Active/Selected State:**
- Subtle primary tint (`bg-primary/10`)
- Primary border (`border-primary/30`)
- Step icon in primary circle (`bg-primary text-primary-foreground`)
- Step label in primary text (`text-primary`)

### Drag-Over State (Desktop)
- Light blue background with dashed blue border
- Shows where step will be dropped

### Delete Button on Steps
- Only shows on hover (`opacity-0 group-hover:opacity-100`)
- Destructive on hover (`hover:text-destructive`)
- Not shown for fixed steps (Intro, Result)

### Add Step Button
- Dashed border, muted text
- On hover: Primary border and text

---

## 4. Mobile Sidebar (Collapsible Rail)

### Collapsed State (56px width)
- Shows only icons in circles (`w-11 h-11`)
- Step number below icon (`text-[10px]`)
- Active step: Primary background (`bg-primary text-primary-foreground`)
- Inactive: Muted background (`bg-muted text-muted-foreground`)

### Expanded State (70% width)
- Overlays content with shadow (`shadow-xl`)
- Backdrop behind (`bg-background/70`)
- Full step cards with icon, number, label, and subtitle
- Transition: `transition-all duration-300`

### Touch Drag & Drop
- On drag start: Item becomes semi-transparent and slightly smaller (`opacity-50 scale-95`)
- Drag over: Primary dashed border on target
- Uses touch events: `onTouchStart`, `onTouchMove`, `onTouchEnd`

---

## 5. Header Tabs

### Tab Styling
**Default State:**
- Muted text (`text-muted-foreground`)
- No background

**Hover State:**
- Foreground text (`hover:text-foreground`)

**Active State:**
- Card background with shadow (`bg-card shadow-sm`)
- Foreground text (`text-foreground`)

### Tab Transitions
- Smooth transition on all properties (`transition-all`)

---

## 6. Floating AI Chat

### Collapsed State (Pill)
- Centered at bottom (`bottom-6 left-1/2 -translate-x-1/2`)
- Card background, rounded full (`rounded-full`)
- Shadow that grows on hover (`shadow-lg hover:shadow-xl`)
- Primary/accent icon on left
- Placeholder text
- Arrow icon on right

### Expanded State (Card)
- Fixed width 500px
- Rounded corners (`rounded-[var(--radius-lg)]`)
- Large shadow (`shadow-xl`)
- Header with branded icon, title, "Beta" badge
- Message history area (scrollable, 256px height)
- Input area with primary/accent icon

### Chat Message Bubbles
- User messages: Primary background, right-aligned, rounded with small top-right corner (`rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)]`)
- AI messages: Muted background, left-aligned, rounded with small top-left corner (`rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)]`)
- Max width 80% of container

### Mobile: AI FAB
- Fixed bottom-right (`bottom-6 right-4`)
- Primary circle button (`w-14 h-14 bg-primary text-primary-foreground`)
- Icon centered
- On tap: Opens full-screen chat overlay

---

## 7. Properties Panel (Right Side)

### Panel Sections
- Card/background surface, full height
- Left border (`border-l`)
- Scrollable content area

### Block List (No Selection)
Each block row shows:
- Block icon (emoji or Lucide in final)
- Block label
- Move up/down buttons (visible on hover)
- Delete button (visible on hover)
- Visibility toggle indicator

### Block Selected View
- Back button (`← Voltar`) at top
- Block icon and label as header
- Move/delete controls in header
- Block-specific configuration below
- "Remover bloco" button at bottom

### Toggle Switches
- Track: Muted when off (`bg-muted`), primary when on (`bg-primary`)
- Thumb: White circle that slides (`translate-x-4` when on)
- Transition on color and position

---

## 8. Device Toggle (Preview)

### Position
- Floating top-left of preview area (`absolute top-4 left-4`)
- Card background with shadow (`bg-card shadow-md`)
- Rounded corners (`rounded-[var(--radius-lg)]`)
- Small padding (`p-1`)

### Toggle Buttons
**Default State:**
- Muted icon (`text-muted-foreground`)

**Hover State:**
- Muted background (`hover:bg-muted/60`)

**Active State:**
- Primary tint background (`bg-primary/15`)
- Primary icon (`text-primary`)

### Icons
- Mobile: Phone SVG icon
- Desktop: Monitor SVG icon

---

## 9. Sheets & Modals

### Add Step Sheet (Mobile)
- Slides up from bottom (`animate-in slide-in-from-bottom`)
- Rounded top corners (`rounded-t-[var(--radius-lg)]`)
- Card/background surface
- Grid of step type cards
- Each card: Icon, title, description
- Disabled cards: 50% opacity, no interaction (`cursor-not-allowed`)

### Add Block Sheet
- Similar slide-up animation
- Grid of block type options
- Already-used blocks may be disabled (e.g., only one Options block per step)

### Mobile Overflow Menu
- Slides in from top (`slide-in-from-top-2`)
- Rounded corners (`rounded-[var(--radius-lg)]`)
- Shadow (`shadow-xl`)
- List of actions with icons
- Danger actions use destructive (`text-destructive`)

---

## 10. Progress Bar

### Visibility
- Controlled by step setting `showProgress`
- Shows inside preview card at top

### Styling
- Muted track (`bg-muted h-1 rounded-full`)
- Primary fill (`bg-primary rounded-full`)
- Width calculated: `(currentIndex + 1) / totalSteps * 100%`
- Smooth transition (`transition-all duration-300`)

---

## 11. Empty States

### No Blocks
- Centered muted text
- "Nenhum bloco" message

### No Outcomes (Result Step)
- Dashed border container (`border-dashed border-border/60`)
- Emoji icon (dimmed 50%)
- Message text
- Primary CTA button to create outcome

### Media Without URL
- Destructive warning styling
- Dashed border (`border-dashed border-destructive/40`)
- Destructive background (`bg-destructive/10`)
- Warning icon and message in `text-destructive`

---

## 12. Form Controls

### Text Inputs
- Full width
- Border styling (`border border-input rounded-[var(--radius-md)]`)
- Padding (`px-3 py-2`)
- Focus: Ring token (`focus:ring-ring`)

### Textareas
- Same as inputs
- Specified rows for different use cases

### Select/Dropdown
- Same base styling as inputs
- Chevron icon on right

### Checkboxes
- Custom styled with rounded corners
- Primary when checked

---

## 13. Button Variants

### Primary
- Primary background (`bg-primary`)
- Primary foreground (`text-primary-foreground`)
- Hover: Slightly darker/stronger (`hover:bg-primary/90`)

### Secondary/Ghost
- Muted surface or transparent
- Muted text (`text-muted-foreground`)
- Hover: Muted surface (`hover:bg-muted/60`) and `text-foreground`

### Destructive
- Destructive text (`text-destructive`)
- Hover: Destructive tint (`hover:bg-destructive/10`)

### Dashed (Add Actions)
- Dashed border (`border-2 border-dashed border-border/60`)
- Muted by default (`text-muted-foreground`)
- Primary on hover (`hover:border-primary/60 hover:text-primary`)

---

## 14. Animation Keyframes Used

From globals.css:
- `animate-in` / `animate-out`
- `slide-in-from-bottom` / `slide-out-to-bottom`
- `slide-in-from-top-2`
- `fade-in` / `fade-out`
- `transition-all duration-300` for sidebar expansion

---

## 15. Z-Index Layers

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base content | 0 | Preview card, main content |
| Floating controls | 10 | Device toggle, block action buttons |
| AI Chat | 20 | Floating chat pill/card |
| Mobile sidebar expanded | 20 | Expanded sidebar overlay |
| Mobile AI FAB | 30 | Primary floating button |
| Mobile menu backdrop | 40 | Background overlay |
| Mobile drawer | 40 | Block edit drawer |
| Modals/Sheets | 50 | Confirmation dialogs |

---

## 16. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Collapsible rail, bottom drawer, FAB |
| Tablet (768-1024px) | Hide right panel, show on selection |
| Desktop (>1024px) | Full three-column layout |

---

## 17. Design System Tokens (Required)

Use the design system tokens from `app/globals.css` for all visual styling:

### Core surfaces and text
- `background`, `foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`

### Brand and status
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`

### Utility
- `border`, `input`, `ring`
- Radius tokens: `--radius`, `--radius-lg`, `--radius-md`, `--radius-sm`
- Cursor tokens: `--cursor-interactive`, `--cursor-not-allowed`

---

## Summary: Key Interactions to Implement

1. **Block hover → action buttons fade in**
2. **Insertion point between blocks → expand on hover → show + button**
3. **Step items → hover highlight → active state with blue**
4. **Mobile rail → tap to expand → overlay with shadow**
5. **Touch drag → opacity/scale feedback → drop zone highlight**
6. **AI pill → tap to expand → slide up animation**
7. **Tabs → smooth active state transition**
8. **Toggle switches → slide animation**
9. **Sheets → slide from bottom animation**
10. **Progress bar → width transition**
