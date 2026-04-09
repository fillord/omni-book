# omni-book

## What This Is

omni-book is a multi-tenant SaaS booking platform where tenants (businesses) configure their services and resources, and customers book appointments via a public-facing page. It supports multiple business niches (healthcare, legal, fitness, etc.) with configurable options per niche.

**v1.0 shipped 2026-03-19** — Full dark mode audit across all surfaces (66 files, 26 requirements). **v1.1 shipped 2026-03-19** — Critical bug fixes: opt_* ID display, mobile card overflow, mobile theme toggle visibility (6 requirements, 20 regression tests added). **v1.2 shipped 2026-03-20** — Advanced Customization & Niche Expansion: custom duration input + 19 new resource types with trilingual translations (12 requirements). **v1.3 shipped 2026-03-24** — Neumorphism Soft UI visual system, Super-Admin God Mode panel, 30-day subscription lifecycle with automated resource freezing. **v1.4 shipped 2026-04-08** — Mini-CRM (Client model + aggregated metrics + clients table + Telegram outreach), tokenized self-service booking management, bookings dashboard CRM overhaul, enterprise SaaS pricing, full Kaspi Pay → Paylink.kz payment pivot, and legal compliance pages — 366 files, 8 phases, 28 plans, 189 commits.

## Core Value

A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.

## Current State: v1.5 In Progress — Phase 14 Complete

**Phase 14 complete (2026-04-09):** Removed all ESLint suppressions (3× no-img-element → next/image, 2× no-explicit-any → typed aliases), cleaned stale Paylink.kz payment strings, hardened next.config.ts with security headers + scoped remotePatterns, set 7-day session maxAge, marked stub routes with intent comments.

**Phase 13 complete (2026-04-09):** DB indexes on Booking/OtpCode, tenant isolation for Client/PlatformPayment, ReadCommitted transaction fix, syncClients N+1 batching (chunks of 100), expired OTP cleanup in subscriptions cron, rate limiting on cancel/reschedule manage routes.

**v1.4 delivered (2026-04-08):**
- Mini-CRM: `Client` Prisma model with aggregated metrics, searchable Neumorphic clients table, detail page, Telegram outreach
- Tokenized booking self-service: `/manage/[token]` public page with cancel/reschedule, 4-hour cutoff rule
- Bookings Dashboard CRM: day-grouped cards, CANCELLED exclusion filter, manual booking creation Sheet
- Full payment infrastructure: Kaspi Pay mock → `SubscriptionPlan` DB pricing → Enterprise calculator → real Paylink.kz redirect API + WhatsApp prepayment
- Legal compliance: 4 public legal pages (/oferta, /privacy, /refund, /about) in RU/EN/KZ

**Next milestone:** To be defined via `/gsd:new-milestone`

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

- ✓ `Client` Prisma model with (tenantId, phone) composite key, `syncClients` idempotent upsert, aggregated metrics (visits, revenue, last visit, Telegram) — v1.4 (CRM-01–05)
- ✓ Neumorphic clients table page with real-time search, client detail page with booking history, Telegram outreach action — v1.4 (CRM-06–12)
- ✓ Tokenized booking self-service: `/manage/[token]` public page, cancel/reschedule, 4-hour cutoff rule, owner Telegram notification — v1.4 (TOK-01–07)
- ✓ Bookings Dashboard CRM overhaul: day-grouped Neumorphic cards, CANCELLED exclusion filter, manual booking creation Sheet — v1.4 (CRM-B01–12)
- ✓ `SubscriptionPlan` DB model replacing all hardcoded pricing, Enterprise tier with dynamic calculator, `PlatformPayment` model, Super Admin plan editor — v1.4 (MON-01–09)
- ✓ 4 public legal pages (/oferta, /privacy, /refund, /about) with multi-column footer in RU/EN/KZ — v1.4 (LEGAL-01–07)
- ✓ Full Kaspi Pay removal + real Paylink.kz integration (HMAC-SHA256 webhook) + WhatsApp prepayment deep-link replacing deposit flow — v1.4 (PIV-01–10)

## Current Milestone: v1.5 Optimization & Launch Readiness

**Goal:** Harden the production deployment — fix database performance gaps, clear accumulated code debt, and complete the /docs onboarding surface before growth-phase marketing.

**Target features:**
- Database indexes for CRM queries + batch syncClients + OTP cleanup cron
- ESLint suppression fixes, stale Kaspi i18n cleanup, security hardening (headers, session maxAge, remotePatterns)
- /docs sub-pages (getting-started, branch-setup, billing) + tenant page SEO metadata

### Active

