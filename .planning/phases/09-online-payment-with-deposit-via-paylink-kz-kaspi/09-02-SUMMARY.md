---
phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi
plan: "02"
subsystem: payments
tags: [kaspi, webhook, cron, booking-route, payment-lifecycle]

# Dependency graph
requires:
  - 09-01 (Kaspi adapter mock, Prisma schema with payment fields, CreateBookingParams extension)
provides:
  - Conditional deposit branch in POST /api/bookings — creates PENDING booking + Kaspi invoice
  - Kaspi webhook handler at /api/webhooks/kaspi — idempotent CONFIRMED transition with email+Telegram
  - Payment lifecycle function cancelExpiredPendingBookings — PENDING + expired -> CANCELLED
  - Cron route /api/cron/pending-payments — runs every 5 min with CRON_SECRET auth
  - vercel.json with 3 cron entries
affects:
  - 09-03 (booking-form.tsx payment UI — reads invoiceCreated from booking route response)
  - 09-04 (any Neumorphism styling on the payment flow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deposit branch returns early with { booking, invoiceCreated: true } — non-deposit flow unchanged"
    - "Webhook handler idempotency: CONFIRMED booking returns 200 without re-processing"
    - "Fire-and-forget: basePrisma.booking.update().catch(console.error) for non-critical invoice ID tracking"
    - "Cron uses GET handler (not POST) — Vercel Cron GET-only constraint enforced"

key-files:
  created:
    - app/api/webhooks/kaspi/route.ts
    - lib/payment-lifecycle.ts
    - app/api/cron/pending-payments/route.ts
  modified:
    - app/api/bookings/route.ts
    - vercel.json

key-decisions:
  - "Kaspi webhook sends email+Telegram to guest/owner after PENDING->CONFIRMED transition — not at PENDING creation time"
  - "basePrisma.booking.update for invoice ID is fire-and-forget (non-critical tracking); failure does not break payment flow"
  - "vercel.json 3rd cron entry — Vercel free tier supports 2 cron jobs; user may need Pro upgrade or fold into subscriptions cron"
  - "Deposit branch exits early (return statement) before notification block — PENDING bookings never trigger premature email/Telegram"
  - "manageToken included in webhook confirmation email/Telegram — guests can manage confirmed bookings from link"

patterns-established:
  - "payment-lifecycle.ts follows subscription-lifecycle.ts pattern (basePrisma.updateMany, typed return)"
  - "Webhook handler reads rawBody via request.text() before JSON.parse — required for signature verification"

requirements-completed:
  - PAY-03
  - PAY-05
  - PAY-06

# Metrics
duration: 10min
completed: "2026-03-31"
---

# Phase 9 Plan 02: Server-Side Payment Flow Summary

**POST /api/bookings wires Kaspi deposit branch (PENDING + 10-min expiry), Kaspi webhook handler confirms payments idempotently with notifications, cron cancels expired PENDING bookings every 5 minutes, vercel.json updated to 3 cron entries**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-31T08:17:00Z
- **Completed:** 2026-03-31T08:27:31Z
- **Tasks:** 2
- **Files modified:** 5 (4 new, 1 modified)

## Accomplishments

- Extended `app/api/bookings/route.ts` POST handler with deposit branch: fetches `requireDeposit`/`depositAmount`/`kaspiMerchantId`/`kaspiApiKey` from tenant, creates `PENDING` booking with `paymentExpiresAt = now + 10min`, calls `createKaspiInvoice`, returns `{ booking, invoiceCreated: true, invoiceId }`. Non-deposit flow unchanged (CONFIRMED, email+Telegram notifications fire as before).
- Created `app/api/webhooks/kaspi/route.ts`: parses `x-kaspi-signature` header, verifies via `verifyKaspiWebhook`, looks up booking by `paymentInvoiceId`, idempotently returns 200 for already-CONFIRMED bookings, transitions PENDING->CONFIRMED with `paymentExpiresAt: null`, fires email confirmation + Telegram owner notification.
- Created `lib/payment-lifecycle.ts`: `cancelExpiredPendingBookings()` runs `booking.updateMany` for `status=PENDING AND paymentExpiresAt <= now`, returns `{ cancelled: number }`.
- Created `app/api/cron/pending-payments/route.ts`: GET handler with CRON_SECRET auth guard, calls `cancelExpiredPendingBookings`, returns `{ success: true, cancelled: N }`.
- Updated `vercel.json`: added third cron entry `{ "path": "/api/cron/pending-payments", "schedule": "*/5 * * * *" }`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend POST /api/bookings with conditional deposit branch** - `05d80f2` (feat)
2. **Task 2: Create Kaspi webhook handler + payment lifecycle cron + vercel.json** - `b34b716` (feat)

## Files Created/Modified

- `app/api/bookings/route.ts` - Added deposit branch: requireDeposit check, PENDING status, paymentExpiresAt, createKaspiInvoice call, invoiceCreated response
- `app/api/webhooks/kaspi/route.ts` - New: POST handler with signature verification, idempotent CONFIRMED transition, email+Telegram notifications
- `lib/payment-lifecycle.ts` - New: cancelExpiredPendingBookings lifecycle function
- `app/api/cron/pending-payments/route.ts` - New: GET cron handler with CRON_SECRET auth
- `vercel.json` - Added `/api/cron/pending-payments` every-5-min entry (now 3 total crons)

## Decisions Made

- Early return in deposit branch before notification block — PENDING bookings must NOT trigger premature email/Telegram (notifications fire from webhook after payment)
- Webhook idempotency via `booking.status === 'CONFIRMED'` check before any update — safe for duplicate webhook delivery
- `manageToken` included in webhook confirmation email and Telegram link — guests can cancel/reschedule from confirmation
- 10-minute payment expiry window — matches PAY-06 specification

## Deviations from Plan

**1. [Rule 3 - Blocking] Ran `npx prisma generate` to regenerate Prisma client**
- **Found during:** Task 2 verification (TypeScript check)
- **Issue:** Prisma client in shared `node_modules` did not include `manageToken` field, causing TypeScript errors in new webhook handler
- **Fix:** Ran `npx prisma generate` in main repo directory — regenerated client now includes `manageToken`, `paymentInvoiceId`, `paymentExpiresAt`, `isFrozen` fields
- **Files modified:** node_modules/.prisma/client (generated, not tracked)
- **Verification:** `npx tsc --noEmit` shows zero errors in new files after regeneration

**2. [Rule 1 - Adjustment] Used Unicode escapes for Cyrillic in Telegram message strings**
- **Found during:** Task 2 file creation
- **Issue:** Plan provided Unicode escape sequences (\u2705, \ud83d\udc64, etc.) for emoji and Cyrillic in Telegram messages; consistent with plan template
- **Fix:** Used the Unicode escape sequences as provided (readable in UTF-8 environments)
- **Verification:** String content matches plan intent — "Оплата получена!" confirmation message

## Pre-existing TypeScript Issues (Out of Scope)

These errors existed before this plan and are unrelated to our changes:
- `__tests__/neumorphism-surface.test.ts` — regex `s` flag requires ES2018 target (6 errors)
- `components/resources-manager.tsx`, `services-manager.tsx`, `staff-manager.tsx` — missing `@/components/billing-limit-alert` module
- `components/tenant-public-page.tsx` — missing `@/components/public-sections-tabs` module
- `components/staff-manager.tsx` — Radix slot type incompatibility

## Known Stubs

- `app/api/webhooks/kaspi/route.ts` — `verifyKaspiWebhook` always returns `true` (mock implementation from Plan 01). Intentional for Phase 9; real HMAC-SHA256 verification deferred to Phase 9b.
- `lib/payment-lifecycle.ts` — Only cancels expired PENDING bookings; does not send cancellation emails to guests. Future enhancement if needed.

## Vercel Cron Limit Note

Vercel free tier supports **2 cron jobs**. This plan adds a 3rd cron (`/api/cron/pending-payments`). If deployment fails with a cron limit error, the user has two options:
1. Upgrade to Vercel Pro (supports more crons)
2. Fold the pending-payments check into the existing `/api/cron/subscriptions` cron (runs daily at 2am) — acceptable trade-off since 10-minute payments will be cancelled within the next daily run

## Next Phase Readiness

- Plan 03 can now read `invoiceCreated: true` from the booking route response to show the payment waiting UI in `booking-form.tsx`
- Webhook handler is ready to receive Kaspi payment confirmations (mock in Phase 9, real in 9b)
- Expired PENDING bookings auto-cancel every 5 minutes via cron

---
*Phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi*
*Completed: 2026-03-31*
