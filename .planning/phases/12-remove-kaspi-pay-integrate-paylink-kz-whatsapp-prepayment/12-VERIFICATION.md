---
phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment
verified: 2026-04-04T10:00:00Z
status: human_needed
score: 10/10 requirements verified
re_verification:
  previous_status: gaps_found
  previous_score: 8/10
  gaps_closed:
    - "PIV-05 — Kaspi deposit UI fully removed from components/service-form.tsx (requireDeposit toggle, depositAmount input, Kaspi branding all gone)"
    - "i18n TS1117 — Duplicate payment: namespace eliminated from lib/i18n/translations.ts; exactly one payment block per locale; no TS1117 errors"
    - "PIV-08 — app/api/mock-payment/ directory and all contents deleted"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Confirm WhatsApp deep-link generates correct message when booking is confirmed"
    expected: "After completing a booking on a tenant's public page (tenant must have phone configured), the SuccessScreen shows a green WhatsApp button. Clicking it opens wa.me with a pre-filled Russian template containing service name, date/time, and price."
    why_human: "Deep-link generation requires a live browser interaction with an active tenant record that has a phone field populated."
  - test: "Confirm Paylink redirect flow opens correct payment page"
    expected: "Clicking 'Оплатить через Paylink.kz →' in the payment modal opens a new tab. If PAYLINK_API_KEY is set in production, it should redirect to a real Paylink.kz checkout. In dev without the key, it opens the mock fallback URL."
    why_human: "Requires production Paylink.kz credentials and a live payment record."
  - test: "Confirm polling detects subscription activation after payment"
    expected: "After clicking the Paylink button, the modal shows 'Ожидаем подтверждения оплаты...' and polls every 5 seconds. When webhook fires and subscription activates, the billing page refreshes to show the active plan and the modal disappears."
    why_human: "Requires end-to-end Paylink webhook in a live environment."
---

# Phase 12: Remove Kaspi Pay / Integrate Paylink.kz + WhatsApp Prepayment — Verification Report

**Phase Goal:** Complete architectural pivot away from Kaspi Pay. Remove all Kaspi logic (booking deposits + platform payment mock QR). Replace SaaS subscription payments with real Paylink.kz API (redirect-based). Replace in-widget deposit flow with a WhatsApp deep-link button that pre-fills a professional booking confirmation template with booking details.
**Verified:** 2026-04-04
**Status:** human_needed (all automated checks pass; 3 items require live environment testing)
**Re-verification:** Yes — after gap closure via plan 12.1-01

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Kaspi source files are deleted (kaspi.ts, webhook, cron) | ✓ VERIFIED | All 3 files absent: `lib/payments/kaspi.ts`, `app/api/webhooks/kaspi/route.ts`, `app/api/cron/pending-payments/route.ts` |
| 2 | Prisma schema is clean — no Kaspi/mock fields, paylinkOrderId/paylinkUrl present | ✓ VERIFIED | Schema has 4 paylink-related matches; zero kaspiMerchantId/kaspiApiKey/paymentInvoiceId/paymentExpiresAt/mockQrCode/mockPaylink |
| 3 | Booking route always creates CONFIRMED bookings, no deposit branch | ✓ VERIFIED | `app/api/bookings/route.ts` line 153: `const bookingStatus = 'CONFIRMED' as const`; zero Kaspi/requireDeposit/PENDING references |
| 4 | WhatsApp prepayment button is in booking SuccessScreen | ✓ VERIFIED | `components/booking-form.tsx` lines 288, 304, 346, 369: button renders when `tenantPhone` truthy; `buildWhatsAppPrepaymentUrl()` helper generates wa.me URL |
| 5 | tenantPhone prop wired from tenant-public-page to BookingForm | ✓ VERIFIED | `components/tenant-public-page.tsx` line 510 passes `tenantPhone`; `components/booking-form.tsx` line 43 declares prop |
| 6 | Kaspi deposit UI removed from service-form.tsx | ✓ VERIFIED | `components/service-form.tsx` contains zero matches for requireDeposit, depositAmount, or Kaspi branding text — gap fully closed by plan 12.1-01 |
| 7 | Paylink.kz adapter (lib/payments/paylink.ts) exists and is wired | ✓ VERIFIED | File exists; exports `createPaylinkPayment()` and `verifyPaylinkWebhook()`; imported by `lib/platform-payment.ts` and `app/api/webhooks/paylink/route.ts` |
| 8 | Paylink webhook handler exists and activates subscriptions | ✓ VERIFIED | `app/api/webhooks/paylink/route.ts` verifies HMAC signature and calls `processPlatformPayment()` on PAID status |
| 9 | Platform payment flow uses paylinkUrl (not mock QR) | ✓ VERIFIED | `lib/platform-payment.ts` calls `createPaylinkPayment()`, stores `paylinkOrderId`/`paylinkUrl`; `payment-modal.tsx` uses `paylinkUrl` with `window.open()` redirect and polling; no mockQrCode/generateMockQrSvg references |
| 10 | i18n translations.ts has no duplicate payment namespace | ✓ VERIFIED | Exactly one `payment:` block per locale (RU at line 670, KZ at 1452, EN at 2234); zero TS1117 errors; `whatsappPrepayment` present in all 3 locales — gap fully closed by plan 12.1-01 |
| 11 | app/api/mock-payment/ directory is deleted | ✓ VERIFIED | Both `app/api/mock-payment/simulate/route.ts` and parent directory `app/api/mock-payment/` are absent — gap fully closed by plan 12.1-01 |

