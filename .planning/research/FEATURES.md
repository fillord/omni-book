# Feature Research

**Domain:** Dark mode theming — semantic token coverage for a Next.js 15 + shadcn/ui multi-tenant SaaS
**Researched:** 2026-03-17
**Confidence:** HIGH (based on direct codebase audit)

---

## Overview

This is not a greenfield feature spec. It is an audit-and-fix exercise. "Features" here are the theming behaviors a production SaaS must exhibit in dark mode, and the specific surfaces where they must be verified or repaired. Research was conducted by inspecting every component file in the codebase for hardcoded Tailwind color classes vs. semantic CSS variable tokens.

**Token system available:** Full shadcn/ui OKLch token set is already defined in `app/globals.css` for both `:root` (light) and `.dark` (dark):
`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `border`, `input`, `ring`, `chart-1..5`, `sidebar`, `sidebar-foreground`, `sidebar-accent`, `sidebar-border`, `sidebar-ring`.

**Missing from token system:** No `body` baseline application of `bg-background text-foreground` was found in `globals.css`'s `body` rule — only `font-family` is set.

---

## Feature Landscape

### Table Stakes (Must Work — Dark Mode Is Broken Without These)

These are the behaviors users observe immediately when toggling dark mode. A single failure here makes the entire theme feel broken.

| Feature | Why Expected | Complexity | Files Affected |
|---------|--------------|------------|---------------|
| Body/page background responds to theme | Root canvas flipping white in dark mode is the most visible failure | LOW | `app/globals.css` (body rule missing `bg-background`) |
| Card backgrounds flip to dark | Cards are the primary content container on every page; white cards on a dark canvas scream "broken" | LOW | Dashboard stat cards, resource/service list cards, analytics cards |
| Text contrast on all surfaces | Unreadable text is an accessibility failure, not just aesthetic | LOW | All surfaces — replace `text-gray-900`, `text-gray-500`, `text-zinc-900`, `text-zinc-500` with tokens |
| Form input backgrounds and borders | Inputs that stay white in dark mode break every data entry flow | LOW | `booking-form.tsx`, `resource-form.tsx`, `service-form.tsx`, auth pages |
| Table row backgrounds and dividers | Data tables with white rows in dark mode are unusable | LOW | `bookings-dashboard.tsx` (uses shadcn Table component — already semantic), admin tenant table |
| Navigation/sidebar background | The main navigation chrome must not stay white | LOW | `dashboard-sidebar.tsx` (audit shows clean), `components/landing/Navbar.tsx` (audit shows clean) |
| Modal/dialog/sheet/dropdown backgrounds | Overlay surfaces that stay light-colored create jarring contrast breaks | LOW | shadcn `dialog`, `dropdown-menu`, `sheet` — all use `--popover` token already |
| Border colors on all surfaces | Visible borders disappear or create harsh contrast when hardcoded | LOW | Replace `border-gray-200`, `border-gray-300` with `border-border`; replace `border-zinc-200` with `border-border` |
| Hover state backgrounds | Interactive elements with `hover:bg-gray-100` stay light on dark hover | LOW | Multiple files — `hover:bg-zinc-50` → `hover:bg-muted`, etc. |
| Focus ring colors | Focus rings must remain visible in dark mode for keyboard nav | LOW | Replace `focus:border-gray-300` with `focus:border-input` |
| Badge/pill backgrounds | Inline status pills with hardcoded backgrounds become invisible or clash | LOW | `analytics-dashboard.tsx` stat cards, booking form service pills, tenant public page |

### Surface-by-Surface Table Stakes Breakdown

**Surface: `app/globals.css` (body rule)**

| Component | Issue | Fix |
|-----------|-------|-----|
| `body` | No `bg-background text-foreground` on body — root canvas not token-driven | Add `@apply bg-background text-foreground;` (or CSS variable equivalent) to the `body` rule |

**Surface: Dashboard (`app/dashboard/`, `components/dashboard/`)**

| Component | Issue | Fix |
|-----------|-------|-----|
| `app/dashboard/page.tsx` | Uses `bg-white/10`, `bg-white/15`, `border-white/30` — alpha-transparency on white is intentional (gradient overlays on colored hero card, correct for dark mode too) | These are safe — white at low alpha on colored background works in both modes |
| `app/dashboard/layout.tsx` | Uses `dark:` prefix variants directly (`dark:border-orange-800`, etc.) for superadmin banner | Verify pattern is not applied to structural backgrounds; the existing instance is a contextual alert, acceptable |
| `components/dashboard/activity-timeline.tsx` | Needs audit | Audit for hardcoded grays |
| `components/bookings-dashboard.tsx` | Clean — no hardcoded gray/white found | No action needed |
| `components/analytics-dashboard.tsx` | Stat card `iconBg` uses hardcoded Tailwind color classes (`bg-blue-50 text-blue-600`, `bg-green-50 text-green-600`, etc.) | Wrap in `dark:` variant or use opacity modifiers; these icon badges are the only issue |
| `components/analytics-dashboard.tsx` | Chart `stroke="#f4f4f5"` (CartesianGrid lines) hardcoded — invisible in dark mode | Replace with CSS variable reference via `style` prop or computed value |
| `components/dashboard-sidebar.tsx` | Clean — no hardcoded grays found | No action needed |
| `components/staff-manager.tsx` | Needs audit | Not directly reviewed |
| `components/services-manager.tsx` | Needs audit | Not directly reviewed |
| `components/resources-manager.tsx` | Needs audit | Not directly reviewed |

**Surface: Landing (`components/landing/`, `app/(marketing)/`)**

| Component | Issue | Fix |
|-----------|-------|-----|
| `components/landing/PricingCards.tsx` | `bg-white text-indigo-600 hover:bg-indigo-50` on CTA button inside a gradient hero card | Button on a dark gradient card — needs `dark:` variant or semantic token |
| `components/landing/HeroSection.tsx` | No hardcoded grays found | No action needed |
| `components/landing/Navbar.tsx` | No hardcoded grays found | No action needed |
| `components/landing/Footer.tsx` | No hardcoded grays found | No action needed |
| `components/landing/NicheCards.tsx` | No hardcoded grays found | No action needed |
| `components/landing/DemoSection.tsx` | No hardcoded grays found | No action needed |
| `components/landing/FeaturesGrid.tsx` | Needs audit | Not directly reviewed |
| `components/landing/StatsCounter.tsx` | Needs audit | Not directly reviewed |
| `components/landing/Testimonials.tsx` | Needs audit | Not directly reviewed |

**Surface: Tenant Booking (`app/(tenant)/`, `components/tenant-public-page.tsx`, `components/booking-form.tsx`, `components/booking-calendar.tsx`)**

| Component | Issue | Fix |
|-----------|-------|-----|
| `components/tenant-public-page.tsx` | `bg-white text-slate-900` as root container, `bg-white dark:bg-zinc-900` on header and content — uses manual `dark:` prefixes instead of semantic tokens | Replace `bg-white` → `bg-background`, `text-slate-900` → `text-foreground`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `border-zinc-200` → `border-border` |
| `components/tenant-public-page.tsx` | Hero button `bg-white text-blue-700 hover:bg-blue-50` per niche — white button on colored hero background | Keep as-is or use `text-primary-foreground bg-background` — needs design intent verification |
| `components/booking-form.tsx` | Uses `dark:` prefix throughout (`dark:bg-zinc-900`, `dark:border-zinc-700`, etc.) — heavy manual dual-class pattern | Migrate to semantic tokens; `bg-zinc-900` (dark) / `bg-white` (light) → `bg-background`; `border-zinc-200/dark:border-zinc-700` → `border-input` |
| `components/booking-form.tsx` | Niche accent classes (`bg-blue-600 text-white`, `bg-pink-600 text-white`, etc.) for step indicators and slot selection — these are intentional brand colors | Leave niche accent colors as-is; they are not theme-mode colors |
| `components/booking-calendar.tsx` | `bg-gray-400` on calendar legend dots | Replace with `bg-muted-foreground` |

**Surface: Auth (`app/(auth)/`)**

| Component | Issue | Fix |
|-----------|-------|-----|
| `app/(auth)/login/page.tsx` | `bg-orange-600 hover:bg-orange-700 text-white` on force-login emergency button | Intentional semantic color (warning state) — acceptable, keep |
| `app/(auth)/register/page.tsx` | Needs audit | Not directly reviewed |
| `app/(auth)/verify-otp/page.tsx` | Needs audit | Not directly reviewed |

**Surface: Admin Platform (`app/admin/`)**

| Component | Issue | Fix |
|-----------|-------|-----|
| `app/admin/page.tsx` | No hardcoded color classes found | No action needed |
| `app/admin/tenants/admin-tenant-row.tsx` | Uses alpha-opacity semantic colors (`bg-amber-500/15 text-amber-700 dark:text-amber-300`) — manually dual-classed | Acceptable pattern for semantic status colors; no replacement needed |

**Surface: Shared/Root**

| Component | Issue | Fix |
|-----------|-------|-----|
| `components/service-form.tsx` | `border-gray-300` on checkbox | Replace with `border-input` |
| `components/resource-form.tsx` | `border-gray-300` on two checkbox elements | Replace with `border-input` |
| `components/banned-actions.tsx` | No hardcoded colors found | No action needed |
| `components/ui/skeleton.tsx` | Uses `bg-muted` — already semantic | No action needed |
| `components/ui/sonner.tsx` | Passes `--popover`, `--popover-foreground`, `--border` CSS vars to Sonner — already semantic | No action needed |

---

### Differentiators (Competitive Advantage)

These are above minimum viable dark mode correctness. They improve the dark mode experience but the product is not broken without them.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Chart grid lines using semantic color | `stroke="#f4f4f5"` CartesianGrid lines become invisible in dark mode (they match dark bg) — fixing this makes analytics actually usable in dark mode | LOW | `analytics-dashboard.tsx`: pass computed color from CSS variable rather than hardcoded hex |
| Recharts chart fills themed via CSS variables | Bar/area fills currently use hardcoded hex colors (`#22c55e`, `#ef4444`); they remain visible but don't adapt to theme palette | MEDIUM | Out of scope per PROJECT.md — third-party internals; acceptable as-is |
| Stat card icon badges themed | `bg-blue-50 text-blue-600` (light only) icon containers in analytics stat cards look fine in light, washed out in dark | LOW | Replace with `bg-primary/10 text-primary` or similar alpha token pattern |
| Tenant booking page color transitions | `transition-colors duration-300` already present in tenant-public-page; smooth theming crossfades are already partially implemented | LOW | Ensure the same transition is on all major containers |
| System theme preference auto-detection | `next-themes` with `defaultTheme="system"` honors OS preference on first visit — verify this is wired correctly in providers | LOW | Check `components/theme-providers.tsx` configuration |
| Dark mode persistence across sessions | `next-themes` persists theme in localStorage by default — verify no SSR flash | LOW | Ensure `suppressHydrationWarning` on `<html>` — standard next-themes setup |

