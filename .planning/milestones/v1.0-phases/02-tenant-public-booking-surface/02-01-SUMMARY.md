---
phase: 02-tenant-public-booking-surface
plan: "01"
subsystem: testing
tags: [jest, tailwind, color-tokens, dark-mode, static-file-assertions]

requires:
  - phase: 01-landing-marketing-surface
    provides: "landing-surface.test.ts pattern (fs.readFileSync static assertions)"

provides:
  - "__tests__/booking-surface.test.ts with RED assertions for BOOK-01 through BOOK-05"
  - "Documented violation inventory: bg-white/bg-zinc-*/text-zinc-*/border-zinc-* in tenant-public-page and booking-form"
  - "Assertion that RESOURCE_PALETTE intentional comment must exist in booking-calendar.tsx"
  - "BOOK-04 brand accent verification (passes green even before remediation)"

affects:
  - 02-tenant-public-booking-surface
  - phase-02-remediation

tech-stack:
  added: []
  patterns:
    - "Static file scan tests using fs.readFileSync — same pattern as landing-surface.test.ts"
    - "RED-first TDD: write assertions against current violations, verify tests fail, then remediate"

key-files:
  created:
    - __tests__/booking-surface.test.ts
  modified: []

key-decisions:
  - "booking-form.tsx bg-white violation is in date input field (line 619), not a brand exception — must be removed"
  - "tenant-public-page.tsx footer bg-zinc-900 is intentional fixed-dark surface — test scoped to assert only footer lines use it"
  - "booking-calendar.tsx RESOURCE_PALETTE uses functional accent palette (blue/purple/emerald/orange/pink/teal) which is intentional — test asserts an 'intentional' comment must document this"
  - "text-slate-50/text-slate-900 in tenant-public-page are violations (dark:/root div pairing without semantic token)"

patterns-established:
  - "BOOK tests: describe block per requirement, scoped to file, follow LAND test naming convention"
  - "Footer exception pattern: test that zinc-900 only appears on footer-tagged lines"
  - "Brand accent preservation: separate BOOK-04 describe block asserts COLORS/BOOKING_COLORS maps retain niche colors"

requirements-completed:
  - BOOK-01
  - BOOK-02
  - BOOK-03
  - BOOK-04
  - BOOK-05

duration: 2min
completed: "2026-03-18"
---

# Phase 2 Plan 01: Booking Surface Test Scaffold Summary

**36-test static file scan suite for booking surface (BOOK-01 through BOOK-05) in RED state confirming violations in tenant-public-page, booking-form, and booking-calendar components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T10:30:43Z
- **Completed:** 2026-03-18T10:32:15Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `__tests__/booking-surface.test.ts` with 36 test cases covering all 5 BOOK requirements
- Confirmed RED state: 21 tests fail against un-remediated source (violations confirmed present)
- Confirmed GREEN partial: 15 tests pass — BOOK-04 (brand accent preservation) fully green, calendar zinc/border/text clean
- Documented footer bg-zinc-900 exception pattern for intentional fixed-dark surface

## Task Commits

1. **Task 1: Create booking-surface.test.ts with BOOK-01 through BOOK-05 assertions** - `05ca961` (test)

## Files Created/Modified

- `__tests__/booking-surface.test.ts` — Static file scan assertions for BOOK-01 through BOOK-05 (241 lines, 36 tests)

## Decisions Made

- booking-form.tsx `bg-white` in date input (line 619) is a violation, not a brand exception — test asserts `.not.toMatch(/\bbg-white\b/)`
- Footer `bg-zinc-900` is intentional fixed-dark surface (same pattern as Phase 1 Footer.tsx) — test scoped to assert only footer-tagged lines contain it, not a blanket prohibition
- `booking-calendar.tsx` RESOURCE_PALETTE functional accent palette (blue/purple/emerald/orange/pink/teal) is intentional for visual differentiation — remediation plan must add an "intentional" comment near the palette declaration
- `text-slate-50` and `text-slate-900` in tenant-public-page are violations despite being used as text-on-gradient — semantic `text-foreground` / `text-background` tokens must be used instead

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Test scaffold complete and in RED state — confirms violations are real and tests are working
- Phase 02-02 remediation plan: fix tenant-public-page.tsx, booking-form.tsx, booking-calendar.tsx to turn tests GREEN
- Key violations to fix:
  - `tenant-public-page.tsx` root div: `bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-50` → `bg-background text-foreground`
  - `tenant-public-page.tsx` header: `bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800` → semantic tokens
  - `booking-form.tsx` date input: `bg-white dark:bg-zinc-900` → `bg-background`
  - `booking-calendar.tsx`: remove `bg-gray-400` fallback, add "intentional" comment near RESOURCE_PALETTE

---
*Phase: 02-tenant-public-booking-surface*
*Completed: 2026-03-18*
