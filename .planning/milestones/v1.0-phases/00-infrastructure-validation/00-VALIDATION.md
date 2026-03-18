---
phase: 0
slug: infrastructure-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `jest.config.ts` (project root) |
| **Quick run command** | `npm test -- --testPathPattern="infrastructure-validation"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="infrastructure-validation"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 0-01-01 | 01 | 0 | FOUND-01 | unit (file content assertion) | `npm test -- --testPathPattern="infrastructure-validation"` | ❌ W0 | ⬜ pending |
| 0-01-02 | 01 | 0 | FOUND-02 | unit (file content assertion) | `npm test -- --testPathPattern="infrastructure-validation"` | ❌ W0 | ⬜ pending |
| 0-01-03 | 01 | 0 | FOUND-03 | unit (file content assertion) | `npm test -- --testPathPattern="infrastructure-validation"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/infrastructure-validation.test.ts` — covers FOUND-01, FOUND-02, FOUND-03 (file content assertions using `fs.readFileSync`)

*Wave 0 creates the test file before any inspection tasks run.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
