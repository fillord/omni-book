---
phase: 2
slug: super-admin-god-mode-and-platform-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest (existing) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern="god-mode" --passWithNoTests` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="god-mode" --passWithNoTests`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | GOD-01..06 | unit | `npx jest --testPathPattern="god-mode"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | GOD-01 | unit | `npx jest --testPathPattern="god-mode"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | GOD-02 | unit | `npx jest --testPathPattern="god-mode"` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | GOD-03 | unit | `npx jest --testPathPattern="god-mode"` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | GOD-04 | unit | `npx jest --testPathPattern="god-mode"` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 2 | GOD-05 | unit | `npx jest --testPathPattern="god-mode"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/god-mode-surface.test.ts` — static file assertion tests covering GOD-01 through GOD-06 (fs.readFileSync + regex pattern, matching existing `neumorphism-surface.test.ts` approach)

*No new framework config needed — `jest.config.ts` pattern already supports new test files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Announcement banner appears for all tenant users | GOD-03 | Cross-user visibility requires multiple sessions | Login as super-admin, create banner; login as tenant, verify banner appears at dashboard top |
| Bell notification delivered and marked read | GOD-04 | Real user interaction flow | Send notification to tenant; login as tenant, verify Bell badge count > 0; click to open, mark read, verify badge clears |
| Audit log captures login event | GOD-05 | Requires actual auth flow | Login as tenant; check `/admin/audit-logs` for login event entry |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