---

### Anti-Features (Do Not Do These)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Adding `dark:` prefix variants alongside existing semantic tokens | Feels like "covering both bases" | Creates class duplication that diverges over time; `dark:bg-zinc-900` plus `bg-background` on same element means the explicit zinc value wins and the token is ignored | Use only the semantic token — it already switches automatically via `.dark` class |
| Inverting SVG icons in dark mode (`dark:invert`) | Quick way to make white icons visible | Breaks color icons, applies to all SVG children including colored elements, creates unexpected hues | Use `currentColor` in SVGs so they inherit `text-foreground`; or use Lucide icons which already use `currentColor` |
| Creating new CSS custom properties outside `globals.css` | To handle "edge cases" | Fragments the token system; new properties won't automatically get dark mode values | Map the edge case to an existing token or add a properly paired `:root` + `.dark` entry to `globals.css` |
| Using Tailwind arbitrary values for colors (`bg-[#ffffff]`) | Precision color matching | Bypasses the entire token system; invisible to dark mode switching | Use the nearest semantic token; if exact shade is critical, add it to the token system |
| Replacing niche accent classes (blue-600, pink-600, orange-600, green-600) | They are "hardcoded colors" | They are intentional brand/niche identity colors, not background utility colors; `bg-blue-600 text-white` on a selected booking slot IS correct in both modes | Leave niche accent colors alone; only audit background/text/border utility colors |
| Modifying component structure or logic as part of color fixes | Developer temptation while already in a file | Violates project's strict scope constraint — pure color class replacement only | Make only the color class change; nothing else |
| Adding Tailwind `dark:` variants when the file already uses semantic tokens | Redundancy | The shadcn semantic tokens already apply the dark value automatically; adding explicit `dark:` overrides can conflict | Trust the token system — if a component uses `bg-card` it is already correct in dark mode |

