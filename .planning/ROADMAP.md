# Roadmap: Dark Mode Audit & Fix — omni-book

## Overview

A surface-by-surface replacement of hardcoded Tailwind color utilities with semantic shadcn/ui CSS variable tokens across the entire omni-book application. Starting with infrastructure validation to confirm the token foundation is solid, then working outward through the most public-facing surfaces (landing, tenant booking) before tackling authenticated surfaces (dashboard, auth), and finishing with a cleanup sweep of edge-case components. Every change is a color class swap only — zero business logic, zero structural changes.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2, 3, 4): Planned milestone work
- Decimal phases: Urgent insertions (marked with INSERTED)

- [x] **Phase 0: Infrastructure Validation** - Verify globals.css token foundation before touching any component (completed 2026-03-17)
- [ ] **Phase 1: Landing / Marketing Surface** - Remediate all 7+ components in `components/landing/`
- [ ] **Phase 2: Tenant Public Booking Surface** - Remediate tenant-public-page, booking-form, booking-calendar
- [ ] **Phase 3: Dashboard + Auth Surface** - Remediate sidebar, billing, analytics, staff/services/resources, and auth pages
- [ ] **Phase 4: Cleanup Sweep** - Remediate remaining edge-case components and verify complete coverage

## Phase Details

### Phase 0: Infrastructure Validation
**Goal**: Confirm the CSS token foundation is correct and unblocked before any component work begins
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03
**Success Criteria** (what must be TRUE):
  1. `app/globals.css` body rule applies `bg-background text-foreground` as the page canvas baseline — verified by inspection
  2. The `@theme inline` block bridges CSS custom properties to Tailwind utility classes — verified by confirming `bg-background` resolves to `var(--background)`
  3. Both `AdminThemeProvider` and `BookingThemeProvider` use `attribute="class"` to inject `.dark` on `<html>` — verified in `theme-providers.tsx`
**Plans:** 1/1 plans complete
Plans:
- [x] 00-01-PLAN.md — Create automated validation tests for FOUND-01, FOUND-02, FOUND-03

### Phase 1: Landing / Marketing Surface
**Goal**: Every marketing and landing page renders correctly in both light and dark mode
**Depends on**: Phase 0
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-07
**Success Criteria** (what must be TRUE):
  1. Toggling dark mode on the landing page (`/`) shows no white panels, cards, or text on dark backgrounds
  2. `PricingCards.tsx` renders with correct contrast in both modes — no invisible text or washed-out borders
  3. Gradient sections either adapt to dark mode with `dark:from-*/to-*` variants or are explicitly documented as intentional fixed brand colors
  4. All hover states in landing components produce a visible, non-jarring feedback color in both modes
**Plans:** 4 plans (2 executed, 2 gap closure)
Plans:
- [x] 01-01-PLAN.md — Create test scaffold + remediate HeroSection, PricingCards, FeaturesGrid, Footer
- [x] 01-02-PLAN.md — Remediate Testimonials, NicheCards, DemoSection, StatsCounter
- [ ] 01-03-PLAN.md — Fix Footer.tsx build-blocking JSX syntax error (gap closure)
- [ ] 01-04-PLAN.md — Replace dark:bg-zinc-900 with dark:bg-card + add test coverage (gap closure)

### Phase 2: Tenant Public Booking Surface
**Goal**: Every tenant public page and booking flow renders correctly in both light and dark mode
**Depends on**: Phase 1
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05
**Success Criteria** (what must be TRUE):
  1. `tenant-public-page.tsx` displays with correct surface hierarchy in dark mode — no zinc/slate hardcoded classes remaining, no dual `dark:` pairs
  2. The booking form (date/time inputs, submit button) is legible and correctly bordered in dark mode
  3. The booking calendar renders with visible day cells, borders, and selected-state highlights in dark mode
  4. Niche brand accent colors (`bg-blue-600`, `bg-pink-600`, `bg-orange-600`, `bg-green-600`) are unchanged and visually intact in both modes
**Plans:** 2/3 plans executed
Plans:
- [ ] 02-01-PLAN.md — Create test scaffold for BOOK-01 through BOOK-05
- [ ] 02-02-PLAN.md — Remediate tenant-public-page.tsx (BOOK-01, BOOK-04, BOOK-05)
- [ ] 02-03-PLAN.md — Remediate booking-form.tsx and booking-calendar.tsx (BOOK-02, BOOK-03, BOOK-04)

### Phase 3: Dashboard + Auth Surface
**Goal**: All authenticated dashboard views and auth pages render correctly in both light and dark mode
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. The dashboard sidebar uses the sidebar token family (`bg-sidebar`, `text-sidebar-foreground`) and renders distinct from the main content area in dark mode
  2. The billing page has no `dark:!` force-override classes — every element uses a single semantic token and renders correctly in both modes
  3. The analytics dashboard chart area (CartesianGrid, cursor tooltip) is visible and readable in dark mode
  4. Login, register, and OTP verification pages are readable and correctly themed in dark mode (brand SVG colors preserved)
**Plans:** 3/4 plans executed
Plans:
- [ ] 03-01-PLAN.md — Create test scaffold covering DASH-01 through AUTH-03 (Wave 1)
- [ ] 03-02-PLAN.md — Remediate dashboard-sidebar.tsx and billing-content.tsx (DASH-01, DASH-02, DASH-05)
- [ ] 03-03-PLAN.md — Remediate analytics-dashboard.tsx and confirm manager components (DASH-03, DASH-04)
- [ ] 03-04-PLAN.md — Audit and confirm auth pages + visual checkpoint (AUTH-01, AUTH-02, AUTH-03)

### Phase 4: Cleanup Sweep
**Goal**: All remaining edge-case components audited and any hardcoded color utilities resolved — complete audit coverage achieved
**Depends on**: Phase 3
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03
**Success Criteria** (what must be TRUE):
  1. `banned-actions.tsx` and `booking-status-badge.tsx` render correctly in dark mode with no hardcoded gray/zinc/slate utilities remaining
  2. `app/dashboard/page.tsx` decorative `bg-white/10` overlays are either confirmed intentional (documented) or replaced with semantic tokens
  3. A full manual dark mode toggle sweep across all major pages confirms no remaining broken surfaces
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 0 -> 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Infrastructure Validation | 1/1 | Complete   | 2026-03-17 |
| 1. Landing / Marketing Surface | 2/4 | In Progress|  |
| 2. Tenant Public Booking Surface | 2/3 | In Progress|  |
| 3. Dashboard + Auth Surface | 3/4 | In Progress|  |
| 4. Cleanup Sweep | 0/TBD | Not started | - |
