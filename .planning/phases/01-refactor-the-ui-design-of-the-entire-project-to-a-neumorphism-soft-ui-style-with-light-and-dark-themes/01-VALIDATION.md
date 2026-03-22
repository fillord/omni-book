---
phase: 1
slug: refactor-the-ui-design-of-the-entire-project-to-a-neumorphism-soft-ui-style-with-light-and-dark-themes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 with ts-jest |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern="neumorphism"` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds (quick) / ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="neumorphism"`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | W0 | 0 | NEU-01 to NEU-14 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | NEU-01 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | NEU-02 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | NEU-03 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | NEU-10 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | NEU-04 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | NEU-05 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | NEU-06 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 2 | NEU-07 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-02-05 | 02 | 2 | NEU-08 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-02-06 | 02 | 2 | NEU-09 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-02-07 | 02 | 2 | NEU-11 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | NEU-14 | static | `npx jest --testPathPattern="neumorphism-surface"` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | NEU-12 | static | `npx jest --testPathPattern="landing-surface"` | ✅ | ⬜ pending |
| 1-REG-01 | all | end | NEU-13 | regression | `npx jest` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/neumorphism-surface.test.ts` — covers NEU-01 through NEU-11 and NEU-14 using `fs.readFileSync` + regex pattern (matching existing test suite style)

*NEU-12 (Footer.tsx retains bg-zinc-900) is already covered by existing `landing-surface.test.ts`.*
*NEU-13 (all 215 tests pass) uses existing `npx jest` full suite.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual Neumorphism shadow appearance in light theme | NEU-01/03 | Visual depth cannot be asserted via static file checks | Open app in browser, confirm raised cards show dual-shadow effect |
| Visual Neumorphism shadow appearance in dark theme | NEU-01/03 | Visual depth varies by display | Toggle to dark mode, confirm shadows use dark Neumorphism values |
| Button press (.neu-inset) on :active state | NEU-04 | Interaction state — not testable statically | Click buttons, confirm shadow flips to inset on press |
| Theme transition smoothness (300ms) | NEU-10 | Animation smoothness not testable via Jest | Toggle theme, confirm no flash/abrupt color change |
| SelectContent / DropdownMenu popup visual separation | NEU-08/09 | Floating layer visual distinction is subjective | Open dropdowns, confirm menus are visually distinct from page surface |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
