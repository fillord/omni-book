---
phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links
plan: 03
subsystem: api, ui
tags: [nextjs, prisma, telegram, neumorphism, react, typescript]

# Dependency graph
requires:
  - phase: 06-02
    provides: "BookingManagePage component with cancel button, cancel API route, public manage/[token] page"

provides:
  - "POST /api/manage/[token]/reschedule - auth-free reschedule endpoint with Serializable transaction, collision detection, 4-hour rule re-check, Telegram notification"
  - "BookingManagePage with full slot picker calendar: date navigation, slot grid, confirm reschedule flow, success state"

affects:
  - "06-04 — confirmation link phase has full reschedule endpoint available for integration"
  - "public-facing manage page UX"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Serializable transaction with SELECT FOR UPDATE for slot conflict detection on reschedule"
    - "rescheduleMode state pattern with useEffect slot fetching on date change"
    - "Fire-and-forget Telegram notification on booking mutation in auth-free route"

key-files:
  created:
    - app/api/manage/[token]/reschedule/route.ts
  modified:
    - components/booking-manage-page.tsx

key-decisions:
  - "Reschedule updates booking startsAt/endsAt in-place (same record, no new booking) inside Serializable transaction"
  - "SELECT FOR UPDATE on Resource row prevents concurrent reschedule races"
  - "Collision check excludes current booking by id — allows re-selecting the same slot"
  - "selectedDate initialized to tomorrow on reschedule mode open — avoids showing today's potentially-past slots"
  - "rescheduledSlotDisplay derived from last selectedSlot state — survives rescheduleMode=false reset"

patterns-established:
  - "Serializable + FOR UPDATE: use for any booking mutation that must be conflict-free"
  - "Slot grid: grid-cols-3 with neu-inset on selected, neu-raised on unselected"

requirements-completed: [TOK-05, TOK-06]

# Metrics
duration: 2min
completed: 2026-03-28
---

# Phase 06 Plan 03: Reschedule API and Calendar UI Summary

**Auth-free reschedule endpoint with Serializable conflict detection, Telegram notification, and slot picker calendar integrated into BookingManagePage**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-28T12:13:42Z
- **Completed:** 2026-03-28T12:15:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- POST /api/manage/[token]/reschedule validates token, re-checks 4-hour rule, detects slot conflicts in Serializable transaction with SELECT FOR UPDATE, updates booking in place, and fires Telegram notification to tenant
- BookingManagePage now has a full reschedule calendar: date navigation (prev/next day, constrained to future), slot grid, selected slot state, confirm button, and success message
- All 24 booking-manage-surface tests pass (TOK-01 through TOK-07)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reschedule API route** - `e138b11` (feat)
2. **Task 2: Add RescheduleCalendar UI to BookingManagePage** - `207ae5a` (feat)

## Files Created/Modified
- `app/api/manage/[token]/reschedule/route.ts` - Auth-free reschedule POST endpoint with collision detection and Telegram notification
- `components/booking-manage-page.tsx` - Added rescheduleMode state, date navigation, slot grid, confirm flow, success state

## Decisions Made
- Reschedule updates booking in-place (same id, new startsAt/endsAt) — no new booking created, matches plan spec
- Serializable isolation + SELECT FOR UPDATE on Resource prevents concurrent slot conflicts
- `conflicted` flag set inside transaction, checked outside to return 409 after transaction completes
- `rescheduledSlotDisplay` derived from `selectedSlot` before `rescheduleMode` is reset to false, preserving the time for the success message
- selectedDate initialized to tomorrow on mode open — today's slots may be in the past

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Reschedule endpoint at /api/manage/[token]/reschedule is live and tested
- BookingManagePage fully functional with both cancel and reschedule flows
- Plan 06-04 (email/Telegram confirmation links) can reference the completed manage surface

---
*Phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links*
*Completed: 2026-03-28*
