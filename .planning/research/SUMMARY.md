# Project Research Summary

**Project:** omni-book dark mode audit and fix
**Domain:** Semantic theming refactor — Tailwind CSS 4 + shadcn/ui + next-themes in Next.js 15 multi-tenant SaaS
**Researched:** 2026-03-17
**Confidence:** HIGH

## Executive Summary

This is not a new feature build — it is a targeted audit-and-fix of an existing dark mode theming system that is partially broken. The foundation is correct: `app/globals.css` defines a complete OKLch-based token set for both `:root` (light) and `.dark` (dark), the body baseline applies `bg-background text-foreground`, and next-themes correctly injects the `.dark` class on `<html>` via two independent ThemeProvider instances (admin and booking surfaces). The problem is that a significant portion of the application's components were written with hardcoded Tailwind palette classes (`bg-white`, `text-gray-900`, `bg-zinc-900`, `dark:bg-zinc-900`, etc.) rather than the semantic CSS variable tokens the system provides. In dark mode, these components render with the wrong colors or require duplicated `dark:` variants that diverge from the token system.

The recommended approach is a phased, surface-by-surface replacement of hardcoded color utilities with their semantic equivalents from the existing token set. No new tokens should be added, no component structure should change, and no logic should be touched — every change is a color class swap only. The replacement map is fully defined in STACK.md and is authoritative: `bg-white` on page roots becomes `bg-background`, on card surfaces becomes `bg-card`, `text-gray-900` becomes `text-foreground`, `text-gray-500` becomes `text-muted-foreground`, `border-gray-200` becomes `border-border`, and so on. The sidebar has its own dedicated token family (`bg-sidebar`, `text-sidebar-foreground`, etc.) that must be used instead of the general tokens.

The two primary risks are token selection errors and incomplete migration. The most dangerous error is using `bg-background` in place of `bg-card` or `bg-sidebar` — in light mode all three resolve to near-white so the mistake is invisible; in dark mode they render at different lightness levels (`oklch(0.12)` vs `oklch(0.16)`) and collapse surface hierarchy. The second risk is leaving `dark:!` force-override classes in place after migrating the base class — `billing-content.tsx` is the worst offender and needs its entire dual-class pattern stripped and replaced. Three files represent the majority of broken dark mode surface area: `components/tenant-public-page.tsx`, `components/booking-form.tsx`, and `app/dashboard/settings/billing/billing-content.tsx`.

## Key Findings

### Recommended Stack

The theming system is Tailwind CSS 4.2.1 with `@theme inline` bridging CSS custom properties to utility classes, shadcn/ui 4.0.2 for components that already use semantic tokens by default, and next-themes 0.4.6 for class-based theme switching. The `@theme inline` directive is critical: it generates utilities like `bg-background` that output `background-color: var(--background)` preserving the live CSS variable reference. Without `inline`, the variable would resolve at compile time, breaking runtime switching. This stack is already installed and configured — no dependency changes are needed.

**Core technologies:**
- Tailwind CSS 4.2.1: utility generation from CSS variables via `@theme inline` — no config file, tokens registered directly in `globals.css`
- shadcn/ui 4.0.2: component library with semantic token conventions baked in — all `components/ui/` files are already correct
- next-themes 0.4.6: `attribute="class"` mode adds `.dark` to `<html>`; triggers full CSS cascade change; `suppressHydrationWarning` on `<html>` prevents React hydration mismatch
- OKLch color model: tokens chosen for perceptual contrast, not mechanical inversion — dark values are individually designed, not auto-calculated

### Expected Features

This project's "features" are the theming behaviors that must hold across all surfaces after the fix is complete.

**Must have (table stakes — dark mode is broken without these):**
- Page/body background responds to theme — `globals.css` body rule already correct, no change needed
- Card and panel backgrounds flip to dark card surface — replace `bg-white` with `bg-card` on all discrete content containers
- Text contrast on all surfaces — replace `text-gray-900`, `text-zinc-900`, `text-slate-900` with `text-foreground`; replace `text-gray-500`, `text-zinc-400` with `text-muted-foreground`
- Form input backgrounds and borders — replace `bg-white` on date/time inputs with `bg-background`; replace `border-gray-300` with `border-input`
- Border colors on all surfaces — replace `border-gray-200`, `border-zinc-200` with `border-border`
- Sidebar background and text using sidebar token family — not general background/card tokens
- Hover state backgrounds — replace `hover:bg-gray-100` with `hover:bg-muted`

