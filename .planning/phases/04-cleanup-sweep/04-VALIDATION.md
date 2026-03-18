---
phase: 4
slug: cleanup-sweep
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (ts-jest) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest __tests__/cleanup-surface.test.ts --no-coverage 2>&1 \| tail -20` |
| **Full suite command** | `npx jest --no-coverage 2>&1 \| tail -30` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/cleanup-surface.test.ts __tests__/booking-surface.test.ts --no-coverage 2>&1 | tail -20`
- **After every plan wave:** Run `npx jest --no-coverage 2>&1 | tail -30`
- **Before `/gsd:verify-work`:** Full suite must be green + manual sweep checklist signed off
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | CLEAN-01,02,03,REG | static scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage 2>&1 \| tail -20` | ❌ Wave 0 | ⬜ pending |
| 4-02-01 | 02 | 1 | CLEAN-01 | static scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "CLEAN-01" 2>&1 \| tail -10` | ❌ Wave 0 | ⬜ pending |
| 4-02-02 | 02 | 1 | CLEAN-02 | static scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "CLEAN-02" 2>&1 \| tail -10` | ❌ Wave 0 | ⬜ pending |
| 4-02-03 | 02 | 1 | CLEAN-03 | static scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "CLEAN-03" 2>&1 \| tail -10` | ❌ Wave 0 | ⬜ pending |
| 4-03-01 | 03 | 1 | Regression | static scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "regression" 2>&1 \| tail -10` | ❌ Wave 0 | ⬜ pending |
| 4-03-02 | 03 | 1 | Regression | static scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "regression" 2>&1 \| tail -10` | ❌ Wave 0 | ⬜ pending |
| 4-04-01 | 04 | 2 | CLEAN-03 req 3 | manual | N/A — manual checklist | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/cleanup-surface.test.ts` — stubs and assertions covering CLEAN-01, CLEAN-02, CLEAN-03, and regression dark: override checks

*Wave 0 must create the test file before Wave 1 execution tasks run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full dark mode toggle sweep across all major pages | CLEAN-03 (req 3) | Visual rendering cannot be asserted by file scan; requires browser interaction | Toggle dark mode on: `/` (landing), `/[slug]` (tenant public), `/dashboard`, analytics, billing, auth pages. Confirm no broken surfaces (black text on dark bg, invisible elements). Pass = all surfaces readable. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
