# Phase 01: Neumorphism UI Refactor - Research

**Researched:** 2026-03-23
**Domain:** CSS custom properties, Tailwind CSS v4, Neumorphism design system, shadcn/ui component editing, Next.js theming
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Variable coexistence strategy**
- Map new Neumorphism variables INTO the existing shadcn/ui token structure in `globals.css`
- Define `--neu-bg`, `--neu-shadow-light`, `--neu-shadow-dark`, `--neu-accent` in `:root` and `.dark`
- Override existing shadcn core tokens to use Neumorphism hex values:
  - `--background`, `--card`, `--popover` → `var(--neu-bg)` (all surfaces share the same bg color)
  - `--border` → `transparent` or removed (Neumorphism uses shadows, not borders)
  - `--input` → `var(--neu-bg)` (inputs share surface color, shadow creates the inset)
  - `--primary` → maps to `var(--neu-accent)` where appropriate
- Light theme Neumorphism values:
  - `--neu-bg: #e0e5ec`
  - `--neu-text: #4a5568`
  - `--neu-shadow-light: #ffffff`
  - `--neu-shadow-dark: #a3b1c6`
  - `--neu-accent: #4299e1`
- Dark theme Neumorphism values:
  - `--neu-bg: #1e1e24`
  - `--neu-text: #d1d5db`
  - `--neu-shadow-light: #2c2c35`
  - `--neu-shadow-dark: #101013`
  - `--neu-accent: #10b981`

**Coverage scope**
- Apply Neumorphism to the ENTIRE project: marketing landing page, authentication pages, dashboard, booking flow, admin
- 100% visual consistency — no surface is excluded
- Landing page hero gradients and animations may need adaptation (maintain spirit, apply Neumorphism principles)

**shadcn/ui component override approach**
- Edit component files directly: `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/card.tsx`, `components/ui/textarea.tsx`, `components/ui/dialog.tsx`, `components/ui/popover.tsx`, etc.
- Define Neumorphism Tailwind custom utility classes in `globals.css`:
  - `.neu-raised` → `box-shadow: 10px 10px 20px var(--neu-shadow-dark), -10px -10px 20px var(--neu-shadow-light);`
  - `.neu-inset` → `box-shadow: inset 5px 5px 10px var(--neu-shadow-dark), inset -5px -5px 10px var(--neu-shadow-light);`
  - `.neu-btn` → `.neu-raised` by default, `.neu-inset` on `:active`, accent text color on `:hover`
- Strip default borders from components (or set to `border-transparent`)
- Remove default backgrounds on surfaces — all use `var(--neu-bg)` via `--background` token

**Button interaction states**
- Default: protruding (`.neu-raised` shadow)
- `:hover`: text color changes to `var(--neu-accent)`, shadow unchanged
- `:active`: shadow flips to inset (`.neu-inset`) — simulates physical button press

**Input/Textarea visual treatment**
- Always inset (`.neu-inset` shadow)
- Remove default borders and outlines
- Focus state: keep inset shadow, optionally accent the shadow color slightly

**Theme transition behavior**
- Add `transition: background-color 300ms ease-in-out, color 300ms ease-in-out, box-shadow 300ms ease-in-out` globally
- Apply via `@layer base` on `*` or `body` so all elements inherit smooth transitions during theme toggle
- The existing `disableTransitionOnChange: false` on ThemeProviders already allows this

### Claude's Discretion
- Exact border-radius values (current `--radius: 0.5rem` may need increase to 12-16px for Neumorphism aesthetics — Claude decides)
- Which landing page gradient/animation elements to adapt vs preserve
- Focus ring implementation (accent color ring or subtle shadow-based)
- Chart colors (recharts uses hardcoded fills — out of scope per prior decisions)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

## Summary

This phase applies a Neumorphism (Soft UI) visual system to the entire omni-book application. The implementation strategy is elegant: inject new `--neu-*` CSS variables into the existing `:root`/`.dark` blocks in `globals.css`, then remap the existing shadcn/ui tokens (`--background`, `--card`, `--border`, `--input`, etc.) to the new variables. Because the entire codebase already uses semantic tokens like `bg-background`, `bg-card`, and `border-border`, almost every surface updates automatically without touching individual page or feature files.

