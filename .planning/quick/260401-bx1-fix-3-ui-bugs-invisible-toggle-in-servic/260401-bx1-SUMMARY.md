---
phase: 260401-bx1
plan: 01
subsystem: ui
tags: [tailwind, dark-mode, nextjs, sidebar, billing]

# Dependency graph
requires: []
provides:
  - Visible requireDeposit toggle track (bg-muted) in service form for both light and dark mode
  - Billing settings page with only kaspiMerchantId and kaspiApiKey fields
  - Sidebar exact-match active check for /dashboard/settings to prevent double-highlight
affects: [service-form, billing-settings, dashboard-sidebar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Use bg-muted (not bg-input) for toggle track unchecked state — bg-input is transparent in dark neumorphism theme
    - Settings-type sidebar links that have child routes should use exact: true to avoid startsWith collision

key-files:
  created: []
  modified:
    - components/service-form.tsx
    - app/dashboard/settings/billing/billing-content.tsx
    - lib/actions/payment-settings.ts
    - components/dashboard-sidebar.tsx

key-decisions:
  - "Toggle track uses bg-muted not bg-input: bg-input maps to near-transparent in dark neumorphism theme; bg-muted always visible"
  - "Deposit settings removed from billing page: requireDeposit/depositAmount are now per-service, not tenant-level"
  - "Settings sidebar link exact: true: prevents /dashboard/settings/billing from also activating the parent Settings link"

patterns-established:
  - "Toggle unchecked track: bg-muted guarantees visible slate/gray in all themes"
  - "Sidebar nav exact flag: parent routes that have active children use exact: true"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-04-01
---

# Quick Task 260401-bx1: Fix 3 UI Bugs Summary

**Patched invisible service-form toggle (bg-muted track), stripped obsolete deposit fields from billing settings, and fixed sidebar double-highlight with exact-match on /dashboard/settings.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-01T00:00:00Z
- **Completed:** 2026-04-01T00:12:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Toggle track in service form is now visible in dark mode — replaced `bg-input` (transparent) with `bg-muted` (visible slate/gray)
- Billing settings page now shows only Kaspi Merchant ID and Kaspi API Key — removed requireDeposit checkbox, depositAmount input, and their state/type references
- Sidebar no longer double-highlights Settings + Billing when visiting `/dashboard/settings/billing` — settings link now uses `exact: true`

## Task Commits

1. **Task 1: Fix invisible toggle in service-form.tsx** - `952c85e` (fix)
2. **Task 2: Remove deposit fields from billing settings** - `5bed4b2` (fix)
3. **Task 3: Fix sidebar double-highlight** - `548bf47` (fix)

## Files Created/Modified

- `components/service-form.tsx` - Toggle track changed from `bg-input` to `bg-muted` on unchecked state
- `app/dashboard/settings/billing/billing-content.tsx` - Removed requireDeposit/depositAmount type fields, state, JSX; Kaspi-only form; simplified handleSaveDeposit
- `lib/actions/payment-settings.ts` - Removed requireDeposit/depositAmount from action type and Prisma update call
- `components/dashboard-sidebar.tsx` - Settings nav item changed from `exact: false` to `exact: true`

## Decisions Made

- `bg-muted` chosen for toggle unchecked track because it renders a consistent slate/gray in both light and dark neumorphism themes, whereas `bg-input` maps to a transparent value in dark mode
- Deposit fields removed entirely from billing page because they are now managed per-service in service-form.tsx
- `exact: true` on settings link is the minimal targeted fix — billing link keeps `exact: false` to handle any future `/dashboard/settings/billing/*` sub-routes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All three bugs resolved. No blockers. Service form toggle, billing settings, and sidebar navigation are consistent and correct in both light and dark mode.

---
*Quick Task: 260401-bx1*
*Completed: 2026-04-01*
