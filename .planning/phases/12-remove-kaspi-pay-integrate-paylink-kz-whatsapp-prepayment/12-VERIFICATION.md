---
phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment
verified: 2026-04-04T00:00:00Z
status: gaps_found
score: 8/10 requirements verified
gaps:
  - truth: "Kaspi deposit UI is fully removed from service-form.tsx"
    status: failed
    reason: "PIV-05 not completed — components/service-form.tsx still contains the full 'Kaspi deposit' toggle, depositAmount input, and the label 'Клиент оплачивает депозит через Kaspi перед подтверждением записи'"
    artifacts:
      - path: "components/service-form.tsx"
        issue: "Lines 60, 85-135, 371-410: requireDeposit state, depositAmount field, Zod schema fields, and Kaspi deposit UI section all still present"
    missing:
      - "Remove requireDeposit toggle, depositAmount input, and entire '/* Deposit settings */' section from service-form.tsx"
      - "Remove requireDeposit and depositAmount from Zod schema in service-form.tsx"
      - "Remove requireDeposit state initialization and form default values"

  - truth: "i18n translations.ts has no duplicate payment namespace (TypeScript compilation is clean)"
    status: failed
    reason: "Plan 12-02 added a single-key 'payment' block at lines 606/1391/2176 with only whatsappPrepayment, but the pre-existing full 'payment' block at lines 673/1458/2243 still exists — resulting in duplicate object key TS1117 errors in all 3 locales"
    artifacts:
      - path: "lib/i18n/translations.ts"
        issue: "Lines 606 and 673 (RU), 1391 and 1458 (KZ), 2176 and 2243 (EN) — two 'payment:' keys in the same locale object. TypeScript reports TS1117 for the second occurrence in each locale. Runtime behavior: second block wins, so whatsappPrepayment IS accessible but only because it appears in BOTH blocks."
    missing:
      - "Merge the single-key payment block added in 12-02 (line 606/1391/2176) into the existing full payment block (line 673/1458/2243)"
      - "Remove the duplicate single-key payment block after merging"
      - "The merged block should contain whatsappPrepayment plus all existing deposit/Kaspi keys that are still used in booking-form.tsx"

  - truth: "app/api/mock-payment/simulate/route.ts is deleted"
    status: partial
    reason: "PIV-08 requires deletion of the simulate endpoint, but the file still exists at app/api/mock-payment/simulate/route.ts. It is not referenced from any UI component (simulatePaymentAction removed from billing.ts and payment-modal.tsx), but the route file itself was not deleted. Phase 12-03 SUMMARY notes it as a task but the file remains."
    artifacts:
      - path: "app/api/mock-payment/simulate/route.ts"
        issue: "File exists and is a functional POST handler. Not imported/called from UI, but accessible as an HTTP endpoint."
    missing:
      - "Delete app/api/mock-payment/simulate/route.ts and its parent directory app/api/mock-payment/ if empty"
      - "Run next build or next dev to regenerate .next/types (which will also clear stale .next/types entries for kaspi webhook and pending-payments cron)"
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
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Kaspi source files are deleted (kaspi.ts, webhook, cron) | ✓ VERIFIED | All 3 files absent; verified with `test -f` checks |
| 2 | Prisma schema is clean — no Kaspi/mock fields, paylinkOrderId/paylinkUrl present | ✓ VERIFIED | `prisma/schema.prisma` shows paylinkOrderId/paylinkUrl on PlatformPayment; no kaspiMerchantId/kaspiApiKey/paymentInvoiceId/paymentExpiresAt/mockQrCode/mockPaylink found |
| 3 | Booking route always creates CONFIRMED bookings, no deposit branch | ✓ VERIFIED | `app/api/bookings/route.ts` line 153: `const bookingStatus = 'CONFIRMED' as const`; zero Kaspi/requireDeposit/PENDING references |
| 4 | WhatsApp prepayment button is in booking SuccessScreen | ✓ VERIFIED | `components/booking-form.tsx` lines 285-308: WhatsApp button renders when `tenantPhone` is truthy; `buildWhatsAppPrepaymentUrl()` helper present at line 346 |
| 5 | tenantPhone prop wired from tenant-public-page to BookingForm | ✓ VERIFIED | `components/tenant-public-page.tsx` line 510 passes `tenantPhone`; `components/booking-form.tsx` line 43 declares prop |
| 6 | Kaspi deposit UI removed from service-form.tsx | ✗ FAILED | `components/service-form.tsx` still has requireDeposit toggle, depositAmount input, and the text "Клиент оплачивает депозит через Kaspi" (line 371) |
| 7 | Paylink.kz adapter (lib/payments/paylink.ts) exists and is wired | ✓ VERIFIED | File exists; exports `createPaylinkPayment()` and `verifyPaylinkWebhook()`; imported by `lib/platform-payment.ts` and `app/api/webhooks/paylink/route.ts` |
| 8 | Paylink webhook handler exists and activates subscriptions | ✓ VERIFIED | `app/api/webhooks/paylink/route.ts` verifies signature via `verifyPaylinkWebhook()` and calls `processPlatformPayment()` on PAID status |
| 9 | Platform payment flow uses paylinkUrl (not mock QR) | ✓ VERIFIED | `lib/platform-payment.ts` calls `createPaylinkPayment()`, stores `paylinkOrderId`/`paylinkUrl`; no mockQrCode/generateMockQrSvg; billing.ts returns `paylinkUrl`; payment-modal.tsx uses `paylinkUrl` with `window.open()` redirect and polling |
| 10 | i18n translations.ts has no duplicate payment namespace | ✗ FAILED | Duplicate `payment:` keys in all 3 locales (RU: lines 606 and 673; KZ: 1391 and 1458; EN: 2176 and 2243) — TypeScript reports TS1117 errors. Caused by Plan 12-02 adding a new single-key block instead of merging into the existing block. |
| 11 | app/api/mock-payment/simulate/route.ts is deleted | ✗ PARTIAL | File still exists. Not called from any UI (simulatePaymentAction removed from billing.ts and payment-modal.tsx), but the HTTP endpoint remains accessible |

