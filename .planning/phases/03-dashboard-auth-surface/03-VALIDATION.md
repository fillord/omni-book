---
phase: 3
slug: dashboard-auth-surface
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (ts-jest) |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest __tests__/dashboard-auth-surface.test.ts --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/dashboard-auth-surface.test.ts --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-T1 | 01 | 1 | DASH-01–05, AUTH-01–03 | unit/scaffold | `npx jest __tests__/dashboard-auth-surface.test.ts --no-coverage` | ✅ created by task | ⬜ pending |
| 3-02-T1 | 02 | 2 | DASH-01, DASH-05 | unit | `npx jest __tests__/dashboard-auth-surface.test.ts --testNamePattern="DASH-01\|DASH-05" --no-coverage` | ✅ | ⬜ pending |
| 3-02-T2 | 02 | 2 | DASH-02 | unit | `npx jest __tests__/dashboard-auth-surface.test.ts --testNamePattern="DASH-02" --no-coverage` | ✅ | ⬜ pending |
| 3-03-T1 | 03 | 2 | DASH-03 | unit | `npx jest __tests__/dashboard-auth-surface.test.ts --testNamePattern="DASH-03" --no-coverage` | ✅ | ⬜ pending |
| 3-03-T2 | 03 | 2 | DASH-04 | unit | `npx jest __tests__/dashboard-auth-surface.test.ts --testNamePattern="DASH-04" --no-coverage` | ✅ | ⬜ pending |
| 3-04-T1 | 04 | 2 | AUTH-01–03 | unit | `npx jest __tests__/dashboard-auth-surface.test.ts --testNamePattern="AUTH" --no-coverage` | ✅ | ⬜ pending |
| 3-04-T2 | 04 | 2 | AUTH-01–03 | visual/manual | `npx jest --no-coverage 2>&1 \| tail -5` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar token family renders distinct from main content in dark mode | DASH-01 | Visual CSS token rendering | Toggle dark mode, inspect sidebar bg vs main content area |
| Billing page has no `dark:!` force-override classes | DASH-02 | DOM/class inspection | `grep -r "dark:!" src/` on billing component |
| Chart CartesianGrid/cursor tooltip visible in dark mode | DASH-03 | Visual chart rendering | Toggle dark mode, verify chart elements visible and readable |
| Auth pages readable in dark mode, brand SVG colors preserved | AUTH-01–AUTH-03 | Visual rendering + SVG color check | Toggle dark mode on login/register/OTP pages |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 01 creates scaffold in Wave 1)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-18