The non-trivial work is concentrated in three areas: (1) defining `.neu-raised` and `.neu-inset` utility classes in `globals.css` and applying them to the ~10 `components/ui/*.tsx` files, (2) handling the landing page hero section which uses hardcoded gradient backgrounds that must be adapted to Neumorphism principles, and (3) ensuring the theme toggle components themselves receive Neumorphism styling. The entire existing test suite (215 tests) uses `fs.readFileSync` + regex assertions — these tests will need updating wherever they assert on classes that are being replaced.

The project uses Base UI v1.2 (not Radix UI) as the primitive layer beneath all UI components. Tailwind v4's `@theme inline` block and `@custom-variant dark` mechanism are the CSS scaffolding. The `.dark` class on `<html>` (via `next-themes`) drives both light and dark modes via two separate ThemeProviders.

**Primary recommendation:** Implement in three waves — (1) CSS variables + utility classes in `globals.css`, (2) `components/ui/*.tsx` component edits, (3) landing page adaptation and theme toggle visual polish. The token-remapping approach in Wave 1 propagates automatically through the 20,000+ LOC codebase.

---

## Standard Stack

### Core (already in project — no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.1 | Utility-first CSS, `@theme inline` for token mapping | Already the styling foundation |
| next-themes | 0.4.6 | `.dark` class toggle via ThemeProvider | Already wired for both booking and admin themes |
| class-variance-authority | 0.7.1 | `cva()` variant system in button.tsx and others | Used in all component variants |
| @base-ui/react | 1.2.0 | Headless primitives (Button, Input, Dialog, Select, Menu) | Replaces Radix UI — already installed |

### No New Dependencies
This phase is pure CSS + component className editing. No new npm packages are required.

**Installation:** None required.

---

## Architecture Patterns

### Token Remapping Chain (the core pattern)

The project uses a three-layer CSS token chain:

```
:root / .dark (CSS custom properties)
    ↓
@theme inline block (maps CSS vars → Tailwind color utilities)
    ↓
Component classNames use bg-background, bg-card, text-foreground, etc.
```

Injecting Neumorphism variables at layer 1 propagates automatically to all components at layer 3.

### Pattern 1: CSS Variable Injection in globals.css

**What:** Add `--neu-*` variables to `:root` and `.dark`, then override existing shadcn tokens to point at them.

**When to use:** First step — everything else builds on this.

```css
/* Source: confirmed from app/globals.css structure */

:root {
  /* Neumorphism palette */
  --neu-bg: #e0e5ec;
  --neu-text: #4a5568;
  --neu-shadow-light: #ffffff;
  --neu-shadow-dark: #a3b1c6;
  --neu-accent: #4299e1;

  /* Override existing tokens to use Neumorphism values */
  --background: var(--neu-bg);
  --card: var(--neu-bg);
  --popover: var(--neu-bg);
  --border: transparent;
  --input: var(--neu-bg);
  /* --foreground: use neu-text or keep existing dark near-black */
}

.dark {
  --neu-bg: #1e1e24;
  --neu-text: #d1d5db;
  --neu-shadow-light: #2c2c35;
  --neu-shadow-dark: #101013;
  --neu-accent: #10b981;

  /* Same overrides — dark mode neu values propagate via the same token names */
  --background: var(--neu-bg);
  --card: var(--neu-bg);
  --popover: var(--neu-bg);
  --border: transparent;
  --input: var(--neu-bg);
}

/* Add neu-accent to @theme inline for Tailwind utility access */
@theme inline {
  /* ...existing entries... */
  --color-neu-accent: var(--neu-accent);
  --color-neu-bg: var(--neu-bg);
}
```

### Pattern 2: Utility Classes in @layer base

**What:** Define reusable `.neu-raised`, `.neu-inset`, `.neu-btn` CSS utilities. These are plain CSS classes (not Tailwind utilities) defined in `@layer base` so they take correct cascade precedence.

**When to use:** Applied to component files via `className` additions.

```css
/* Source: CONTEXT.md locked decisions + standard Neumorphism CSS patterns */

@layer base {
  /* Neumorphism utility classes */
  .neu-raised {
    box-shadow: 10px 10px 20px var(--neu-shadow-dark), -10px -10px 20px var(--neu-shadow-light);
  }

  .neu-inset {
    box-shadow: inset 5px 5px 10px var(--neu-shadow-dark), inset -5px -5px 10px var(--neu-shadow-light);
  }

  .neu-btn {
    box-shadow: 10px 10px 20px var(--neu-shadow-dark), -10px -10px 20px var(--neu-shadow-light);
    background-color: var(--neu-bg);
  }

  .neu-btn:hover {
    color: var(--neu-accent);
  }

  .neu-btn:active {
    box-shadow: inset 5px 5px 10px var(--neu-shadow-dark), inset -5px -5px 10px var(--neu-shadow-light);
  }

  /* Global theme transition */
  * {
    transition: background-color 300ms ease-in-out, color 300ms ease-in-out, box-shadow 300ms ease-in-out;
  }
}
```