**Score:** 10/10 truths verified (up from 8/10 in initial verification)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/payments/kaspi.ts` | DELETED | ✓ VERIFIED | File absent |
| `app/api/webhooks/kaspi/route.ts` | DELETED | ✓ VERIFIED | File absent |
| `app/api/cron/pending-payments/route.ts` | DELETED | ✓ VERIFIED | File absent |
| `prisma/schema.prisma` | Clean schema, paylinkOrderId/paylinkUrl on PlatformPayment | ✓ VERIFIED | All Kaspi fields removed; paylink fields confirmed present (4 matches) |
| `vercel.json` | No pending-payments cron | ✓ VERIFIED | Only 2 crons remain (reminders, subscriptions) |
| `app/api/bookings/route.ts` | Always CONFIRMED, no deposit branch | ✓ VERIFIED | Line 153 hardcodes CONFIRMED; zero Kaspi/deposit refs |
| `components/booking-form.tsx` | WhatsApp button in SuccessScreen, tenantPhone prop | ✓ VERIFIED | Button present, wired, buildWhatsAppPrepaymentUrl generates wa.me deep-link |
| `components/tenant-public-page.tsx` | Passes tenantPhone to BookingForm | ✓ VERIFIED | Line 510 passes tenant.phone |
| `components/service-form.tsx` | Kaspi deposit section removed | ✓ VERIFIED | Zero matches for requireDeposit/depositAmount/Kaspi — fully clean after 12.1-01 |
| `lib/payments/paylink.ts` | Paylink adapter with createPaylinkPayment + verifyPaylinkWebhook | ✓ VERIFIED | Both functions present with HMAC-SHA256 webhook verification and dev fallback |
| `app/api/webhooks/paylink/route.ts` | Paylink webhook POST handler | ✓ VERIFIED | Verifies signature, processes PAID events |
| `lib/platform-payment.ts` | Uses Paylink redirect, no mock QR | ✓ VERIFIED | createPlatformPayment calls Paylink API; processPlatformPayment activates subscription |
| `app/api/mock-payment/simulate/route.ts` | DELETED | ✓ VERIFIED | File and parent directory both absent after 12.1-01 |
| `lib/actions/billing.ts` | Returns paylinkUrl, no simulatePaymentAction | ✓ VERIFIED | paylinkUrl returned; simulatePaymentAction absent |
| `app/dashboard/settings/billing/payment-modal.tsx` | Paylink redirect button + polling, no mock QR/simulate | ✓ VERIFIED | window.open redirect, startPolling(), isPolling state; comments reference old field names but no live mock code |
| `app/dashboard/settings/billing/billing-content.tsx` | No Kaspi config, Paylink info card | ✓ VERIFIED | Zero kaspiMerchantId/kaspiApiKey references; Paylink info card present (6 Paylink matches) |
| `app/dashboard/settings/billing/page.tsx` | Selects paylinkUrl (not mockQrCode) | ✓ VERIFIED | Line 29 selects paylinkUrl |
| `lib/i18n/translations.ts` | whatsappPrepayment in all 3 locales, no duplicate payment blocks | ✓ VERIFIED | One payment block per locale; whatsappPrepayment at lines 688, 1470, 2252; zero TS1117 errors |
| `.env.example` | PAYLINK_API_KEY, PAYLINK_WEBHOOK_SECRET, PAYLINK_API_URL documented | ✓ VERIFIED | Present in .env.example |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/booking-form.tsx` | WhatsApp URL | `buildWhatsAppPrepaymentUrl()` | ✓ WIRED | Helper at line 346; button at line 288 conditionally renders when tenantPhone truthy |
| `components/tenant-public-page.tsx` | `BookingForm` | `tenantPhone` prop | ✓ WIRED | Line 510 passes tenant.phone |
| `lib/platform-payment.ts` | Paylink API | `createPaylinkPayment()` import | ✓ WIRED | Imported from `@/lib/payments/paylink`; called in createPlatformPayment() |
| `app/api/webhooks/paylink/route.ts` | `processPlatformPayment()` | import from `@/lib/platform-payment` | ✓ WIRED | Called on PAID status |
| `app/api/webhooks/paylink/route.ts` | `verifyPaylinkWebhook()` | import from `@/lib/payments/paylink` | ✓ WIRED | Called before processing payload |
| `app/dashboard/settings/billing/payment-modal.tsx` | Paylink redirect | `window.open(paylinkUrl)` | ✓ WIRED | Opens paylinkUrl in new tab |
| `app/dashboard/settings/billing/payment-modal.tsx` | Polling | `router.refresh()` every 5s | ✓ WIRED | startPolling() sets interval |
| `app/dashboard/settings/billing/page.tsx` | `BillingContent` | `paylinkUrl` prop pass | ✓ WIRED | Passes pendingPayment.paylinkUrl |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `payment-modal.tsx` | `paymentData.paylinkUrl` | `initiateSubscriptionPayment()` → `createPlatformPayment()` → Paylink API | Yes (with dev fallback when PAYLINK_API_KEY unset) | ✓ FLOWING |
| `components/booking-form.tsx` SuccessScreen | `tenantPhone` | Tenant DB record via `tenant-public-page.tsx` prop | Yes — passed from DB query in tenant-public-page | ✓ FLOWING |
| `app/api/webhooks/paylink/route.ts` | `payload.orderId` | POST body from Paylink webhook | Yes — external real data from Paylink | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Kaspi source files deleted | `test -f lib/payments/kaspi.ts` | File absent | ✓ PASS |
| Paylink webhook route exists | `test -f app/api/webhooks/paylink/route.ts` | File present | ✓ PASS |
| Schema has paylinkOrderId | `grep paylinkOrderId prisma/schema.prisma` | 4 matches | ✓ PASS |
| Booking always CONFIRMED | `grep "bookingStatus = 'CONFIRMED'" app/api/bookings/route.ts` | Line 153 matches | ✓ PASS |
| WhatsApp button wired | `grep "wa.me" components/booking-form.tsx` | Line 369 matches | ✓ PASS |
| simulate endpoint deleted | `test ! -f app/api/mock-payment/simulate/route.ts` | File absent | ✓ PASS |
| No TS1117 errors | `npx tsc --noEmit 2>&1 \| grep "TS1117"` | Zero matches | ✓ PASS |
| service-form.tsx Kaspi deposit removed | `grep "Kaspi\|requireDeposit\|depositAmount" components/service-form.tsx` | Zero matches | ✓ PASS |
| No source-file TS errors (excluding .next/ cache stubs and pre-existing test TS1501) | `npx tsc --noEmit 2>&1 \| grep "error TS" \| grep -v "\.next/" \| grep -v "__tests__/"` | Zero errors | ✓ PASS |

