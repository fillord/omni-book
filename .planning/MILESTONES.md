# Milestones

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