**Should have (completeness — dark mode is noticeably incomplete without these):**
- Analytics CartesianGrid stroke color — replace `stroke="#f4f4f5"` with `var(--color-muted)` or CSS variable equivalent
- Analytics chart cursor tooltip background — replace `cursor={{ fill: '#f4f4f5' }}` with `cursor={{ fill: 'var(--color-muted)' }}`
- Stat card icon badge backgrounds — replace `bg-blue-50 text-blue-600` with `bg-primary/10 text-primary`
- Gradient sections with dark variants — landing and tenant hero gradients need `dark:from-*` / `dark:to-*` counterparts where they adapt rather than being fixed brand colors

**Defer (out of scope per PROJECT.md):**
- Recharts bar/pie fill colors beyond the cursor fix — third-party internals, separately planned
- New token additions to `globals.css` — not needed for this fix
- Niche accent brand colors (`bg-blue-600`, `bg-pink-600`, `bg-orange-600`) — intentionally hardcoded per niche type, must not be replaced

### Architecture Approach

The codebase is divided into five surfaces, each wrapped in either `AdminThemeProvider` or `BookingThemeProvider`. Both providers share the same `globals.css` token definitions, so a correct token choice applies to both. Fixing requires working surface by surface — landing/marketing, then tenant booking, then admin dashboard — because each surface must be independently tested by toggling its own theme control. The `components/ui/` shadcn primitives are already fully semantic and require no changes; only feature-level and page-level components need fixing.

**Major components and their current state:**
1. `app/globals.css` — theme foundation (CORRECT — no changes needed)
2. `components/theme-providers.tsx` — next-themes configuration (CORRECT — no changes needed)
3. `components/landing/` (7 files) — marketing surface (BROKEN — mixed zinc/slate with `dark:` overrides)
4. `components/tenant-public-page.tsx` + `booking-form.tsx` + `booking-calendar.tsx` — tenant booking surface (BROKEN/PARTIAL — heavy dual-class patterns)
5. `components/dashboard-sidebar.tsx` + `app/dashboard/settings/billing/billing-content.tsx` + `components/analytics-dashboard.tsx` — dashboard surface (BROKEN — `dark:!` force overrides in billing, minor zinc in others)

### Critical Pitfalls

1. **Using `bg-background` where `bg-card` or `bg-sidebar` is correct** — in light mode all resolve to near-white so the mistake is invisible; in dark mode they are distinct surfaces (`oklch(0.12)` vs `oklch(0.16)`). Always match the token to the semantic role: page root = `bg-background`, discrete content surface = `bg-card`, sidebar shell = `bg-sidebar`.

2. **Leaving `dark:!` overrides in place after replacing the base class** — `billing-content.tsx` has 15+ `dark:!bg-zinc-900` and `dark:!text-white` force overrides. The correct approach is to remove both the hardcoded base class AND the `dark:!` override simultaneously, replacing both with a single semantic token. Leaving the `dark:!` override means the component is not truly semantic.

3. **Replacing intentional brand/niche accent colors** — `booking-form.tsx` and `tenant-public-page.tsx` contain per-niche color maps (`bg-blue-600 text-white`, `bg-pink-600 text-white`, etc.). These are business identity colors, not UI surface colors. `text-white` on a saturated dark-enough background is correct contrast in both modes. Do not replace these.

4. **`text-white` on semantic backgrounds that lighten in dark mode** — `bg-primary` shifts from `oklch(0.45)` (dark enough for white text) in light mode to `oklch(0.65)` (too light for white text) in dark mode. The correct class is `text-primary-foreground` which the token system defines as near-black in dark mode. Found in `dashboard-sidebar.tsx` and `billing-content.tsx`.

5. **Inline `style={{}}` and SVG `fill` props bypassing Tailwind** — Recharts uses JSX props for colors, not CSS classes. The `analytics-dashboard.tsx` cursor prop `cursor={{ fill: '#f4f4f5' }}` is a hardcoded light gray that disappears against the dark card background. Fix with `cursor={{ fill: 'var(--color-muted)' }}`. Google sign-in SVG colors are brand-required — do not replace them.

