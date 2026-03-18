---
phase: 3
slug: dashboard-auth-surface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | DASH-01 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | DASH-02 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |
| 3-01-03 | 01 | 1 | DASH-03 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |
| 3-01-04 | 01 | 1 | DASH-04 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |
| 3-01-05 | 01 | 1 | DASH-05 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 2 | AUTH-01 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |
| 3-02-02 | 02 | 2 | AUTH-02 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |
| 3-02-03 | 02 | 2 | AUTH-03 | visual/manual | `npx vitest run` | ✅ | ⬜ pending |

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
