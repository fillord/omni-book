---
phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment
plan: "01"
subsystem: database
tags: [prisma, schema-migration, kaspi, paylink, cleanup]

# Dependency graph
requires:
  - phase: 9-online-payment-with-deposit-via-paylink-kz-kaspi
    provides: Kaspi Pay infrastructure (kaspi.ts, webhook, cron, schema fields)
provides:
  - Kaspi Pay infrastructure fully deleted
  - Prisma schema cleaned (4 Tenant fields, 2 Booking fields, 2 PlatformPayment mock fields removed)
  - paylinkOrderId and paylinkUrl fields added to PlatformPayment
  - vercel.json pending-payments cron removed
  - TypeScript errors resolved with TODO markers for Plans 12-02/03/04
affects:
  - 12-02: WhatsApp prepayment (booking-form.tsx TODO(12-02) stubs to fix)
  - 12-03: Paylink.kz adapter (platform-payment.ts TODO(12-03) stubs to wire)
  - 12-04: Billing settings (payment-settings.ts TODO(12-04) to update)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TODO(12-XX) comments at removed code sites for traceability across plans"
    - "Collision queries simplified — PENDING bookings now block slots without expiry check (no paymentExpiresAt)"

key-files:
  created:
    - __tests__/payment-surface.test.ts (rewritten — Phase 12-01 assertions replace Kaspi assertions)
  modified:
    - prisma/schema.prisma
    - vercel.json
    - lib/booking/engine.ts
    - lib/actions/bookings.ts
    - lib/payment-lifecycle.ts
    - lib/platform-payment.ts
    - lib/actions/billing.ts
    - lib/actions/payment-settings.ts
    - app/dashboard/settings/billing/billing-content.tsx
    - app/dashboard/settings/billing/page.tsx
    - app/dashboard/settings/billing/payment-modal.tsx
    - components/booking-form.tsx
  deleted:
    - lib/payments/kaspi.ts
    - app/api/webhooks/kaspi/route.ts
    - app/api/cron/pending-payments/route.ts

key-decisions:
  - "PENDING bookings now block slots unconditionally — paymentExpiresAt check removed along with the field"
  - "cancelExpiredPendingBookings stubbed to return 0 — Paylink lifecycle will replace in 12-03"
  - "Billing UI Kaspi card removed entirely — Paylink config placeholder added as TODO(12-03)"
  - "payment-settings.ts stubbed to return error — Kaspi fields gone, Paylink action comes in 12-04"
  - "payment-modal.tsx updated to paylinkUrl — QR replaced with link display (TODO(12-03) to wire real URL)"

patterns-established:
  - "TODO(12-0X) scope tags in comments: TODO(12-02) for booking-form Kaspi stubs, TODO(12-03) for Paylink wiring, TODO(12-04) for billing settings"

requirements-completed:
  - PIV-01
  - PIV-02

# Metrics
duration: 12min
completed: 2026-04-04
---

# Phase 12 Plan 01: Schema migration + Kaspi file deletion + vercel.json cleanup Summary

**Kaspi Pay infrastructure fully deleted: 3 source files removed, 6 schema fields dropped, 2 PlatformPayment mock fields replaced with paylinkOrderId/paylinkUrl, pending-payments cron removed from vercel.json, TypeScript errors resolved**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-04T21:07:57Z
- **Completed:** 2026-04-04T21:19:35Z
- **Tasks:** 8 of 8
- **Files modified:** 13 (3 deleted)

## Accomplishments

- Deleted `lib/payments/kaspi.ts`, `app/api/webhooks/kaspi/route.ts`, `app/api/cron/pending-payments/route.ts`
- Removed `requireDeposit`, `depositAmount`, `kaspiMerchantId`, `kaspiApiKey` from Tenant schema; `paymentInvoiceId`, `paymentExpiresAt` and composite index from Booking schema; replaced `mockQrCode`/`mockPaylink` with `paylinkOrderId`/`paylinkUrl` in PlatformPayment
- Ran `prisma generate` to update client types; all TypeScript errors resolved
- Removed pending-payments cron from vercel.json (back to 2 crons — within Vercel free tier)
- Updated `__tests__/payment-surface.test.ts` — 14 new Phase 12-01 assertions pass, all Kaspi assertions removed

## Task Commits

1. **Task 1: Delete Kaspi source files** - `a5b7a09` (feat)
2. **Task 2: Remove pending-payments cron** - `13fc8bf` (feat)
3. **Task 3: Remove Kaspi fields from Tenant** - `e0a5123` (feat)
4. **Task 4: Remove Kaspi fields from Booking** - `4f71df1` (feat)
5. **Task 5: Replace mock fields in PlatformPayment** - `3b3757b` (feat)
6. **Task 6: Prisma generate** - `12a6596` (chore)
7. **Task 7: Fix TypeScript errors** - `b500bc3` (feat)
8. **Task 8: Update test file** - `38b301b` (test)

