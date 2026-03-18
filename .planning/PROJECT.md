# Dark Mode Audit & Fix — omni-book

## What This Is

A systematic refactor of the omni-book multi-tenant SaaS to make dark mode work flawlessly across the entire UI. Every component was audited for hardcoded Tailwind color classes and replaced with semantic shadcn/ui CSS variables so that toggling dark mode produces a correct, visually consistent UI without broken contrast or invisible text.

**v1.0 shipped 2026-03-19.** All 5 surfaces (infrastructure, landing, tenant public, dashboard, auth) and all 26 requirements delivered across 15 plans in 2 days.

## Core Value

Every page and component renders correctly in both light and dark mode — no white backgrounds trapped in dark mode, no invisible text, no hardcoded color escapes.

## Requirements

### Validated

- ✓ Dark mode infrastructure installed (next-themes 0.4.6) — existing pre-v1.0
- ✓ shadcn/ui CSS variable system defined in `app/globals.css` with OKLch color model — existing pre-v1.0
- ✓ Tailwind CSS 4.2.1 with `bg-background` / `text-foreground` variable tokens available — existing pre-v1.0
- ✓ Theme toggle mechanism exists in the UI — existing pre-v1.0
- ✓ `app/globals.css` body tag applies `bg-background text-foreground` as canvas baseline — v1.0 (FOUND-01)
- ✓ `@theme inline` block correctly bridges CSS custom properties to Tailwind utilities — v1.0 (FOUND-02)
- ✓ Both ThemeProviders use `attribute="class"` to set `.dark` on `<html>` — v1.0 (FOUND-03)
- ✓ All hardcoded background classes in `components/landing/` replaced with semantic equivalents — v1.0 (LAND-01)
- ✓ All hardcoded text classes in `components/landing/` replaced with semantic equivalents — v1.0 (LAND-02, LAND-03)
- ✓ All hardcoded border classes in `components/landing/` replaced with `border-border` — v1.0 (LAND-04)
- ✓ Hover/focus/ring state variants in landing components use semantic tokens — v1.0 (LAND-05)
- ✓ `PricingCards.tsx` fully semantic — no hardcoded color utilities except intentional brand accents — v1.0 (LAND-06)
- ✓ Gradient sections in landing have correct dark mode behavior — v1.0 (LAND-07)
- ✓ `tenant-public-page.tsx` — all 34+ hardcoded zinc/slate `dark:` dual-class pairs replaced — v1.0 (BOOK-01)
- ✓ `booking-form.tsx` — `bg-white` on date/time inputs replaced with `bg-background` — v1.0 (BOOK-02)
- ✓ `booking-calendar.tsx` — hardcoded color classes replaced with semantic tokens — v1.0 (BOOK-03)
- ✓ Niche brand accent colors preserved as intentional identity colors — v1.0 (BOOK-04)
- ✓ Hero section container background uses `bg-background` not `bg-card` — v1.0 (BOOK-05)
- ✓ `dashboard-sidebar.tsx` uses full sidebar token family — v1.0 (DASH-01)
- ✓ `billing-content.tsx` — all 15+ `dark:!` force-override classes removed — v1.0 (DASH-02)
- ✓ `analytics-dashboard.tsx` — hardcoded hex values replaced with CSS variable references — v1.0 (DASH-03)
- ✓ Staff/services/resources managers audited and confirmed clean — v1.0 (DASH-04)
- ✓ `text-white` on semantic backgrounds replaced with `text-primary-foreground` — v1.0 (DASH-05)
- ✓ Auth pages (login, register, OTP) confirmed correct in dark mode — v1.0 (AUTH-01, AUTH-02, AUTH-03)
- ✓ `banned-actions.tsx` and `booking-status-badge.tsx` remediated — v1.0 (CLEAN-01, CLEAN-02)
- ✓ `app/dashboard/page.tsx` `bg-white/10` overlays documented as intentional — v1.0 (CLEAN-03)

### Active

*(Next milestone — define via `/gsd:new-milestone`)*

### Out of Scope

- Business logic changes — strict constraint, color refactor only
- State management or component structure changes — strict constraint
- Third-party component internals (recharts bar/pie fills) — not accessible via Tailwind class replacement; deferred to v2 (ADV-01)
- `hover-glow` utility CSS var refactor — deferred to v2 (ADV-02)
- Automated visual regression screenshots — deferred to v2 (ADV-03)
- Custom CSS properties defined outside Tailwind utility classes — handled case-by-case only

## Context

The app uses Next.js 15 App Router with a multi-tenant architecture. UI is built with shadcn/ui components on top of Tailwind CSS 4.2.1. The color system is OKLch-based, defined in `app/globals.css` as CSS custom properties (`:root` for light, `.dark` for dark). The `next-themes` library manages the `dark` class on the `<html>` element.

**v1.0 state:** 27,500 LOC TypeScript. 66 files modified. All surfaces confirmed dark-mode-correct. Niche brand accent colors (blue-600, pink-600, orange-600, green-600) preserved as intentional functional palette. Fixed-dark surfaces (Footer, booking calendar RESOURCE_PALETTE) documented with code comments.

**Known patterns established during v1.0:**
- Static file assertion tests using `fs.readFileSync` + regex for Tailwind class audits (no DOM/build required)
- Intentional brand exception documentation via code comments (`// INTENTIONAL: fixed-dark surface`)
- `dark:!` force-overrides indicate past failed fix attempts — investigate specificity root cause before stripping
- Sidebar uses separate `bg-sidebar` token family, not `bg-background`/`bg-card`
- Orange force-login warning and green OTP success blocks are functional status colors — not violations

## Constraints

- **Scope**: Color utility classes only — zero business logic, state management, or structural changes
- **Tech stack**: Tailwind CSS 4.2.1 + shadcn/ui CSS variables; do not introduce new tokens not already defined in `globals.css`
- **Verification**: Visual manual review by toggling dark mode on each page after each phase completes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use semantic shadcn/ui tokens (not custom `dark:` variants) | Tokens automatically adapt to theme class; `dark:` variants would duplicate effort and diverge from shadcn patterns | ✓ Good — resulted in cleaner, more maintainable code throughout |
| Prioritize dashboard + landing first | These are highest-traffic areas and contain most of the custom color usage | ✓ Good — established patterns early, later phases had clearer precedent |
| Include hover/focus/ring variants in scope | Invisible hover states in dark mode are a common and jarring UX failure | ✓ Good — caught several hover state violations |
| Treat Footer.tsx as intentional fixed-dark surface | Strong product intent as a visual anchor at page bottom | ✓ Good — documented with comment, not altered |
| Use `bg-sidebar` token family for sidebar | Sidebar needs visual separation from main content area | ✓ Good — sidebar renders distinctly in both modes |
| Preserve `RESOURCE_PALETTE` in booking-calendar.tsx | Functional accent colors for resource differentiation, not neutral violations | ✓ Good — documented with intent comment |
| Remove billing-content.tsx `dark:!` overrides | Root cause was specificity conflict with DialogContent; removing overrides + fixing base classes resolved both | ✓ Good — code is simpler and more robust |

---
*Last updated: 2026-03-19 after v1.0 milestone*
