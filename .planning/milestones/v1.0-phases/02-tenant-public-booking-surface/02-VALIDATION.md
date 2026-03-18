---
phase: 2
slug: tenant-public-booking-surface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest __tests__/booking-surface.test.ts --no-coverage 2>&1 \| tail -20` |
| **Full suite command** | `npx jest __tests__/booking-surface.test.ts --no-coverage 2>&1 \| tail -30` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/booking-surface.test.ts --no-coverage 2>&1 | tail -20`
- **After every plan wave:** Run `npx jest __tests__/booking-surface.test.ts --no-coverage 2>&1 | tail -30`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | BOOK-01–05 | unit | `npx jest __tests__/booking-surface.test.ts --no-coverage 2>&1 \| tail -20` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | BOOK-01, BOOK-04, BOOK-05 | unit | `npx jest __tests__/booking-surface.test.ts --no-coverage -t "BOOK-01\|BOOK-04\|BOOK-05" 2>&1 \| tail -20` | ✅ | ⬜ pending |
| 2-03-01 | 03 | 2 | BOOK-02, BOOK-04 | unit | `npx jest __tests__/booking-surface.test.ts --no-coverage -t "BOOK-02\|BOOK-04" 2>&1 \| tail -20` | ✅ | ⬜ pending |
| 2-03-02 | 03 | 2 | BOOK-03 | unit | `npx jest __tests__/booking-surface.test.ts --no-coverage 2>&1 \| tail -20` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/booking-surface.test.ts` — stubs for BOOK-01 through BOOK-05 dark mode class assertions (created by Plan 02-01)

*Existing jest infrastructure detected — only phase-specific test file needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual dark mode rendering | BOOK-01–05 | CSS class presence is tested; pixel rendering requires browser | Open app in dark mode, verify surfaces, booking form, calendar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
