---
phase: 03-dashboard-auth-surface
plan: 01
subsystem: testing
tags: [jest, ts-jest, tailwind, static-assertions, dashboard, auth]

# Dependency graph
requires:
  - phase: 02-tenant-public-booking-surface
    provides: established fs.readFileSync + regex test pattern (booking-surface.test.ts)
  - phase: 00-infrastructure-validation
    provides: Jest + ts-jest test infrastructure
provides:
  - Static assertion test scaffold for all 8 Phase 3 requirements (DASH-01 through AUTH-03)
  - 23 test assertions documenting all dashboard and auth surface violations
  - Wave 0 test file enabling automated verify commands for Plans 02-04
affects:
  - 03-02 (sidebar + billing remediation)
  - 03-03 (analytics + managers remediation)
  - 03-04 (auth pages remediation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fs.readFileSync + regex static assertion pattern extended to dashboard/auth surface"
    - "readApp() helper for app/ path files (complement to readComponent() for components/)"

key-files:
  created:
    - __tests__/dashboard-auth-surface.test.ts
  modified: []

key-decisions:
  - "Auth page tests (AUTH-01/02/03) assert negative — files are already clean so tests are GREEN from day 1"
  - "Manager tests (DASH-04) are GREEN from day 1 — audit confirmed staff/services/resources-manager.tsx have zero violations"
  - "DASH-01/02/03/05 tests are intentionally RED — violations documented, fixed by Plans 02-03"
  - "readApp() helper added alongside readComponent() to reach app/(auth)/* paths outside components/"

patterns-established:
  - "Pattern 1: readApp(relPath) helper for files under app/ that cannot be reached with readComponent()"
  - "Pattern 2: Wave 0 test scaffold written RED-first; subsequent plans turn assertions GREEN without modifying test file"

requirements-completed:
  - DASH-01
  - DASH-02
  - DASH-03
  - DASH-04
  - DASH-05
  - AUTH-01
  - AUTH-02
  - AUTH-03

# Metrics
duration: 1min
completed: 2026-03-18
---

# Phase 3 Plan 01: Dashboard-Auth Surface Test Scaffold Summary

**23-assertion Jest test scaffold covering DASH-01 through AUTH-03 using fs.readFileSync + regex pattern; 9 GREEN (clean files), 14 RED (violations for Plans 02-03 to fix)**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-18T12:55:20Z
- **Completed:** 2026-03-18T12:56:56Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `__tests__/dashboard-auth-surface.test.ts` with 23 assertions across 8 describe blocks (DASH-01 through AUTH-03)
- Confirmed DASH-04 (manager files) and AUTH-01/02/03 (auth pages) are already clean — 9 tests GREEN from day 1
- Documented all 14 outstanding violations (DASH-01, DASH-02, DASH-03, DASH-05) as RED tests for Plans 02-03 to remediate
- Full prior-phase suite (landing, booking, infrastructure) remains 137/137 passing — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard-auth-surface test scaffold** - `4ced5c1` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `__tests__/dashboard-auth-surface.test.ts` - Static assertion coverage for all 8 Phase 3 requirements; 23 it() blocks using readComponent() and readApp() helpers with regex/toContain assertions

## Decisions Made
- AUTH-01/02/03 tests assert absence of `bg-zinc-*` and `bg-slate-*` only; the orange warning color (`bg-orange-600 hover:bg-orange-700`) on the login force-button and green success color in verify-otp are intentional status colors and are not tested as violations
- readApp() helper introduced alongside readComponent() to handle `app/(auth)/*` paths that cannot be reached from the `components/` directory
- All test assertions transcribed exactly from plan to avoid any divergence from the requirement specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test scaffold complete; Plans 02-04 can reference `npx jest __tests__/dashboard-auth-surface.test.ts --no-coverage` as their verify command
- 14 RED tests document exactly what violations Plans 02-03 must fix
- Auth pages (AUTH-01/02/03) and manager files (DASH-04) confirmed clean — no remediation needed for those

---
*Phase: 03-dashboard-auth-surface*
*Completed: 2026-03-18*
