---
phase: 07-bookings-dashboard-crm-overhaul-and-manual-booking-creation
plan: "03"
subsystem: bookings-dashboard
tags: [neumorphism, crm, day-grouping, filtering, date-fns]
dependency_graph:
  requires: [07-01]
  provides: [day-grouped-bookings-view, cancelled-filter-toggle]
  affects: [components/bookings-dashboard.tsx]
tech_stack:
  added: [date-fns/locale/ru, date-fns-tz/toZonedTime]
  patterns: [groupBookingsByDay-map-helper, timezone-aware-getDayLabel, sticky-day-headers, neu-raised-booking-cards]
key_files:
  modified: [components/bookings-dashboard.tsx]
decisions:
  - "Use Map<string, BookingRow[]> for groupBookingsByDay — O(n) grouping, predictable ordering via sort on keys"
  - "Use string key comparison in getDayLabel (dateKey === todayKey) instead of isToday()/isTomorrow() to avoid machine-timezone vs tenant-timezone pitfall"
  - "effectiveStatuses computed inline: empty selection defaults to all-except-CANCELLED when showCancelled is false"
  - "Removed Table/TableBody/TableCell/TableHead/TableRow imports — replaced entirely with div-based Neumorphism cards"
  - "services prop added as optional (ServiceOption[]) for Plan 04 ManualBookingSheet compatibility"
metrics:
  duration_minutes: 20
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 7 Plan 03: Bookings Dashboard CRM View Summary

Day-grouped CRM booking view with default CANCELLED exclusion, toggle chip, sticky date headers, and Neumorphism neu-raised booking row cards replacing the flat table.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add default CANCELLED exclusion and showCancelled toggle | 7c81206 | components/bookings-dashboard.tsx |
| 2 | Replace flat table with day-grouped sections and Neumorphism cards | 8130785 | components/bookings-dashboard.tsx |

## What Was Built

### Task 1: CANCELLED Exclusion + Toggle Chip

- Added `showCancelled` state (default `false`) to `BookingsDashboard`
- Computed `effectiveStatuses` in `fetchTable`: when `showCancelled` is false and no filters active, uses `['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW']` — CANCELLED never reaches API by default
- When `showCancelled` is false and specific statuses are selected, CANCELLED is filtered out from the selection
- Added "Отменено" toggle chip with `aria-pressed`, `neu-raised` (inactive) / `neu-inset` (active) states
- Existing status chips updated from `rounded-full` to `rounded-xl` (Neumorphism spec), with `aria-pressed`
- Added `ServiceOption` type and optional `services?: ServiceOption[]` prop (forward-compatible with Plan 04)

### Task 2: Day-Grouped Neumorphism View

- Added `date-fns` (`format`, `ru` locale) and `date-fns-tz` (`toZonedTime`) imports
- Added `groupBookingsByDay(bookings, timezone)` — groups by `yyyy-MM-dd` key using Map, sorted ascending
- Added `getDayLabel(dateKey, timezone)` — returns "Сегодня, 30 марта" / "Завтра, 31 марта" / "dd MMMM" using string key comparison (timezone-safe)
- Replaced `<Table>/<TableRow>` with day-grouped `<div>` sections:
  - Sticky day headers: `sticky top-0 z-10 bg-[var(--neu-bg)] py-2 px-4 border-t border-border/30`
  - Booking rows: `neu-raised rounded-xl` cards with `font-semibold text-lg` time display
  - Within-day sort: ascending by `startsAt` string comparison
- Preserved: pagination controls, resource filter, date range inputs, status change buttons, calendar tab
- Removed unused Table imports (TableBody, TableCell, TableHead, TableHeader, TableRow)

## Requirements Delivered

| Requirement | Status | Test |
|-------------|--------|------|
| CRM-B01: CANCELLED excluded by default | PASS | CRM-B01 (2 tests) |
| CRM-B02: showCancelled toggle chip | PASS | CRM-B02 (2 tests) |
| CRM-B03: Sticky day-group headers with z-10 | PASS | CRM-B03 (4 tests) |
| CRM-B04: font-semibold text-lg on time | PASS | CRM-B04 (2 tests) |
| CRM-B09: neu-raised on booking rows (partial) | PASS | CRM-B09 (1/3 — dashboard part only) |

## Deviations from Plan

None — plan executed exactly as written.

Note: CRM-B09 has 3 sub-tests: 1 tests `bookings-dashboard.tsx` (passing), 2 test `manual-booking-sheet.tsx` (not in scope for Plan 03 — covered by Plan 04).

## Known Stubs

None — all filter and display logic is fully wired. `getDayLabel` returns live timezone-aware labels. `groupBookingsByDay` operates on real API response data.

## Self-Check: PASSED

- components/bookings-dashboard.tsx modified: FOUND
- Commit 7c81206: FOUND (feat(07-03): add showCancelled state...)
- Commit 8130785: FOUND (feat(07-03): replace flat table...)
- CRM-B01 through CRM-B04 tests passing: VERIFIED
- No TypeScript errors in modified file: VERIFIED
