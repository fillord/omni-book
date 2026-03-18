---
phase: 01-landing-marketing-surface
plan: 04
subsystem: ui
tags: [tailwind, dark-mode, semantic-tokens, landing, testing]

# Dependency graph
requires:
  - phase: 01-landing-marketing-surface
    provides: NicheCards.tsx and DemoSection.tsx with initial dark mode remediation
provides:
  - NicheCards.tsx COLOR_MAP using dark:bg-card (semantic token) for all 4 niche entries
  - DemoSection.tsx DEMOS using dark:bg-card (semantic token) for all 4 demo entries
  - Test assertions for dark:bg-zinc-900 absence and dark:bg-card presence (LAND-01 supplemental)
affects: [landing-surface-verification, dark-mode-audit]

# Tech tracking
tech-stack:
  added: []
  patterns: [semantic-token-replacement, regression-test-coverage-per-fix]

key-files:
  created: []
  modified:
    - components/landing/NicheCards.tsx
    - components/landing/DemoSection.tsx
    - __tests__/landing-surface.test.ts

key-decisions:
  - "dark:bg-card used instead of dark:bg-zinc-900 to align niche/demo card backgrounds with theme system"
  - "Supplemental LAND-01 describe block added (not folded into existing) for clear annotation of targeted regression guard"

patterns-established:
  - "Pattern: Each hardcoded token replacement gets a corresponding static-file assertion in the test suite to prevent regression"

requirements-completed: [LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-07]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 01 Plan 04: Dark bg-zinc-900 Remediation in NicheCards and DemoSection Summary

**Replaced 8 hardcoded dark:bg-zinc-900 instances with semantic dark:bg-card in NicheCards.tsx and DemoSection.tsx, adding 4 regression-guard test assertions (51 total, all passing)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-18T08:00:00Z
- **Completed:** 2026-03-18T08:05:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- NicheCards.tsx COLOR_MAP: all 4 color entries (blue, pink, orange, green) now use `dark:bg-card`
- DemoSection.tsx DEMOS: all 4 demo entries now use `dark:bg-card` in their color class strings
- Test suite extended with 4 LAND-01 supplemental assertions guarding against regression of dark:bg-zinc-900 reintroduction

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace dark:bg-zinc-900 with dark:bg-card in NicheCards and DemoSection** - `e41ec54` (feat)
2. **Task 2: Add test assertions for dark:bg-zinc-900 absence** - `21094b1` (test)

## Files Created/Modified

- `components/landing/NicheCards.tsx` - COLOR_MAP bg values updated from dark:bg-zinc-900 to dark:bg-card (4 replacements)
- `components/landing/DemoSection.tsx` - DEMOS color strings updated from dark:bg-zinc-900 to dark:bg-card (4 replacements)
- `__tests__/landing-surface.test.ts` - Added LAND-01 supplemental describe block with 4 assertions

## Decisions Made

- Used `dark:bg-card` (shadcn/ui semantic token) to match the established pattern across all other landing components
- Added a dedicated supplemental describe block rather than embedding assertions in the existing LAND-01 describe — clearer intent and isolated concern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 51 landing-surface tests pass
- Zero instances of `dark:bg-zinc-900` remain in `components/landing/`
- Phase 01 landing surface fully remediated — ready to proceed to Phase 02 or next phase in ROADMAP

---
*Phase: 01-landing-marketing-surface*
*Completed: 2026-03-18*
