---
phase: 13-database-optimization
plan: "01"
subsystem: database
tags: [prisma, indexes, tenant-isolation, transactions, performance]
dependency_graph:
  requires: []
  provides: [DB-01, DB-02, DB-03, DB-06, DB-08]
  affects: [lib/booking/engine.ts, lib/tenant/prisma-tenant.ts, prisma/schema.prisma]
tech_stack:
  added: []
  patterns: [prisma-@@index, tenant-scoped-middleware, ReadCommitted-with-FOR-UPDATE]
key_files:
  created: []
  modified:
    - prisma/schema.prisma
    - lib/tenant/prisma-tenant.ts
    - lib/booking/engine.ts
decisions:
  - "@@index([tenantId, guestPhone]) composite index supports CRM sync + booking limit check without full table scan"
  - "Client and PlatformPayment added to TENANT_SCOPED for defense-in-depth (both have tenantId columns)"
  - "ReadCommitted + FOR UPDATE replaces Serializable — row lock provides sufficient concurrency control without predicate lock overhead"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-04-09"
  tasks_completed: 3
  files_modified: 3
---

# Phase 13 Plan 01: Database Index + Isolation Fix Summary

**One-liner:** Three Prisma indexes applied (Booking composite tenantId+guestPhone, telegramChatId, OtpCode standalone email), Client/PlatformPayment added to tenant scope middleware, createBooking isolation downgraded from Serializable to ReadCommitted + FOR UPDATE.

## What Was Built

Eliminated three full-table-scan paths and two tenant isolation gaps in the booking platform database layer:

1. **Booking indexes** — `@@index([tenantId, guestPhone])` enables the CRM `syncClients` upsert and booking limit check to use an index rather than scanning the full Bookings table. `@@index([telegramChatId])` enables the Telegram outreach `findFirst` to avoid a full scan.

2. **OtpCode index** — `@@index([email])` on OtpCode supports `deleteMany({ where: { email } })` range deletes without scanning the composite unique key for each delete.

3. **TENANT_SCOPED expansion** — `Client` and `PlatformPayment` added to the set in `lib/tenant/prisma-tenant.ts`. These models have `tenantId` columns but were missing from the middleware guard, creating a potential cross-tenant data leak if `getTenantPrisma` was used for them. Current code uses `basePrisma` with manual filtering, but this adds defense-in-depth.

4. **Transaction isolation fix** — `createBooking` transaction changed from `Serializable` to `ReadCommitted`. The `SELECT ... FOR UPDATE` on the Resource row already provides exclusive row-level locking to prevent concurrent double-bookings. Serializable was adding SSI predicate locks that increase lock contention under concurrent booking load without any additional correctness benefit.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Booking + OtpCode indexes | 6b8d20e | prisma/schema.prisma |
| 2 | TENANT_SCOPED: Client + PlatformPayment | 0b19c95 | lib/tenant/prisma-tenant.ts |
| 3 | ReadCommitted isolation in createBooking | 63ad3ef | lib/booking/engine.ts |

## Verification Results

All plan verification checks passed:
- `@@index([tenantId, guestPhone])` present in Booking model — confirmed
- `@@index([telegramChatId])` present in Booking model — confirmed
- `@@index([email])` present in OtpCode model (separate from `@@unique([email, code])`) — confirmed
- `Client` and `PlatformPayment` in TENANT_SCOPED — confirmed
- `isolationLevel: "ReadCommitted"` in engine.ts — confirmed
- `Serializable` not present in engine.ts — confirmed
- `prisma db push` applied all indexes to database without errors — confirmed

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- prisma/schema.prisma — modified with 3 new indexes
- lib/tenant/prisma-tenant.ts — TENANT_SCOPED expanded
- lib/booking/engine.ts — isolation level changed
- Commits: 6b8d20e, 0b19c95, 63ad3ef — all verified in git log
