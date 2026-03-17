# Architecture Research

**Domain:** Dark mode audit and fix — Next.js 15 App Router + shadcn/ui SaaS
**Researched:** 2026-03-17
**Confidence:** HIGH (based on direct codebase scan, not inference)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  THEME INFRASTRUCTURE (already correct — do not touch)              │
│                                                                     │
│  app/globals.css                                                    │
│    :root { --background, --foreground, --card, ... }  ← light vars │
│    .dark { --background, --foreground, --card, ... }  ← dark vars  │
│    body { @apply bg-background text-foreground; }     ← CORRECT    │
│    * { @apply border-border; }                        ← CORRECT    │
│                                                                     │
│  components/theme-providers.tsx                                     │
│    AdminThemeProvider  (storageKey: "admin-theme")                  │
│    BookingThemeProvider (storageKey: "booking-theme")               │
│    Both use: attribute="class", defaultTheme="system"               │
└─────────────────────────────────────────────────────────────────────┘
         │ injects `.dark` class on <html> via next-themes
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SURFACE LAYERS (where hardcoded colors break dark mode)            │
│                                                                     │
│  Surface A: Marketing / Landing                                     │
│    app/(marketing)/layout.tsx  → AdminThemeProvider                 │
│    components/landing/         → 7 files, mix of dark: variants     │
│                                  and raw zinc/slate tokens          │
│                                                                     │
│  Surface B: Tenant Public Booking                                   │
│    app/(tenant)/layout.tsx     → BookingThemeProvider               │
│    components/tenant-public-page.tsx  ← largest file, 30 dark:     │
│    components/booking-form.tsx        ← niche color maps + 1 bg-   │
│    components/booking-calendar.tsx    ← bg-gray-400 fallback dot   │
│                                                                     │
│  Surface C: Admin Dashboard                                         │
│    app/dashboard/layout.tsx    → AdminThemeProvider (wraps sidebar) │
│    components/dashboard-sidebar.tsx   ← bg-zinc-900 hardcoded      │
│    components/analytics-dashboard.tsx ← text-zinc-400 empty state  │
│    components/dashboard/activity-timeline.tsx                       │
│    components/bookings-dashboard.tsx  ← CLEAN (no hardcoded)       │
│    app/dashboard/page.tsx             ← bg-white/10 (decorative)   │
│    app/dashboard/settings/billing/billing-content.tsx               │
│                   ← heavy zinc hardcoding + dark: overrides         │
│                                                                     │
│  Surface D: Auth Pages                                              │
│    app/(auth)/layout.tsx       → AdminThemeProvider                 │
│    app/(auth)/login/page.tsx   ← CLEAN                             │
│    app/(auth)/register/page.tsx← CLEAN                             │
│    app/(auth)/verify-otp/page.tsx ← CLEAN                         │
│                                                                     │
│  Surface E: Superadmin                                              │
│    app/admin/layout.tsx        → AdminThemeProvider                 │
│                                  USES semantic tokens throughout    │
│    app/admin/page.tsx          ← needs scan                        │
│    app/admin/tenants/page.tsx  ← needs scan                        │
│                                                                     │
│  Surface F: Shared / Root-level components                          │
│    components/banned-actions.tsx   ← bg-zinc-900 hardcoded         │
│    components/booking-status-badge.tsx ← text-zinc (minor)         │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component / File | Dark Mode Role | Current State |
|------------------|----------------|---------------|
| `app/globals.css` | Defines all CSS tokens; `body` applies `bg-background text-foreground` | CORRECT — no fix needed |
| `components/theme-providers.tsx` | Injects `.dark` class on `<html>` via next-themes | CORRECT — no fix needed |
| `app/layout.tsx` | Root HTML shell; no color classes | CORRECT — no fix needed |
| `app/dashboard/layout.tsx` | Wraps `AdminThemeProvider`; uses semantic tokens in warning banner | Mostly semantic; review `text-white` on orange button |
| `app/admin/layout.tsx` | Full sidebar inline; uses semantic tokens throughout | CLEAN — no fix needed |
| `app/(auth)/layout.tsx` | Thin wrapper only; no color classes | CLEAN — no fix needed |
| `app/(tenant)/layout.tsx` | Wraps `BookingThemeProvider`; uses `bg-background` | CLEAN — no fix needed |
| `app/(marketing)/layout.tsx` | Thin wrapper only; no color classes | CLEAN — no fix needed |
| `components/landing/` (7 files) | Marketing surface; uses `dark:` variants with zinc/slate raw tokens | BROKEN — mixed zinc/slate with raw `dark:` overrides |
| `components/tenant-public-page.tsx` | Tenant public page shell + resource/service cards | BROKEN — heavy hardcoding, some `dark:` variants present |
| `components/booking-form.tsx` | Multi-step booking form with niche color maps | PARTIAL — niche brand colors are intentional; `bg-white` on date input needs fix |
| `components/booking-calendar.tsx` | Date/slot picker | MINOR — `bg-gray-400` fallback in status dot |
| `components/dashboard-sidebar.tsx` | Dashboard nav | MINOR — `bg-zinc-900 text-white` on sign-out button |
| `components/analytics-dashboard.tsx` | Analytics charts | MINOR — `text-zinc-400` on empty state |
| `components/dashboard/activity-timeline.tsx` | Timeline widget | MINOR — single zinc class |
| `app/dashboard/settings/billing/billing-content.tsx` | Billing page inline content | BROKEN — heavy zinc hardcoding with `dark:!` force-overrides |
| `app/dashboard/page.tsx` | Dashboard home with hero card | MINOR — `bg-white/10` is decorative opacity on colored surface |
| `components/bookings-dashboard.tsx` | Bookings management table | CLEAN — no fix needed |
| `components/ui/` (20+ files) | shadcn/ui primitives | CLEAN — generated with semantic tokens |

