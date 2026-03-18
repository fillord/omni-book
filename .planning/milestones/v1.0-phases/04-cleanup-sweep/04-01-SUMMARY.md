---
phase: 04-cleanup-sweep
plan: 01
subsystem: testing
tags: [jest, tailwind, dark-mode, cleanup, static-analysis]

# Dependency graph
requires:
  - phase: 03-dashboard-auth-surface
    provides: dashboard/page.tsx, booking-status-badge.tsx, established test patterns
  - phase: 02-tenant-public-booking-surface
    provides: booking-form.tsx, tenant-public-page.tsx, booking-surface.test.ts
provides:
  - RED-state test scaffold for all Phase 4 requirements (CLEAN-01/02/03) and regressions
  - __tests__/cleanup-surface.test.ts with 32 assertions targeting 5 source files
affects: [04-02-PLAN, 04-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [fs.readFileSync static-file assertions, line-proximity comment assertions, per-line dark-mode class scanning]

key-files:
  created:
    - __tests__/cleanup-surface.test.ts
  modified: []

key-decisions:
  - "CANCELLED badge target: bg-muted text-muted-foreground border-border (single semantic string, no dark: duplication needed)"
  - "Regression assertions use line-level find() pattern to isolate COLORS map entries — avoids false positives from other usages of color classes in JSX"
  - "CLEAN-03 proximity assertion checks 5 lines above bg-white/10 (same pattern as BOOK-03 intentional comment test)"
  - "isTable emoji container tested via w-12 h-12 rounded-xl line presence — matches the only isTable branch in ResourceCard"

patterns-established:
  - "Proximity comment assertion: find line index, slice [idx-5..idx], any(.includes('intentional'))"
  - "Per-entry COLORS map assertion: find() line containing both key name and color class, then assert dark: variant on that line"

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03]

# Metrics
duration: 12min
completed: 2026-03-18
---

# Phase 4 Plan 01: Cleanup Sweep RED-State Test Scaffold Summary

**32-assertion test scaffold in cleanup-surface.test.ts covering CLEAN-01/02/03 + dark mode regressions for booking-form.tsx and tenant-public-page.tsx — all correctness assertions fail RED against current source**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-18T17:04:40Z
- **Completed:** 2026-03-18T17:16:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `__tests__/cleanup-surface.test.ts` with 32 assertions across 4 describe blocks
- 27 tests fail RED confirming violations exist in banned-actions.tsx, booking-status-badge.tsx, dashboard/page.tsx, booking-form.tsx, and tenant-public-page.tsx
- 5 preservation assertions pass confirming PENDING/CONFIRMED/COMPLETED/NO_SHOW accents and bg-white/10 exist
- Phase 2 guard tests (booking-surface.test.ts, 36 tests) remain fully green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cleanup-surface.test.ts with RED-state assertions** - `2ffe206` (test)

## Files Created/Modified
- `__tests__/cleanup-surface.test.ts` - RED-state test scaffold for all Phase 4 requirements (264 lines, 32 assertions)

## Decisions Made
- CANCELLED badge semantic target is `bg-muted text-muted-foreground border-border` — matches the neutral/disabled semantic intent without dark: duplication (same approach as other shadcn badge patterns in the project)
- Regression assertions use line-level `find()` pattern on COLORS map entries (e.g. `line.includes("badge:") && line.includes("bg-blue-100")`) to avoid false positives from JSX usages of the same color classes
- CLEAN-03 proximity assertion checks 5 lines above the `bg-white/10` line — consistent with the BOOK-03 `intentional` comment proximity test pattern established in Phase 2
- isTable emoji container tested via `w-12 h-12 rounded-xl` line match — the only element in ResourceCard with these classes is the isTable branch container

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- `04-02-PLAN.md` can proceed immediately — tests are RED, remediation targets are confirmed
- `04-03-PLAN.md` can also proceed — all regression test targets are defined
- Cleanup sweep requires fixing: banned-actions.tsx (CLEAN-01), booking-status-badge.tsx (CLEAN-02), dashboard/page.tsx (CLEAN-03), booking-form.tsx (regression dark states), tenant-public-page.tsx (regression badge/avatarBg/isTable dark states)

---
*Phase: 04-cleanup-sweep*
*Completed: 2026-03-18*
