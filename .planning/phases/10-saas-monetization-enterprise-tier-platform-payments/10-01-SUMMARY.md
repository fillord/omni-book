---
phase: 10-saas-monetization-enterprise-tier-platform-payments
plan: 01
subsystem: database
tags: [prisma, postgresql, saas, subscription, payments, audit-log]

# Dependency graph
requires: []
provides:
  - SubscriptionPlan Prisma model with plan @unique, maxResources, priceMonthly, priceYearly, pricePerResource, features
  - PlatformPayment Prisma model with tenantId FK, amount, planTarget, mockQrCode, status, expiresAt
  - PaymentStatus enum (PENDING, PAID, FAILED, EXPIRED)
  - Tenant.platformPayments relation field
  - prisma/seed-plans.ts upsert script for FREE/PRO/ENTERPRISE plans
  - DB-backed maxResources in updateTenantPlan, activateSubscription, subscription-lifecycle downgrade
  - DB-backed MRR in admin analytics page
  - saas_payment_received in AuditEventType union
  - Phase 10 test scaffold covering MON-01 through MON-09 requirements
affects: [plan-02-platform-payment-service, plan-03-admin-plan-management, plan-04-billing-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - activateSubscription now accepts plan param with default PRO — forward-compatible for ENTERPRISE activations
    - SubscriptionPlan DB lookup as source of truth for maxResources — eliminates all hardcoded pricing constants
    - Analytics page builds PLAN_MRR dynamically from subscriptionPlan.findMany — MRR auto-updates with plan price changes

key-files:
  created:
    - __tests__/phase-10-saas-monetization.test.ts
    - prisma/seed-plans.ts
  modified:
    - prisma/schema.prisma
    - lib/actions/admin.ts
    - lib/subscription-lifecycle.ts
    - app/admin/analytics/page.tsx
    - lib/actions/audit-log.ts

key-decisions:
  - "activateSubscription accepts plan: Plan = 'PRO' parameter — enables future ENTERPRISE plan activation without code change"
  - "Analytics PLAN_MRR built dynamically from subscriptionPlan.findMany — prices auto-reflect DB changes, no deploy needed"
  - "DB lookup with fallback values in admin.ts — safe during migration period when seed hasn't run yet"
  - "freePlan lookup inside expiry loop — fetches once per expired tenant, acceptable for cron workload"

patterns-established:
  - "Pattern: basePrisma.subscriptionPlan.findUnique({ where: { plan } }) for maxResources — use in all plan-change operations"
  - "Pattern: planRecord?.maxResources ?? fallback — safe fallback for pre-seed environments"

requirements-completed: [MON-01, MON-02, MON-06]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 10 Plan 01: SaaS Monetization Data Foundation Summary

**SubscriptionPlan and PlatformPayment Prisma models added, all hardcoded pricing constants replaced with DB lookups across admin actions, subscription lifecycle, and analytics — plus PaymentStatus enum, seed script, and test scaffold for MON-01 through MON-09**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T03:11:19Z
- **Completed:** 2026-04-02T03:14:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- SubscriptionPlan model with plan @unique, priceMonthly, priceYearly, pricePerResource, maxResources, features added to Prisma schema
- PlatformPayment model with PaymentStatus enum, tenantId FK, mockQrCode/mockPaylink, expiresAt, Tenant relation added
- All hardcoded pricing callsites eliminated: PLAN_DEFAULT_MAX_RESOURCES removed from admin.ts, maxResources: 1 hardcode removed from subscription-lifecycle.ts, PLAN_MRR constant replaced with DB query in analytics page
- activateSubscription() now accepts plan: Plan = 'PRO' parameter with DB lookup for maxResources
- saas_payment_received added to AuditEventType union for Phase 10 billing audit events
- Static test scaffold created covering all MON-01 through MON-09 requirements (MON-01, MON-02, MON-06 pass; MON-03, MON-07, MON-09 fail as expected until Plans 02-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Test scaffold + Prisma schema (SubscriptionPlan, PlatformPayment, PaymentStatus)** - `0fb39d9` (feat)
2. **Task 2: Remove all hardcoded pricing constants and replace with DB lookups** - `621c549` (feat)

## Files Created/Modified

- `__tests__/phase-10-saas-monetization.test.ts` - Static assertion test scaffold for MON-01 through MON-09
- `prisma/schema.prisma` - Added PaymentStatus enum, SubscriptionPlan model, PlatformPayment model, Tenant relation
- `prisma/seed-plans.ts` - Upsert script for FREE/PRO/ENTERPRISE subscription plan rows
- `lib/actions/admin.ts` - Removed PLAN_DEFAULT_MAX_RESOURCES; added subscriptionPlan.findUnique in updateTenantPlan (x2) and activateSubscription; activateSubscription now accepts plan param
- `lib/subscription-lifecycle.ts` - Added subscriptionPlan.findUnique for FREE plan maxResources in expiry downgrade
- `app/admin/analytics/page.tsx` - Replaced hardcoded PLAN_MRR constant with DB-backed subscriptionPlan.findMany
- `lib/actions/audit-log.ts` - Added saas_payment_received to AuditEventType union

## Decisions Made

- activateSubscription accepts `plan: Plan = 'PRO'` parameter — enables future ENTERPRISE plan activation from billing flow without separate function
- Analytics PLAN_MRR built dynamically from `subscriptionPlan.findMany` — plan price changes reflect immediately without deploy
- DB lookup with inline fallback `?? { FREE: 1, PRO: 20, ENTERPRISE: 100 }[plan]` in admin.ts — safe during migration period before seed script runs
- `freePlan` lookup inside expiry loop rather than once before loop — simpler code; cron processes few tenants so per-iteration DB call is acceptable

## Deviations from Plan

None - plan executed exactly as written. The test assertion for analytics PLAN_MRR was refined to detect the OLD hardcoded static object literal (with `PRO: 10000`) rather than any `const PLAN_MRR` usage, since the dynamic version still uses the same variable name inside the function.

## Issues Encountered

- Test for `app/admin/analytics/page.tsx` initially used regex `/const PLAN_MRR/` which matched the dynamic version (variable name reused inside function). Fixed by checking for the specific old hardcoded values (`PRO: 10000`, `ENTERPRISE: 29900`) instead.
- Test file initially used `/s` (dotAll) regex flag which TypeScript reported as TS1501 (requires es2018 target). Refactored to two separate simple pattern checks.

## Known Stubs

None — all code paths are fully wired. The `freePlan` lookup in subscription-lifecycle uses `?? 1` fallback for pre-seed environments; this is a safety default, not a stub.

## Next Phase Readiness

- Schema models ready for `prisma db push` (requires live DB — manual step)
- Seed script ready to run after schema push: `npx ts-node prisma/seed-plans.ts`
- Plan 02 can implement lib/platform-payment.ts and billing actions against the new PlatformPayment model
- Plan 03 can implement admin/plans UI against SubscriptionPlan model
- activateSubscription accepts `plan` param — Plan 02 billing flow can pass 'PRO' or 'ENTERPRISE' directly

---
*Phase: 10-saas-monetization-enterprise-tier-platform-payments*
*Completed: 2026-04-02*