## Recommended Project Structure

The codebase structure is already correct. The audit does not reorganize files — it replaces hardcoded color utilities in place. The conceptual grouping that matters for batching work:

```
audit-scope/
├── Phase 1: globals.css validation       # Prerequisite — verify before anything
├── Phase 2: components/landing/          # 7 files, all marketing surface
│   ├── HeroSection.tsx
│   ├── DemoSection.tsx
│   ├── NicheCards.tsx
│   ├── Testimonials.tsx
│   ├── FeaturesGrid.tsx
│   ├── StatsCounter.tsx
│   ├── PricingCards.tsx
│   └── Footer.tsx (in landing/)
├── Phase 3: tenant-public-page.tsx       # Single large file, high impact
│   └── booking-form.tsx                  # Companion form, same surface
├── Phase 4: dashboard components         # dashboard-sidebar + billing content
│   ├── dashboard-sidebar.tsx
│   ├── billing-content.tsx               # (app/dashboard/settings/billing/)
│   └── analytics-dashboard.tsx
└── Phase 5: cleanup sweep                # Scattered minor issues
    ├── booking-calendar.tsx
    ├── booking-status-badge.tsx
    ├── banned-actions.tsx
    ├── dashboard/activity-timeline.tsx
    └── app/dashboard/page.tsx
```

### Structure Rationale

- **Phase 1 first:** `globals.css` `body { @apply bg-background text-foreground; }` already exists and is correct. Confirm `@custom-variant dark (&:is(.dark *))` is also present (it is). No changes needed — validation only.
- **Landing before tenant:** Marketing/landing components are stateless and have no inter-component dependencies beyond layout. Changing them cannot break booking logic.
- **Tenant public before dashboard:** `tenant-public-page.tsx` and `booking-form.tsx` are co-rendered on the same route surface. Fixing them together avoids a second pass through the same page.
- **Dashboard components last among heavy work:** The dashboard uses `AdminThemeProvider` independently, so regressions there are isolated to authenticated sessions and easy to spot-check.
- **Cleanup sweep last:** Minor/decorative zinc classes (like `bg-white/10` blur decorations in the dashboard hero) are lowest-risk and lowest-impact. Some may be intentional (niche brand accent colors).

