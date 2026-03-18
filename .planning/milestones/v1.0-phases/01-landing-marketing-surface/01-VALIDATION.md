---
phase: 1
slug: landing-marketing-surface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (ts-jest) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest __tests__/landing-surface.test.ts --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest __tests__/landing-surface.test.ts --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | LAND-01 | static file scan | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | LAND-02 | static file scan | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | LAND-03 | static file scan | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | LAND-04 | static file scan | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | LAND-05 | static file scan | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 1 | LAND-06 | static file scan | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 01-01-07 | 01 | 1 | LAND-07 | static file scan | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/landing-surface.test.ts` — static file assertions for LAND-01 through LAND-07

*Pattern (from Phase 0):* Use `fs.readFileSync` to read landing component source files as strings, apply regex patterns to verify absence of hardcoded color classes and correct semantic token usage.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover state visual feedback (indigo buttons, niche cards) | LAND-05 | Visual perception cannot be automated | Toggle dark mode, hover over all CTAs and interactive elements in `components/landing/` — all should show visible, non-jarring color change |
| Gradient rendering in dark mode (HeroSection, FeaturesGrid icons) | LAND-07 | Color palette perception, visual quality | Toggle dark mode on landing page — Hero gradient should be dark-appropriate; FeaturesGrid icon containers should be visible |
| Footer visual weight preservation | Footer intentional exception | Dark mode UX perception | Verify footer remains visually distinct from page body in both light and dark modes; should not blend in |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
