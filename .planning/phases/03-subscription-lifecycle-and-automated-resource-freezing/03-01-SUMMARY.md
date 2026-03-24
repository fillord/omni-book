---
phase: 03-subscription-lifecycle-and-automated-resource-freezing
plan: 01
subsystem: database
tags: [prisma, cron, vercel, subscription, lifecycle, freeze]

# Dependency graph
requires:
  - phase: 02-super-admin-god-mode-and-platform-management
    provides: AuditLog model, createAuditLog helper, Notification model, basePrisma
provides:
  - isFrozen Boolean field on Resource and Service Prisma models
  - CANCELED value in PlanStatus enum
  - Automated subscription lifecycle cron at /api/cron/subscriptions (3-day warning + expiry downgrade/freeze)
  - Test scaffold covering SUB-01 through SUB-06 (25 tests, 15 pass for plans 01-02; 10 await future plans)
affects: [03-02, 03-03, billing-ui, admin-activation, resources-manager, services-manager]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Cron route uses GET handler (Vercel Cron GET-only constraint)
    - Fuzzy expiry window (2-4 days) handles daily trigger drift for 3-day warnings
    - Dedup with timestamp check prevents duplicate warning notifications
    - findFirst + updateMany with id-not-oldest pattern for safe bulk freeze (guards against empty results)
    - Fire-and-forget createAuditLog (no await) for non-blocking audit tracking

key-files:
  created:
    - __tests__/subscription-lifecycle-surface.test.ts
    - app/api/cron/subscriptions/route.ts
  modified:
    - prisma/schema.prisma
    - vercel.json

key-decisions:
  - "Freeze keeps oldest-by-createdAt resource/service to preserve most-established data"
  - "Staff (User) records not frozen — no isFrozen on User model, per research decision"
  - "3-day warning uses 2-4 day window (not exactly 3 days) to tolerate cron scheduling drift"
  - "CANCELED added to PlanStatus enum for future use in subscription cancellation flow"
  - "Downgrade sets maxResources: 1 inline in cron (not via separate action) for atomicity"

patterns-established:
  - "Subscription cron: GET handler, CRON_SECRET Bearer auth, processSubscriptionLifecycle() extracted as pure function"
  - "Test scaffold safeRead pattern: returns empty string for missing files, tests fail with assertion errors not throws"

requirements-completed: [SUB-01, SUB-02, SUB-06]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 03 Plan 01: Subscription Lifecycle Foundation Summary

**Prisma schema gains isFrozen + CANCELED, and automated daily cron downgrades expired tenants to FREE while bulk-freezing excess resources and services**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T10:42:13Z
- **Completed:** 2026-03-24T10:44:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `isFrozen Boolean @default(false)` to Resource and Service Prisma models; added `CANCELED` to PlanStatus enum; ran `prisma db push` + `prisma generate`
- Created 25-test scaffold in `__tests__/subscription-lifecycle-surface.test.ts` covering all 6 SUB requirement groups (15 pass for this plan's scope; 10 await future plans)
- Created `app/api/cron/subscriptions/route.ts` with 3-day expiry warning (dedup'd) and expiry-triggered downgrade+freeze logic; registered at `0 2 * * *` in vercel.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Test scaffold + Prisma schema expansion** - `a8a5fa4` (feat)
2. **Task 2: Cron subscription lifecycle route** - `c7bd9e2` (feat)

## Files Created/Modified

- `__tests__/subscription-lifecycle-surface.test.ts` - 25-test static file assertion scaffold covering SUB-01 through SUB-06
- `prisma/schema.prisma` - Added isFrozen to Resource + Service models; CANCELED to PlanStatus enum
- `app/api/cron/subscriptions/route.ts` - Cron GET handler: 3-day warning notifications + expired tenant downgrade/freeze
- `vercel.json` - Added `/api/cron/subscriptions` cron at `0 2 * * *`

## Decisions Made

- Freeze keeps oldest-by-createdAt resource and service to preserve the tenant's most-established data on downgrade
- Staff (User) records are not frozen — no isFrozen on User model, consistent with CONTEXT.md design decision
- 3-day warning uses a 2-4 day fuzzy window rather than exactly 3 days to tolerate daily cron scheduling drift
- CANCELED added to PlanStatus enum now for future use in an explicit subscription cancellation flow (SUB-06 test readiness)
- Downgrade sets maxResources: 1 inline in the cron handler rather than via a separate action for atomicity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Cron runs automatically once deployed to Vercel.

## Next Phase Readiness

- Data foundation (isFrozen, CANCELED) is in place for all downstream UI plans
- Cron route is live and will automatically process expired subscriptions on each daily run
- 10 of 25 scaffold tests are intentionally failing (SUB-03, SUB-04, SUB-05, SUB-06) — each will be resolved by plans 02 and 03

---
*Phase: 03-subscription-lifecycle-and-automated-resource-freezing*
*Completed: 2026-03-24*
