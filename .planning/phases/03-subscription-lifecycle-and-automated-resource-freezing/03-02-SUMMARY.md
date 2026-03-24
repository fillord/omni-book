---
phase: 03-subscription-lifecycle-and-automated-resource-freezing
plan: 02
subsystem: ui
tags: [react, nextjs, prisma, subscription, frozen-state, dashboard]

# Dependency graph
requires:
  - phase: 03-01
    provides: isFrozen boolean on Resource and Service models, CANCELED/EXPIRED PlanStatus enum values
provides:
  - Frozen badge (Заморожен) with neu-inset styling on frozen resources and services in dashboard managers
  - Edit/Delete buttons disabled on frozen resources and services
  - Staff invite button disabled when tenant planStatus === EXPIRED
  - Expired notice text shown in staff manager when subscription is expired
  - planStatus queried from DB and passed to StaffManager from server page
affects: [04-tenant-ux, billing-ui, staff-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isFrozen conditional badge: render `{resource.isFrozen && <span>Заморожен</span>}` after isActive badge in both mobile card and desktop table views"
    - "Disabled button pattern: `disabled={isPending || resource.isFrozen}` — combine with existing disabled condition"
    - "planStatus server-side query: parent server page fetches `tenant.planStatus` via basePrisma, passes as optional string prop"

key-files:
  created: []
  modified:
    - components/resources-manager.tsx
    - components/services-manager.tsx
    - components/staff-manager.tsx
    - app/dashboard/staff/page.tsx

key-decisions:
  - "DialogTrigger uses asChild to properly forward disabled prop to the inner Button for invite staff"
  - "planStatus passed as optional string (not enum type) to keep component generic and avoid import coupling"
  - "Expired notice placed between CardHeader and CardContent so it's always visible regardless of member list state"

patterns-established:
  - "Frozen badge placement: after active/inactive status indicator in both mobile card and desktop table cell"
  - "Frozen badge class: neu-inset bg-[var(--neu-bg)] text-orange-500 text-xs font-medium rounded-full px-2.5 py-1"
  - "Frozen button guard: add || resource.isFrozen (or service.isFrozen) to existing disabled={isPending} condition"

requirements-completed: [SUB-03, SUB-06]

# Metrics
duration: 15min
completed: 2026-03-24
---

# Phase 03 Plan 02: Frozen State Visual Indicators and Interaction Locks Summary

**Frozen badges and disabled Edit/Delete buttons for resources/services, plus EXPIRED lock on staff invite using planStatus prop passed from server page**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-24T10:44:12Z
- **Completed:** 2026-03-24T10:59:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Resources and services tables show orange "Заморожен" badge with neu-inset neumorphism styling on frozen items (both mobile card and desktop table)
- Edit and Delete buttons disabled on frozen resources/services preventing mutation of frozen data
- StaffManager accepts `planStatus` prop; invite button disabled when EXPIRED with human-readable notice
- Server-side staff page queries `tenant.planStatus` from DB and passes it to StaffManager

## Task Commits

Each task was committed atomically:

1. **Task 1: Frozen badges and disabled actions in resources-manager and services-manager** - `5a44be8` (feat)
2. **Task 2: Staff manager EXPIRED lock with planStatus prop** - `a35972f` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified
- `components/resources-manager.tsx` - Added `r.isFrozen` badge (mobile + desktop) and `disabled={isPending || r.isFrozen}` on Edit/Delete buttons
- `components/services-manager.tsx` - Added `s.isFrozen` badge (mobile + desktop) and `disabled={isPending || s.isFrozen}` on Edit/Delete buttons
- `components/staff-manager.tsx` - Added `planStatus` prop, `isExpired` derived boolean, disabled invite button, expired notice text
- `app/dashboard/staff/page.tsx` - Added `basePrisma` query for `tenant.planStatus`, passes to `StaffManager`

## Decisions Made
- Used `DialogTrigger asChild` to correctly forward `disabled={isExpired}` to the inner Button (without asChild, disabled on trigger doesn't propagate to the rendered button)
- planStatus typed as `string | undefined` rather than `PlanStatus` enum to avoid cross-layer import coupling
- Expired notice placed between CardHeader and CardContent for persistent visibility

## Deviations from Plan

None - plan executed exactly as written. Task 1 was already committed (`5a44be8`) prior to this execution session; Task 2 completed the remaining work.

## Issues Encountered
- Pre-existing test failures in `booking-surface.test.ts`, `cleanup-surface.test.ts`, and `landing-surface.test.ts` (28 tests) existed before this plan and are unrelated to frozen UI changes — they concern booking-form.tsx color maps and landing component styling, out of scope for plan 03-02.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Frozen UI indicators complete: tenants can see which items are frozen and cannot accidentally edit/delete them
- Staff invite gate complete: EXPIRED tenants see clear messaging about restricted access
- Ready for Plan 03-03 (billing page expiry display and renewSubscription action) and remaining subscription lifecycle plans

---
*Phase: 03-subscription-lifecycle-and-automated-resource-freezing*
*Completed: 2026-03-24*
