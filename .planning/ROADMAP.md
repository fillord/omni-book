# Roadmap: omni-book

## Milestones

- ✅ **v1.0 Dark Mode** — Phases 0-4 (shipped 2026-03-19)
- ✅ **v1.1 Critical Bug Fixes** — Phases 6-7 (shipped 2026-03-19)
- ✅ **v1.2 Advanced Customization & Niche Expansion** — Phases 1-2 (shipped 2026-03-20)
- ✅ **v1.3 Neumorphism UI, God Mode & Subscription Lifecycle** — Phases 1-3 (shipped 2026-03-24)
- ✅ **v1.4 Client Base** — Phases 4-12 (shipped 2026-04-08)
- 🚧 **v1.5 Optimization & Launch Readiness** — Phases 13-15 (in progress)

## Phases

<details>
<summary>✅ v1.0 Dark Mode (Phases 0-4) — SHIPPED 2026-03-19</summary>

Full-stack dark mode fix — 66 files updated, 26 requirements delivered, hardcoded Tailwind color classes replaced with semantic shadcn/ui CSS variable tokens across all surfaces. See `.planning/milestones/v1.0-ROADMAP.md` for full details.

- [x] Phase 0: Infrastructure Validation (1/1 plans) — completed 2026-03-17
- [x] Phase 1: Landing / Marketing Surface (4/4 plans) — completed 2026-03-17
- [x] Phase 2: Tenant Public Booking Surface (3/3 plans) — completed 2026-03-18
- [x] Phase 3: Dashboard + Auth Surface (4/4 plans) — completed 2026-03-18
- [x] Phase 4: Cleanup Sweep (3/3 plans) — completed 2026-03-18

</details>

<details>
<summary>✅ v1.1 Critical Bug Fixes (Phases 6-7) — SHIPPED 2026-03-19</summary>

Three classes of user-visible defects eliminated — opt_* ID leakage, mobile card overflow, and mobile theme toggle occlusion. See `.planning/milestones/v1.1-ROADMAP.md` for full details.

- [x] Phase 6: Data Display Correctness (1/1 plans) — completed 2026-03-19
- [x] Phase 7: Mobile UI Fixes (1/1 plans) — completed 2026-03-19

</details>

<details>
<summary>✅ v1.2 Advanced Customization & Niche Expansion (Phases 1-2) — SHIPPED 2026-03-20</summary>

Custom service duration input (1-1440 min) replacing fixed dropdown, 19 new niche resource types with trilingual translations across 4 verticals. See `.planning/milestones/v1.2-ROADMAP.md` for full details.

- [x] Phase 1: Replace fixed duration dropdown with free-text number input (1/1 plans) — completed 2026-03-19
- [x] Phase 2: Expand resource types and specialties for Clinic, Restaurant, Sports, and Beauty (1/1 plans) — completed 2026-03-20

</details>

<details>
<summary>✅ v1.3 Neumorphism UI, God Mode & Subscription Lifecycle (Phases 1-3) — SHIPPED 2026-03-24</summary>

Full Neumorphism Soft UI visual system, Super-Admin "God Mode" management panel, and 30-day subscription lifecycle with automated resource freezing. See `.planning/MILESTONES.md` for full details.

- [x] Phase 1: Neumorphism Soft UI (4/4 plans) — completed 2026-03-22
- [x] Phase 2: Super-Admin God Mode & Platform Management (5/5 plans) — completed 2026-03-23
- [x] Phase 3: Subscription Lifecycle and Automated Resource Freezing (3/3 plans) — completed 2026-03-24

</details>

<details>
<summary>✅ v1.4 Client Base (Phases 4-12) — SHIPPED 2026-04-08</summary>

Mini-CRM with client aggregation, tokenized booking self-service, bookings CRM overhaul, full payment infrastructure pivot (Kaspi Pay → Paylink.kz), enterprise pricing, and legal compliance pages. See `.planning/milestones/v1.4-ROADMAP.md` for full details.

- [x] Phase 4: Client Data Foundation (2/2 plans) — completed 2026-03-25
- [x] Phase 5: Client UI, Outreach & Polish (3/3 plans) — completed 2026-03-25
- [x] Phase 6: Tokenized Booking Management (4/4 plans) — completed 2026-03-28
- [x] Phase 7: Bookings Dashboard CRM Overhaul & Manual Booking Creation (4/4 plans) — completed 2026-04-01
- [x] Phase 9: Online Deposit Payments via Kaspi Pay (4/4 plans) — completed 2026-04-02
- [x] Phase 10: SaaS Monetization, Enterprise Tier & Platform Payments (4/4 plans) — completed 2026-04-03
- [x] Phase 11: Public Footer & Legal Pages (2/2 plans) — completed 2026-04-04
- [x] Phase 12: Remove Kaspi Pay → Paylink.kz + WhatsApp Prepayment (5/5 plans) — completed 2026-04-08

