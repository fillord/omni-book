# Stack Research

**Domain:** Semantic theming — Tailwind CSS 4.x + shadcn/ui dark mode correctness
**Researched:** 2026-03-17
**Confidence:** HIGH (all findings grounded in actual globals.css, component source, and official Tailwind 4 docs)

---

## The Core Mechanism: How Tokens Become Utilities

This is not a theoretical question. The app's `globals.css` already implements the full system. Understanding it precisely determines every replacement decision.

### Step 1 — CSS custom properties defined in `:root` and `.dark`

```css
/* app/globals.css — light theme */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0.01 250);
  --card: oklch(1 0 0);
  /* ... all tokens */
}

/* dark theme — same variable names, different values */
.dark {
  --background: oklch(0.12 0.01 250);
  --foreground: oklch(0.98 0 0);
  /* ... all tokens */
}
```

The `.dark` selector override is the entire mechanism. When next-themes adds `class="dark"` to `<html>`, every CSS variable defined under `.dark` takes precedence via cascade. No JavaScript, no React state, no conditional rendering — pure CSS.

### Step 2 — `@theme inline` bridges variables to Tailwind's utility system

```css
/* app/globals.css — @theme inline block */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  /* ... all tokens mapped as --color-* */
}
```

Tailwind CSS 4 uses a namespace convention: anything defined as `--color-{name}` in `@theme` generates utility classes `bg-{name}`, `text-{name}`, `border-{name}`, `ring-{name}`, etc.

The `inline` keyword is critical. Without it, `var(--background)` would resolve once at compile time using the variable's definition context, breaking the dynamic reference. With `inline`, the utility class generates `background-color: var(--background)` in the final CSS — preserving the live CSS variable reference that switches on `.dark`.

### Step 3 — next-themes sets the class

`components/theme-providers.tsx` configures next-themes with `attribute: 'class'`. When the user toggles theme, next-themes sets `<html class="dark">`. The `.dark` CSS block activates. All `var(--*)` references cascade to their dark values. Every `bg-background`, `text-foreground`, etc. updates automatically across the entire document.

### Step 4 — Body baseline

```css
/* app/globals.css — @layer base */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

The body baseline is already set. Any component that inherits text color correctly gets `text-foreground` for free. Components that hardcode `text-gray-900` bypass this inheritance.

---

## Complete Token Inventory

These are the exact tokens defined in `app/globals.css`. No others exist — do not invent new ones.

### Surface Tokens (backgrounds)

| CSS Variable | Tailwind Utility | Light Value | Dark Value | Semantic Meaning |
|---|---|---|---|---|
| `--background` | `bg-background` | `oklch(1 0 0)` — pure white | `oklch(0.12 0.01 250)` — very dark blue-gray | Page/app background |
| `--card` | `bg-card` | `oklch(1 0 0)` — white | `oklch(0.16 0.01 250)` — dark card surface | Cards, panels, containers |
| `--popover` | `bg-popover` | `oklch(1 0 0)` — white | `oklch(0.16 0.01 250)` — dark popover | Dropdowns, tooltips, popovers |
| `--muted` | `bg-muted` | `oklch(0.96 0.01 250)` — light gray | `oklch(0.2 0.02 250)` — dark muted | Secondary areas, table alternates, skeletons |
| `--secondary` | `bg-secondary` | `oklch(0.96 0.01 250)` — light gray | `oklch(0.2 0.02 250)` — dark secondary | Secondary interactive elements |
| `--accent` | `bg-accent` | `oklch(0.96 0.01 250)` — light gray | `oklch(0.25 0.02 250)` — slightly lighter | Hover highlights, subtle accents |
| `--primary` | `bg-primary` | `oklch(0.45 0.18 260)` — indigo | `oklch(0.65 0.18 260)` — bright indigo | Brand primary, CTA buttons |
| `--destructive` | `bg-destructive` | `oklch(0.58 0.22 27)` — red | `oklch(0.7 0.19 22)` — lighter red | Error/danger states |
| `--sidebar` | `bg-sidebar` | `oklch(0.98 0.005 250)` — near white | `oklch(0.12 0.01 250)` — dark sidebar | Sidebar panel background |

### Text Tokens (foregrounds)

| CSS Variable | Tailwind Utility | Semantic Meaning |
|---|---|---|
| `--foreground` | `text-foreground` | Primary body text on `--background` |
| `--card-foreground` | `text-card-foreground` | Text inside card/panel surfaces |
| `--popover-foreground` | `text-popover-foreground` | Text inside popovers/dropdowns |
| `--muted-foreground` | `text-muted-foreground` | Secondary/subdued text, captions, timestamps |
| `--secondary-foreground` | `text-secondary-foreground` | Text on secondary backgrounds |
| `--accent-foreground` | `text-accent-foreground` | Text on accent backgrounds |
| `--primary-foreground` | `text-primary-foreground` | Text on primary (indigo) backgrounds |
| `--destructive` | `text-destructive` | Error text, danger labels |
| `--sidebar-foreground` | `text-sidebar-foreground` | Text inside sidebar |
| `--sidebar-primary-foreground` | `text-sidebar-primary-foreground` | Text on sidebar primary elements |
| `--sidebar-muted-foreground` | N/A — not defined | Not available |

### Border & Input Tokens

| CSS Variable | Tailwind Utility | Semantic Meaning |
|---|---|---|
| `--border` | `border-border` | Default dividers, card borders, separators |
| `--input` | `border-input` | Form field borders; also `bg-input` for input backgrounds |
| `--ring` | `ring-ring`, `outline-ring` | Focus rings on interactive elements |
| `--sidebar-border` | `border-sidebar-border` | Sidebar internal dividers |

### Sidebar Extended Tokens

These exist for sidebar-specific theming and allow the sidebar to have a subtly different shade from the main content area.

| CSS Variable | Utility | Purpose |
|---|---|---|
| `--sidebar` | `bg-sidebar` | Sidebar panel |
| `--sidebar-foreground` | `text-sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | `bg-sidebar-primary`, `text-sidebar-primary` | Active/highlighted sidebar items |
| `--sidebar-primary-foreground` | `text-sidebar-primary-foreground` | Text on highlighted sidebar items |
| `--sidebar-accent` | `bg-sidebar-accent` | Sidebar hover states |
| `--sidebar-accent-foreground` | `text-sidebar-accent-foreground` | Text on sidebar hover states |
| `--sidebar-border` | `border-sidebar-border` | Sidebar dividers |
| `--sidebar-ring` | `ring-sidebar-ring` | Focus rings in sidebar |