### Pattern 3: Component File Edits (Button example)

**What:** Add Neumorphism classes to `buttonVariants` cva definition; remove borders; the `default` variant gets `.neu-btn`.

**When to use:** Each `components/ui/*.tsx` file gets targeted edits.

```tsx
// Source: confirmed from reading components/ui/button.tsx
// Pattern: add neu-btn to default variant, strip border classes

const buttonVariants = cva(
  // Base: remove 'border border-transparent', add neu-btn
  "group/button inline-flex ... neu-btn ...",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",  // bg comes from neu-btn, remove bg-primary
        outline: "neu-raised border-transparent ...",
        // etc.
      }
    }
  }
)
```

### Pattern 4: Input/Select/Textarea — Inset Treatment

**What:** Replace `border border-input bg-transparent dark:bg-input/30` with `.neu-inset border-transparent bg-[var(--neu-bg)]`.

```tsx
// Source: confirmed from reading components/ui/input.tsx
// Current: "border border-input bg-transparent ... dark:bg-input/30"
// New pattern:
className={cn(
  "h-8 w-full min-w-0 rounded-lg neu-inset border-transparent bg-[var(--neu-bg)] px-2.5 py-1 text-base ...",
  className
)}
```

### Pattern 5: Card — Raised Surface

**What:** Replace `ring-1 ring-foreground/10` (the current thin border substitute) with `.neu-raised` and remove the ring.

```tsx
// Source: confirmed from reading components/ui/card.tsx
// Current: "ring-1 ring-foreground/10"
// New:
className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground neu-raised has-data-[slot=card-footer]:pb-0 ...",
  className
)}
```

### Pattern 6: Dialog/Dropdown/Select Content — Elevated Raised Surface

**What:** These floating surfaces use `shadow-md ring-1 ring-foreground/10`. Replace with `.neu-raised` (stronger elevation) and remove ring + shadow-md.

```tsx
// Source: confirmed from dialog.tsx and dropdown-menu.tsx
// Current: "shadow-md ring-1 ring-foreground/10"
// New: "neu-raised"
```

### Recommended Work Breakdown

```
Wave 1: globals.css — CSS variables + utility classes + global transition
Wave 2: components/ui/*.tsx — 8-10 component files (Button, Input, Card, Dialog,
        Select, DropdownMenu, Sheet, Textarea, Badge, Table)
Wave 3: Landing page adaptation (HeroSection.tsx gradients → Neumorphism)
         ThemeToggle visual update
         Navbar, Footer border treatment
```

### Anti-Patterns to Avoid

- **Adding per-component `box-shadow` inline styles:** Define and reuse `.neu-raised`/`.neu-inset` instead. Consistency matters for theme switching.
- **Using `bg-white` or `bg-zinc-900` for surfaces:** Use `var(--neu-bg)` exclusively via the `--background` token. The existing test suite (LAND-01) catches hardcoded `bg-zinc-*` classes.
- **Setting `border: none` instead of `border-transparent`:** Tailwind v4's `@apply border-border` in `@layer base` applies to `*` — override to `border-transparent` not `border-0` to avoid layout shifts.
- **Touching `RESOURCE_PALETTE` in booking-calendar.tsx:** The calendar uses fixed pastel tints for resource color-coding — these are functional and marked `intentional`. Leave them alone.
- **Adding `!important` overrides:** The codebase has existing `dark:!` force-overrides in card.tsx, dialog.tsx, select.tsx, and dropdown-menu.tsx. Investigate these before touching — they indicate past specificity fights.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme switching | Custom JS toggle | `next-themes` (already installed, `disableTransitionOnChange: false`) | SSR-safe, handles system preference, both ThemeProviders already wired |
| CSS variable theme tokens | Manual per-component dark: variants | `:root`/`.dark` token remapping + existing Tailwind `@custom-variant dark` | 20,000 LOC already uses semantic tokens — one change propagates everywhere |
| Smooth theme transition | Per-component transition classes | Global `transition` on `*` in `@layer base` | Already the pattern in globals.css for `.hover-lift`, `.hover-scale` |
| Component variant system | Switch statements or conditional classes | `cva()` already in `buttonVariants` | Already in use, extend existing variants |

