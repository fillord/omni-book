---
phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links
plan: 02
subsystem: booking-management
tags: [tokenized-booking, public-page, cancel-api, neumorphism, auth-free]
dependency_graph:
  requires: [06-01]
  provides: [public-manage-page, cancel-api-route]
  affects: [booking-cancellation-flow]
tech_stack:
  added: []
  patterns: [server-to-client-date-serialization, auth-free-token-api, neumorphism-public-page]
key_files:
  created:
    - app/manage/[token]/page.tsx
    - components/booking-manage-page.tsx
    - app/api/manage/[token]/cancel/route.ts
  modified: []
decisions:
  - "basePrisma used for both page and cancel route (cross-tenant public lookup, no tenant scoping needed)"
  - "4-hour rule enforced both server-side (page canManage flag) and in API route (prevents stale UI exploitation)"
  - "Reschedule button shown as disabled placeholder — Plan 03 will enable it"
  - "Date formatting uses Intl.DateTimeFormat with tenant timezone for correct local time display"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_changed: 3
---

# Phase 6 Plan 02: Public Booking Management Page and Cancel API Summary

**One-liner:** Neumorphic public /manage/[token] page with server-side 4-hour cutoff check and auth-free cancel API route using manageToken as authorization.

## What Was Built

Created the public-facing booking management surface — a Next.js server page at `/manage/[token]` that looks up bookings by their unique `manageToken`, computes the 4-hour management cutoff server-side, and renders a Neumorphism-styled client component. Added an auth-free cancel API route that re-validates the 4-hour rule server-side before updating the booking status.

## Tasks Completed

### Task 1: /manage/[token] server page and BookingManagePage client component

**Files created:**
- `app/manage/[token]/page.tsx` — Server component that queries booking via `basePrisma.booking.findUnique({ where: { manageToken: token } })`, calls `notFound()` for missing tokens, computes `canManage` flag, serializes dates to ISO strings, and renders `BookingManagePage`
- `components/booking-manage-page.tsx` — Client component displaying booking details (service, resource, date/time in tenant timezone), status badge, and action buttons; shows Russian disabled message when `canManage === false`

**Key implementation details:**
- `canManage = now < cutoff && ['CONFIRMED', 'PENDING'].includes(booking.status)` ensures both time and status requirements
- When `canManage === false`, displays: "Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую" with clickable `tel:` phone link
- Reschedule button is visible but disabled (Plan 03 scope)
- Post-cancel success state shows "Запись отменена" confirmation

### Task 2: Cancel API route at /api/manage/[token]/cancel

**File created:**
- `app/api/manage/[token]/cancel/route.ts` — Auth-free POST handler that: looks up booking by `manageToken`, validates cancellable status (404/422), re-checks 4-hour rule server-side, updates status to `CANCELLED`

**Key implementation details:**
- Zero auth imports — no `getServerSession`, no `requireAuth`
- Server-side 4-hour validation: `now >= cutoff` returns 422 with Russian error message
- Uses `basePrisma` (not `getTenantDB`) for cross-tenant access

## Verification Results

- TOK-02 (5 tests): All pass — page file exists, contains `notFound`, `basePrisma`, component has `neu-raised`
- TOK-03 (2 tests): All pass — component contains `canManage`, Russian disabled message
- TOK-04 (4 tests): All pass — cancel route exists, contains `CANCELLED`, no auth imports
- TypeScript: No errors in new files (pre-existing test file errors unrelated)
- Auth check: `grep` confirms 0 auth imports in cancel route

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `app/manage/[token]/page.tsx` exists and contains `basePrisma`, `notFound`, `manageToken`, `canManage`, `.toISOString()`
- `components/booking-manage-page.tsx` exists, starts with `"use client"`, contains `canManage`, `neu-raised`, `bg-[var(--neu-bg)]`, `Для отмены или переноса`, `/api/manage/`
- `app/api/manage/[token]/cancel/route.ts` exists, contains `POST`, `CANCELLED`, `basePrisma`, `manageToken`, `4 * 60 * 60 * 1000`, no auth imports
- Commits: 9934e19 (Task 1), 0022478 (Task 2)