### Chart Tokens

These are for data visualization only — do not use for general UI.

| Variable | Utility | Notes |
|---|---|---|
| `--chart-1` through `--chart-5` | `bg-chart-1` etc., `text-chart-1` etc. | Recharts data series colors only |

### Radius Tokens

| Variable | Utility | Value |
|---|---|---|
| `--radius` | (base value) | `0.5rem` |
| `--radius-sm` | `rounded-sm` | `calc(0.5rem * 0.6)` |
| `--radius-md` | `rounded-md` | `calc(0.5rem * 0.8)` |
| `--radius-lg` | `rounded-lg` | `0.5rem` |
| `--radius-xl` | `rounded-xl` | `calc(0.5rem * 1.4)` |
| `--radius-2xl` | `rounded-2xl` | `calc(0.5rem * 1.8)` |

---

## The Dark Variant: `@custom-variant dark`

The app defines:

```css
@custom-variant dark (&:is(.dark *));
```

This means: the `dark:` utility variant applies when the element is a descendant of an element with class `dark`.

**Important:** This differs slightly from the Tailwind docs canonical form `(&:where(.dark, .dark *))` — notably it does NOT apply when the element itself has class `dark`, only its descendants. In practice this is inconsequential for layout children, but matters if you ever put `class="dark"` directly on a component rather than `<html>`.

next-themes with `attribute: 'class'` adds `.dark` to `<html>`, so all descendants qualify. The `dark:` variant works as expected throughout the app.

**Critical implication:** `dark:` variants in this app are for exceptions and overrides inside shadcn/ui component internals. For general component work, semantic tokens are the correct approach because they require zero `dark:` duplication.

---

## The Replacement Map

This is the authoritative, complete mapping for this project.

### Background Replacements

| Hardcoded Class | Semantic Replacement | Rationale |
|---|---|---|
| `bg-white` | `bg-background` | Page/app backgrounds — switches to `oklch(0.12...)` in dark |
| `bg-white` (in a card/panel) | `bg-card` | Slightly elevated surfaces — better semantic intent |
| `bg-gray-50` | `bg-muted` | Secondary/subdued areas — maps to `oklch(0.96...)` / `oklch(0.2...)` |
| `bg-gray-100` | `bg-muted` | Same as above — light gray fills |
| `bg-gray-200` | `bg-muted` or `bg-secondary` | Both map to same values in this theme |
| `bg-gray-50` (on input) | `bg-input/50` | Disabled state input backgrounds — use opacity modifier |
| `bg-blue-50`, `bg-indigo-50` | `bg-primary/10` | Light tints of primary — use opacity modifier on `bg-primary` |
| `bg-orange-50` | No direct token — keep or add dark: variant | Notification/warning colors have no semantic token in this theme |

