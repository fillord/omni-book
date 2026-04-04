---
phase: 12
plan: 4
subsystem: billing-ui
tags: [paylink, payment-modal, billing-content, i18n, typescript]
dependency_graph:
  requires: [12-01-SUMMARY, 12-03-schema-paylinkUrl]
  provides: [payment-modal-paylink-redirect, billing-kaspi-removed, whatsappPrepayment-i18n]
  affects: [app/dashboard/settings/billing, lib/actions/billing.ts, lib/platform-payment.ts, lib/i18n/translations.ts]
tech_stack:
  added: []
  patterns: [polling-via-router-refresh, window.open-noopener, paylink-redirect-ux]
key_files:
  created: []
  modified:
    - app/dashboard/settings/billing/payment-modal.tsx
    - app/dashboard/settings/billing/billing-content.tsx
    - app/dashboard/settings/billing/page.tsx
    - lib/actions/billing.ts
    - lib/platform-payment.ts
    - lib/actions/payment-settings.ts
    - lib/booking/engine.ts
    - lib/payment-lifecycle.ts
    - lib/i18n/translations.ts
decisions:
  - "Polling via router.refresh() every 5s — billing Server Component re-fetches tenant; ACTIVE plan hides modal automatically"
  - "Paylink info card always visible (not PRO-gated) — all tenants see payment provider info"
  - "Mock fallback in platform-payment.ts when PAYLINK_API_KEY not set — dev mode works without credentials"
  - "payment-lifecycle.ts made no-op — PENDING booking cancellation removed since Kaspi deposit flow is gone"
metrics:
  duration_seconds: 525
  completed_date: "2026-04-03"
  tasks_completed: 5
  files_modified: 9
---

# Phase 12 Plan 4: Payment Modal Rewrite + Billing UI Cleanup Summary

Payment modal rewritten from mock QR code / "Simulate Payment" to Paylink.kz redirect button with 5-second polling; Kaspi Merchant ID / API Key config section removed from billing UI; whatsappPrepayment i18n key added to all 3 locales.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Rewrite payment-modal.tsx — Paylink redirect + polling | 9400c59 | Done |
| 2 | Update billing-content.tsx — remove Kaspi section, add Paylink info | a468458 | Done |
| 3 | Update billing page.tsx — select paylinkUrl, remove kaspi fields | 6aea3c8 | Done |
| 4 | Add whatsappPrepayment i18n key (RU/KZ/EN) | 53a4e8d | Done |
| 5 | TypeScript cleanup — fix mockQrCode/kaspi refs, engine.ts, lifecycle | 466e7c1 | Done |

## What Was Built

**Payment Modal (`payment-modal.tsx`)**:
- `PendingPayment.mockQrCode` → `paylinkUrl: string | null`
- `PaymentData.mockQrCode` → `paylinkUrl: string`
- `simulatePaymentAction` import removed
- Step 2 QR image replaced with `window.open(paylinkUrl, '_blank')` redirect button
- `startPolling()` function: `setInterval(router.refresh, 5000)` after user clicks Pay
- `isPolling` state shows "Ожидаем подтверждения оплаты..." animation
- Countdown timer preserved
- Step 1 button label updated from "Kaspi" to "Paylink.kz"

**Billing Content (`billing-content.tsx`)**:
- `TenantInfo.kaspiMerchantId` and `kaspiApiKey` removed
- `PendingPaymentInfo.mockQrCode` → `paylinkUrl`
- Kaspi state vars (`kaspiMerchantId`, `kaspiApiKey`, `savingDeposit`) removed
- `handleSaveDeposit()` function removed
- `updatePaymentSettings` import removed
- Entire Kaspi Merchant ID / Kaspi API Key card removed
- Paylink.kz info card added (read-only, always visible)
- PaymentModal prop updated to pass `paylinkUrl`

**Billing Page (`page.tsx`)**:
- Tenant query uses explicit `select` without kaspi fields
- `pendingPayment` query uses `select: { paylinkUrl: true }` instead of `mockQrCode`
- `pendingPayment` prop passes `paylinkUrl` to `BillingContent`

