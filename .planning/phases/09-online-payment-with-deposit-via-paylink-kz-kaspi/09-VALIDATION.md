---
phase: 9
slug: online-payment-with-deposit-via-paylink-kz-kaspi
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (existing `__tests__/` directory) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern="09-"` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="09-"`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 0 | PAY-01..08 | static | `npx jest --testPathPattern="09-01"` | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 1 | PAY-01 | unit | `npx jest --testPathPattern="09-02"` | ❌ W0 | ⬜ pending |
| 9-03-01 | 03 | 1 | PAY-02,PAY-03 | unit | `npx jest --testPathPattern="09-03"` | ❌ W0 | ⬜ pending |
| 9-04-01 | 04 | 2 | PAY-05 | unit | `npx jest --testPathPattern="09-04"` | ❌ W0 | ⬜ pending |
| 9-05-01 | 05 | 2 | PAY-06 | unit | `npx jest --testPathPattern="09-05"` | ❌ W0 | ⬜ pending |
| 9-06-01 | 06 | 3 | PAY-04,PAY-08 | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/09-payment.test.ts` — static assertions for PAY-01 through PAY-08
- [ ] Verifies file existence: `lib/payments/kaspi.ts`, `app/api/webhooks/kaspi/route.ts`, `app/api/cron/pending-payments/route.ts`
- [ ] Verifies schema fields: `requireDeposit`, `depositAmount`, `kaspiMerchantId`, `kaspiApiKey` on Tenant; `paymentInvoiceId`, `paymentExpiresAt` on Booking

*Existing test infrastructure (jest) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Waiting-for-payment screen renders with countdown | PAY-04 | UI component with timer | Book a service with deposit enabled; verify "waiting" Neumorphic screen appears with 10-min countdown |
| Neumorphism design adherence | PAY-08 | Visual inspection | All new UI uses `var(--neu-bg)`, `.neu-raised`, `.neu-inset` — verified by eye |
| Kaspi invoice push mock returns correct shape | PAY-02 | Mock only in Phase 9 | Confirm mock adapter returns `{ invoiceId, expiresAt }` without errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