### Text Replacements

| Hardcoded Class | Semantic Replacement | Rationale |
|---|---|---|
| `text-black` | `text-foreground` | Main body text |
| `text-gray-900` | `text-foreground` | Primary text — switches to `oklch(0.98...)` in dark |
| `text-gray-800` | `text-foreground` | Primary text — same mapping |
| `text-gray-700` | `text-foreground` or `text-card-foreground` | Strong secondary text |
| `text-gray-600` | `text-muted-foreground` | Secondary text |
| `text-gray-500` | `text-muted-foreground` | Subdued text — maps to `oklch(0.5...)` / `oklch(0.65...)` |
| `text-gray-400` | `text-muted-foreground` | Further subdued — same token is correct |
| `text-white` (on primary bg) | `text-primary-foreground` | White text on indigo buttons/badges |
| `text-white` (on dark panel) | `text-card-foreground` | Text in panels that should invert |
| `text-blue-600`, `text-indigo-600` | `text-primary` | Brand color text |

### Border Replacements

| Hardcoded Class | Semantic Replacement | Rationale |
|---|---|---|
| `border-gray-200` | `border-border` | Default dividers — maps to `oklch(0.9...)` / `oklch(0.25...)` |
| `border-gray-300` | `border-border` or `border-input` | Form field borders → `border-input`; structural borders → `border-border` |
| `border-gray-100` | `border-border` | Light dividers |
| `divide-gray-200` | `divide-border` | Table/list dividers — same token via `divide-*` utilities |

### Hover State Replacements

| Hardcoded Class | Semantic Replacement | Rationale |
|---|---|---|
| `hover:bg-gray-50` | `hover:bg-muted` | Lightest hover — maps to muted surface |
| `hover:bg-gray-100` | `hover:bg-muted` | Standard hover background |
| `hover:bg-gray-200` | `hover:bg-accent` | Stronger hover — accent maps to slightly darker muted |
| `hover:text-gray-900` | `hover:text-foreground` | Hover text contrast |
| `hover:text-gray-700` | `hover:text-foreground` | Strong hover text |
| `group-hover:bg-gray-50` | `group-hover:bg-muted` | Same pattern with group modifier |

### Focus & Ring Replacements

| Hardcoded Class | Semantic Replacement | Rationale |
|---|---|---|
| `focus:border-gray-300` | `focus:border-input` | Form field focus border |
| `focus:border-blue-500` | `focus:border-ring` | Focus indicator — ring is primary-matched |
| `focus:ring-2 focus:ring-gray-200` | `focus-visible:ring-3 focus-visible:ring-ring/50` | Standard shadcn focus pattern |
| `focus:ring-blue-500` | `focus-visible:ring-ring` | Brand focus ring |
| `ring-gray-200` | `ring-border` | Subtle outline rings |
| `outline-gray-300` | `outline-ring/50` | Outline utilities |

### Opacity Modifier Pattern

Tailwind 4 supports the slash opacity modifier on all color utilities. These are correct semantic patterns:

```
bg-primary/10   → indigo at 10% opacity (replaces bg-indigo-50)
bg-muted/50     → muted at 50% opacity (CardFooter uses this)
ring-ring/50    → ring at 50% opacity (focus ring glow)
text-foreground/70 → slightly subdued foreground
border-border/50   → subtle border
```

---

## What NOT to Do

### Do not add `dark:` variants as a substitute for semantic tokens

```tsx
// WRONG — manual duplication, won't stay in sync
<div className="bg-white dark:bg-gray-800">

// CORRECT — single class, automatic
<div className="bg-card">
```

