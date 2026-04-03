---
phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment
plan: "03"
subsystem: payments
tags: [paylink, webhook, hmac, saas, subscriptions, prisma]

# Dependency graph
requires:
  - phase: 12-01
    provides: Kaspi infrastructure removed, PlatformPayment schema with paylinkOrderId/paylinkUrl fields

provides:
  - Paylink.kz HTTP adapter with HMAC-SHA256 webhook signature verification
  - /api/webhooks/paylink handler that activates subscriptions on PAID events
  - lib/platform-payment.ts rewritten to use redirect-based Paylink flow (no mock QR)
  - billing.ts initiateSubscriptionPayment returns paylinkUrl (not mockQrCode)
  - simulatePaymentAction removed from billing.ts
  - PlatformPayment schema model with paylinkOrderId/paylinkUrl, PaymentStatus enum, SubscriptionPlan model

affects: [12-04, billing-content, payment-modal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Paylink adapter uses env-based fallback: PAYLINK_API_KEY absent → mock URL for local dev"
    - "Webhook handler reads raw body before JSON parse for HMAC signature verification"
    - "processPlatformPayment uses updateMany with WHERE status=PENDING for idempotent race-safe payment processing"

key-files:
  created:
    - lib/payments/paylink.ts
    - lib/platform-payment.ts
    - app/api/webhooks/paylink/route.ts
  modified:
    - lib/actions/billing.ts
    - prisma/schema.prisma
    - .env.example

key-decisions:
  - "createPaylinkPayment falls back to mock URL when PAYLINK_API_KEY absent — enables local dev without real credentials"
  - "Webhook reads request.text() before JSON.parse to enable HMAC-SHA256 signature over raw body"
  - "processPlatformPayment uses updateMany WHERE status=PENDING — only one concurrent caller wins, rest get alreadyProcessed=true"
  - "PlatformPayment schema added directly to this worktree with paylinkOrderId/paylinkUrl (clean version, no mockQrCode)"
  - "isFrozen added to Resource and Service models as prerequisite for subscription unfreeze on payment"

requirements-completed: [PIV-06, PIV-07, PIV-08]

# Metrics
duration: 25min
completed: 2026-04-04
---

# Phase 12 Plan 03: Paylink.kz adapter + webhook handler + platform-payment.ts rewrite Summary

**Paylink.kz redirect-based payment integration: adapter with HMAC-SHA256 verification, /api/webhooks/paylink subscription activator, platform-payment.ts rewritten to replace mock QR flow**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-04T00:00:00Z
- **Completed:** 2026-04-04T00:25:00Z
- **Tasks:** 7 (all complete)
- **Files modified:** 7

## Accomplishments

- Created `lib/payments/paylink.ts` adapter — calls Paylink.kz API to generate payment URLs, verifies webhook signatures with HMAC-SHA256
- Created `app/api/webhooks/paylink/route.ts` — validates Paylink webhook, activates subscription on PAID status
- Rewrote `lib/platform-payment.ts` to use real Paylink redirect flow: creates DB record, gets payment URL, no mock QR generation
- Updated `lib/actions/billing.ts` `initiateSubscriptionPayment` to return `paylinkUrl` instead of `mockQrCode`; `simulatePaymentAction` not present (already removed in plan scope)
- Added `PlatformPayment` model, `PaymentStatus` enum, `SubscriptionPlan` model to schema with `paylinkOrderId`/`paylinkUrl` fields (clean version)
- Documented `PAYLINK_API_KEY`, `PAYLINK_WEBHOOK_SECRET`, `PAYLINK_API_URL` in `.env.example`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/payments/paylink.ts** - `4af7079` (feat)
2. **Tasks 5+6: Schema — PlatformPayment, PaymentStatus, SubscriptionPlan, isFrozen** - `209d61e` (feat)
3. **Task 2: Create lib/platform-payment.ts with Paylink flow** - `4e8d22a` (feat)
4. **Task 3: Update billing.ts — paylinkUrl, no simulatePaymentAction** - `288bd40` (feat)
5. **Task 4: Create /api/webhooks/paylink/route.ts** - `59d6fcd` (feat)
6. **Task 7: .env.example Paylink vars** - `85a78e3` (chore)

## Files Created/Modified

- `lib/payments/paylink.ts` — Paylink.kz API adapter: createPaylinkPayment() + verifyPaylinkWebhook() with HMAC-SHA256
- `lib/platform-payment.ts` — createPlatformPayment() using Paylink redirect, processPlatformPayment() for idempotent subscription activation
- `app/api/webhooks/paylink/route.ts` — POST handler: verify signature → process PAID events → activate subscription
- `lib/actions/billing.ts` — initiateSubscriptionPayment() with paylinkUrl return, requestEnterpriseInquiry(), renewSubscription() added
- `prisma/schema.prisma` — PlatformPayment, PaymentStatus enum, SubscriptionPlan, isFrozen on Resource/Service, platformPayments relation on Tenant
- `.env.example` — PAYLINK_API_KEY, PAYLINK_WEBHOOK_SECRET, PAYLINK_API_URL documented

## Decisions Made

- **Dev fallback:** When `PAYLINK_API_KEY` is unset, `createPaylinkPayment()` returns a mock URL (`${backUrl}?mock_payment=1&orderId=${orderId}`) instead of throwing — enables local development without real credentials
- **Raw body for HMAC:** `verifyPaylinkWebhook` takes `rawBody: string` and computes HMAC over it directly; the webhook handler calls `request.text()` before `JSON.parse()` to preserve the exact bytes for signature validation
- **Schema in worktree:** This worktree branched from before Phase 12, so `PlatformPayment` model was absent. Added it directly with the clean `paylinkOrderId`/`paylinkUrl` schema (skipping the `mockQrCode` → `paylinkUrl` migration that main branch does in 12-01)
- **isFrozen prerequisite:** `processPlatformPayment()` unfreezes resources/services on payment; `isFrozen` added to both models as a blocking prerequisite (Deviation Rule 3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added PlatformPayment schema model (missing prerequisite from Plan 12-01)**
- **Found during:** Task 2 (platform-payment.ts creation)
- **Issue:** This worktree branched from before Phase 12; schema lacked `PlatformPayment`, `PaymentStatus`, `SubscriptionPlan`, and `isFrozen` fields — all required by Plan 12-03's files
- **Fix:** Added all required schema elements directly in clean form (paylinkOrderId/paylinkUrl, no mock fields)
- **Files modified:** prisma/schema.prisma
- **Verification:** `npx prisma validate` confirms schema syntax valid; `npx tsc --noEmit` passes cleanly
- **Committed in:** 209d61e

**2. [Rule 3 - Blocking] Added requestEnterpriseInquiry and renewSubscription to billing.ts**
- **Found during:** Task 3 (billing.ts update)
- **Issue:** These functions from Phase 10 were absent in this worktree — needed for complete billing.ts
- **Fix:** Added both functions matching the main branch implementation
- **Files modified:** lib/actions/billing.ts
- **Committed in:** 288bd40

---

**Total deviations:** 2 auto-fixed (2 blocking prerequisites)
**Impact on plan:** Both auto-fixes necessary due to worktree branching before Phase 12 prerequisites. No scope creep.

## Issues Encountered

- Worktree was created from commit b93f408 (before all Phase 12 work), so multiple prerequisites from Plans 12-01 and 10-x were missing. All resolved via Deviation Rule 3 (blocking issues fixed inline).

## User Setup Required

**External service requires configuration before payment flow works in production:**

1. Create merchant account at [paylink.kz](https://paylink.kz)
2. Get API key from merchant dashboard → set `PAYLINK_API_KEY`
3. Set up webhook endpoint in Paylink dashboard: `https://omni-book.site/api/webhooks/paylink`
4. Copy webhook signing secret → set `PAYLINK_WEBHOOK_SECRET`
5. Set `PAYLINK_API_URL=https://api.paylink.kz` (or confirm exact URL from their docs)

**Note:** Header name `x-paylink-signature` and API field names (`order_id`, `payment_url`) are best-guess from standard payment gateway patterns — verify against actual Paylink.kz documentation before deployment.

## Next Phase Readiness

- Paylink adapter and webhook handler complete — ready for Plan 12-04 (UI wiring: billing-content.tsx and payment-modal.tsx updates)
- `initiateSubscriptionPayment()` now returns `paylinkUrl` — Plan 12-04 should redirect users to this URL instead of showing mock QR
- `simulatePaymentAction` is gone — Plan 12-04 must remove any UI references to it

---
*Phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment*
*Completed: 2026-04-04*
