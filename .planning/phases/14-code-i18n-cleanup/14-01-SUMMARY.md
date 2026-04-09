---
phase: 14-code-i18n-cleanup
plan: 01
subsystem: testing, infra
tags: [jest, next.js, security-headers, remotePatterns, image-optimization]

# Dependency graph
requires: []
provides:
  - Phase 14 CLN-01..CLN-08 test scaffold appended to cleanup-surface.test.ts
  - next.config.ts security headers (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin) on all routes
  - next.config.ts remotePatterns scoped to explicit trusted hostnames (i.imgur.com, i.ibb.com, omni-book.site)
affects: [14-02, 14-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static file string assertion tests using fs.readFileSync for CLN requirements (CLN-01..CLN-08)"
    - "Next.js headers() config for security headers — zero runtime cost, applies before JS"

key-files:
  created: []
  modified:
    - __tests__/cleanup-surface.test.ts
    - next.config.ts

key-decisions:
  - "CLN-05/06 tests written first (RED) then next.config.ts updated (GREEN) — strict Wave 0 TDD ordering"
  - "Explicit remotePatterns: i.imgur.com, i.ibb.com, omni-book.site — no wildcard, http protocol entry removed"
  - "Security headers use source: '(.*)' pattern covering all Next.js routes"

patterns-established:
  - "Pattern: force-add tracked files in gitignored dirs with git add -f"

requirements-completed: [CLN-05, CLN-06]

# Metrics
duration: 8min
completed: 2026-04-09
---

# Phase 14 Plan 01: Test Scaffold + Security Headers Summary

**Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) added to next.config.ts and wildcard remotePatterns replaced with explicit trusted hostnames; Phase 14 CLN-01..CLN-08 test blocks established as automated verification scaffold**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-09T16:30:00Z
- **Completed:** 2026-04-09T16:37:52Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Appended 8 CLN describe blocks (CLN-01 through CLN-08) to `__tests__/cleanup-surface.test.ts` — Wave 0 test foundation for all Phase 14 requirements
- Added `headers()` function to `next.config.ts` returning 3 security headers on all routes (`/(.*)`): X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin
- Replaced wildcard `hostname: '**'` remotePatterns with explicit `i.imgur.com`, `i.ibb.com`, `omni-book.site`; removed http protocol entry entirely

## Task Commits

Each task was committed atomically:

1. **Task 1: Append CLN-01..CLN-08 test blocks to cleanup-surface.test.ts** - `2da092c` (test)
2. **Task 2: Add security headers and scoped remotePatterns to next.config.ts** - `a8c099d` (feat)

## Files Created/Modified
- `__tests__/cleanup-surface.test.ts` - 8 new CLN describe blocks appended (120 lines added)
- `next.config.ts` - Security headers + explicit remotePatterns replacing wildcard

## Decisions Made
- CLN-05/06 tests verified RED before updating next.config.ts, then GREEN after — confirms Wave 0 is correctly gating downstream plans
- Used `source: '/(.*)'` (not `source: '**'`) for Next.js headers config — covers all routes including root
- Removed http protocol remotePattern entirely (all trusted image sources use HTTPS)
- `__tests__/` is in .gitignore but files are already tracked — used `git add -f` to stage

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `__tests__/` directory is listed in `.gitignore` — used `git add -f` since files are already tracked in git index. This is expected behavior for this repo (tests are tracked explicitly despite gitignore entry).
- Pre-existing CLEAN-01 test failure (1 of 6 pre-existing failures from v1.0 documented in STATE.md): `banned-actions.tsx contact support button uses semantic bg-foreground` — not caused by this plan, not fixed.

## Known Stubs
None — no stub patterns introduced by this plan.

## Next Phase Readiness
- CLN-01, CLN-02 (img → Image migration) tests are RED — ready for 14-02 execution
- CLN-03 (guard.ts any removal) test is RED — ready for 14-02 execution
- CLN-04 (translations cleanup) test is RED — ready for 14-02 execution
- CLN-07 (session maxAge) test is RED — ready for 14-02 execution
- CLN-08 (stub route comments) test is RED — ready for 14-02 execution
- CLN-05 and CLN-06 tests are GREEN — next.config.ts fully hardened

---
*Phase: 14-code-i18n-cleanup*
*Completed: 2026-04-09*
