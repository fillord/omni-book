---
phase: 04-client-data-foundation
plan: "01"
subsystem: database
tags: [prisma, postgresql, crm, schema, testing, jest]

# Dependency graph
requires:
  - phase: 03-subscription-lifecycle
    provides: Cascade delete pattern and Tenant model structure with AuditLog, Notification back-relations

provides:
  - Client Prisma model with (tenantId, phone) composite unique constraint
  - Tenant clients Client[] back-relation
  - Static file assertion test scaffold for CRM-01 through CRM-05
  - Prisma client types regenerated with Client model

affects:
  - 04-02-client-sync-action (uses Client model and tenantId_phone unique key)
  - 05-client-ui (queries Client table via getClients)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "safeRead + describe block per CRM-requirement — static assertion test scaffold covering all requirements before implementation"
    - "Prisma @@unique([tenantId, phone]) composite key for phone-based client deduplication"
    - "onDelete: Cascade on all tenant-scoped models (Client follows same pattern as Notification, AuditLog)"

key-files:
  created:
    - __tests__/client-data-surface.test.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Client identity is (tenantId, phone) not (tenantId, email) — phone is always present on bookings; email is optional"
  - "totalRevenue stored as Int (KZT integer) — matches Service.price: Int? in existing schema, no currency conversion in v1.4"
  - "No direct Booking[] relation on Client — Client is a materialized aggregate, avoiding clientId on Booking model (breaking change)"
  - "prisma generate only in executor context; prisma db push is a manual step (requires database access)"

patterns-established:
  - "CRM test scaffold: one describe block per requirement ID (CRM-01 through CRM-05) using safeRead pattern"
  - "Test-first scaffold: schema tests pass after Task 2; action tests intentionally fail until Plan 02"

requirements-completed:
  - CRM-01

# Metrics
duration: 2min
completed: "2026-03-25"
---

# Phase 4 Plan 01: Client Data Foundation - Schema & Test Scaffold Summary

**Prisma Client model with (tenantId, phone) composite unique constraint, Cascade delete, and Jest test scaffold covering CRM-01 through CRM-05 static assertions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T10:56:33Z
- **Completed:** 2026-03-25T10:58:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `__tests__/client-data-surface.test.ts` (179 lines) with safeRead helper and describe blocks for CRM-01 through CRM-05
- Added `model Client` to `prisma/schema.prisma` with all 10 required fields, @@unique([tenantId, phone]), @@index([tenantId]), and onDelete: Cascade
- Added `clients Client[]` back-relation to Tenant model
- Ran `npx prisma generate` to regenerate typed Prisma client with Client model
- CRM-01 schema tests: 11/11 pass; action tests (20) intentionally fail pending Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Create client-data-surface test scaffold** - `0a4e069` (test)
2. **Task 2: Add Client model to Prisma schema** - `7030c82` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `__tests__/client-data-surface.test.ts` - Static assertion test scaffold for CRM-01 through CRM-05 (179 lines, safeRead pattern)
- `prisma/schema.prisma` - Client model added + clients back-relation on Tenant model

## Decisions Made

- Client identity uses `(tenantId, phone)` composite key — phone is always present on bookings (required by booking form); email is `String?` and cannot serve as reliable identity
- `totalRevenue` stored as `Int` (KZT) matching `Service.price: Int?` — no currency conversion needed in v1.4
- No `Booking[]` relation on Client — Client is a materialized aggregate; adding `clientId` to Booking would be a breaking schema change
- `prisma db push` not run in executor context (requires database connection) — noted as manual step for deployment

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Database schema sync required after deployment.**

Run the following to apply the Client model to the database:

```bash
npx prisma db push
```

This adds the `Client` table with the composite unique index `(tenantId, phone)`.

## Next Phase Readiness

- Client model in schema, Prisma client types regenerated — Plan 02 can import `basePrisma.client` immediately
- Test scaffold in place — Plan 02's syncClients action will turn the 20 failing action tests green
- `lib/actions/clients.ts` path expected by tests is `lib/actions/clients.ts`

---
*Phase: 04-client-data-foundation*
*Completed: 2026-03-25*

## Self-Check: PASSED

- FOUND: `__tests__/client-data-surface.test.ts`
- FOUND: `prisma/schema.prisma` (Client model added)
- FOUND: `.planning/phases/04-client-data-foundation/04-01-SUMMARY.md`
- FOUND commit: `0a4e069` (test scaffold)
- FOUND commit: `7030c82` (Client model schema)