## Implications for Roadmap

The research strongly supports a 5-phase structure ordered from infrastructure validation through surface-by-surface fixes to cleanup, matching the build order identified in ARCHITECTURE.md.

### Phase 0: Infrastructure Validation
**Rationale:** Confirm the token foundation is correct before touching any component. The research confirms `globals.css` is already correct (body baseline, `@custom-variant dark`, full `.dark` token block). This is a read-only verification pass that takes minutes and prevents wasted work if a foundation issue is found.
**Delivers:** Confirmed green-light to proceed; documented baseline state
**Avoids:** Anti-Pattern 4 from ARCHITECTURE.md — fixing components before globals.css is verified

### Phase 1: Landing / Marketing Surface
**Rationale:** Public-facing, stateless, no auth dependencies, no side effects. Regressions are visible to any visitor immediately but the components contain no business logic. Safe to batch all 7-8 files together. Establishes the `bg-card` vs `bg-background` rule that carries through all subsequent phases.
**Delivers:** All marketing pages (`/`, pricing, features, etc.) correct in dark mode
**Addresses:** Landing components with mixed zinc/slate `dark:` overrides
**Files:** `components/landing/HeroSection.tsx`, `DemoSection.tsx`, `NicheCards.tsx`, `Testimonials.tsx`, `FeaturesGrid.tsx`, `StatsCounter.tsx`, `PricingCards.tsx`, `Footer.tsx`
**Avoids:** Gradient sections without dark variants (Pitfall 9); inline `rgba()` in hover-glow utility (Pitfall 7)

### Phase 2: Tenant Public Booking Surface
**Rationale:** Customer-facing and high-traffic. `tenant-public-page.tsx` has the heaviest hardcoded color usage (34+ zinc/slate occurrences) of any single file. The booking form is the core product flow. Both files share the same route surface and must be fixed together to avoid a mismatched outer container and inner form.
**Delivers:** Every tenant public page and booking flow correct in dark mode — the highest-visibility customer-facing surfaces
**Addresses:** Full migration of dual-class `dark:` patterns to single semantic tokens; niche brand colors explicitly preserved
**Files:** `components/tenant-public-page.tsx`, `components/booking-form.tsx`, `components/booking-calendar.tsx`
**Avoids:** Replacing niche accent colors (Pitfall 3 / Anti-Pattern 3); `bg-card` vs `bg-background` confusion on page shell

### Phase 3: Dashboard Surface
**Rationale:** Authenticated-only, so regressions are not publicly visible. `billing-content.tsx` is the most broken dashboard file (heavy `dark:!` force overrides) and is the best example of the dual-class anti-pattern that must be fully eradicated. Dashboard sidebar uses a dedicated sidebar token family that requires explicit attention.
**Delivers:** Full dark mode correctness across all authenticated dashboard views including billing, analytics, and sidebar navigation
**Addresses:** `dark:!` override strip in `billing-content.tsx`; sidebar token family in `dashboard-sidebar.tsx`; `text-zinc-400` in `analytics-dashboard.tsx`
**Files:** `components/dashboard-sidebar.tsx`, `app/dashboard/settings/billing/billing-content.tsx`, `components/analytics-dashboard.tsx`, `components/dashboard/activity-timeline.tsx`
**Avoids:** Sidebar token confusion (Pitfall 10); `text-white` on semantic lightening backgrounds (Pitfall 2); `dark:!` band-aid proliferation (Pitfall 4)

### Phase 4: Cleanup Sweep
**Rationale:** Remaining minor and edge-case components. Some fixes here may be intentional brand colors upon closer inspection (`bg-zinc-900` footer sections). Lowest risk, lowest visibility.
**Delivers:** Complete audit coverage with no remaining known hardcoded gray/zinc/slate utilities
**Files:** `components/banned-actions.tsx`, `components/booking-status-badge.tsx`, `app/dashboard/page.tsx`
**Avoids:** Accidentally replacing intentional dark-section zinc backgrounds (footer, brand hero areas)

### Phase Ordering Rationale