## Architectural Patterns

### Pattern 1: Two-Theme-Provider Isolation

**What:** The app runs two independent `ThemeProvider` instances from `next-themes` — `AdminThemeProvider` (storageKey `"admin-theme"`) and `BookingThemeProvider` (storageKey `"booking-theme"`). Each stores its theme preference separately in `localStorage`.

**When to use:** This is already in place. It means a user can have dark mode in the dashboard but light mode in the public booking widget (or vice versa). No change required.

**Trade-offs:** Each surface must be tested independently when toggling dark mode. Fixing a component for the admin surface does not automatically verify it on the booking surface. The underlying CSS token definitions in `globals.css` are shared, so a fix in token usage applies to both.

**Implication for audit:** When verifying fixes, test each surface with its own theme toggle. The dashboard has `ThemeToggle` in the sidebar footer. The tenant public page has `public-theme-toggle.tsx`.

### Pattern 2: Semantic Token Usage (The Target State)

**What:** All color classes reference shadcn/ui CSS variable tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `bg-muted`, etc.) rather than raw Tailwind palette values. The tokens flip between light and dark definitions automatically when the `.dark` class is present.

**When to use:** Every place a background, foreground, border, or ring color is applied to a visible UI element.

**Example:**
```tsx
// Before (broken in dark mode)
<div className="bg-white border-gray-200 text-gray-900">
  <p className="text-gray-500">Subtitle</p>
</div>

// After (correct)
<div className="bg-card border-border text-card-foreground">
  <p className="text-muted-foreground">Subtitle</p>
</div>
```

### Pattern 3: Intentional Non-Semantic Colors (Do Not Replace)

**What:** Some hardcoded color classes are intentional and should not be replaced with semantic tokens.

**When to use:** Two categories exist in this codebase:

1. **Niche brand accent colors** — `booking-form.tsx` and `tenant-public-page.tsx` contain niche color maps (blue, pink, orange, green variants per business type). These are brand identity colors chosen per niche, not UI surface colors. The `text-white` on a `bg-blue-600` button is correct: white on a colored surface.

2. **Alpha/opacity overlays on colored surfaces** — `bg-white/10`, `bg-white/15`, `border-white/30` in `app/dashboard/page.tsx` are decorative glows on a colored gradient card. The underlying gradient is intentional; the white opacity is mathematically correct regardless of theme.

**How to distinguish:** Ask "would this look wrong if `bg-background` replaced this?" If the element is inside a brand-colored hero/card with its own colored background, the existing color is likely intentional.

### Pattern 4: `dark:` Variants vs Semantic Tokens

**What:** The landing and booking components use `dark:` Tailwind variants (`dark:bg-zinc-900`, `dark:text-slate-50`) rather than semantic tokens. This works mechanically but diverges from the shadcn/ui pattern and duplicates definitions.

**Current state:** Landing components have partial `dark:` coverage with 72 `dark:` variant instances across 7 files. This means some classes already respond to dark mode — they just use zinc/slate primitives rather than tokens.

**Why replace anyway:** The zinc/slate values are hardcoded to specific lightness levels that may not match the OKLch-based token values in `globals.css`. The `--card` token in dark is `oklch(0.16 0.01 250)`, which may differ from `bg-zinc-900` (`oklch(~0.18 0 0)`). Replacing ensures visual consistency with the shadcn/ui design system rather than approximating it.

**Trade-off:** The `dark:` approach is not wrong — it's a matter of consistency. If time-boxing is needed, landing components with existing `dark:` variants are lower priority than components with no dark handling at all (e.g., `billing-content.tsx`).

## Data Flow

### Theme Class Propagation

