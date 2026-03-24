---
phase: 3
slug: subscription-lifecycle-and-automated-resource-freezing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest __tests__/subscription-lifecycle-surface.test.ts --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/subscription-lifecycle-surface.test.ts --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | schema isFrozen Resource | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "schema"` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | schema isFrozen Service | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "schema"` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | schema CANCELED enum | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "schema"` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | cron route exists | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "cron"` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | cron CRON_SECRET auth | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "cron"` | ❌ W0 | ⬜ pending |
| 3-02-03 | 02 | 2 | cron expiry logic | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "cron"` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 3 | resources isFrozen badge | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "frozen-ui"` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 3 | services isFrozen badge | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "frozen-ui"` | ❌ W0 | ⬜ pending |
| 3-03-03 | 03 | 3 | staff planStatus prop | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "frozen-ui"` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 4 | billing subscriptionExpiresAt | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "billing"` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 4 | admin activateSubscription action | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "admin"` | ❌ W0 | ⬜ pending |
| 3-04-03 | 04 | 4 | admin activate subscription UI | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "admin"` | ❌ W0 | ⬜ pending |
| 3-04-04 | 04 | 4 | neumorphism classes on new elements | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "neumorphism"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/subscription-lifecycle-surface.test.ts` — static file assertions covering schema, cron route, frozen UI badges, billing expiry display, admin activation action, and neumorphism classes (using `safeRead` pattern from `god-mode-surface.test.ts`)

*Pattern reference: `__tests__/god-mode-surface.test.ts` — established safeRead pattern in this project*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cron actually freezes expired tenants end-to-end | Module 2 | Requires real DB + time manipulation | Seed a tenant with `subscriptionExpiresAt` in the past, POST to `/api/cron/subscriptions` with `Authorization: Bearer {CRON_SECRET}`, verify `isFrozen=true` on resources/services and `planStatus=EXPIRED` on tenant |
| Frozen badge renders correctly in browser | Module 3 | Visual assertion | Load tenant dashboard with a frozen resource/service, confirm amber "Заморожен" badge displays and Edit/Delete buttons are disabled |
| Billing page shows expiry date in Russian locale | Module 4 | i18n/locale formatting | Load billing page for PRO tenant, confirm "Подписка активна до:" with correct date format |
| Admin activation flow works end-to-end | Module 4 | Multi-step form interaction | Go to admin tenant page, use "Activate Subscription" block to set new expiry date, confirm `planStatus=ACTIVE` and resources unfrozen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