---

## Feature Dependencies

```
Body baseline (bg-background on body)
    └──enables──> All page surfaces (without this, even correct-token components may sit on a white canvas)

Semantic border tokens (border-border, border-input)
    └──required by──> Form inputs, cards, dividers, tables

Semantic background tokens (bg-background, bg-card, bg-muted)
    └──required by──> Text contrast (text must be tested against the actual background token it sits on)
                          └──required by──> Hover state tokens (hover:bg-muted only makes sense if bg-background is the base)

Manual dark: variants (existing pattern in booking-form.tsx, tenant-public-page.tsx)
    └──conflicts──> Semantic token approach
                    (migrating away from dual-class pattern to single semantic token is the goal)
```

### Dependency Notes

- **Body baseline enables everything:** If `globals.css` body does not apply `bg-background`, pages that correctly use `bg-card` for cards will have those cards floating on a white document background even in dark mode. Fix the body first.
- **tenant-public-page.tsx and booking-form.tsx use conflicting patterns:** These files were written with explicit `dark:` prefixed classes. Migrating them to semantic tokens is correct but requires care — removing the `dark:` class AND replacing the light-mode class with a token in one pass.
- **Niche accent colors are independent:** The per-niche coloring system (`blue`, `pink`, `orange`, `green`) for booking UI accent colors is business logic expressed as CSS. It is not a theming system and must not be converted to semantic tokens.

