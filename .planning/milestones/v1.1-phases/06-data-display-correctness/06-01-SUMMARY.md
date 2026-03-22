---
phase: 06-data-display-correctness
plan: 01
subsystem: ui
tags: [i18n, opt_, translations, booking-form, static-assertions, jest]

# Dependency graph
requires: []
provides:
  - opt_* ID resolution at all three display points in booking-form.tsx
  - static file assertion test (data-display.test.ts) preventing future opt_ regressions
affects: [any future work touching booking-form.tsx attribute or specialization display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline opt_ guard: val.startsWith('opt_') ? t('niche', val) : val at render points"
    - "Static file assertion tests with fs.readFileSync + regex for display correctness audits"

key-files:
  created:
    - __tests__/data-display.test.ts
  modified:
    - components/booking-form.tsx

key-decisions:
  - "Inline the opt_ guard at each display point rather than extracting optLabel() helper — keeps fixes localized and avoids refactoring scope"
  - "5 DATA-01 assertions cover all three leak points plus a regression guard for bare {String(v)}"
  - "cleanup-surface.test.ts failures (6 tests) confirmed pre-existing and out of scope — not introduced by this plan"

patterns-established:
  - "opt_ guard pattern: strVal.startsWith('opt_') ? t('niche', strVal) : strVal — consistent with resource-form.tsx optLabel helper"

requirements-completed: [DATA-01, DATA-02]

# Metrics
duration: 15min
completed: 2026-03-19
---

# Phase 6 Plan 01: Data Display Correctness Summary

**Eliminated all three opt_* ID leaks in booking-form.tsx via inline opt_ guards using t('niche', val), with a static file assertion test preventing future regressions**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-19T10:30:00Z
- **Completed:** 2026-03-19T10:45:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed three confirmed opt_* ID leak points in booking-form.tsx: resource.specialization badge (line ~549), attribute loop fallback (line ~570), and booking summary SummaryRow (line ~703)
- Full-surface audit confirmed services-manager.tsx and lib/email/reminders.ts have no opt_ display concerns
- Created __tests__/data-display.test.ts with 8 assertions (5 DATA-01 + 3 DATA-02) — all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix all opt_* ID leaks in booking-form.tsx** - `8c6c315` (fix)
2. **Task 2: Add static file assertion test for opt_* display correctness** - `f5ccc97` (test)

**Plan metadata:** committed separately (docs)

## Files Created/Modified

- `components/booking-form.tsx` - Three opt_ guards added at resource.specialization badge, attribute fallback, and SummaryRow
- `__tests__/data-display.test.ts` - Static file assertion tests for DATA-01 and DATA-02 requirements

## Decisions Made

- Inlined the opt_ guard at each display point (no shared optLabel helper extracted) — keeps changes minimal and localized, consistent with the existing inline approach in tenant-public-page.tsx
- Used `const strVal = String(v)` pattern for the attribute loop fallback to avoid double-evaluating String(v)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Pre-existing failures in `__tests__/cleanup-surface.test.ts` (6 tests, related to dark mode classes) confirmed not caused by this plan's changes via `git stash` verification. Logged as out-of-scope.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- DATA-01 and DATA-02 requirements fully satisfied
- All three known opt_* leak points in booking-form.tsx resolved
- Static regression test in place — any future removal of opt_ guards will immediately fail the test suite
- Pre-existing cleanup-surface.test.ts failures remain and will need attention in a future phase

---
*Phase: 06-data-display-correctness*
*Completed: 2026-03-19*
