---
phase: 10
slug: saas-monetization-enterprise-tier-platform-payments
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | `jest.config.ts` (exists) |
| **Quick run command** | `npx jest --testPathPattern="10-" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="10-" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | MON-01 | unit | `npx jest --testPathPattern="10-" --no-coverage` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 0 | MON-06 | unit | `npx jest --testPathPattern="10-" --no-coverage` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | MON-02 | unit | `npx jest --testPathPattern="10-" --no-coverage` | ✅ | ⬜ pending |
| 10-02-02 | 02 | 1 | MON-07 | unit | `npx jest --testPathPattern="10-" --no-coverage` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 2 | MON-03 | unit | `npx jest --testPathPattern="10-" --no-coverage` | ✅ | ⬜ pending |
| 10-03-02 | 03 | 2 | MON-08 | unit + manual | `npx jest --testPathPattern="10-" --no-coverage` | ✅ | ⬜ pending |
| 10-04-01 | 04 | 3 | MON-04, MON-05 | manual | Visual browser check | N/A | ⬜ pending |
| 10-04-02 | 04 | 3 | MON-09 | unit | `npx jest --testPathPattern="10-" --no-coverage` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/phase-10-saas-monetization.test.ts` — stubs for MON-01 through MON-09
  - Schema assertions: `SubscriptionPlan` model exists, `PlatformPayment` model exists, `PaymentStatus` enum exists
  - Static: `PLAN_DEFAULT_MAX_RESOURCES` does NOT appear in any TypeScript source file
  - Static: hardcoded `10000` price does NOT appear in `billing-content.tsx`
  - Static: hardcoded card number `4400430389830552` does NOT appear in `billing-content.tsx`
  - Unit stub: `createPlatformPayment` is exported from `lib/platform-payment.ts`
  - Unit stub: `processPlatformPayment` is exported from `lib/platform-payment.ts`
  - Unit stub: `updateSubscriptionPlan` is exported from `lib/actions/admin-plans.ts`
  - Unit stub: `initiateSubscriptionPayment` is exported from `lib/actions/billing.ts`
  - Route existence: `app/api/mock-payment/simulate/route.ts` exists
  - Route existence: `app/admin/plans/page.tsx` exists

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Enterprise slider renders and calculates price in real-time | MON-04 | Visual/interactive component | Open billing page, look for Enterprise section, move slider, verify price updates without page reload |
| Mock QR code displayed in waiting modal | MON-08 | Visual assertion | Click "Оплатить через Kaspi" on billing page, verify Step 2 shows QR placeholder image |
| "Симулировать оплату" button hidden in production | MON-08 | Env-gated UI | Set `NEXT_PUBLIC_MOCK_PAYMENTS=false`, verify button absent; set to `true`, verify present |
| Admin plan editor inline save works | MON-03 | UI interaction | Go to `/admin/plans`, change PRO price, save, reload page, verify new price persists |
| MRR analytics page reflects DB price after update | MON-02 | Integration visual | Update PRO price in admin plans editor, go to `/admin/analytics`, verify MRR chart reflects updated price |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
