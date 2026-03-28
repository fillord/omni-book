---
phase: 6
slug: implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern=manage --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=manage --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | TOK-01 | static | `npx jest --testPathPattern=manage-token --no-coverage` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | TOK-01 | unit | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 6-02-01 | 02 | 1 | TOK-02 | e2e-manual | n/a — public page render | n/a | ⬜ pending |
| 6-02-02 | 02 | 1 | TOK-03 | unit | `npx jest --testPathPattern=manage-token --no-coverage` | ❌ W0 | ⬜ pending |
| 6-02-03 | 02 | 1 | TOK-04 | unit | `npx jest --testPathPattern=manage-cancel --no-coverage` | ❌ W0 | ⬜ pending |
| 6-03-01 | 03 | 2 | TOK-05 | unit | `npx jest --testPathPattern=manage-reschedule --no-coverage` | ❌ W0 | ⬜ pending |
| 6-03-02 | 03 | 2 | TOK-06 | unit | `npx jest --testPathPattern=manage-reschedule --no-coverage` | ❌ W0 | ⬜ pending |
| 6-04-01 | 04 | 3 | TOK-07 | static | `npx jest --testPathPattern=confirmation-links --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/manage-token.test.ts` — stubs for TOK-01 (manageToken field present on Booking schema), TOK-03 (4-hour rule logic)
- [ ] `__tests__/manage-cancel.test.ts` — stubs for TOK-04 (cancel API sets CANCELLED status)
- [ ] `__tests__/manage-reschedule.test.ts` — stubs for TOK-05/TOK-06 (reschedule API updates booking, Telegram notification sent)
- [ ] `__tests__/confirmation-links.test.ts` — stubs for TOK-07 (email/Telegram templates contain manageToken link)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public page renders correctly at /manage/[token] | TOK-02 | UI rendering requires browser | Open browser, navigate to /manage/[valid-token], verify Neumorphic UI renders |
| Disabled state shows correct Russian text + phone | TOK-03 | UI state near 4-hour boundary | Create booking <4h ahead, visit manage link, verify disabled buttons + message |
| RescheduleCalendar shows only available slots | TOK-05 | Calendar UI interaction | Click Reschedule, verify only available slots shown for correct service/resource |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
