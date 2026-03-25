---
phase: 05-client-ui-outreach-polish
plan: 01
subsystem: ui
tags: [i18n, sidebar, navigation, testing, crm, translations]

# Dependency graph
requires:
  - phase: 04-client-data-foundation
    provides: Client model, syncClients and getClients server actions
provides:
  - Static file assertion test scaffold for CRM-06 through CRM-12
  - clients i18n section in all three locales (ru, kz, en) with 27 keys each
  - Sidebar navigation link to /dashboard/clients with Users icon
affects:
  - 05-02 (clients table + page implementation)
  - 05-03 (client detail + Telegram outreach implementation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - safeRead helper (fs.existsSync check before readFileSync) used for static file assertions
    - Static file assertion tests use `safeRead` to avoid throws on missing files — tests fail with assertion errors, not ReferenceErrors

key-files:
  created:
    - __tests__/client-ui-surface.test.ts
  modified:
    - lib/i18n/translations.ts
    - components/dashboard-sidebar.tsx

key-decisions:
  - "Test scaffold created before implementation (test-first) — CRM-06 sidebar + CRM-12 translation tests pass immediately; CRM-07 through CRM-11 fail until Plans 02+03 implement the files"
  - "clients section uses section: 'clients' translation namespace in sidebar items array, consistent with existing section-based i18n pattern"
  - "27 translation keys per locale covers full client UI surface: table columns, search, Telegram outreach, booking history, sync operations"

patterns-established:
  - "Sidebar items array uses { href, section, tKey, icon, exact } shape — clients entry follows this pattern with section: 'clients'"
  - "Test scaffold for a feature group (CRM-06 through CRM-12) created as a single test file with one describe block per requirement ID"

requirements-completed: [CRM-06, CRM-12]

# Metrics
duration: 15min
completed: 2026-03-25
---

# Phase 5 Plan 01: Client UI Surface Summary

**Jest test scaffold (25 tests across 7 CRM requirements) + clients i18n section (81 keys across 3 locales) + sidebar Clients link with Users icon**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-25T00:00:00Z
- **Completed:** 2026-03-25T11:06:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `__tests__/client-ui-surface.test.ts` with 25 static file assertion tests covering CRM-06 through CRM-12 using the `safeRead` pattern
- Added `clients` section to all three locales in `lib/i18n/translations.ts` (27 keys × 3 locales = 81 keys total)
- Added `Users` icon + `/dashboard/clients` navigation entry to `components/dashboard-sidebar.tsx` items array

## Task Commits

Each task was committed atomically:

1. **Task 1: Create static file assertion test scaffold for CRM-06 through CRM-12** - `24f59fc` (test)
2. **Task 2: Add i18n clients section + sidebar link** - `d9bc3c7` (feat)

## Files Created/Modified
- `__tests__/client-ui-surface.test.ts` - Static file assertion tests for all 7 Phase 5 CRM requirements; 25 tests, 8 pass immediately (CRM-06 + CRM-12), 17 fail as expected until implementation in Plans 02+03
- `lib/i18n/translations.ts` - Added `clients:` section to `ru`, `kz`, and `en` locales with 27 keys each: table columns, search placeholder, Telegram outreach strings, booking history labels, sync operations
- `components/dashboard-sidebar.tsx` - Added `Users` to lucide-react import and `{ href: '/dashboard/clients', section: 'clients', tKey: 'title', icon: Users, exact: false }` to items array

## Decisions Made
- Test scaffold runs with Jest (not Vitest — plan verification command said `npx vitest run` but project uses `npm test` / `npx jest`); tests pass correctly under Jest
- CRM-06 and CRM-12 tests pass immediately since the sidebar and translations are implemented in this plan; remaining CRM-07 through CRM-11 tests fail with assertion errors (not throws) because implementation files don't exist yet — this is the intended behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Verification command in plan used `npx vitest run` but project uses Jest; test file works correctly under `npx jest` — this is a documentation-only mismatch in the plan, not a code issue.

## Next Phase Readiness
- Test scaffold in place for all 7 Phase 5 requirements — Plans 02 and 03 will make the failing tests pass
- Sidebar link and translations ready — Plan 02 can implement the clients page and table component without additional navigation or i18n work

---
*Phase: 05-client-ui-outreach-polish*
*Completed: 2026-03-25*
