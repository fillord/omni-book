---
phase: 01-replace-fixed-duration-dropdown-with-free-text-number-input-1-1440m
plan: "01"
subsystem: ui
tags: [react, zod, lucide-react, form, validation]

# Dependency graph
requires: []
provides:
  - Number input widget for duration with custom stepper buttons and preset quick-select
  - Updated zod schema accepting 1-1440 minute range for durationMin
  - Static-file assertion tests for DUR-01 through DUR-06
affects: [service-form, booking-validation, services-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static-file assertion tests using fs.readFileSync + regex for UI structural correctness"
    - "Absolutely-positioned suffix span inside relative wrapper (same as phone-input.tsx)"
    - "Native number spinner suppression via [appearance:textfield] and webkit pseudo-element overrides"
    - "Custom stepper buttons with type='button' to prevent accidental form submission"

key-files:
  created:
    - __tests__/service-form.test.ts
  modified:
    - lib/validations/service.ts
    - components/service-form.tsx

key-decisions:
  - "col-span-full on FormField FormItem so the wider duration widget gets its own row in the grid"
  - "FormControl wraps the relative wrapper div (not the Input directly) to satisfy Radix Slot prop forwarding"
  - "parseInt(field.value) || 1 for NaN handling from empty number input"
  - "Preset buttons render {preset} min text inline (not translated) — unit label is always 'min'"

patterns-established:
  - "Number input with custom stepper: relative wrapper + absolutely-positioned suffix span"
  - "Preset quick-select buttons as siblings of FormControl div, inside FormItem"

requirements-completed: [DUR-01, DUR-02, DUR-03, DUR-04, DUR-05, DUR-06]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 01 Plan 01: Replace Duration Dropdown Summary

**Duration field replaced with number input stepper (1-1440 min), custom +/- buttons, "min" suffix span, and 15/30/60 preset buttons — zod schema updated to match**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T18:50:47Z
- **Completed:** 2026-03-19T18:55:00Z
- **Tasks:** 3 (Task 0, Task 1, Task 2)
- **Files modified:** 3

## Accomplishments

- Removed DURATION_OPTIONS constant and updated durationMin zod validation to min(1)/max(1440)
- Replaced Select dropdown with number input featuring custom stepper buttons, "min" suffix, and 15/30/60 preset buttons
- Created 12 static-file assertion tests (6 describe blocks, DUR-01 through DUR-06) — all pass

## Task Commits

Each task was committed atomically:

1. **Task 0: Create static-file assertion tests** - `a46e782` (test)
2. **Task 1: Update zod schema** - `a375d84` (feat)
3. **Task 2: Replace Select with number input stepper widget** - `5ce39a9` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified

- `__tests__/service-form.test.ts` - 12 static-file assertion tests covering DUR-01 through DUR-06
- `lib/validations/service.ts` - Removed DURATION_OPTIONS; updated durationMin to min(1)/max(1440)
- `components/service-form.tsx` - Replaced duration Select with number input + stepper + presets; added Minus/Plus imports; removed DURATION_OPTIONS import

## Decisions Made

- `col-span-full` on the duration FormItem so the wider widget (stepper row + presets) occupies its own full grid row, instead of sharing with price/currency columns.
- `FormControl` wraps the `<div className="relative flex-1">` (not the Input directly) because Radix Slot forwards `id`/`aria-invalid` to the first child. Wrapping the div is acceptable since Input is the only interactive element inside it.
- Stepper clamps with `parseInt(field.value) || 1` to safely handle NaN from an empty input box.
- Preset buttons label text is `{preset} min` (untranslated "min") — consistent with the "min" suffix on the input widget.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all three tasks completed cleanly with no blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Duration field fully functional for any value between 1 and 1440 minutes
- All 215 tests pass, TypeScript compiles clean
- No blockers for future phases

## Self-Check: PASSED

- FOUND: `__tests__/service-form.test.ts`
- FOUND: `lib/validations/service.ts`
- FOUND: `components/service-form.tsx`
- FOUND commit a46e782 (test: add failing static-file assertion tests)
- FOUND commit a375d84 (feat: remove DURATION_OPTIONS, update schema)
- FOUND commit 5ce39a9 (feat: replace Select dropdown with number input stepper)

---
*Phase: 01-replace-fixed-duration-dropdown-with-free-text-number-input-1-1440m*
*Completed: 2026-03-19*