The entire point of the token system is that the `.dark` CSS block handles the flip. Adding `dark:` variants is only appropriate for true exceptions — cases where the dark behavior needs to differ from what the semantic token provides (e.g., the app's `dark:border-orange-800` on the expired-plan banner, which has no semantic token).

### Do not use raw oklch values as arbitrary values

```tsx
// WRONG — loses token semantics entirely
<div className="bg-[oklch(0.16_0.01_250)]">

// CORRECT
<div className="bg-card">
```

### Do not create new CSS variables in globals.css

The constraint from PROJECT.md is explicit: only use tokens already defined in `globals.css`. The existing token set is comprehensive enough to cover all standard UI patterns.

### Do not use `text-foreground` on colored backgrounds

```tsx
// WRONG — text-foreground is near-black/near-white; unreadable on primary
<button className="bg-primary text-foreground">

// CORRECT — use the paired foreground token
<button className="bg-primary text-primary-foreground">
```

Each surface token has a paired foreground token. Always use the pair.

---

## ThemeProvider Architecture (Actual Implementation)

The app uses segment-scoped ThemeProviders. This is intentional — different sections preserve independent theme state via different `storageKey` values.

```
app/layout.tsx
  └─ <html> (bare — no ThemeProvider at root)
      ├─ app/(auth)/layout.tsx → <AdminThemeProvider>    storageKey="admin-theme"
      ├─ app/(marketing)/layout.tsx → <AdminThemeProvider>  storageKey="admin-theme"
      ├─ app/dashboard/layout.tsx → <AdminThemeProvider>  storageKey="admin-theme"
      ├─ app/admin/layout.tsx → <AdminThemeProvider>      storageKey="admin-theme"
      ├─ app/(tenant)/layout.tsx → <BookingThemeProvider>  storageKey="booking-theme"
      └─ app/book/layout.tsx → <BookingThemeProvider>      storageKey="booking-theme"
```

All providers use `attribute: 'class'`, so next-themes injects `.dark` class on the wrapping element's closest DOM ancestor that `ThemeProvider` controls. In practice, since `ThemeProvider` renders a React context and no DOM element itself, the class lands on `<html>` (next-themes v0.4+ behavior with App Router).

The `@custom-variant dark (&:is(.dark *))` selector in `globals.css` matches all descendants of `.dark` — which in this setup means the entire document when `.dark` is on `<html>`.

---

## Core Technologies (Reference)

| Technology | Version | Purpose | Why |
|---|---|---|---|
| Tailwind CSS | 4.2.1 | Utility classes | `@theme inline` bridges CSS variables to utilities; no config file needed for token registration |
| shadcn/ui | 4.0.2 | Component library | Ships with semantic token conventions; all components use `bg-card`, `text-foreground`, etc. by default |
| next-themes | 0.4.6 | Theme switching | `attribute: 'class'` adds `.dark` to `<html>`; triggers CSS cascade change |
| OKLch colors | — | Color model | Perceptually uniform; dark theme values chosen for contrast rather than mechanical inversion |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| clsx | 2.1.1 | Conditional class composition | Combining semantic tokens with conditional classes |
| tailwind-merge | 3.5.0 | Class conflict resolution | Merging consumer className overrides without duplication |
| class-variance-authority | 0.7.1 | Component variant definitions | Defining button/badge variant maps using semantic tokens |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| Semantic tokens (`bg-card`) | `dark:` variants (`bg-white dark:bg-gray-900`) | Only when component genuinely needs behavior that diverges from the semantic token (e.g., warning banners with custom colors not in the token set) |
| CSS variable tokens | Hardcoded color utilities | Never — hardcoded utilities are the problem being solved |
| Existing token set | Adding new tokens to globals.css | Out of scope for this project; only if a future design system expansion is planned |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---|---|---|
| Tailwind CSS 4.2.1 | `@theme inline` directive | This syntax is Tailwind 4 only; Tailwind 3 uses `tailwind.config.js` theme extension instead |
| next-themes 0.4.6 | Next.js 15 App Router | v0.4+ required for App Router compatibility; v0.3 had hydration issues with App Router |
| shadcn 4.0.2 | Tailwind 4 | shadcn v4 generates Tailwind 4-compatible components; v3 components use legacy color utilities |

---

## Sources

- `app/globals.css` — authoritative token definitions (verified line by line)
- `components/theme-providers.tsx` — actual next-themes configuration (`attribute: 'class'`, `storageKey` per segment)
- `components/ui/card.tsx`, `button.tsx`, `input.tsx` etc. — empirical verification of which tokens shadcn/ui components use
- Tailwind CSS official docs (https://tailwindcss.com/docs/theme) — `@theme inline` behavior, `--color-*` namespace convention
- Tailwind CSS official docs (https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark` syntax and class-based dark mode
- HIGH confidence: all key claims verified against actual codebase source and official Tailwind 4 documentation

---

*Stack research for: Tailwind CSS 4.x + shadcn/ui semantic theming*
*Researched: 2026-03-17*
