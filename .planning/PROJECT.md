# Dark Mode Audit & Fix — omni-book

## What This Is

A systematic refactor of the omni-book multi-tenant SaaS to make dark mode work flawlessly across the entire UI. The project audits every component for hardcoded Tailwind color classes and replaces them with semantic shadcn/ui CSS variables so that toggling dark mode produces a correct, visually consistent UI without broken contrast or invisible text.

## Core Value

Every page and component renders correctly in both light and dark mode — no white backgrounds trapped in dark mode, no invisible text, no hardcoded color escapes.

## Requirements

### Validated

- ✓ Dark mode infrastructure is installed (next-themes 0.4.6) — existing
- ✓ shadcn/ui CSS variable system is defined in `app/globals.css` with OKLch color model — existing
- ✓ Tailwind CSS 4.2.1 with `bg-background` / `text-foreground` variable tokens available — existing
- ✓ Theme toggle mechanism exists in the UI — existing

### Active

- [ ] `app/globals.css` body tag applies `@apply bg-background text-foreground;` (or equivalent CSS variable reference)
- [ ] All hardcoded light-mode background classes replaced with semantic equivalents (`bg-white` → `bg-background`/`bg-card`, `bg-gray-50`/`bg-gray-100` → `bg-muted`/`bg-secondary`)
- [ ] All hardcoded light-mode text classes replaced with semantic equivalents (`text-black`/`text-gray-900` → `text-foreground`/`text-card-foreground`, `text-gray-500` → `text-muted-foreground`, `text-white` on light backgrounds → `text-primary-foreground` or appropriate token)
- [ ] All hardcoded border classes replaced (`border-gray-200` → `border-border`)
- [ ] Hover/focus/ring state variants also use semantic tokens (`hover:bg-gray-100` → `hover:bg-muted`, `focus:border-gray-300` → `focus:border-input`, `ring-gray-200` → `ring-border`)
- [ ] Dashboard pages/components fully remediated (highest priority — most cards and forms)
- [ ] `components/landing` fully remediated
- [ ] Tenant-facing booking pages fully remediated
- [ ] Auth pages fully remediated
- [ ] Admin platform pages fully remediated
- [ ] Visual review of all major pages confirms dark mode renders correctly

### Out of Scope

- Business logic changes — strict constraint, color refactor only
- State management or component structure changes — strict constraint
- Adding automated visual regression tests — deferred to a future QA phase
- Custom CSS properties defined outside Tailwind utility classes — handled case-by-case only if they cause visible breakage
- Third-party component internals (recharts, etc.) — not accessible via Tailwind class replacement

## Context

The app uses Next.js 15 App Router with a multi-tenant architecture. UI is built with shadcn/ui components on top of Tailwind CSS 4.2.1. The color system is OKLch-based, defined in `app/globals.css` as CSS custom properties (`:root` for light, `.dark` for dark). The `next-themes` library manages the `dark` class on the `<html>` element.

The breakage pattern: developers wrote components with explicit Tailwind color utilities (e.g., `bg-white`, `text-gray-900`) instead of the semantic variable tokens shadcn/ui provides. These classes do not respond to the `.dark` class and remain fixed regardless of theme.

**Priority areas (highest risk of breakage):**
1. `app/dashboard/` — admin dashboard with cards, tables, forms, stats widgets
2. `components/landing/` — marketing landing page components
3. `app/(tenant)/` — public-facing booking pages
4. `app/(auth)/` — login, register, OTP verification pages
5. `app/admin/` — superadmin platform pages

**Semantic replacement map:**
| Hardcoded | Semantic replacement |
|-----------|---------------------|
| `bg-white` | `bg-background` or `bg-card` |
| `bg-gray-50`, `bg-gray-100` | `bg-muted` or `bg-secondary` |
| `text-black`, `text-gray-900` | `text-foreground` or `text-card-foreground` |
| `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `text-white` (on colored bg) | `text-primary-foreground` / `text-secondary-foreground` |
| `border-gray-200`, `border-gray-300` | `border-border` or `border-input` |
| `hover:bg-gray-100` | `hover:bg-muted` |
| `focus:border-gray-300` | `focus:border-input` |
| `ring-gray-200` | `ring-border` |

## Constraints

- **Scope**: Color utility classes only — zero business logic, state management, or structural changes
- **Tech stack**: Tailwind CSS 4.2.1 + shadcn/ui CSS variables; do not introduce new tokens not already defined in `globals.css`
- **Verification**: Visual manual review by toggling dark mode on each page after each phase completes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use semantic shadcn/ui tokens (not custom `dark:` variants) | Tokens automatically adapt to theme class; `dark:` variants would duplicate effort and diverge from shadcn patterns | — Pending |
| Prioritize dashboard + landing first | These are highest-traffic areas and contain most of the custom color usage | — Pending |
| Include hover/focus/ring variants in scope | Invisible hover states in dark mode are a common and jarring UX failure | — Pending |

---
*Last updated: 2026-03-17 after initialization*
