---
phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi
plan: "01"
subsystem: payments
tags: [kaspi, prisma, schema, booking-engine, testing]

# Dependency graph
requires: []
provides:
  - Prisma schema with 4 Tenant payment fields (requireDeposit, depositAmount, kaspiMerchantId, kaspiApiKey)
  - Prisma schema with 2 Booking payment fields (paymentInvoiceId, paymentExpiresAt) + compound index
  - lib/payments/kaspi.ts mock adapter with createKaspiInvoice, verifyKaspiWebhook, KaspiInvoiceResult
  - CreateBookingParams extended with optional status/paymentExpiresAt/paymentInvoiceId
  - Payment surface test scaffold (PAY-01 through PAY-08) with safeRead helper
affects:
  - 09-02 (bookings route wires createKaspiInvoice)
  - 09-03 (webhook handler uses verifyKaspiWebhook)
  - 09-04 (booking-form.tsx payment UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "safeRead helper (fs.existsSync guard) in test files — prevents crashes on missing files, test fails cleanly with assertion error"
    - "Mock adapter pattern in lib/payments/ — real integration deferred to Phase 9b, logs intent for observability"

key-files:
  created:
    - __tests__/payment-surface.test.ts
    - lib/payments/kaspi.ts
  modified:
    - prisma/schema.prisma
    - lib/booking/engine.ts

key-decisions:
  - "Phase 9: Kaspi adapter is mock implementation — createKaspiInvoice returns synthetic invoiceId, verifyKaspiWebhook accepts all webhooks. Real HMAC-SHA256 verification deferred to Phase 9b"
  - "paymentInvoiceId/paymentExpiresAt added to Booking BEFORE relation block — consistent with existing field ordering convention"
  - "status?: CONFIRMED | PENDING in CreateBookingParams (not the full BookingStatus enum) — restricts to the two valid booking-creation states, prevents invalid CANCELLED/COMPLETED/NO_SHOW at create time"
  - "requestedStatus ?? CONFIRMED fallback — all existing callers continue to create CONFIRMED bookings; only Plan 02 payment flow passes PENDING"

patterns-established:
  - "safeRead helper pattern for static file assertion tests — extend to all future test scaffolds in Phase 9"

requirements-completed:
  - PAY-01
  - PAY-02
  - PAY-03
  - PAY-07

# Metrics
duration: 2min
completed: "2026-03-31"
---

# Phase 9 Plan 01: Payment Foundation Summary

**Prisma schema extended with 6 payment fields (4 Tenant, 2 Booking), Kaspi Pay mock adapter created, booking engine interface accepts optional PENDING status and payment metadata, test scaffold covers PAY-01 through PAY-08 with 13 tests green**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T03:51:54Z
- **Completed:** 2026-03-31T03:54:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `__tests__/payment-surface.test.ts` with 24 tests across 8 PAY requirements using the `safeRead` helper pattern; PAY-07 passes immediately (existing PENDING collision check), 13 total pass after Task 2
- Extended Prisma schema: Tenant gets `requireDeposit Boolean @default(false)`, `depositAmount Int @default(0)`, `kaspiMerchantId String?`, `kaspiApiKey String?`; Booking gets `paymentInvoiceId String?`, `paymentExpiresAt DateTime?`, compound index `@@index([status, paymentExpiresAt])`
- Created `lib/payments/kaspi.ts` mock adapter with `createKaspiInvoice` (returns synthetic invoiceId) and `verifyKaspiWebhook` (accepts all, no real signature check) — real HMAC-SHA256 deferred to Phase 9b
- Extended `CreateBookingParams` with `status?: 'CONFIRMED' | 'PENDING'`, `paymentExpiresAt?: Date | null`, `paymentInvoiceId?: string | null`; updated `createBooking` to use `requestedStatus ?? "CONFIRMED"` and pass payment fields to db

## Task Commits

Each task was committed atomically:

1. **Task 1: Create payment surface test scaffold (PAY-01 through PAY-08)** - `603297a` (test)
2. **Task 2: Extend Prisma schema + Kaspi adapter mock + booking engine interface** - `e405d63` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `__tests__/payment-surface.test.ts` - 24 static file assertion tests for PAY-01 through PAY-08 with safeRead helper
- `lib/payments/kaspi.ts` - Mock Kaspi Pay adapter; exports createKaspiInvoice, verifyKaspiWebhook, KaspiInvoiceResult
- `prisma/schema.prisma` - Added 4 Tenant payment fields + 2 Booking payment fields + compound index
- `lib/booking/engine.ts` - CreateBookingParams extended with optional status/payment fields; createBooking uses them

## Decisions Made

- Kaspi adapter uses mock implementation (console.log + synthetic invoiceId) — real API integration deferred to Phase 9b/10. This satisfies PAY-02 export contract without needing real Kaspi credentials.
- `status?` typed as `'CONFIRMED' | 'PENDING'` (not full `BookingStatus` enum) — prevents invalid states at create time; only the two valid creation states are allowed.
- `paymentInvoiceId/paymentExpiresAt` fields added BEFORE the relations block in Booking model — consistent with field ordering convention in this schema (scalar fields before relations).
- `@@index([status, paymentExpiresAt])` compound index enables efficient cron queries for expired PENDING bookings in Plan 04.

## Deviations from Plan

**1. [Rule 1 - Adjustment] payment fields inserted before relations block (no `manageToken` in this worktree)**
- **Found during:** Task 2 (schema editing)
- **Issue:** Plan specified adding fields "AFTER the `manageToken` field" but `manageToken` does not exist in this worktree's schema (it's in main branch but not synced here)
- **Fix:** Fields inserted after `reminder1hSentAt` and before the relations block — same semantic position, consistent with schema ordering convention
- **Files modified:** prisma/schema.prisma
- **Verification:** PAY-03 schema tests pass; `npx prisma generate` succeeds
- **Committed in:** e405d63

---

**Total deviations:** 1 auto-adjusted (positional change only, same semantic result)
**Impact on plan:** No correctness impact — schema ordering is cosmetic. All acceptance criteria met.

## Issues Encountered

None — plan executed cleanly after positional adjustment for missing `manageToken` field.

## Known Stubs

- `lib/payments/kaspi.ts` — `createKaspiInvoice` returns `mock-inv-${bookingId}` synthetic invoiceId; `verifyKaspiWebhook` always returns `true`. Intentional for Phase 9 foundation; real integration in Phase 9b. These stubs do not prevent the plan's goal (establishing the interface contract).

## Next Phase Readiness

- Plan 02 can now import `createKaspiInvoice` from `lib/payments/kaspi.ts` and wire it into `app/api/bookings/route.ts`
- Plan 02 can pass `status: 'PENDING'` and `paymentExpiresAt`/`paymentInvoiceId` to `createBooking()`
- Schema changes need `npx prisma db push` against live DB before deployment (manual step — requires database connection)
- PAY-04 (waiting-for-payment UI), PAY-05 (webhook handler), PAY-06 (cron), PAY-08 (Neumorphism) remain RED — to be implemented in Plans 02-04

---
*Phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi*
*Completed: 2026-03-31*
