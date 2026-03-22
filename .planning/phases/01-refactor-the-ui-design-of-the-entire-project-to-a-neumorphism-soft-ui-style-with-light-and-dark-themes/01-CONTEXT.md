# Phase 1: Neumorphism UI Refactor - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply a Neumorphism (Soft UI) visual system to the entire omni-book application. This means:
- Injecting new CSS shadow/color variables into `globals.css` and mapping them to existing shadcn/ui tokens so the whole app updates automatically
- Applying inset/protruding box-shadow rules globally (cards/buttons protrude, inputs/textareas inset)
- Supporting both Light and Dark Neumorphism themes via the existing `.dark` class mechanism
- Editing core shadcn/ui component files directly (Button, Input, Card, etc.) to implement the new visual rules

Business logic, API calls, React/Vue state, and i18n translations are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Variable coexistence strategy
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

### Coverage scope
- Apply Neumorphism to the ENTIRE project: marketing landing page, authentication pages, dashboard, booking flow, admin
- 100% visual consistency — no surface is excluded
- Landing page hero gradients and animations may need adaptation (maintain spirit, apply Neumorphism principles)

### shadcn/ui component override approach
- Edit component files directly: `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/card.tsx`, `components/ui/textarea.tsx`, `components/ui/dialog.tsx`, `components/ui/popover.tsx`, etc.
- Define Neumorphism Tailwind custom utility classes in `globals.css`:
  - `.neu-raised` → `box-shadow: 10px 10px 20px var(--neu-shadow-dark), -10px -10px 20px var(--neu-shadow-light);`
  - `.neu-inset` → `box-shadow: inset 5px 5px 10px var(--neu-shadow-dark), inset -5px -5px 10px var(--neu-shadow-light);`
  - `.neu-btn` → `.neu-raised` by default, `.neu-inset` on `:active`, accent text color on `:hover`
- Strip default borders from components (or set to `border-transparent`)
- Remove default backgrounds on surfaces — all use `var(--neu-bg)` via `--background` token

### Button interaction states
- Default: protruding (`.neu-raised` shadow)
- `:hover`: text color changes to `var(--neu-accent)`, shadow unchanged
- `:active`: shadow flips to inset (`.neu-inset`) — simulates physical button press

### Input/Textarea visual treatment
- Always inset (`.neu-inset` shadow)
- Remove default borders and outlines
- Focus state: keep inset shadow, optionally accent the shadow color slightly

### Theme transition behavior
- Add `transition: background-color 300ms ease-in-out, color 300ms ease-in-out, box-shadow 300ms ease-in-out` globally
- Apply via `@layer base` on `*` or `body` so all elements inherit smooth transitions during theme toggle
- The existing `disableTransitionOnChange: false` on ThemeProviders already allows this

### Claude's Discretion
- Exact border-radius values (current `--radius: 0.5rem` may need increase to 12-16px for Neumorphism aesthetics — Claude decides)
- Which landing page gradient/animation elements to adapt vs preserve
- Focus ring implementation (accent color ring or subtle shadow-based)
- Chart colors (recharts uses hardcoded fills — out of scope per prior decisions)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core styling files
- `app/globals.css` — Current CSS variable definitions (OKLch shadcn tokens, @theme inline block, animation utilities). This is where Neumorphism variables and utility classes will be injected.
- `components/theme-providers.tsx` — BookingThemeProvider and AdminThemeProvider. Both use `attribute="class"` which applies `.dark` to `<html>` element.
- `components/theme-toggle.tsx` — ThemeToggle component (uses `useTheme()` from next-themes). May need visual updates to match Neumorphism style.
- `components/public-theme-toggle.tsx` — Public-facing toggle wrapper.

### shadcn/ui component files to edit directly
- `components/ui/button.tsx` — Primary button component
- `components/ui/input.tsx` — Input component
- `components/ui/card.tsx` — Card, CardHeader, CardContent, CardFooter
- `components/ui/textarea.tsx` — Textarea component
- `components/ui/dialog.tsx` — Modal/dialog surfaces
- `components/ui/popover.tsx` — Popover surfaces

### Layout wrappers (theme provider injection points)
- `app/layout.tsx` — Root layout (no ThemeProvider here — uses Providers component)
- `app/dashboard/layout.tsx` — Dashboard layout (uses AdminThemeProvider)
- `app/book/layout.tsx` — Booking layout (uses BookingThemeProvider)
- `app/(marketing)/layout.tsx` — Marketing layout
- `app/(tenant)/layout.tsx` — Tenant public layout

### Key UI surfaces (reference for coverage audit)
- `components/landing/Navbar.tsx` — Navigation bar
- `components/dashboard-sidebar.tsx` — Dashboard sidebar (uses bg-sidebar token family)
- `components/booking-form.tsx` — Main booking form (inputs, selects)
- `components/booking-calendar.tsx` — Calendar surface

### Prior decisions that constrain this phase
- `RESOURCE_PALETTE` in booking-calendar.tsx is intentional — functional accent colors, not violations
- Orange expired-plan warning and green OTP success blocks are functional status colors — preserve them
- `dark:!` force-overrides indicate past specificity conflicts — investigate before touching
- Footer.tsx is intentional fixed-dark surface — document but potentially adapt for Neumorphism

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ThemeToggle` / `PublicThemeToggle`: Already wired to `useTheme()` + `.dark` class toggle — no logic change needed, only visual update
- `components/ui/*`: shadcn/ui component files — direct edit targets for Neumorphism classes
- Existing animation utilities in globals.css (`.hover-lift`, `.hover-glow`) — can complement Neumorphism or be updated

### Established Patterns
- OKLch CSS custom properties in `:root` / `.dark` blocks → `@theme inline` → Tailwind utilities: This chain must be preserved; new Neumorphism vars plug into `:root` / `.dark` blocks
- `@layer base` with `@apply` for global rules — established pattern for global CSS overrides
- `.dark` class on `<html>` element (via next-themes `attribute="class"`) — the existing theme switch mechanism works for Neumorphism dark mode too
- Two separate ThemeProviders (booking vs dashboard) — independent storage keys, same visual rules

### Integration Points
- `app/globals.css` `:root` / `.dark` blocks: inject `--neu-*` variables here
- `@theme inline` block: add `--color-neu-accent: var(--neu-accent)` etc. for Tailwind utility access
- `@layer base`: add global transition and Neumorphism utility classes
- All `bg-background` / `bg-card` / `bg-popover` usages will update automatically once `--background` / `--card` / `--popover` tokens are overridden to `var(--neu-bg)`

</code_context>

<specifics>
## Specific Ideas

- "Map new Neumorphism variables INTO the existing shadcn/ui token structure" — the key insight is that `--background: var(--neu-bg)` lets all existing `bg-background` usages update automatically across 20,000 LOC without touching each file
- Define `.neu-raised` and `.neu-inset` as reusable CSS utilities in `globals.css` and apply them via component-level `className` updates
- Smooth theme transition: `transition: background-color 300ms ease-in-out, color 300ms ease-in-out, box-shadow 300ms ease-in-out` globally

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-refactor-the-ui-design-of-the-entire-project-to-a-neumorphism-soft-ui-style-with-light-and-dark-themes*
*Context gathered: 2026-03-23*