**Key insight:** The token-remapping approach means the implementation is concentrated in ~12 files. Custom solutions (per-component dark mode, per-file class additions) would require hundreds of edits.

---

## Common Pitfalls

### Pitfall 1: `@layer base` `border-border` Conflicts with `border-transparent`

**What goes wrong:** `globals.css` line 127 applies `@apply border-border outline-ring/50` to `*` in `@layer base`. After setting `--border: transparent`, `border-border` becomes `border-transparent` automatically — BUT individual component classes like `border border-input` in input.tsx will still render visible borders since `--input` is being remapped to `--neu-bg` (same color as background). Verify visually.

**Why it happens:** The cascade between `@layer base` and component className strings is not always obvious when tokens are redirected.

**How to avoid:** After setting `--border: transparent`, test that `border-border` in `@layer base` doesn't produce a visible ring on every element. The Card's `ring-1 ring-foreground/10` must be removed explicitly — it is NOT controlled by `--border`.

**Warning signs:** Thin grey rings appearing on all elements in light mode after token remapping.

### Pitfall 2: `ring-1 ring-foreground/10` Is Not `border-border`

**What goes wrong:** Card.tsx, dialog.tsx, select.tsx (SelectContent), and dropdown-menu.tsx all use `ring-1 ring-foreground/10` as their border substitute. This is NOT controlled by `--border`. Setting `--border: transparent` will not remove these rings.

**Why it happens:** The components use the ring utility as a workaround for border rendering consistency across overflow-hidden containers.

**How to avoid:** These must be explicitly removed from each component file. Replace with `.neu-raised` only.

### Pitfall 3: Landing Page Tests Enforce Semantic Token Usage

**What goes wrong:** The landing surface test suite (`__tests__/landing-surface.test.ts`) asserts that landing components do NOT contain hardcoded `bg-zinc-*`, `text-zinc-*`, `border-zinc-*`, etc. classes. If HeroSection.tsx or other landing components are updated with hardcoded Neumorphism hex values inline (e.g. `bg-[#e0e5ec]`), those patterns may pass the test — but it's better to use `bg-background` tokens.

**Why it happens:** Tests check for specific Tailwind class patterns, not raw CSS.

**How to avoid:** Always use `bg-background`, `bg-card`, `text-foreground`, etc. in component className strings. The `--neu-bg` value flows through these tokens automatically.

**Warning signs:** Tests passing but visual inspection shows hardcoded colors not adapting between light/dark modes.

### Pitfall 4: `dark:bg-card` Tests in landing-surface.test.ts

**What goes wrong:** Tests LAND-01 supplemental check that `NicheCards.tsx` and `DemoSection.tsx` use `dark:bg-card`. After the token remapping, `dark:bg-card` will now mean Neumorphism dark background — which is correct. But the tests also check that `bg-indigo-600` is preserved in PricingCards (LAND-06). The indigo CTA button on the Pro pricing card is a brand choice exempt from Neumorphism.

**How to avoid:** Preserve `bg-indigo-600` in PricingCards.tsx. The landing test for this is an explicit guard.

### Pitfall 5: CardFooter `bg-muted/50` Breaks Neumorphism Surface Consistency

**What goes wrong:** `CardFooter` in card.tsx uses `bg-muted/50` which will differ slightly from `var(--neu-bg)` once muted is still pointing to the old secondary token. All card surfaces must be uniform for Neumorphism to look correct.

**Why it happens:** `--muted` is a secondary token that wasn't remapped in the locked decisions.

**How to avoid:** During card component edit, change CardFooter's `bg-muted/50` to `bg-background` (which maps to `--neu-bg`). Or set `--muted: var(--neu-bg)` during token remapping.

### Pitfall 6: `dark:!` Force-Override Classes in Components

**What goes wrong:** card.tsx, dialog.tsx, select.tsx, and dropdown-menu.tsx may contain `dark:!` prefixed classes (confirmed from grep). These indicate past specificity conflicts and will fight any new Neumorphism class additions.