## Files Created/Modified

- `prisma/schema.prisma` - Tenant fields removed, Booking fields removed, PlatformPayment mock->paylink
- `vercel.json` - pending-payments cron removed
- `lib/booking/engine.ts` - paymentExpiresAt references removed, collision queries simplified
- `lib/actions/bookings.ts` - cancelExpiredBooking function removed (TODO(12-02) stub)
- `lib/payment-lifecycle.ts` - Stubbed to return 0 (TODO(12-02))
- `lib/platform-payment.ts` - mockQrCode/mockPaylink replaced with paylinkOrderId/paylinkUrl (TODO(12-03))
- `lib/actions/billing.ts` - mockQrCode references updated to paylinkUrl
- `lib/actions/payment-settings.ts` - Stubbed with TODO(12-04) error return
- `app/dashboard/settings/billing/billing-content.tsx` - kaspiMerchantId/kaspiApiKey fields removed from TenantInfo, Kaspi card section removed
- `app/dashboard/settings/billing/page.tsx` - mockQrCode -> paylinkUrl in pendingPayment pass
- `app/dashboard/settings/billing/payment-modal.tsx` - mockQrCode -> paylinkUrl, QR img -> Paylink link
- `components/booking-form.tsx` - cancelExpiredBooking import removed, Kaspi payment blocks stubbed TODO(12-02)
- `__tests__/payment-surface.test.ts` - Rewritten with Phase 12-01 assertions (14 tests, all pass)
- DELETED: `lib/payments/kaspi.ts`, `app/api/webhooks/kaspi/route.ts`, `app/api/cron/pending-payments/route.ts`

## Decisions Made

- PENDING bookings now block slots unconditionally — paymentExpiresAt check removed along with the field. This is safe since all new bookings are CONFIRMED (12-02 commit 8ad505c).
- `payment-settings.ts` stubbed to return error rather than deleted — billing-content.tsx import still present and will be properly wired in 12-04.
- `cancelExpiredPendingBookings` stub retained in `payment-lifecycle.ts` for module resolution integrity (cron file deleted but library may be referenced elsewhere).
- `payment-modal.tsx` updated to display Paylink link instead of QR image — will be properly wired in 12-03 when real Paylink API is available.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed payment-modal.tsx to use paylinkUrl**
- **Found during:** Task 7 (TypeScript error triage)
- **Issue:** `payment-modal.tsx` had `mockQrCode` in its local `PendingPayment`/`PaymentData` types and QR display logic — not listed in plan's Task 7 file list but caused TS error via billing-content.tsx type mismatch
- **Fix:** Updated types to `paylinkUrl`, replaced QR `<img>` with Paylink anchor link, updated button text
- **Files modified:** `app/dashboard/settings/billing/payment-modal.tsx`
- **Verification:** TypeScript reports zero errors after fix
- **Committed in:** `b500bc3` (Task 7 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix was required for TypeScript compilation. No scope creep.

## Issues Encountered

- `prisma migrate dev` could not run due to local dev database requiring schema reset (pre-existing divergence). Per project pattern (STATE.md), `prisma db push` is a manual step requiring live DB connection — documented and skipped. `prisma generate` ran successfully to update client types.

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `lib/actions/payment-settings.ts` | Returns error string | Kaspi fields removed; Paylink settings come in 12-04 |
| `lib/payment-lifecycle.ts` | Returns `{ cancelled: 0 }` | Kaspi expiry logic removed; Paylink lifecycle in 12-03 |
| `app/dashboard/settings/billing/payment-modal.tsx` | paylinkUrl null (no real URL yet) | Paylink API wired in 12-03 |
| `components/booking-form.tsx` | TODO(12-02) comments at payment blocks | Full booking-form Kaspi cleanup in 12-02 |

These stubs do not prevent the plan's goal (infrastructure deletion) — they are intentional placeholders for subsequent plans.

## User Setup Required

After deployment, run `prisma db push` or `prisma migrate deploy` against the production database to drop the Kaspi columns. This is a destructive migration — backup first.

## Next Phase Readiness

- Plan 12-02 (WhatsApp prepayment): booking-form.tsx TODO(12-02) stubs ready for cleanup
- Plan 12-03 (Paylink.kz adapter): `lib/platform-payment.ts` TODO(12-03) sites ready for Paylink API integration; `paylinkOrderId`/`paylinkUrl` fields present in schema
- Plan 12-04 (Billing settings): `payment-settings.ts` TODO(12-04) stub ready for Paylink settings action

---
*Phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment*
*Completed: 2026-04-04*
