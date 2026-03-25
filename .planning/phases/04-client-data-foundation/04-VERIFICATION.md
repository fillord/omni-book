---
phase: 04-client-data-foundation
verified: 2026-03-25T12:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 4: Client Data Foundation Verification Report

**Phase Goal:** Prisma Client model, aggregation logic, sync from existing bookings.
**Verified:** 2026-03-25
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Running syncClients creates one Client record per unique phone/email under correct tenant with no duplicates | VERIFIED | `basePrisma.client.upsert` with `where: { tenantId_phone: { tenantId, phone } }` — composite unique key enforces one record per (tenant, phone) pair |
| 2 | Client records carry totalVisits | VERIFIED | `const totalVisits = clientBookings.length` — count of COMPLETED bookings in group |
| 3 | Client records carry totalRevenue | VERIFIED | `clientBookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0)` |
| 4 | Client records carry lastVisitAt | VERIFIED | `clientBookings[0]?.startsAt ?? null` — bookings ordered `desc` so index 0 is most recent |
| 5 | Client records carry hasTelegram | VERIFIED | `clientBookings.some(b => b.telegramChatId != null)` |
| 6 | getClients returns records for Phase 5 UI | VERIFIED | `basePrisma.client.findMany({ where: { tenantId }, orderBy: { totalVisits: 'desc' } })` |
| 7 | Prisma schema Client model with all required fields and constraints | VERIFIED | `model Client` at line 210 of `prisma/schema.prisma` with all 11 fields, `@@unique([tenantId, phone])`, `@@index([tenantId])`, `onDelete: Cascade`; `clients Client[]` on Tenant model at line 42 |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Client model with composite unique and Tenant back-relation | VERIFIED | `model Client` at line 210; all 11 fields present; `@@unique([tenantId, phone])` and `@@index([tenantId])` present; `onDelete: Cascade` on tenant relation; `clients Client[]` on Tenant at line 42 |
| `lib/actions/clients.ts` | syncClients + getClients server actions | VERIFIED | 56 lines; `'use server'`; exports both `syncClients` and `getClients`; substantive implementation, no stubs |
| `__tests__/client-data-surface.test.ts` | Static assertion tests for CRM-01 through CRM-05 | VERIFIED | 179 lines; `safeRead` helper; 6 describe blocks (CRM-01 schema, CRM-01 action, CRM-01 getClients, CRM-02, CRM-03, CRM-04, CRM-05); 31 tests, 31 pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/actions/clients.ts` | `prisma.booking.findMany` | COMPLETED booking query with service.price include | WIRED | Line 14: `basePrisma.booking.findMany({ where: { tenantId, status: 'COMPLETED' }, include: { service: { select: { price: true } } } })` |
| `lib/actions/clients.ts` | `prisma.client.upsert` | tenantId_phone composite unique upsert | WIRED | Line 39: `basePrisma.client.upsert({ where: { tenantId_phone: { tenantId, phone } }, create: {...}, update: {...} })` |
| `lib/actions/clients.ts` | `lib/auth/guards` | requireAuth + requireRole(['OWNER']) | WIRED | Lines 8-9: `const session = await requireAuth()` then `requireRole(session, ['OWNER'])` |
| `__tests__/client-data-surface.test.ts` | `prisma/schema.prisma` | safeRead file assertion | WIRED | Line 14: `const schema = safeRead("prisma/schema.prisma")` used across all schema describe block assertions |
| `prisma/schema.prisma` | `model Tenant` | clients Client[] back-relation | WIRED | Tenant model line 42: `clients        Client[]` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| CRM-01 | 04-01, 04-02 | Booking history aggregated into Client model per unique phone/email, synced from existing bookings via seeding action | SATISFIED | Client model in schema with (tenantId, phone) composite unique; syncClients upserts one record per unique phone per tenant |
| CRM-02 | 04-02 | Each client record exposes total completed visits count | SATISFIED | `totalVisits = clientBookings.length` where clientBookings are COMPLETED bookings for that phone |
| CRM-03 | 04-02 | Each client record exposes total revenue from completed bookings | SATISFIED | `totalRevenue = clientBookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0)` |
| CRM-04 | 04-02 | Each client record exposes last visit date | SATISFIED | `lastVisitAt = clientBookings[0]?.startsAt ?? null` with bookings pre-sorted `startsAt desc` |
| CRM-05 | 04-02 | Each client record shows whether client has an active Telegram connection | SATISFIED | `hasTelegram = clientBookings.some(b => b.telegramChatId != null)` |

No orphaned requirements — REQUIREMENTS.md traceability table maps CRM-01 through CRM-05 exclusively to Phase 4. All five are covered. CRM-06 through CRM-12 are Phase 5 and are not in scope for this phase.

### Anti-Patterns Found

None. No TODO/FIXME/PLACEHOLDER comments, no stub return values, no empty handlers in any phase-4 files.

### Human Verification Required

#### 1. Database schema applied to production

**Test:** Connect to the production/staging database and run `\d "Client"` or equivalent.
**Expected:** A `Client` table exists with columns `id`, `tenantId`, `phone`, `name`, `email`, `totalVisits`, `totalRevenue`, `lastVisitAt`, `hasTelegram`, `createdAt`, `updatedAt`, and unique index on `(tenantId, phone)`.
**Why human:** `prisma db push` was deliberately not run in the executor context. The schema change exists in `prisma/schema.prisma` and types are regenerated, but the actual database table must be created by running `npx prisma db push` or applying a migration before syncClients can write any rows.

#### 2. End-to-end syncClients execution

**Test:** Log in as a tenant OWNER who has COMPLETED bookings. Call `syncClients()` (e.g., via a temporary button or the Node REPL). Check the `Client` table for new rows.
**Expected:** One row per unique `guestPhone` under that `tenantId`; `totalVisits`, `totalRevenue`, `lastVisitAt`, `hasTelegram` populated correctly; calling it a second time produces no duplicates and updates the same rows.
**Why human:** No integration test exists. The static tests verify file structure only — they do not execute the function against a real database.

### Gaps Summary

No gaps. All automated checks pass.

- `prisma/schema.prisma` contains a fully specified `Client` model with all required fields, the `@@unique([tenantId, phone])` composite constraint, `@@index([tenantId])`, and `onDelete: Cascade`. The `Tenant` model carries the `clients Client[]` back-relation.
- `lib/actions/clients.ts` is a real 56-line implementation (not a stub). It correctly filters by `status: 'COMPLETED'`, groups by phone using a `Map`, computes all four metrics (`totalVisits`, `totalRevenue`, `lastVisitAt`, `hasTelegram`), and upserts using the composite unique key.
- `getClients` is a clean pass-through query ordered by `totalVisits: 'desc'` ready for Phase 5 UI consumption.
- All 31 tests in `__tests__/client-data-surface.test.ts` pass (verified by running the suite).
- Commits `0a4e069`, `7030c82`, and `688feaa` all exist in git history.
- The two human verification items (database schema application and end-to-end execution) are operational concerns, not code gaps.

---
_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
