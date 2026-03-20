---
phase: 1
slug: replace-fixed-duration-dropdown-with-free-text-number-input-1-1440m
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 with ts-jest |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern="service-form"` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="service-form"`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | DUR-01..06 | static-file | `npx jest --testPathPattern="service-form"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | DUR-01, DUR-02 | static-file | `npx jest --testPathPattern="service-form"` | ✅ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | DUR-03..06 | static-file | `npx jest --testPathPattern="service-form"` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/service-form.test.ts` — static file assertions for DUR-01 through DUR-06

*All created in Wave 0 before any implementation tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stepper clamping at boundaries | DUR-04 | UI interaction | Click − at value 1 → stays 1; click + at value 1440 → stays 1440 |
| Preset buttons set correct value | DUR-05 | UI interaction | Click 15/30/60 buttons → input shows correct value |
| "min" suffix visible | DUR-06 | Visual check | Open service form → confirm "min" text visible next to input |
| No native browser spinners | visual | Cross-browser | Check Chrome + Firefox: no browser arrows visible on number input |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