**Why it happens:** Base UI primitives may apply inline styles or their own class defaults that required `!important` overrides previously.

**How to avoid:** Before editing each component file, check for `dark:!` patterns. When present, either (a) remove them if the conflict is resolved by Neumorphism token remapping, or (b) use `!` prefix on Neumorphism classes too where absolutely necessary.

### Pitfall 7: HeroSection.tsx Gradient Background

**What goes wrong:** HeroSection uses `bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800`. After `--background` is remapped to `#e0e5ec`, the indigo-to-violet gradient creates a visual conflict with the flat Neumorphism surface.

**Why it happens:** Neumorphism aesthetics are incompatible with multi-color gradient section backgrounds — they require a single solid base color for shadows to work correctly.

**How to avoid:** Per Claude's Discretion, the hero section gradient must be adapted. Recommended: Replace gradient with `bg-background` + keep decorative gradient blobs as subtle accent-colored circles at reduced opacity. The floating icons and animations can be preserved.

### Pitfall 8: Footer.tsx Is Intentionally Dark

**What goes wrong:** Footer.tsx uses `bg-zinc-900` with comment `// intentional: fixed dark footer surface`. The landing surface test (LAND-01) exempts it but checks for the `intentional` keyword. This surface should remain dark in both themes — it is a brand design choice.

**How to avoid:** Do NOT remap Footer's `bg-zinc-900`. The test guard will catch accidental removal. Document in implementation that Footer is excluded from Neumorphism surface treatment.

### Pitfall 9: ThemeToggle Uses `hover:bg-muted` — a Semantic Token

**What goes wrong:** ThemeToggle uses `hover:bg-muted hover:text-foreground` for hover state. After `--muted` remapping, the hover state may look unexpected since muted will share the same `--neu-bg` color as the background, making hover invisible.

**How to avoid:** During ThemeToggle visual update (it needs Neumorphism styling anyway), replace `hover:bg-muted` with `.neu-raised` hover shadow or an explicit accent-based hover state.

### Pitfall 10: `transition: all` Can Cause Janky Animations

**What goes wrong:** If the global transition on `*` uses `transition: all`, it captures all CSS properties including `opacity`, `transform`, and layout properties — which conflicts with the existing slideUp/slideLeft/fadeIn animations on landing page components.

**How to avoid:** Be explicit in the global transition: `transition: background-color 300ms ease-in-out, color 300ms ease-in-out, box-shadow 300ms ease-in-out` — exactly as specified in the locked decisions. Do NOT use `transition: all`.

---

## Code Examples

Verified patterns from direct code inspection:

### Tailwind v4 Custom Variant (already in globals.css)
```css
/* Source: app/globals.css line 5 */
@custom-variant dark (&:is(.dark *));
```
This is Tailwind v4's mechanism for `.dark` class-based dark mode. All `dark:` utilities in component files use this. The Neumorphism `.dark` block in globals.css works with this same mechanism.

### @theme inline — How to Add New Token
```css
/* Source: app/globals.css lines 83-123 */
@theme inline {
  /* Existing pattern */
  --color-background: var(--background);
  --color-card: var(--card);

  /* New entries for neu-accent Tailwind utilities */
  --color-neu-accent: var(--neu-accent);
  --color-neu-bg: var(--neu-bg);
}
```
After adding these, `bg-neu-bg` and `text-neu-accent` become valid Tailwind utilities.

### Base UI Button Primitive (confirmed pattern)
```tsx
/* Source: components/ui/button.tsx */
/* Base UI's ButtonPrimitive is used — not Radix or native button */
import { Button as ButtonPrimitive } from "@base-ui/react/button"

// ButtonPrimitive renders a <button> element with data-slot="button"
// It supports standard HTML button props + Base UI extras
// No ref forwarding issue — Base UI handles this internally
```

### Base UI Input Primitive (confirmed pattern)
```tsx
/* Source: components/ui/input.tsx */
import { Input as InputPrimitive } from "@base-ui/react/input"

// InputPrimitive renders <input> with data-slot="input"
// CSS classes apply directly to the input element
```

### Card's Current "Border" Pattern (must be replaced)
```tsx
/* Source: components/ui/card.tsx line 15 */
/* Current: ring-1 ring-foreground/10 — this is NOT a border token */
/* Must be explicitly removed and replaced with neu-raised */
className={cn(
  "... ring-1 ring-foreground/10 ...",
  className
)}
```

