# Milestones

## v1.4 Client Base (Shipped: 2026-04-08)

**Phases completed:** 8 phases (4–12), 28 plans, 90 tasks
**Files modified:** 366 | **Net lines:** +47,353 / −4,043 | **Timeline:** 2026-03-24 → 2026-04-08 (14 days, 189 commits)

**Delivered:** Mini-CRM with client aggregation, tokenized booking self-service, bookings CRM overhaul, full payment infrastructure from Kaspi Pay mock → real Paylink.kz, enterprise pricing, and legal compliance pages.

**Key accomplishments:**

1. **Mini-CRM (Phases 4–5):** `Client` Prisma model with aggregated metrics (visits, revenue, last visit, Telegram status), idempotent `syncClients` upsert, Neumorphic clients table with real-time search, client detail page with full booking history, and Telegram outreach action — all CRM-01 through CRM-12 requirements delivered
2. **Tokenized booking self-service (Phase 6):** `/manage/[token]` public page (no login) for cancel/reschedule with 4-hour cutoff rule enforced server+client side; Telegram notification to owner on reschedule; email + Telegram confirmation templates updated with management link
3. **Bookings Dashboard CRM overhaul (Phase 7):** Redesigned `/dashboard/bookings` with day-grouped Neumorphic booking cards, default CANCELLED exclusion filter, and manual booking creation via admin Sheet slide-over with Serializable collision detection
4. **Payment infrastructure: Kaspi Pay → Paylink.kz pivot (Phases 9–12):** Initially built Kaspi Pay mock (PENDING booking + 10-min auto-cancel cron); then complete pivot: removed all Kaspi Pay code, wired real Paylink.kz redirect API with HMAC-SHA256 webhook verification, replaced booking deposit flow with WhatsApp deep-link prepayment button
5. **SaaS monetization (Phase 10):** `SubscriptionPlan` DB model replacing all hardcoded pricing constants, Enterprise tier with dynamic pricing calculator (1–200 resource slider), `PlatformPayment` model, Super Admin plan editor at `/admin/plans`
6. **Legal compliance (Phase 11):** Multi-column footer + 4 public pages (/oferta, /privacy, /refund, /about) with full RU/EN/KZ i18n — satisfying Kaspi Pay merchant compliance requirements

---

## v1.3 Neumorphism UI, God Mode & Subscription Lifecycle (Shipped: 2026-03-24)

**Phases completed:** 3 phases, 12 plans
**Timeline:** 2026-03-20 → 2026-03-24 (5 days)
**Git range:** `95be2ea` → `5b1a867`

**Delivered:** Full Neumorphism Soft UI visual system, Super-Admin "God Mode" management panel, and 30-day subscription lifecycle with automated resource freezing.

**Key accomplishments:**

1. **Phase 1 — Neumorphism Soft UI (4 plans):** CSS variable injection with `var(--neu-bg)` token remapping, `.neu-raised`/`.neu-inset` utility classes on all shadcn/ui components, landing page adaptation, 300ms theme transitions — full visual consistency in both light/dark themes
2. **Phase 2 — Super-Admin God Mode (5 plans):** Financial Analytics Dashboard (MRR + plan tier breakdown), per-tenant drill-down with read-only Services/Resources/Staff views, Global Announcement Banners, targeted In-App Notification Bell, Audit & Activity Log with createAuditLog hooks
3. **Phase 3 — Subscription Lifecycle (3 plans):** `isFrozen` on Resource/Service models, daily `/api/cron/subscriptions` route with 3-day warning notifications and expiry-triggered freeze/downgrade, frozen state UI badges with disabled actions, billing page expiry display + EXPIRED alert + `renewSubscription` action, super-admin `activateSubscription` with bulk unfreeze

---

## v1.2 Advanced Customization & Niche Expansion (Shipped: 2026-03-20)

**Phases completed:** 2 phases, 2 plans, 5 tasks
**Files modified:** 5 source files | **Timeline:** 2026-03-19 → 2026-03-20 (2 days)
**Git range:** `a46e782` → `2429afe`

**Delivered:** Custom service duration input (1–1440 min) replacing fixed dropdown, and 19 new niche resource types with trilingual translations across 4 verticals.

**Key accomplishments:**

1. Replaced `durationMin` Select dropdown with number input stepper featuring custom +/− buttons, "min" suffix, and 15/30/60 quick-select presets — accepts any value 1–1440 min
2. Updated zod schema (removed `DURATION_OPTIONS` constant, added `min(1)/max(1440)` bounds)
3. Added 12 static-file assertion tests covering DUR-01 through DUR-06
4. Expanded resource types for all 4 niches: 6 clinic types, 5 horeca types, 5 sports types, 3 beauty workspace types (19 total new entries)
5. Converted beauty `specialization` from select (6 opt_* options) to free-text; added `attr_specialization` field to horeca/sports staff — 60 new RU/EN/KZ translation entries added

---

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
