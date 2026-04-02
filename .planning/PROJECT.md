# omni-book

## What This Is

omni-book is a multi-tenant SaaS booking platform where tenants (businesses) configure their services and resources, and customers book appointments via a public-facing page. It supports multiple business niches (healthcare, legal, fitness, etc.) with configurable options per niche.

**v1.0 shipped 2026-03-19** — Full dark mode audit across all surfaces (66 files, 26 requirements). **v1.1 shipped 2026-03-19** — Critical bug fixes: opt_* ID display, mobile card overflow, mobile theme toggle visibility (6 requirements, 20 regression tests added). **v1.2 shipped 2026-03-20** — Advanced Customization & Niche Expansion: custom duration input + 19 new resource types with trilingual translations (12 requirements).

## Core Value

A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.

## Current Milestone: v1.4 Client Base (Mini-CRM)

**Goal:** Build a client aggregation layer so business owners can view their actual customer base — who visited, how often, how much they spent, and whether they're reachable via Telegram.

**Target features:**
- Dedicated `Client` Prisma model linked to `Tenant`, synced from existing bookings
- Aggregated metrics per client: total visits, total revenue, last visit date, Telegram status
- Neumorphic clients table page at `app/(dashboard)/[tenantId]/clients/page.tsx` with search
- Client detail page showing full booking history per client
- Telegram message action for clients with active chat connection

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
- ✓ All `opt_*` ID leaks in `booking-form.tsx` resolved — users see human-readable labels everywhere — v1.1 (DATA-01, DATA-02)
- ✓ Mobile card text overflow fixed in services/resources managers — `min-w-0` + `truncate` pattern applied — v1.1 (MOBL-01, MOBL-02)
- ✓ PublicThemeToggle visible on all viewports — `hidden sm:` removed — v1.1 (THEM-01, THEM-02)
- ✓ `durationMin` Select replaced with number input stepper (1–1440 min) + custom buttons + presets — v1.2 (DUR-01, DUR-02, DUR-03, DUR-04, DUR-05, DUR-06)
- ✓ 19 new resource types across 4 niches (6 clinic, 5 horeca, 5 sports, 3 beauty) — v1.2 (RES-01, RES-02, RES-03, RES-04)
- ✓ Beauty specialization converted from select to free-text; horeca/sports gain `attr_specialization` for staff — v1.2 (SPEC-01)
- ✓ RU/EN/KZ translations for all 19 new resource type labels + `attr_specialization` (60 entries) — v1.2 (I18N-01)

- ✓ Neumorphism Soft UI system (`var(--neu-bg)`, `.neu-raised`, `.neu-inset`) across all surfaces — v1.3 (NEU-01–14)
- ✓ Super-Admin "God Mode" panel: Financial Analytics, Tenant Drill-Down, Announcement Banners, Notification Bell, Audit Log — v1.3 (GOD-01–06)
- ✓ Subscription lifecycle: `isFrozen` on Resource/Service, daily cron with 3-day warnings, frozen UI badges, billing EXPIRED alert, super-admin activation with bulk unfreeze — v1.3 (SUB-01–06)

### Active

- [ ] **CRM-01**: Client model linked to Tenant, synced from existing bookings
- [ ] **CRM-02**: Aggregated metrics per client (visits, revenue, last visit, Telegram status)
- [ ] **CRM-03**: Clients table page with Neumorphic design and search
- [ ] **CRM-04**: Client detail page with full booking history
- [ ] **CRM-05**: Send Telegram message action from client detail

### Out of Scope

- New features during v1.1 — pure bug fix milestone only (completed)
- Automated visual regression screenshots — deferred to v2 (ADV-03, carried from v1.1)
- Third-party component internals (recharts bar/pie fills) — deferred to v2 (ADV-01)
- `hover-glow` utility CSS var refactor — deferred to v2 (ADV-02)
- Automated visual regression screenshots — deferred to v2 (ADV-03)

## Context

The app uses Next.js 15 App Router with a multi-tenant architecture. UI is built with shadcn/ui components on top of Tailwind CSS 4.2.1. The color system is OKLch-based, defined in `app/globals.css` as CSS custom properties (`:root` for light, `.dark` for dark). The `next-themes` library manages the `dark` class on the `<html>` element.

**v1.2 state:** ~20,000 LOC TypeScript (app code). 12 requirements delivered across 2 phases. Duration stepper widget added to `service-form.tsx` with 12 new static-file assertion tests. `NICHE_CONFIG` expanded with 19 new resource type entries and 60 new i18n translation keys. Pre-existing `cleanup-surface.test.ts` failures (6 tests, dark mode selection state) documented as tech debt — root cause is commit f7da11b from v1.0 completion.

**Known patterns established:**
- Static file assertion tests using `fs.readFileSync` + regex for Tailwind class audits (no DOM/build required) — extended in v1.1 to cover opt_* display correctness and mobile class audits
- Intentional brand exception documentation via code comments (`// INTENTIONAL: fixed-dark surface`)
- `dark:!` force-overrides indicate past failed fix attempts — investigate specificity root cause before stripping
- Sidebar uses separate `bg-sidebar` token family, not `bg-background`/`bg-card`
- Orange force-login warning and green OTP success blocks are functional status colors — not violations
- `min-w-0` on flex children enables `truncate` to work — never use `overflow-hidden` on the card container for text truncation inside flex layouts
- Inline opt_ guard pattern: `strVal.startsWith('opt_') ? t('niche', strVal) : strVal` — consistent with resource-form.tsx `optLabel` helper approach

## Constraints

- **Tech stack**: Next.js 15 App Router, Tailwind CSS 4.2.1, shadcn/ui, next-themes 0.4.6
- **Scope (v1.1)**: Bug fixes only — no new features, no structural refactors beyond what's needed to fix each bug *(completed)*
- **Verification**: Manual review on mobile viewport + both themes after each fix

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
| Inline opt_ guard at each display point (no shared helper) | Keeps fixes localized, consistent with existing tenant-public-page.tsx inline approach — avoids refactoring scope | ✓ Good — minimal diff, easy to review |
| `min-w-0` on flex child (not `overflow-hidden` on container) | Canonical Tailwind pattern; `overflow-hidden` on the container can clip shadows/outlines | ✓ Good — correct pattern per Tailwind docs |
| Remove `max-w-xs` from description after adding `min-w-0` | `max-w-xs` becomes incorrect once parent has `min-w-0`; description should fill available width | ✓ Good — avoids unintended width cap |
| Static file assertions scoped by `sm:hidden` / `hidden sm:` boundary | Allows mobile-only class audits without a DOM or build step | ✓ Good — extends established static assertion pattern |
| `col-span-full` on duration FormItem | Wider stepper widget (input + buttons + presets) needs its own grid row | ✓ Good — clean layout, no column-sharing conflicts |
| `FormControl` wraps relative div wrapper (not Input) | Radix Slot forwards `id`/`aria-invalid` to first child — wrapping the container div is valid since Input is the only interactive element | ✓ Good — resolves Slot prop forwarding without restructuring |
| New resource type keys use `resource_type_<value>` pattern (no `opt_xxx`) | Breaking away from opaque opt_ pattern for all new additions — readable keys preferred | ✓ Good — eliminates future opt_ leakage risk at source |
| Beauty specialization → free-text (not select) | Removes 6 opaque `opt_xxx` options; staff records with type:'staff' still match forTypes filter | ✓ Good — simpler UX, backward compatible for stored records |

---
*Last updated: 2026-04-02 — Phase 10 complete: SaaS monetization, Enterprise tier & platform payments*