### ThemeProvider Configuration (both providers)
```tsx
/* Source: components/theme-providers.tsx */
const commonProps = {
  attribute: 'class' as const,       // applies .dark to <html>
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,  // allows CSS transition during theme switch
}
// BookingThemeProvider: storageKey="booking-theme"
// AdminThemeProvider: storageKey="admin-theme"
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `@layer base` with `border` token | `@apply border-border` on `*` already set | Border token remapping automatically updates all elements |
| Per-component dark: variants | `:root`/`.dark` token remapping | One change propagates everywhere via `@custom-variant dark` |
| Radix UI primitives | Base UI v1.2 (`@base-ui/react`) | Different import paths; `ButtonPrimitive`, `InputPrimitive` etc. are Base UI, not Radix |
| `ring-*` as border substitute | Standard CSS `box-shadow` for Neumorphism | Neumorphism uses double shadow (light + dark), not rings |

**Deprecated/outdated for this phase:**
- `dark:bg-input/30` in input.tsx: replaced by `bg-[var(--neu-bg)]` + `.neu-inset`
- `border border-input` in input.tsx and select.tsx: replaced by `border-transparent` + `.neu-inset`
- `shadow-md` in dropdown-menu.tsx and select.tsx: replaced by `.neu-raised`

---

## Open Questions

1. **`--sidebar` token family treatment**
   - What we know: Sidebar uses `bg-sidebar` token family (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.) which is independent from `--background`/`--card`. The sidebar is `dashboard-sidebar.tsx` with hardcoded niche-color active link classes.
   - What's unclear: Should `--sidebar` also be set to `var(--neu-bg)`? Or does the sidebar get its own raised Neumorphism treatment with a slightly different shadow depth?
   - Recommendation: Set `--sidebar: var(--neu-bg)` in the token remapping. The sidebar raised effect comes from `.neu-raised` applied to the sidebar container in `dashboard-sidebar.tsx`.

2. **`--muted` token treatment for CardFooter and muted states**
   - What we know: `CardFooter` uses `bg-muted/50`. After `--muted` still points to the old light gray, the footer strip will visually differ from the main card surface.
   - What's unclear: Should `--muted` be remapped to `var(--neu-bg)` making all muted elements match the base surface? Or kept as a slightly lighter/darker tone?
   - Recommendation: Set `--muted: var(--neu-bg)` for surface consistency. Keep `--muted-foreground` as-is for text contrast.

3. **Border radius increase**
   - What we know: Current `--radius: 0.5rem` (8px). CONTEXT.md Claude's Discretion notes 12-16px is typical for Neumorphism aesthetics. The @theme inline block has `--radius-sm` through `--radius-4xl` all derived from `--radius`.
   - Recommendation: Increase `--radius` to `0.875rem` (14px). This is enough for Neumorphism softness without making the UI look cartoonish. All radius-* variants scale proportionally.

4. **SelectContent and DropdownMenuContent popup positioning**
   - What we know: Both use `shadow-md ring-1 ring-foreground/10` for elevation. They are positioned floats that may need stronger `z-index` than card surfaces.
   - What's unclear: Whether `.neu-raised` provides enough visual separation from the neu-bg surface when both popup and background share the same base color.
   - Recommendation: Use `.neu-raised` but also add a subtle background at 2-3% lighter or darker than `--neu-bg` for the popup surface. This is standard Neumorphism practice for elevated menus. Define as a separate token or use CSS `filter: brightness(1.03)` approach.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 with ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest --testPathPattern="neumorphism"` |
| Full suite command | `npx jest` |

