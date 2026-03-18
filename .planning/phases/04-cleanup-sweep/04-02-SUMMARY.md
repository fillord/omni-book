---
phase: 04-cleanup-sweep
plan: 02
subsystem: ui
tags: [dark-mode, semantic-tokens, tailwind, react]

# Dependency graph
requires:
  - phase: 04-01
    provides: Test scaffold (cleanup-surface.test.ts) with RED-state CLEAN-01, CLEAN-02, and booking-form regression tests
provides:
  - banned-actions.tsx with all zinc classes replaced by semantic tokens (CLEAN-01)
  - booking-status-badge.tsx CANCELLED entry using semantic bg-muted text-muted-foreground border-border (CLEAN-02)
  - booking-form.tsx with dark: overrides on all BOOKING_COLORS selection states, error block, and success screen icon
affects:
  - 04-03 (CLEAN-03 and tenant-public-page.tsx fixes, same test file)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - bg-foreground/text-background for inverted buttons (high contrast, semantic, light+dark safe)
    - dark:bg-{color}-950/40 pattern for selection state tinting in dark mode
    - Test filters must include quote check to exclude TypeScript type definition lines

key-files:
  created: []
  modified:
    - components/banned-actions.tsx
    - components/booking-status-badge.tsx
    - components/booking-form.tsx
    - __tests__/cleanup-surface.test.ts

key-decisions:
  - "bg-foreground text-background hover:bg-foreground/90 used for contact support CTA — semantic inverse pair, adapts in both modes"
  - "CANCELLED badge: single bg-muted text-muted-foreground border-border string, no dark: duplication needed — confirmed decision from research"
  - "Test filter narrowed from line.includes('serviceSelected:') to also require line.includes(\"'\") to exclude TypeScript type definition lines from assertion scope"

patterns-established:
  - "Booking selection states: bg-{color}-50 dark:bg-{color}-950/40 — light-mode pastel + dark-mode deep tint"
  - "Error blocks: border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 — full dark override triple"
  - "Success icon circles: bg-green-100 dark:bg-green-950/40 with dark:text-green-400 on child icon"

requirements-completed: [CLEAN-01, CLEAN-02]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 4 Plan 02: Cleanup Sweep — CLEAN-01, CLEAN-02, and Booking Form Dark Mode Summary

**Semantic token replacement in banned-actions.tsx and booking-status-badge.tsx (CLEAN-01/02), plus dark:bg-{color}-950/40 overrides on all 8 BOOKING_COLORS selection state entries and error/success blocks in booking-form.tsx**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-18T17:10:00Z
- **Completed:** 2026-03-18T17:18:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- banned-actions.tsx: 7 zinc class occurrences replaced with semantic tokens (bg-foreground, text-background, border-border, text-foreground, hover:bg-muted, text-muted-foreground, hover:text-foreground)
- booking-status-badge.tsx: CANCELLED entry collapsed from 5 zinc/dark: classes to 3 semantic token classes
- booking-form.tsx: all 8 serviceSelected/resourceSelected entries in BOOKING_COLORS map now have dark:bg-{color}-950/40; error block gets dark:border-red-800 dark:bg-red-950/40 dark:text-red-300; success icon circle gets dark:bg-green-950/40 and checkmark gets dark:text-green-400
- CLEAN-01, CLEAN-02, and all booking-form regression tests GREEN; Phase 2 guard tests remain GREEN (36/36)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remediate banned-actions.tsx and booking-status-badge.tsx (CLEAN-01, CLEAN-02)** - `b364815` (fix)
2. **Task 2: Add dark: overrides to booking-form.tsx BOOKING_COLORS, error block, and success screen** - `d2f49a2` (fix)

## Files Created/Modified
- `components/banned-actions.tsx` - All zinc hardcoded classes replaced with semantic tokens
- `components/booking-status-badge.tsx` - CANCELLED entry uses bg-muted text-muted-foreground border-border
- `components/booking-form.tsx` - 8 BOOKING_COLORS entries get dark: overrides; error block and success screen patched for dark mode
- `__tests__/cleanup-surface.test.ts` - Test filter narrowed to exclude TypeScript type definition lines (auto-fix)

## Decisions Made
- bg-foreground/text-background/hover:bg-foreground/90 used for contact support CTA — semantic inverse pair that auto-adapts in both light and dark modes
- CANCELLED badge: single semantic string, no dark: duplication — aligns with Phase 4 research decision
- Test filter narrowed to require quote character presence, distinguishing value lines from TypeScript type definition lines

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test filter captured TypeScript type definition lines in serviceSelected/resourceSelected assertions**
- **Found during:** Task 2 (booking-form.tsx dark: overrides)
- **Issue:** `source.split("\n").filter((line) => line.includes("serviceSelected:"))` also matched the TypeScript type declaration `serviceSelected:  string` on line 56, causing the "every matched line must contain dark:" assertion to fail for the type definition line
- **Fix:** Added `&& line.includes("'")` to both serviceSelected and resourceSelected filter conditions, ensuring only string value lines (not TypeScript declarations) are asserted
- **Files modified:** `__tests__/cleanup-surface.test.ts`
- **Verification:** All 9 booking-form regression tests GREEN; filter still captures all 4 serviceSelected and 4 resourceSelected value lines
- **Committed in:** d2f49a2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in test filter)
**Impact on plan:** Necessary for test correctness. The test assertion logic was unintentionally over-broad, capturing TypeScript type definitions. Fix narrows to value lines only. No scope creep.

## Issues Encountered
None beyond the test filter bug documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CLEAN-01 and CLEAN-02 requirements complete, tests GREEN
- booking-form.tsx dark mode regression fixed
- 04-03 (tenant-public-page.tsx badge/avatarBg dark overrides + CLEAN-03 dashboard intentional comment) ready to execute
- cleanup-surface.test.ts still has 10 failing tests for 04-03 scope — expected, not a concern for this plan

---
*Phase: 04-cleanup-sweep*
*Completed: 2026-03-18*