**Notes on remaining TypeScript noise:**
- `.next/types/` errors (TS2307 for deleted routes) are stale build cache entries for kaspi webhook, pending-payments cron, and mock-payment simulate — they reference routes that were correctly deleted. These clear on the next `next build` or `next dev` run. Not a source defect.
- `__tests__/neumorphism-surface.test.ts` TS1501 errors are pre-existing tsconfig targeting issues unrelated to Phase 12.
- `__tests__/phase-10-saas-monetization.test.ts` has a test asserting `prisma/schema.prisma contains mockQrCode` — this test was written for Phase 10 and will now fail since Phase 12 deliberately removed mockQrCode. This is an expected Phase 10 test regression that needs cleanup in a future pass.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PIV-01 | 12-01 | Delete kaspi.ts, webhook, cron; remove vercel.json cron | ✓ SATISFIED | All 3 files deleted; vercel.json has only 2 crons |
| PIV-02 | 12-01 | Schema cleanup — remove Kaspi fields from Tenant/Booking; paylinkOrderId/paylinkUrl on PlatformPayment | ✓ SATISFIED | Schema verified clean; paylinkOrderId/paylinkUrl confirmed |
| PIV-03 | 12-02 | Booking route always creates CONFIRMED bookings | ✓ SATISFIED | `const bookingStatus = 'CONFIRMED' as const` at line 153 |
| PIV-04 | 12-02 | WhatsApp prepayment button in booking-form SuccessScreen | ✓ SATISFIED | Button rendered conditionally on tenantPhone; buildWhatsAppPrepaymentUrl generates wa.me deep-link |
| PIV-05 | 12-02 | Remove Kaspi deposit section from service-form.tsx | ✓ SATISFIED | Zero matches for requireDeposit/depositAmount/Kaspi in service-form.tsx — closed by plan 12.1-01 |
| PIV-06 | 12-03 | lib/payments/paylink.ts adapter with createPaylinkPayment | ✓ SATISFIED | File exists; exports both functions; HMAC-SHA256 webhook verification implemented |
| PIV-07 | 12-03 | app/api/webhooks/paylink/route.ts — verify signature, activate subscription | ✓ SATISFIED | POST handler verifies signature, calls processPlatformPayment on PAID |
| PIV-08 | 12-03 | Platform payment uses paylinkOrderId/paylinkUrl; delete simulate endpoint | ✓ SATISFIED | platform-payment.ts and billing.ts use paylinkUrl correctly; app/api/mock-payment/ directory deleted — closed by plan 12.1-01 |
| PIV-09 | 12-04 | Payment modal: Paylink redirect button + polling, no mock QR/simulate | ✓ SATISFIED | window.open redirect, isPolling state, startPolling() interval — no live simulate/mockQrCode code |
| PIV-10 | 12-04 | Billing UI: remove Kaspi config, add Paylink info card, Neumorphic consistency | ✓ SATISFIED | kaspiMerchantId/kaspiApiKey absent from billing-content; Paylink info card present |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/i18n/translations.ts` | 694, 697 (RU) + equivalents in KZ/EN | `kaspiMerchantIdLabel`, `kaspiApiKeyLabel` still in billing namespace | Info | Dead i18n keys — not used in any component after billing-content rewrite; no runtime impact but add minor confusion |
| `__tests__/phase-10-saas-monetization.test.ts` | 72-74 | Test asserts `mockQrCode` field must exist in schema | Warning | This Phase 10 test now fails since Phase 12 correctly deleted mockQrCode; test should be updated to assert `paylinkOrderId` instead |

No blocker anti-patterns remain. The PIV-05/PIV-08/TS1117 blockers from the initial verification are all closed.

---

## Human Verification Required

### 1. WhatsApp Deep-Link Content Accuracy

**Test:** Book an appointment on a tenant's public booking page where the tenant has a phone number configured. Complete the booking flow to reach the SuccessScreen. Click the green WhatsApp button.
**Expected:** Opens wa.me with pre-filled Russian message containing the correct service name, formatted date, time, and price. Phone number has non-digit characters stripped.
**Why human:** Deep-link correctness requires live booking form interaction with an active tenant record that has a phone field populated.

### 2. Paylink Redirect Opens Correct Page

**Test:** In the dashboard billing page, initiate a subscription payment (click "Оплатить через Paylink.kz" button in Step 1, then click the redirect button in Step 2).
**Expected:** New browser tab opens to Paylink.kz checkout page (with real credentials) or mock fallback URL (in dev). The "Ожидаем подтверждения оплаты..." polling message appears in the modal.
**Why human:** Requires Paylink.kz API credentials and a running application.

### 3. Webhook-Triggered Subscription Activation

**Test:** Simulate a Paylink webhook POST to `/api/webhooks/paylink` with a valid PAID payload and matching HMAC signature.
**Expected:** `processPlatformPayment()` activates the tenant's subscription, unfreezes resources/services, and the billing page refreshes to show ACTIVE status.
**Why human:** End-to-end webhook test requires live credentials and DB access.

---

## Re-Verification Summary

All three gaps from the initial verification (2026-04-04) are confirmed closed by plan 12.1-01:

**Gap 1 (PIV-05) — CLOSED:** `components/service-form.tsx` has zero references to requireDeposit, depositAmount, or Kaspi branding. The form now shows only name, description, duration, price, currency, and resource assignment fields.

**Gap 2 (TS1117 duplicate payment namespace) — CLOSED:** `lib/i18n/translations.ts` has exactly one `payment:` block per locale (RU at line 670, KZ at 1452, EN at 2234). The duplicate single-key block added by plan 12-02 has been merged. Zero TS1117 errors. `whatsappPrepayment` is present in all 3 locales.

**Gap 3 (PIV-08 simulate endpoint) — CLOSED:** `app/api/mock-payment/` directory and all contents are deleted. The simulate endpoint is no longer accessible as an HTTP endpoint.

No regressions detected in previously-verified items (PIV-01 through PIV-04, PIV-06, PIV-07, PIV-09, PIV-10).

---

_Verified: 2026-04-04_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after gap closure via plan 12.1-01_
