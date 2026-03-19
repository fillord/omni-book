# Milestones

## v1.1 Critical Bug Fixes (Shipped: 2026-03-19)

**Phases completed:** 2 phases, 2 plans, 4 tasks
**Files modified:** ~6 source files | **Timeline:** 2026-03-19 (1 day)
**Git range:** `ccdba1d` → `a603580`

**Delivered:** Three classes of user-visible defects eliminated — raw opt_* ID leakage, mobile card overflow, and mobile theme toggle occlusion.

**Key accomplishments:**
1. Eliminated all `opt_*` ID leaks in `booking-form.tsx` via inline opt_ guards — users now see human-readable labels everywhere (resource.specialization badge, attribute loop, SummaryRow)
2. Added static regression test suite (`data-display.test.ts`, 8 assertions) preventing future opt_* leaks
3. Fixed mobile card text overflow in services/resources managers using Tailwind `min-w-0` + `truncate` pattern
4. Made PublicThemeToggle visible on all viewports by removing `hidden sm:` — theme toggle no longer occluded by "Book" button
5. Added 12-assertion mobile UI test suite (`mobile-ui.test.ts`) covering all 4 MOBL/THEM requirements

---

## v1.0 Dark Mode (Shipped: 2026-03-19)

**Phases completed:** 5 phases, 15 plans
**Files modified:** 66 | **LOC:** ~27,500 TypeScript | **Timeline:** 2026-03-17 → 2026-03-18 (2 days, 60 commits)

**Delivered:** Full-stack dark mode fix for omni-book — 66 files updated to replace hardcoded Tailwind color classes with semantic shadcn/ui CSS variable tokens across all surfaces.

**Key accomplishments:**
1. Infrastructure validated — 12 automated Jest tests certifying the three-layer CSS token chain (globals.css → Tailwind utilities → next-themes `.dark` injection)
2. Landing surface (7+ components) remediated — HeroSection, PricingCards, FeaturesGrid, Footer, Testimonials, NicheCards, DemoSection, StatsCounter; intentional brand surfaces documented with code comments
3. Tenant public + booking flow — `tenant-public-page.tsx`, `booking-form.tsx`, `booking-calendar.tsx` — 26+ hardcoded dual `dark:` pairs collapsed to single semantic tokens; niche accent palette preserved
4. Dashboard + auth surfaces — sidebar uses full sidebar token family; billing-content's 15 `dark:!` force-overrides removed; analytics hex fills replaced with CSS vars; auth pages confirmed clean
5. Edge case sweep — `banned-actions.tsx`, `booking-status-badge.tsx`, `app/dashboard/page.tsx` audited; all intentional brand exceptions documented
6. Zero regressions — all changes are color class swaps only; zero business logic or structural changes

**Git range:** `13b3d69` → `a9c9187` (60 commits)

---