---

## MVP Definition

This milestone is a fix, not a feature launch. "MVP" here means the minimum set of surfaces that must be correct before the dark mode can be called working.

### Fix First (Phase 1 — Structural Correctness)

- [ ] `app/globals.css` body applies `bg-background text-foreground` — fixes root canvas
- [ ] `components/service-form.tsx` and `components/resource-form.tsx` — `border-gray-300` checkbox borders → `border-input`
- [ ] `components/booking-calendar.tsx` — `bg-gray-400` legend dot → `bg-muted-foreground`

### Fix Next (Phase 2 — Primary User Surfaces)

- [ ] `components/tenant-public-page.tsx` — full migration from manual `dark:` dual-classes to semantic tokens (most impactful public-facing surface)
- [ ] `components/booking-form.tsx` — full migration from manual `dark:` dual-classes to semantic tokens (booking flow is the core product)
- [ ] `components/landing/PricingCards.tsx` — CTA button white background on gradient card

### Fix Last (Phase 3 — Dashboard Polish)

- [ ] `components/analytics-dashboard.tsx` — stat card icon badge backgrounds + CartesianGrid stroke color
- [ ] Remaining landing components (`FeaturesGrid.tsx`, `StatsCounter.tsx`, `Testimonials.tsx`) — full audit
- [ ] Auth pages (`register/page.tsx`, `verify-otp/page.tsx`) — full audit
- [ ] Dashboard subcomponents (`staff-manager.tsx`, `services-manager.tsx`, `resources-manager.tsx`, `activity-timeline.tsx`) — full audit

---

## Feature Prioritization Matrix

| Feature/Fix | User Visibility | Implementation Cost | Priority |
|-------------|-----------------|---------------------|----------|
| Body `bg-background` in globals.css | CRITICAL — affects all pages | LOW — single line | P1 |
| `tenant-public-page.tsx` token migration | HIGH — public-facing, first impression | MEDIUM — many dual-class patterns to refactor | P1 |
| `booking-form.tsx` token migration | HIGH — core product flow | MEDIUM — many dual-class patterns | P1 |
| Analytics CartesianGrid stroke | MEDIUM — chart gridlines invisible in dark | LOW — one computed value | P2 |
| Analytics stat card icon badges | LOW — small colored squares | LOW — three classes | P2 |
| `PricingCards.tsx` CTA button | MEDIUM — conversion-critical button | LOW — one conditional class | P2 |
| Checkbox `border-gray-300` fixes | LOW — small chrome detail | LOW — two files, two lines each | P2 |
| Auth page audit | MEDIUM — login is a trust surface | LOW — mostly semantic already | P2 |
| Landing FeaturesGrid / Testimonials audit | LOW — mostly semantic from codebase evidence | LOW | P3 |
| Dashboard manager component audit | MEDIUM — admin UX quality | LOW per file | P2 |

**Priority key:**
- P1: Required for dark mode to be non-broken on primary flows
- P2: Required for dark mode to be polished and complete
- P3: Nice to have, fine to leave for follow-up

---

## Sources

- Direct codebase audit: `app/globals.css`, `components/tenant-public-page.tsx`, `components/booking-form.tsx`, `components/booking-calendar.tsx`, `components/analytics-dashboard.tsx`, `components/service-form.tsx`, `components/resource-form.tsx`, `components/dashboard-sidebar.tsx`, `components/bookings-dashboard.tsx`, `components/ui/sonner.tsx`, `components/ui/skeleton.tsx`, `components/landing/` (all files), `app/dashboard/` (all files), `app/admin/` (all files), `app/(auth)/login/page.tsx`
- Project context: `.planning/PROJECT.md` (semantic replacement map, scope constraints)
- Architecture context: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
- shadcn/ui token conventions (well-established, HIGH confidence from direct inspection of globals.css token definitions)

---

*Feature research for: Dark mode audit and fix — omni-book multi-tenant SaaS*
*Researched: 2026-03-17*
