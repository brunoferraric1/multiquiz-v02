# Agent Guidelines

1. Always respect the design system tokens defined in `app/globals.css` (colors, radii, spacing, cursor states) and avoid hard-coding values that should come from those variables.
2. Follow the cursor rule: use `var(--cursor-interactive)` for active/focusable elements and `var(--cursor-not-allowed)` for disabled states instead of literal strings, so every component shares the same pointer treatment.
3. Prefer the existing Tailwind/system utilities and CSS custom properties to keep styling maintainable across the stack.