</details>

### 🚧 v1.5 Optimization & Launch Readiness (In Progress)

**Milestone Goal:** Harden the production deployment — fix database performance gaps, clear accumulated code debt, and complete the /docs onboarding surface before growth-phase marketing.

- [ ] **Phase 13: Database Optimization** - Indexes, batched upserts, OTP cleanup cron, tenant scoping, rate limiting, and transaction isolation
- [ ] **Phase 14: Code & i18n Cleanup** - ESLint suppressions, type safety, stale Kaspi i18n, security headers, and session hardening
- [ ] **Phase 15: Documentation & Onboarding** - /docs sub-pages and tenant page SEO metadata

## Phase Details

### Phase 13: Database Optimization
**Goal**: The database is production-hardened — queries use indexes instead of full scans, bulk operations are batched, expired records are cleaned up, tenant data isolation is complete, and public-facing routes are rate-limited
**Depends on**: Phase 12
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08
**Success Criteria** (what must be TRUE):
  1. Prisma schema has `@@index([tenantId, guestPhone])` and `@@index([telegramChatId])` on Booking, and `@@index([email])` on OtpCode — no full table scan warnings in production query logs
  2. `syncClients` processes bookings in chunks of 100 — syncing 500 clients produces 5 DB transactions, not 500
  3. Expired OtpCode rows are deleted automatically on the cron schedule — table does not grow unbounded
  4. `Client` and `PlatformPayment` queries are intercepted by the tenant-scoped Prisma middleware — cross-tenant data leakage is impossible via these models
  5. `/api/manage/[token]/cancel` and `/api/manage/[token]/reschedule` return 429 after 20 requests per IP per minute — cannot be abused to loop cancel/reschedule operations
**Plans**: 2 plans
Plans:
- [ ] 13-01-PLAN.md — Schema indexes (Booking + OtpCode), tenant scoping (Client + PlatformPayment), transaction isolation fix
- [ ] 13-02-PLAN.md — Batch syncClients upserts, OTP cleanup cron, rate limiting on manage routes

### Phase 14: Code & i18n Cleanup
**Goal**: The codebase has zero ESLint suppressions for `<img>` and `any` types, all Kaspi Pay translation strings are removed, and the app ships with security headers, scoped image hostnames, and a 7-day session expiry
**Depends on**: Phase 13
**Requirements**: CLN-01, CLN-02, CLN-03, CLN-04, CLN-05, CLN-06, CLN-07, CLN-08
**Success Criteria** (what must be TRUE):
  1. Running ESLint produces zero `@next/next/no-img-element` and zero `@typescript-eslint/no-explicit-any` suppressions in the affected files
  2. No Kaspi Pay wording appears in any rendered translation string across RU/KZ/EN locales — payment references use Paylink.kz or generic payment terms
  3. Browser DevTools shows `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` response headers on all pages
  4. `next.config.ts` `images.remotePatterns` lists only explicit trusted hostnames — wildcard `**` is absent
  5. A new session expires after 7 days (not 30) — confirmed via NextAuth session token `exp` claim
**Plans**: TBD
**UI hint**: yes

### Phase 15: Documentation & Onboarding
**Goal**: The /docs section is complete with getting-started, branch-setup, and billing sub-pages; and tenant public pages are discoverable by search engines via metadata and JSON-LD structured data
**Depends on**: Phase 14
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05
**Success Criteria** (what must be TRUE):
  1. Navigating to `/docs/getting-started`, `/docs/branch-setup`, and `/docs/billing` each returns a 200 response with rendered content — none of the three pages return 404
  2. The `<title>` and `<meta name="description">` on a tenant slug page reflect that tenant's name and description from the database — not a static fallback
  3. A tenant slug page contains a `<script type="application/ld+json">` block with `@type: LocalBusiness`, `name`, and `telephone` fields
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 13. Database Optimization | v1.5 | 0/2 | Not started | - |
| 14. Code & i18n Cleanup | v1.5 | 0/TBD | Not started | - |
| 15. Documentation & Onboarding | v1.5 | 0/TBD | Not started | - |