- Foundation-first: globals.css validation before any component work eliminates the scenario where components are fixed but the page canvas is still broken
- Public-before-private: landing then tenant then dashboard prioritizes what visitors and customers see over what operators see
- High-impact-before-low: `tenant-public-page.tsx` and `billing-content.tsx` have the highest class-count issues and fix the most broken-looking surfaces per file
- Shared-components-early: `components/landing/*` and `components/booking-form.tsx` are shared across many routes — fixing once fixes all instances, making each phase maximally impactful
- Cleanup last: `banned-actions.tsx` is an edge-case page; `app/dashboard/page.tsx` decorative overlays may be intentional

### Research Flags

Phases with standard, well-documented patterns (no additional research needed):
- **Phase 0:** Pure codebase verification, no implementation
- **Phase 1:** Stateless component token swap, follows the replacement map exactly
- **Phase 2:** Token swap plus care around niche color maps — the maps are documented and their files are known
- **Phase 4:** Minor fixes, each is a single class swap

Phases that may benefit from careful pre-phase review:
- **Phase 3 (billing-content.tsx specifically):** The `dark:!` force overrides indicate a previous failed fix attempt. Before replacing classes, confirm which styles are being overridden and why — the root cause of the specificity conflict should be understood before the overrides are removed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings verified directly against `globals.css`, `theme-providers.tsx`, Tailwind 4 official docs, and shadcn/ui component source |
| Features | HIGH | Based on direct file-by-file codebase audit; specific line numbers and classes confirmed |
| Architecture | HIGH | Component states (CORRECT / BROKEN / MINOR) confirmed via direct grep scan across all `components/` and `app/` directories |
| Pitfalls | HIGH | All 10 pitfalls grounded in actual code found in this specific repo (confirmed line numbers, confirmed file paths) |

**Overall confidence:** HIGH

### Gaps to Address

- **`components/staff-manager.tsx`, `services-manager.tsx`, `resources-manager.tsx`:** These files were noted in FEATURES.md as "needs audit" and were not directly reviewed in the research phase. They should be audited at the start of Phase 3 before the dashboard phase begins.
- **`app/(auth)/register/page.tsx` and `verify-otp/page.tsx`:** Marked "needs audit" in FEATURES.md and noted as CLEAN in ARCHITECTURE.md based on structural inference. These need a direct scan before being marked complete.
- **Recharts bar/pie fill colors:** The `PIE_COLORS` array and `fill="#22c55e"` bar colors are confirmed broken but deferred per PROJECT.md scope. If scope expands, the approach is documented in Pitfall 3: resolve CSS variables at runtime via `getComputedStyle` inside a `useMemo` that re-runs on theme change.
- **`hover-glow` utility `rgba()` in globals.css:** Uses `rgba(99, 102, 241, 0.15)` hardcoded indigo. Fix approach: replace with `color-mix(in oklch, var(--color-primary) 15%, transparent)`. This is outside component scope but is a known loose end.

## Sources

### Primary (HIGH confidence)
- `app/globals.css` — authoritative token definitions, verified line by line; body baseline, `@custom-variant dark`, `@theme inline` block
- `components/theme-providers.tsx` — `attribute: 'class'`, dual-provider configuration, `storageKey` values
- `components/tenant-public-page.tsx` — confirmed 34+ hardcoded zinc/slate occurrences and `dark:` dual-class pattern
- `components/booking-form.tsx` — confirmed niche color maps and single `bg-white` fix target
- `app/dashboard/settings/billing/billing-content.tsx` — confirmed `dark:!` force override proliferation (15+ instances)
- `components/analytics-dashboard.tsx` — confirmed `PIE_COLORS` array, `fill="#22c55e"`, `cursor={{ fill: '#f4f4f5' }}`
- Tailwind CSS 4 official docs — `@theme inline` behavior, `@custom-variant dark` syntax, `--color-*` namespace convention
- Direct grep scan of all `bg-white`, `bg-gray-*`, `text-gray-*`, `bg-zinc-*`, `text-zinc-*`, `dark:` variant usage across `components/` and `app/`

### Secondary (MEDIUM confidence)
- `components/landing/` (7 files) — partial audit; HeroSection, Navbar, Footer, NicheCards, DemoSection confirmed CLEAN or with explicit dark variants; FeaturesGrid, StatsCounter, Testimonials inferred from structural patterns
- `app/dashboard/` layout files — confirmed mostly semantic; full inner component audit deferred to Phase 3

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