```
User toggles theme toggle component
    ↓
next-themes writes "dark" or "light" to localStorage (keyed by surface)
    ↓
ThemeProvider adds/removes `.dark` class on <html> element
    ↓
@custom-variant dark (&:is(.dark *)) in globals.css activates
    ↓
CSS custom properties in .dark { } block take effect for all descendants
    ↓
Tailwind semantic utilities (bg-background, text-foreground, etc.)
read the updated CSS variable values
    ↓
Components using semantic tokens update automatically
Components using hardcoded classes (bg-white, text-gray-900) do NOT update
```

### Audit Verification Flow

```
For each phase batch:
    1. Identify hardcoded classes in scope (grep/visual scan)
    2. Replace with semantic equivalents per replacement map
    3. Toggle dark mode on the affected surface
    4. Visual check: no white backgrounds, no invisible text, no broken borders
    5. Toggle back to light mode
    6. Visual check: light mode unchanged
    7. Mark phase complete
```

## Component Boundary Breakdown

### Directories Containing UI Components That Need Fixing

| Directory / File | Fix Scope | Shared? | Impact |
|-----------------|-----------|---------|--------|
| `components/landing/` | 7 files | Shared (rendered on every marketing page visit) | High — public-facing |
| `components/tenant-public-page.tsx` | 1 large file | Shared (every tenant's public page) | High — customer-facing |
| `components/booking-form.tsx` | 1 large file | Shared (every booking flow) | High — customer-facing |
| `app/dashboard/settings/billing/billing-content.tsx` | 1 file | Isolated (billing page only) | Medium — admin only |
| `components/dashboard-sidebar.tsx` | 1 file | Shared (every dashboard page) | Medium — admin sidebar |
| `components/analytics-dashboard.tsx` | 1 file | Isolated (analytics page) | Low — minor class |
| `components/dashboard/activity-timeline.tsx` | 1 file | Isolated (dashboard home widget) | Low — minor class |
| `components/booking-calendar.tsx` | 1 file | Shared (booking flow) | Low — single dot color |
| `components/booking-status-badge.tsx` | 1 file | Shared (bookings list) | Low — single zinc class |
| `components/banned-actions.tsx` | 1 file | Isolated (banned page) | Low — edge case page |
| `app/dashboard/page.tsx` | 1 file | Isolated (dashboard home) | Low — decorative only |

### Shared vs Isolated Breakdown

**Shared (fixing once fixes all instances):**
- `components/landing/*` — All marketing landing pages render the same components
- `components/tenant-public-page.tsx` — Every tenant public page (`[slug].omnibook.com`) renders this
- `components/booking-form.tsx` — Every booking flow uses this
- `components/booking-calendar.tsx` — Every booking flow uses this
- `components/dashboard-sidebar.tsx` — Every dashboard page renders this

**Isolated (must fix individually, affects only one route):**
- `app/dashboard/settings/billing/billing-content.tsx` — Billing settings page only
- `components/analytics-dashboard.tsx` — Analytics page only
- `components/dashboard/activity-timeline.tsx` — Dashboard home only
- `components/booking-status-badge.tsx` — Used in bookings list
- `components/banned-actions.tsx` — Banned user page only
- `app/dashboard/page.tsx` — Dashboard home only

## Build Order (Audit Execution Order)

### Phase 0: Validation (prerequisite, no code changes)

Confirm `app/globals.css` is correct before touching any component. Based on direct inspection:
- `body { @apply bg-background text-foreground; }` — PRESENT at line 130
- `* { @apply border-border outline-ring/50; }` — PRESENT at line 127
- `.dark { }` block with full token set — PRESENT at lines 53-81
- `@custom-variant dark (&:is(.dark *))` — PRESENT at line 5

**Result: globals.css is already correct. No changes needed. Proceed directly to component work.**

### Phase 1: Landing / Marketing Surface

**Files:** `components/landing/HeroSection.tsx`, `DemoSection.tsx`, `NicheCards.tsx`, `Testimonials.tsx`, `FeaturesGrid.tsx`, `StatsCounter.tsx`, `PricingCards.tsx`, `Footer.tsx`

**Why first:** These are public-facing, stateless, no auth dependency. Regressions are visible immediately by any visitor. Components do not call server actions or mutate state — safe to batch all 7-8 files together.

**Nature of fixes:** Replace `bg-zinc-*`, `text-zinc-*`, `border-zinc-*`, `dark:bg-zinc-*`, `dark:text-zinc-*` with semantic equivalents. The `dark:` variants already partially work but use zinc palette values instead of OKLch tokens.

**Risk:** Low. No business logic involved.

### Phase 2: Tenant Public Booking Surface

**Files:** `components/tenant-public-page.tsx`, `components/booking-form.tsx`, `components/booking-calendar.tsx`

**Why second:** These are also customer-facing and high-traffic. `tenant-public-page.tsx` has the heaviest hardcoded color usage (34 zinc/slate occurrences). Fixing the page shell before the form components ensures the outer container is correct first.

**Nature of fixes:**
- `tenant-public-page.tsx`: Replace `bg-white`, `text-slate-900`, `border-zinc-*` on the page shell and cards. Niche color maps (`bg-blue-600 text-white`) are intentional — skip them.
- `booking-form.tsx`: Replace `bg-white` on the date input (line 619). Niche color maps are intentional.
- `booking-calendar.tsx`: Replace `bg-gray-400` fallback dot color with `bg-muted-foreground` or `bg-border`.

**Risk:** Medium. These files are large and complex. Fix the outer containers (divs, headers, cards) first, then inner elements. Do not touch niche color map objects.

**Caution:** `booking-form.tsx` uses niche-specific color maps (`stepDone`, `slotSelected`, `submitBtn`) that are brand colors, not UI surface colors. The `text-white` on `bg-blue-600` is correct. Only fix the date picker input `bg-white`.

### Phase 3: Dashboard Components

**Files:** `components/dashboard-sidebar.tsx`, `app/dashboard/settings/billing/billing-content.tsx`, `components/analytics-dashboard.tsx`, `components/dashboard/activity-timeline.tsx`

**Why third:** Dashboard is authenticated-only, so regressions are not publicly visible. `billing-content.tsx` has the heaviest hardcoding in the dashboard surface (heavy `zinc-*` with `dark:!` force-overrides).

**Nature of fixes:**
- `billing-content.tsx`: Replace all `text-zinc-900`, `text-zinc-500`, `bg-zinc-50`, `border-zinc-200` with semantic tokens. Remove `dark:!text-white`, `dark:!bg-zinc-900` force overrides — replace with semantic tokens that handle both modes.
- `dashboard-sidebar.tsx`: Replace `bg-zinc-900 text-white` on the sign-out/back-to-home button with `bg-primary text-primary-foreground` or `bg-secondary text-secondary-foreground`.
- `analytics-dashboard.tsx`: Replace `text-zinc-400` empty state text with `text-muted-foreground`.
- `activity-timeline.tsx`: Review the single zinc class.

**Risk:** Medium. The `dark:!` force overrides in `billing-content.tsx` indicate a previous failed attempt at dark mode. Remove them in favor of semantic tokens.

### Phase 4: Cleanup Sweep

**Files:** `components/banned-actions.tsx`, `components/booking-status-badge.tsx`, `app/dashboard/page.tsx`

**Why last:** These are either edge-case pages (banned), minor single-class fixes, or decorative-only colors that may be intentional.

**Nature of fixes:**
- `banned-actions.tsx`: Replace `bg-zinc-900 text-white hover:bg-zinc-700` button with `bg-foreground text-background hover:bg-foreground/90` or use the shadcn Button variant.
- `booking-status-badge.tsx`: Review the single zinc class.
- `app/dashboard/page.tsx`: The `bg-white/10` blur decorations are on a colored gradient card — these are intentional opacity effects. Do not replace. The `border-white/30 text-white bg-white/10` Badge is on a colored gradient surface — also likely intentional.

**Risk:** Low.

## Anti-Patterns

### Anti-Pattern 1: Using `dark:` Variants Instead of Semantic Tokens

**What people do:** Add `dark:bg-zinc-900 dark:text-slate-50` alongside the light-mode class instead of using a semantic token.

**Why it's wrong:** Doubles the class count; uses raw palette values that may not match the OKLch-tuned token values in `globals.css`; creates maintenance burden (changing the dark palette requires updating every `dark:` variant).

**Do this instead:**
```tsx
// Wrong
<div className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-slate-50">

// Correct
<div className="bg-card text-card-foreground">
```

### Anti-Pattern 2: Force-Overriding with `dark:!` Important

**What people do:** Add `dark:!bg-zinc-900` with Tailwind's `!` important modifier to override specificity issues.

**Why it's wrong:** Signals a cascade conflict that should be resolved by using semantic tokens instead. Force overrides make later refactors harder and mask the underlying issue.

**Do this instead:** Replace both the light class and the `dark:!` override with a single semantic token. If there is a specificity conflict, use `cn()` to merge properly.

### Anti-Pattern 3: Replacing Intentional Brand Colors

**What people do:** Replace niche accent colors (`bg-blue-600`, `bg-pink-600`) with semantic tokens because they "look hardcoded."

**Why it's wrong:** The niche color maps in `booking-form.tsx` and `tenant-public-page.tsx` are intentional brand identity colors per niche type. These are not UI surface colors — they are product accent colors that should remain distinct per niche. `text-white` on `bg-blue-600` is correct contrast.

**Do this instead:** Only replace colors on structural UI surfaces (page backgrounds, card backgrounds, text, borders). Leave brand accent colors and their `text-white` foreground intact.

### Anti-Pattern 4: Fixing Components Before Verifying globals.css

**What people do:** Jump straight to component fixes without confirming the CSS token foundation is correct.

**Why it's wrong:** If `globals.css` is missing the `body { @apply bg-background text-foreground; }` rule, fixing every component to use semantic tokens would still leave the page background broken.

**Do this instead:** Confirm Phase 0 validation before any component work. In this project, `globals.css` is already correct — proceed directly.

## Integration Points

### External Services

| Service | Dark Mode Relevance | Notes |
|---------|---------------------|-------|
| Recharts (analytics charts) | Not accessible | Chart colors are configured via JSX props, not Tailwind. Out of scope per PROJECT.md. |
| Radix UI / shadcn primitives | Already semantic | `components/ui/` was scaffolded by shadcn CLI and uses semantic tokens. No changes needed. |
| next-themes | Already correct | `ThemeProvider` with `attribute="class"` correctly adds `.dark` to `<html>`. |

### Internal Boundaries

| Boundary | Communication | Dark Mode Notes |
|----------|---------------|-----------------|
| `globals.css` → all components | CSS custom properties inherited | Fix here once, all semantic token users update automatically |
| `components/ui/` → feature components | Direct JSX import | `ui/` components are already semantic; feature components consuming them just need their own wrapper divs fixed |
| `theme-providers.tsx` → layout trees | React context + next-themes | Two independent providers; test each surface separately |
| Niche color maps → booking/tenant components | JS object lookup | These are intentional, isolated to `booking-form.tsx` and `tenant-public-page.tsx` niche config objects |

## Sources

- Direct codebase scan: `/home/yola/projects/sites/omni-book/app/globals.css` (inspected)
- Direct codebase scan: `components/theme-providers.tsx` (inspected)
- Direct codebase scan: All layout files across route groups (inspected)
- Direct grep scan: All `bg-white`, `bg-gray-*`, `text-gray-*`, `bg-zinc-*`, `text-zinc-*`, `dark:` variant usage across `components/` and `app/`
- Project context: `.planning/PROJECT.md` (replacement map, priority areas, constraints)
- shadcn/ui token system: `globals.css` `@theme inline` block confirms all semantic tokens are registered as Tailwind utilities

---
*Architecture research for: dark mode audit/fix — Next.js 15 App Router + shadcn/ui SaaS*
*Researched: 2026-03-17*