**i18n (`translations.ts`)**:
- Added `whatsappPrepayment` to `payment` namespace in all 3 locales:
  - RU: `'Написать в WhatsApp для предоплаты'`
  - KZ: `'Алдын ала төлем үшін WhatsApp-қа жазу'`
  - EN: `'Message on WhatsApp for prepayment'`
- Existing payment keys kept (still used in booking-form.tsx)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript errors from 12-01 schema changes**
- **Found during:** Task 5
- **Issue:** `lib/booking/engine.ts` still referenced `paymentInvoiceId` and `paymentExpiresAt` which were removed from Booking schema in 12-01; `lib/payment-lifecycle.ts` referenced `paymentExpiresAt` in a Prisma where clause
- **Fix:** Removed `paymentInvoiceId` and `paymentExpiresAt` from `CreateBookingParams` and `createBooking()` data; made `cancelExpiredPendingBookings()` a no-op since the PENDING booking flow is removed
- **Files modified:** `lib/booking/engine.ts`, `lib/payment-lifecycle.ts`
- **Commit:** 466e7c1

**2. [Rule 3 - Blocking] Rewrote platform-payment.ts to use paylinkUrl (12-03 overlap)**
- **Found during:** Task 5
- **Issue:** `lib/platform-payment.ts` still used `mockQrCode`/`mockPaylink` which no longer exist in Prisma schema; this caused TypeScript errors and was also part of plan 12-03's scope. Since 12-03 may run in parallel, fixed here to unblock compilation.
- **Fix:** Replaced `generateMockQrSvg()` helper and `mockQrCode`/`mockPaylink` DB fields with `paylinkOrderId`/`paylinkUrl`; integrated Paylink.kz API call with fallback mock URL for dev
- **Files modified:** `lib/platform-payment.ts`
- **Commit:** 466e7c1

**3. [Rule 2 - Missing functionality] Updated billing.ts initiateSubscriptionPayment return type**
- **Found during:** Task 5
- **Issue:** `initiateSubscriptionPayment` return type still had `mockQrCode?` instead of `paylinkUrl?`, causing a TypeScript error in payment-modal.tsx
- **Fix:** Updated return type and all return sites to use `paylinkUrl`; also removed `simulatePaymentAction` function
- **Files modified:** `lib/actions/billing.ts`
- **Commit:** 466e7c1

**4. [Rule 2 - Missing functionality] Updated payment-settings.ts to remove kaspi fields**
- **Found during:** Task 5
- **Issue:** `payment-settings.ts` tried to update `kaspiMerchantId`/`kaspiApiKey` on Tenant which no longer has those fields
- **Fix:** Made `updatePaymentSettings` a no-op (preserves API compatibility; kaspi fields gone)
- **Files modified:** `lib/actions/payment-settings.ts`
- **Commit:** 466e7c1

### Decisions

- i18n keys `waitingForPayment`, `waitingInstructions`, `paymentCountdown`, `paymentExpired`, `paymentExpiredSub`, `depositRequired`, `depositNotice` retained because they are still used in `components/booking-form.tsx` (verified by grep)
- `toast` import removed from billing-content since the Kaspi save handler using it was removed
- `useRouter` import removed from billing-content since it was only used in the removed Kaspi save handler

## Verification Results

```
1. No Kaspi config in billing UI:         OK: empty
2. Payment modal uses paylinkUrl:          12 matches
3. No simulate button:                     OK: empty
4. WhatsApp i18n key present:              3 matches (RU/KZ/EN)
5. Billing-related TS errors:              0
```

Remaining pre-existing TS errors (15 total, all out of scope):
- `billing-limit-alert` missing component (3 errors)
- `rate-limit`, `analytics-overview`, `support-buttons`, `public-sections-tabs` missing modules
- `neumorphism-surface.test.ts` regex flag compatibility
- `cancelExpiredBooking` export, `asChild` prop type mismatch

## Self-Check: PASSED

All created/modified files exist. All task commits verified in git log:
- 9400c59: payment-modal.tsx rewrite
- a468458: billing-content.tsx cleanup
- 6aea3c8: page.tsx update
- 53a4e8d: i18n additions
- 466e7c1: TypeScript fixes
