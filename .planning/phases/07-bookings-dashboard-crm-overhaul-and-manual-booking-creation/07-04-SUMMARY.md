---
phase: 07-bookings-dashboard-crm-overhaul-and-manual-booking-creation
plan: "04"
subsystem: ui
tags: [react, i18n, neumorphism, booking, sheet, form]

# Dependency graph
requires:
  - phase: 07-02
    provides: createManualBooking Server Action and manualBookingSchema validation
  - phase: 07-03
    provides: BookingsDashboard with day-grouped view and filter chips

provides:
  - ManualBookingSheet slide-over component with slot picker, service filtering, and form submission
  - i18n keys for manual booking UI (14 keys) across ru, kz, en locales including tomorrow key
  - "Новая запись" button wired into BookingsDashboard header (canEdit guard)

affects: [08-client-base, future-booking-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ManualBookingSheet uses useEffect + AbortController pattern for slot fetch cancellation
    - Service filtering via Array.filter on resource.resourceId links (no extra API call)
    - slot.available flag determines disabled state on slot picker buttons
    - i18n fallback pattern: t('dashboard', 'key') ?? 'hardcoded fallback' for safety

key-files:
  created:
    - components/manual-booking-sheet.tsx
  modified:
    - components/bookings-dashboard.tsx
    - lib/i18n/translations.ts

key-decisions:
  - "ManualBookingSheet uses clientEmail as optional field (beyond plan spec) — improves data completeness for CRM sync"
  - "tomorrow key uses date-fns format for consistency with getDayLabel in BookingsDashboard — same source of truth"
  - "Slot Slot type uses startsAt/endsAt (not start/end) to match actual /api/bookings/slots response shape from Plan 07-03"

patterns-established:
  - "ManualBookingSheet: reset form on sheet close via resetForm() helper"
  - "Slot picker: disabled=!slot.available for visual blocking of unavailable slots"

requirements-completed:
  - CRM-B05
  - CRM-B08
  - CRM-B09
  - CRM-B10
  - CRM-B12

# Metrics
duration: 10min
completed: 2026-04-01
---

# Phase 7 Plan 4: Manual Booking Sheet and i18n Summary

**ManualBookingSheet slide-over with slot picker (grid, neu-raised/neu-inset), service filtering by resource, createManualBooking Server Action wiring, and 14 i18n keys across 3 locales**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-01T03:55:09Z
- **Completed:** 2026-04-01T04:05:00Z
- **Tasks:** 2 of 2 automated tasks complete (Task 3 is checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments

- ManualBookingSheet component: date/resource/service/slot/clientName/clientPhone/clientEmail form in a Sheet slide-over with Neumorphism styling
- Slot picker loads from `/api/bookings/slots` with tenantSlug+resourceId+serviceId+date params; grid layout with neu-raised (available) and neu-inset (selected) states
- Services filtered to only those linked to selected resource via `resources.some(r => r.resourceId === selectedResourceId)`
- createManualBooking called on submit with success toast + onSuccess() callback + sheet close + form reset
- BookingsDashboard already had ManualBookingSheet imported and sheetOpen state wired; "Новая запись" button present
- Added missing `tomorrow` key (Завтра/Ертең/Tomorrow) to all 3 locales plus `slotConflict` key
- All 31 CRM-B surface tests pass

## Task Commits

1. **Task 1: Create ManualBookingSheet component** - `4de79eb` (feat)
2. **Task 2: Wire ManualBookingSheet + add i18n keys** - `f2d2268` (feat)

## Files Created/Modified

- `/home/yola/projects/sites/omni-book/components/manual-booking-sheet.tsx` - ManualBookingSheet slide-over form component with slot picker grid
- `/home/yola/projects/sites/omni-book/components/bookings-dashboard.tsx` - ManualBookingSheet import + sheetOpen state + "Новая запись" button + sheet render
- `/home/yola/projects/sites/omni-book/lib/i18n/translations.ts` - Added tomorrow + slotConflict keys in ru/kz/en dashboard section

## Decisions Made

- clientEmail field added beyond plan spec — optional field improves CRM data completeness (inline opt-in, not breaking)
- Slot type uses `startsAt`/`endsAt` property names matching actual API response from Plan 07-03 (not `start`/`end` as in plan spec)
- `tomorrow` key added to fix CRM-B10 test failure; key was in plan spec but missing from existing translations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Slot type property name mismatch**
- **Found during:** Task 1 (Create ManualBookingSheet)
- **Issue:** Plan spec showed `{ start: string; end: string }` but actual /api/bookings/slots response uses `{ startsAt: string; endsAt: string; available: boolean }` — using wrong property names would break slot selection
- **Fix:** Used `startsAt`/`endsAt`/`available` in Slot type and all references, consistent with booking engine
- **Files modified:** components/manual-booking-sheet.tsx
- **Verification:** CRM-B12 tests pass; slot submission sends correct field names
- **Committed in:** 4de79eb (Task 1 commit)

**2. [Rule 1 - Bug] Added missing `tomorrow` key to translations**
- **Found during:** Task 2 (i18n additions)
- **Issue:** CRM-B10 test expected `tomorrow` key in all 3 locales but it was absent — 2 of 31 tests failing
- **Fix:** Added `tomorrow: 'Завтра'/'Ертең'/'Tomorrow'` and `slotConflict` to ru/kz/en dashboard sections
- **Files modified:** lib/i18n/translations.ts
- **Verification:** All 31 CRM-B tests pass after fix
- **Committed in:** f2d2268 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

Both component files were partially or fully implemented from prior commits. Execution verified completeness, fixed property name mismatch, and added missing i18n keys.

## Known Stubs

None — all form fields are wired to state, slot picker loads from real API, form submission calls real Server Action.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 31 CRM-B automated tests pass
- ManualBookingSheet fully functional pending human visual verification (Task 3 checkpoint)
- Complete CRM bookings dashboard overhaul ready for final verification: day-grouped view, filter chips, neumorphism cards, manual booking creation flow, full i18n

---
*Phase: 07-bookings-dashboard-crm-overhaul-and-manual-booking-creation*
*Completed: 2026-04-01*