**Score:** 8/10 requirements verified (PIV-05, PIV-08 partial, i18n TS error)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/payments/kaspi.ts` | DELETED | ✓ VERIFIED | File absent |
| `app/api/webhooks/kaspi/route.ts` | DELETED | ✓ VERIFIED | File absent |
| `app/api/cron/pending-payments/route.ts` | DELETED | ✓ VERIFIED | File absent |
| `prisma/schema.prisma` | Clean schema, paylinkOrderId/paylinkUrl on PlatformPayment | ✓ VERIFIED | All Kaspi fields removed; paylink fields present |
| `vercel.json` | No pending-payments cron | ✓ VERIFIED | Only 2 crons remain (reminders, subscriptions) |
| `app/api/bookings/route.ts` | Always CONFIRMED, no deposit branch | ✓ VERIFIED | Line 153 hardcodes CONFIRMED |
| `components/booking-form.tsx` | WhatsApp button in SuccessScreen, tenantPhone prop | ✓ VERIFIED | Button present, wired, buildWhatsAppPrepaymentUrl helper implemented |
| `components/tenant-public-page.tsx` | Passes tenantPhone to BookingForm | ✓ VERIFIED | Line 510 |
| `components/service-form.tsx` | Kaspi deposit section removed | ✗ STUB | Full deposit UI still present (requireDeposit toggle, depositAmount input, Kaspi label) |
| `lib/payments/paylink.ts` | Paylink adapter with createPaylinkPayment + verifyPaylinkWebhook | ✓ VERIFIED | Both functions present with HMAC-SHA256 and dev fallback |
| `app/api/webhooks/paylink/route.ts` | Paylink webhook POST handler | ✓ VERIFIED | Verifies signature, processes PAID events |
| `lib/platform-payment.ts` | Uses Paylink redirect, no mock QR | ✓ VERIFIED | createPlatformPayment calls Paylink API; processPlatformPayment activates subscription |
| `app/api/mock-payment/simulate/route.ts` | DELETED | ✗ MISSING (not deleted) | File still exists at this path |
| `lib/actions/billing.ts` | Returns paylinkUrl, no simulatePaymentAction | ✓ VERIFIED | paylinkUrl returned; simulatePaymentAction absent |
| `app/dashboard/settings/billing/payment-modal.tsx` | Paylink redirect button + polling, no mock QR | ✓ VERIFIED | window.open redirect, startPolling(), isPolling state present; no simulatePayment references |
| `app/dashboard/settings/billing/billing-content.tsx` | No Kaspi config, Paylink info card | ✓ VERIFIED | No kaspiMerchantId/kaspiApiKey; Paylink info card at line 214 |
| `app/dashboard/settings/billing/page.tsx` | Selects paylinkUrl (not mockQrCode) | ✓ VERIFIED | Line 29 selects paylinkUrl |
| `lib/i18n/translations.ts` | whatsappPrepayment in all 3 locales, no duplicate payment blocks | ✗ STUB | whatsappPrepayment present in all 3 locales BUT duplicate `payment:` keys cause TS1117 errors |
| `.env.example` | PAYLINK_API_KEY, PAYLINK_WEBHOOK_SECRET, PAYLINK_API_URL documented | ✓ VERIFIED | Lines 19-21 present |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/booking-form.tsx` | WhatsApp URL | `buildWhatsAppPrepaymentUrl()` | ✓ WIRED | Helper at line 346; button at line 288 conditionally renders when tenantPhone truthy |
| `components/tenant-public-page.tsx` | `BookingForm` | `tenantPhone` prop | ✓ WIRED | Line 510 passes tenant.phone |
| `lib/platform-payment.ts` | Paylink API | `createPaylinkPayment()` import | ✓ WIRED | Imported from `@/lib/payments/paylink`; called in createPlatformPayment() |
| `app/api/webhooks/paylink/route.ts` | `processPlatformPayment()` | import from `@/lib/platform-payment` | ✓ WIRED | Called on PAID status |
| `app/api/webhooks/paylink/route.ts` | `verifyPaylinkWebhook()` | import from `@/lib/payments/paylink` | ✓ WIRED | Called before processing payload |
| `app/dashboard/settings/billing/payment-modal.tsx` | Paylink redirect | `window.open(paylinkUrl)` | ✓ WIRED | Line 174 opens paylinkUrl in new tab |
| `app/dashboard/settings/billing/payment-modal.tsx` | Polling | `router.refresh()` every 5s | ✓ WIRED | startPolling() sets interval at line 86 |
| `app/dashboard/settings/billing/page.tsx` | `BillingContent` | `paylinkUrl` prop pass | ✓ WIRED | Line 56 passes pendingPayment.paylinkUrl |

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
| Schema has paylinkOrderId | `grep paylinkOrderId prisma/schema.prisma` | 2 matches | ✓ PASS |
| Booking always CONFIRMED | `grep "bookingStatus = 'CONFIRMED'" app/api/bookings/route.ts` | Line 153 matches | ✓ PASS |
| WhatsApp button wired | `grep "wa.me" components/booking-form.tsx` | Line 369 matches | ✓ PASS |
| simulate endpoint deleted | `test ! -f app/api/mock-payment/simulate/route.ts` | File EXISTS | ✗ FAIL |
| No duplicate payment namespace TS errors | `npx tsc --noEmit 2>&1 \| grep "TS1117"` | 3 TS1117 errors in translations.ts | ✗ FAIL |
| service-form.tsx Kaspi deposit removed | `grep "Kaspi" components/service-form.tsx` | 1 match at line 371 | ✗ FAIL |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PIV-01 | 12-01 | Delete kaspi.ts, webhook, cron; remove vercel.json cron | ✓ SATISFIED | All 3 files deleted; vercel.json has only 2 crons |
| PIV-02 | 12-01 | Schema cleanup — remove Kaspi fields from Tenant/Booking; paylinkOrderId/paylinkUrl on PlatformPayment | ✓ SATISFIED | Schema verified clean; paylinkOrderId/paylinkUrl confirmed |
| PIV-03 | 12-02 | Booking route always creates CONFIRMED bookings | ✓ SATISFIED | `const bookingStatus = 'CONFIRMED' as const` at line 153 |
| PIV-04 | 12-02 | WhatsApp prepayment button in booking-form SuccessScreen | ✓ SATISFIED | Button rendered conditionally on tenantPhone; buildWhatsAppPrepaymentUrl generates wa.me deep-link |
| PIV-05 | 12-02 | Remove Kaspi deposit section from service-form.tsx | ✗ BLOCKED | requireDeposit toggle, depositAmount field, and "Kaspi" label still in service-form.tsx. Plan 12-02 SUMMARY notes this was a "no-op because route already clean" — but the service-form.tsx UI was NOT cleaned. |
| PIV-06 | 12-03 | lib/payments/paylink.ts adapter with createPaylinkPayment | ✓ SATISFIED | File exists; exports both functions; HMAC-SHA256 webhook verification implemented |
| PIV-07 | 12-03 | app/api/webhooks/paylink/route.ts — verify signature, activate subscription | ✓ SATISFIED | POST handler verifies signature, calls processPlatformPayment on PAID |
| PIV-08 | 12-03 | Platform payment uses paylinkOrderId/paylinkUrl; delete simulate endpoint | ✗ PARTIAL | platform-payment.ts and billing.ts use paylinkUrl correctly; BUT app/api/mock-payment/simulate/route.ts was NOT deleted |
| PIV-09 | 12-04 | Payment modal: Paylink redirect button + polling, no mock QR/simulate | ✓ SATISFIED | window.open redirect, isPolling state, startPolling() interval — no simulate/mockQrCode references |
| PIV-10 | 12-04 | Billing UI: remove Kaspi config, add Paylink info card, Neumorphic consistency | ✓ SATISFIED | kaspiMerchantId/kaspiApiKey removed from billing-content; Paylink info card present |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/service-form.tsx` | 371 | `"Клиент оплачивает депозит через Kaspi перед подтверждением записи"` | Blocker | Kaspi branding visible to users in service configuration UI; contradicts phase goal |
| `components/service-form.tsx` | 85-135 | Full requireDeposit/depositAmount logic still in form submit handler | Blocker | Deposit data still sent to backend on service save; requireDeposit kept in Prisma Service model so DB writes still work — but UI is misleading |
| `lib/i18n/translations.ts` | 673, 1458, 2243 | Duplicate `payment:` object key in all 3 locale objects | Blocker | TypeScript TS1117 errors; in JavaScript the second definition silently overrides the first — current behavior is functional only because whatsappPrepayment appears in BOTH blocks |
| `app/api/mock-payment/simulate/route.ts` | entire file | Dead endpoint — not called from UI but still exists and is routable | Warning | Accessible HTTP POST endpoint with no protection beyond optional MOCK_PAYMENT_SECRET; could be exploited to activate subscriptions in non-production environments |
| `lib/i18n/translations.ts` | 694, 697 | `payWithKaspi`, `simulatePayment` still in billing namespace (RU/KZ/EN) | Info | Dead i18n keys — not used in any component after payment-modal rewrite; no runtime impact but create confusion |

---

## Human Verification Required

### 1. WhatsApp Deep-Link Content Accuracy

**Test:** Book an appointment on a tenant's public booking page where the tenant has a phone number configured. Complete the booking flow to reach the SuccessScreen. Click the green WhatsApp button.
**Expected:** Opens wa.me with pre-filled Russian message containing the correct service name, formatted date, time, and price. Phone number has non-digit characters stripped.
**Why human:** Deep-link correctness requires live booking form interaction with an active tenant record.

### 2. Paylink Redirect Opens Correct Page

**Test:** In the dashboard billing page, initiate a subscription payment (click "Оплатить через Paylink.kz" button in Step 1, then click the redirect button in Step 2).
**Expected:** New browser tab opens to Paylink.kz checkout page (with real credentials) or mock fallback URL (in dev). The "Ожидаем подтверждения оплаты..." polling message appears in the modal.
**Why human:** Requires Paylink.kz API credentials and a running application.

### 3. Webhook-Triggered Subscription Activation

**Test:** Simulate a Paylink webhook POST to `/api/webhooks/paylink` with a valid PAID payload and matching HMAC signature.
**Expected:** `processPlatformPayment()` activates the tenant's subscription, unfreezes resources/services, and the billing page refreshes to show ACTIVE status.
**Why human:** End-to-end webhook test requires live credentials and DB access.

---

## Gaps Summary

Three gaps block full goal achievement:

**Gap 1 — PIV-05 not completed (service-form.tsx):** The plan 12-02 SUMMARY incorrectly noted the service-form deposit removal as a "no-op (already clean in this branch)." This was inaccurate — the full Kaspi deposit section is still present in `components/service-form.tsx` including the toggle, amount input, Kaspi branding text, and Zod schema entries. This is user-visible: tenant owners configuring services still see a "Kaspi deposit" option that no longer functions.

**Gap 2 — Duplicate payment namespace in translations.ts:** Plan 12-02 added a new single-key `payment: { whatsappPrepayment: '...' }` block instead of merging into the existing `payment:` block that was already defined later in each locale. This creates TypeScript TS1117 (duplicate object property) errors in all 3 locales. The code functions at runtime because JavaScript uses the second definition and both blocks happen to contain whatsappPrepayment, but the TS errors prevent a clean compile and signal a structural defect.

**Gap 3 — simulate endpoint not deleted (PIV-08 partial):** `app/api/mock-payment/simulate/route.ts` was not deleted despite PIV-08 requiring it. Plan 12-03 listed this as Task 5. The endpoint is not reachable from the UI (simulatePaymentAction removed from billing.ts), but it remains a live HTTP endpoint.

The gaps are independent — all three can be fixed without interdependency.

---

_Verified: 2026-04-04_
_Verifier: Claude (gsd-verifier)_
