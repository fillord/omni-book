---
phase: 04-client-data-foundation
plan: "02"
subsystem: api
tags: [prisma, postgresql, crm, server-actions, nextjs]

# Dependency graph
requires:
  - phase: 04-01
    provides: Client Prisma model with (tenantId, phone) composite unique constraint and regenerated Prisma types

provides:
  - syncClients server action — aggregates COMPLETED bookings into Client records (CRM-01 through CRM-05)
  - getClients query action — returns all Client records ordered by totalVisits desc for Phase 5 UI

affects:
  - 05-client-ui (queries Client table via getClients, triggers sync via syncClients)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server action auth guard: requireAuth() then requireRole(session, ['OWNER']) then tenantId from session"
    - "Materialized aggregate pattern: sync bookings into pre-computed Client fields; no runtime aggregation at query time"
    - "Idempotent upsert via tenantId_phone composite unique key — running syncClients twice produces identical records"
    - "Map<phone, bookings[]> grouping with desc orderBy so [0] gives most recent booking for lastVisitAt and name fallback"

key-files:
  created:
    - lib/actions/clients.ts
  modified: []

key-decisions:
  - "syncClients uses orderBy: startsAt desc so clientBookings[0] is most recent — lastVisitAt and name fallback use index 0 without extra sort"
  - "email from clientBookings.find(b => b.guestEmail != null) — uses first non-null email across all bookings, not just most recent"
  - "revalidatePath('/dashboard/clients') called after upsert loop — cache busted for Phase 5 clients page before it exists"

patterns-established:
  - "Aggregation sync pattern: fetch all COMPLETED bookings, group by phone using Map, upsert with computed metrics"
  - "Double-null guard on service price: b.service?.price ?? 0 handles both null serviceId and null price"

requirements-completed:
  - CRM-01
  - CRM-02
  - CRM-03
  - CRM-04
  - CRM-05

# Metrics
duration: 1min
completed: "2026-03-25"
---

# Phase 4 Plan 02: Client Sync Action Summary

**syncClients server action aggregates COMPLETED bookings into pre-computed Client records (visits, revenue, lastVisit, hasTelegram) via idempotent upsert; getClients query action for Phase 5 UI**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-25T11:01:17Z
- **Completed:** 2026-03-25T11:02:15Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `lib/actions/clients.ts` (56 lines) with `syncClients` and `getClients` exports
- syncClients fetches COMPLETED bookings with service price include, groups by phone using Map, upserts Client records with all 5 CRM metrics
- All 31 tests in `__tests__/client-data-surface.test.ts` pass (CRM-01 through CRM-05)
- Full test suite: 319/351 tests pass; 32 failures are pre-existing in unrelated suites

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement syncClients server action with booking aggregation and upsert loop** - `688feaa` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `lib/actions/clients.ts` - syncClients (OWNER-guarded sync action) + getClients (query action) — 56 lines

## Decisions Made

- `orderBy: { startsAt: 'desc' }` on booking query means `clientBookings[0]` is most recent — both `lastVisitAt` and `name` fallback use index 0 without a secondary sort
- `email` uses `Array.find` across all bookings for first non-null email (not just most recent booking)
- `revalidatePath('/dashboard/clients')` included even though Phase 5 page doesn't exist yet — no-op until created, ensures cache is warm from day 1

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. (Database schema was synced in Plan 01.)

## Next Phase Readiness

- `lib/actions/clients.ts` exports `syncClients` and `getClients` — Phase 5 can import immediately
- All CRM-01 through CRM-05 requirements satisfied
- Phase 5 client UI can call `getClients(tenantId)` for client list and `syncClients()` for the sync trigger button

---
*Phase: 04-client-data-foundation*
*Completed: 2026-03-25*