- [ ] **DB-01**: Booking model has `@@index([tenantId, guestPhone])` composite index in Prisma schema — prevents full table scan in CRM sync and booking limit check
- [ ] **DB-02**: Booking model has `@@index([telegramChatId])` index in Prisma schema
- [ ] **DB-03**: OtpCode model has standalone `@@index([email])` in Prisma schema — supports range deletes
- [ ] **DB-04**: `syncClients` upserts are batched (N+1 → chunked `$transaction`) — max 100 per batch
- [ ] **DB-05**: Expired OtpCode records are cleaned up by cron — `deleteMany({ where: { expiresAt: { lt: new Date() } } })` runs in existing subscriptions cron
- [ ] **DB-06**: `Client` and `PlatformPayment` models added to `TENANT_SCOPED` set in `lib/tenant/prisma-tenant.ts`
- [ ] **DB-07**: `/api/manage/[token]/cancel` and `/api/manage/[token]/reschedule` routes have `rateLimit(ip, 20, 60_000)` guard
- [ ] **DB-08**: `createBooking` uses `ReadCommitted` isolation (not `Serializable`) — `FOR UPDATE` provides locking, Serializable is redundant
- [ ] **CLN-01**: 3 `<img>` ESLint suppressions replaced with Next.js `<Image>` (`tenant-public-page.tsx` ×2, `settings-form.tsx`)
- [ ] **CLN-02**: `any` types in `lib/tenant/guard.ts` replaced with `unknown` + type narrowing (2 suppressions removed)
- [ ] **CLN-03**: Stale Kaspi Pay references purged from translations (`payment`, `oferta`, `privacy`, `refund` namespaces — all 3 locales)
- [ ] **CLN-04**: Security headers added to `next.config.ts` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`)
- [ ] **CLN-05**: Wildcard `remotePatterns` (`hostname: '**'`) replaced with explicit hostnames in `next.config.ts`
- [ ] **CLN-06**: JWT session `maxAge` set to `7 * 24 * 60 * 60` (7 days) in `lib/auth/config.ts`
- [ ] **CLN-07**: Stub routes (`/api/tenants`, `/api/resources`, `/api/webhooks`, `/book`) return `405 Method Not Allowed` or have intent comments
- [ ] **DOC-01**: `/docs/getting-started` page exists and renders (no longer 404)
- [ ] **DOC-02**: `/docs/branch-setup` page exists and renders (no longer 404)
- [ ] **DOC-03**: `/docs/billing` page exists and renders (no longer 404)
- [ ] **DOC-04**: `app/(tenant)/[slug]/page.tsx` exports `generateMetadata` returning tenant `name`, `description`, `openGraph`
- [ ] **DOC-05**: Tenant slug page includes JSON-LD `LocalBusiness` schema with `name`, `address`, `telephone`

### Out of Scope

- New features during v1.1 — pure bug fix milestone only (completed)
- Automated visual regression screenshots — deferred to v2 (ADV-03, carried from v1.1)
- Third-party component internals (recharts bar/pie fills) — deferred to v2 (ADV-01)
- `hover-glow` utility CSS var refactor — deferred to v2 (ADV-02)
- Automated visual regression screenshots — deferred to v2 (ADV-03)

## Context

The app uses Next.js 15 App Router with a multi-tenant architecture. UI is built with shadcn/ui components on top of Tailwind CSS 4.2.1. The color system is OKLch-based, defined in `app/globals.css` as CSS custom properties (`:root` for light, `.dark` for dark). The `next-themes` library manages the `dark` class on the `<html>` element.

**v1.4 state:** ~184,700 LOC TypeScript. 8 phases (4–12), 28 plans, 189 commits, 366 files changed. Payment provider is now Paylink.kz (real API, redirect-based). Booking deposits replaced by WhatsApp prepayment deep-link. Subscription pricing is DB-driven via `SubscriptionPlan` model. Legal pages live at /oferta, /privacy, /refund, /about. Mini-CRM is live with `Client` model and aggregated metrics.

**Known tech debt from v1.4:**
- `cleanup-surface.test.ts` has 6 pre-existing failures (dark mode selection state from v1.0, commit f7da11b) — documented but not fixed
- Paylink.kz mock fallback remains in `platform-payment.ts` when `PAYLINK_API_KEY` not set — works in dev but needs real key in production
- Vercel free tier supports 2 cron entries — currently using 2 (subscriptions + any future); pending-payments cron was removed in v1.4

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

| Client identity uses (tenantId, phone) composite key | phone always present on bookings; email is optional — composite key avoids nullability | ✓ Good — no migration issues, deduplication is clear |
| `Client` is materialized aggregate (no direct Booking[] relation) | Adding clientId to Booking would be a breaking schema change; pre-computed metrics avoid runtime joins | ✓ Good — page load is instant, no N+1 queries |
| `manageToken` is nullable (String?) on Booking | Existing bookings lack tokens — migration would fail on non-empty DB without nullable | ✓ Good — backwards compatible |
| manageToken: null for admin (manual) bookings | Admin bookings bypass MAX_ACTIVE_BOOKINGS limit and shouldn't generate self-manage links | ✓ Good — explicit null prevents inadvertent token exposure |
| Paylink.kz redirect-based (not push invoice) for SaaS payments | Kaspi Pay push-to-app was market-specific and required merchant approval; Paylink.kz redirect is simpler and already live | ✓ Good — unblocked monetization without waiting for Kaspi approval |
| WhatsApp deep-link replaces booking deposit flow | Kaspi Pay deposit required merchant API keys per tenant; WhatsApp deep-link has zero infrastructure and works for any tenant | ✓ Good — simpler UX, zero server infrastructure for deposits |
| SubscriptionPlan pricing from DB (not hardcoded) | Allows price changes without code deploy; Super Admin can adjust pricing from UI | ✓ Good — business-configurable pricing |
| Paylink.kz mock fallback when PAYLINK_API_KEY unset | Allows dev/test without production credentials; mock returns a localhost redirect URL | ✓ Good — developer ergonomics, flag is clear |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 — Phase 14 (code-i18n-cleanup) complete*