### Existing Test Infrastructure
All 215 existing tests use `fs.readFileSync` + regex assertions (static file analysis pattern). Tests live in `__tests__/` and cover:
- `landing-surface.test.ts` — 51 tests, asserts semantic token usage in landing components
- `cleanup-surface.test.ts` — asserts specific component patterns
- `dashboard-auth-surface.test.ts` — dashboard component assertions
- `mobile-ui.test.ts` — mobile class audits
- `booking-surface.test.ts` — booking flow component assertions

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NEU-01 | `--neu-*` variables defined in `:root` and `.dark` in globals.css | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-02 | `--background`, `--card`, `--popover` remapped to `var(--neu-bg)` | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-03 | `.neu-raised` and `.neu-inset` utility classes defined in globals.css | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-04 | `button.tsx` uses `.neu-btn` class (or `.neu-raised`) | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-05 | `input.tsx` uses `.neu-inset` and `border-transparent` | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-06 | `card.tsx` uses `.neu-raised` and no `ring-1 ring-foreground/10` | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-07 | `dialog.tsx` popup uses `.neu-raised` and no `shadow-md ring-1` | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-08 | `select.tsx` trigger uses `.neu-inset`; content uses `.neu-raised` | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-09 | `dropdown-menu.tsx` content uses `.neu-raised` and no `shadow-md` | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-10 | Global transition rule present in globals.css `@layer base` | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-11 | `booking-calendar.tsx` RESOURCE_PALETTE preserved unchanged | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |
| NEU-12 | `Footer.tsx` retains `bg-zinc-900` and `intentional` comment | static | Covered by existing `landing-surface.test.ts` | Exists |
| NEU-13 | All existing 215 tests continue to pass | regression | `npx jest` | Exists |
| NEU-14 | HeroSection.tsx uses `bg-background` (not gradient) for main section bg | static | `npx jest --testPathPattern="neumorphism-surface"` | Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="neumorphism-surface"`
- **Per wave merge:** `npx jest` (full 215+ tests)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/neumorphism-surface.test.ts` — covers NEU-01 through NEU-14 (except NEU-12/NEU-13 which already have tests)

---

## Files That Will Be Modified

### Wave 1: CSS Foundation
- `app/globals.css` — Add `--neu-*` variables, override tokens, add utility classes, add global transition

### Wave 2: UI Components (direct edits)
- `components/ui/button.tsx` — Replace variant backgrounds/borders with `.neu-btn`/`.neu-raised`
- `components/ui/input.tsx` — Replace border + background with `.neu-inset border-transparent`
- `components/ui/card.tsx` — Replace `ring-1 ring-foreground/10` with `.neu-raised`; CardFooter `bg-muted/50` → `bg-background`
- `components/ui/dialog.tsx` — DialogContent: replace `ring-1 ring-foreground/10` with `.neu-raised`; DialogFooter: `bg-muted/50` → `bg-background`
- `components/ui/select.tsx` — SelectTrigger: `.neu-inset border-transparent`; SelectContent: `.neu-raised` no `shadow-md ring-1`
- `components/ui/dropdown-menu.tsx` — DropdownMenuContent: `.neu-raised` no `shadow-md ring-1`
- `components/ui/sheet.tsx` — Sheet content panels (if using shadow/border for elevation)
- `components/ui/badge.tsx` — Badge surfaces
- `components/ui/textarea.tsx` — Inset treatment (file does not exist yet — confirm or create)

### Wave 3: Surface Adaptation
- `components/landing/HeroSection.tsx` — Gradient → `bg-background` + adapted decorative blobs
- `components/landing/Navbar.tsx` — Remove `border-b border-border`, add `.neu-raised` or subtle separator
- `components/theme-toggle.tsx` — Visual update to match Neumorphism style (button becomes `.neu-btn`)
- `components/public-theme-toggle.tsx` — Same as above if it wraps ThemeToggle

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `app/globals.css`, `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/dialog.tsx`, `components/ui/select.tsx`, `components/ui/dropdown-menu.tsx`, `components/theme-providers.tsx`, `components/theme-toggle.tsx`
- Direct code inspection: `__tests__/landing-surface.test.ts`, `__tests__/cleanup-surface.test.ts`, `jest.config.ts`
- Direct code inspection: `components/landing/HeroSection.tsx`, `components/landing/Footer.tsx`, `components/landing/Navbar.tsx`, `components/booking-calendar.tsx`
- CONTEXT.md locked decisions (confirmed authoritative by user)

### Secondary (MEDIUM confidence)
- Neumorphism CSS patterns (box-shadow dual light/dark implementation) — well-established CSS technique, cross-verified with CONTEXT.md locked values
- Tailwind v4 `@layer base` + `@theme inline` patterns — confirmed from existing globals.css usage

### Tertiary (LOW confidence — not needed, all info from codebase)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed from package.json, no new dependencies needed
- Architecture: HIGH — entire globals.css and all component files directly inspected
- Pitfalls: HIGH — derived from direct code inspection of current implementation + existing test assertions
- Test mapping: HIGH — existing test suite structure fully inspected, all 215 tests passing

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (stable — no fast-moving dependencies involved)
