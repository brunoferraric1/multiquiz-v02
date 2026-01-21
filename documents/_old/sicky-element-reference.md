# GraphOverlay Component — Technical Documentation

A reusable overlay component that displays a floating card on top of blurred/dimmed content. Used to indicate "more data needed" states while keeping the underlying graphs visible but inaccessible.

---

## Architecture Overview

The component uses a **3-layer stacking technique** with CSS positioning:

```
┌──────────────────────────────────────────────────────────┐
│ Container: position: relative                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Layer 3 (z-30): STICKY CARD                          │ │
│ │ • Floats on top while scrolling                      │ │
│ │ • sticky + top: 20vh keeps it fixed in viewport      │ │
│ └──────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Layer 2 (z-10): BLUR OVERLAY                         │ │
│ │ • absolute + inset: 0 covers entire parent           │ │
│ │ • backdrop-blur + bg-background/70 for frost effect  │ │
│ │ • pointer-events: none (allows click-through)        │ │
│ └──────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Layer 1 (z-0): GRAPHS CONTENT (children)             │ │
│ │ • opacity: 30% for subtle visibility                 │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Key CSS Techniques

### 1. Sticky Positioning for the Card

```css
sticky top-[20vh] z-30 flex justify-center pt-24 md:pt-40 mb-[-380px] md:mb-[-420px] pointer-events-none
```

| Property | Purpose |
|----------|---------|
| `sticky` | Card stays in normal doc flow but sticks to viewport when scrolling |
| `top-[20vh]` | Sticks 20% from the top of the viewport |
| `mb-[-380px]` | **Key trick**: Negative margin collapses space, allowing content behind to "come up" into the same visual area |
| `pointer-events-none` | Wrapper is non-interactive |
| `pointer-events-auto` (on Card) | Makes only the card itself clickable |

### 2. Blur Effect on the Overlay

```css
absolute inset-0 bg-background/70 backdrop-blur-[2px] rounded-lg z-10 pointer-events-none
```

| Property | Purpose |
|----------|---------|
| `absolute inset-0` | Stretches to cover entire relative parent |
| `backdrop-blur-[2px]` | Subtle blur effect on content behind |
| `bg-background/70` | 70% opacity background (adapts to light/dark mode) |
| `pointer-events-none` | Click-through for scrolling |

### 3. Dimmed Graph Content

```css
relative z-0 opacity-30
```

| Property | Purpose |
|----------|---------|
| `opacity-30` | Reduces graph visibility to 30% |
| `z-0` | Lowest z-index in the stack |

---

## The Negative Margin Trick Explained

1. The sticky card renders first in the DOM
2. Negative margin (`mb-[-380px]`) pulls following content **up into the same visual space**
3. The blur overlay (`absolute inset-0`) covers that entire area
4. The sticky card floats on top (`z-30 > z-10 > z-0`)

---

## Minimal Replication Template

```tsx
interface DataOverlayProps {
  children: React.ReactNode;
  showOverlay: boolean;
}

function DataOverlay({ children, showOverlay }: DataOverlayProps) {
  if (!showOverlay) return <>{children}</>;

  return (
    <div className="relative">
      {/* Floating sticky card */}
      <div className="sticky top-[20vh] z-30 flex justify-center pt-24 mb-[-380px] pointer-events-none">
        <div className="max-w-md p-6 bg-white shadow-xl border rounded-lg pointer-events-auto">
          <h3 className="text-lg font-semibold">More data needed</h3>
          <p className="text-sm text-gray-600 mt-2">
            Continue adding data to unlock these visualizations.
          </p>
          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md">
            Get Started
          </button>
        </div>
      </div>

      {/* Dimmed content */}
      <div className="relative z-0 opacity-30">
        {children}
      </div>

      {/* Blur overlay */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 pointer-events-none" />
    </div>
  );
}
```

---

## Usage Example

```tsx
<DataOverlay showOverlay={!hasRealData}>
  <YourGraphsComponent />
  <AnotherChart />
  <MoreContent />
</DataOverlay>
```

---

## Customization Guide

| What to adjust | Property | Notes |
|----------------|----------|-------|
| Card position while scrolling | `top-[20vh]` | Higher = lower on screen |
| Card/content overlap | `mb-[-380px]` | Match to your card height + desired overlap |
| Blur intensity | `backdrop-blur-[2px]` | Increase for stronger blur |
| Background opacity | `bg-white/70` | Lower number = more transparent |
| Content visibility | `opacity-30` | Lower = more faded |

---

## Original Source

- **File**: `src/components/dashboard/graph-overlay.tsx`
- **Project**: multimeta-crm-1
