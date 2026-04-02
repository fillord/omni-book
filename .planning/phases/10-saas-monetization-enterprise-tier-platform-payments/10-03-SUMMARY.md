---
phase: 10-saas-monetization-enterprise-tier-platform-payments
plan: 03
subsystem: ui
tags: [nextjs, prisma, server-actions, neumorphism, admin, saas]

# Dependency graph
requires:
  - phase: 10-saas-monetization-enterprise-tier-platform-payments
    plan: 01
    provides: SubscriptionPlan Prisma model, basePrisma, ensureSuperAdmin pattern from admin.ts
provides:
  - updateSubscriptionPlan Server Action in lib/actions/admin-plans.ts
  - Admin /admin/plans RSC page fetching SubscriptionPlan rows
  - PlanEditorClient inline-edit table component with useTransition
  - AdminNav component with Тарифы link (CreditCard icon) at /admin/plans
  - ensureSuperAdmin() exported from lib/auth/guards.ts
affects: [plan-04-billing-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - RSC page serializes Prisma Date fields to ISO strings before passing to client component
    - useTransition wraps Server Action call for pending state without useState spinner boilerplate
    - AdminNav extracted to separate 'use client' component — layout.tsx remains RSC

key-files:
  created:
    - lib/actions/admin-plans.ts
    - app/admin/plans/page.tsx
    - app/admin/plans/plan-editor-client.tsx
    - app/admin/admin-nav.tsx
  modified:
    - lib/auth/guards.ts

key-decisions:
  - "ensureSuperAdmin added to guards.ts rather than inlined — centralizes the pattern, consistent with other guards"
  - "AdminNav created as new 'use client' component — layout.tsx stays server; usePathname requires client boundary"
  - "Inline-edit uses single editingId state — only one row editable at a time, avoids multi-row save conflicts"
  - "pricePerResource displayed as dash for non-ENTERPRISE plans — reduces visual noise for FREE/PRO rows"

patterns-established:
  - "Pattern: RSC fetches data, serializes dates (.toISOString()), passes to client — avoids non-serializable Date errors"
  - "Pattern: Server Action returns { success: boolean; error?: string } — uniform response shape for UI feedback"

requirements-completed: [MON-03]

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 10 Plan 03: Admin Plan Editor Summary

**Super admin /admin/plans page with inline-edit SubscriptionPlan table backed by updateSubscriptionPlan Server Action with ensureSuperAdmin guard, and Тарифы nav link with CreditCard icon**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T07:07:07Z
- **Completed:** 2026-04-02T07:09:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `updateSubscriptionPlan` Server Action with `ensureSuperAdmin` guard and `revalidatePath('/admin/plans')`
- Admin `/admin/plans` RSC page that fetches all SubscriptionPlan rows ordered by plan type
- `PlanEditorClient` inline-edit table with `useTransition`, per-row edit/save/cancel, success/error messages
- `AdminNav` component with Тарифы link (CreditCard icon) inserted after Компании in the nav order
- `ensureSuperAdmin()` exported from `lib/auth/guards.ts` (was missing — added as Rule 2 deviation)

## Task Commits

Each task was committed atomically:

1. **Task 1: updateSubscriptionPlan Server Action** - `d578c01` (feat)
2. **Task 2: Admin plans page + editor client + nav link** - `1658e07` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/actions/admin-plans.ts` - updateSubscriptionPlan Server Action with ensureSuperAdmin guard
- `app/admin/plans/page.tsx` - RSC fetching all SubscriptionPlan rows, serializing dates for client
- `app/admin/plans/plan-editor-client.tsx` - Inline-edit table with Neumorphism styling, useTransition
- `app/admin/admin-nav.tsx` - AdminNav 'use client' component with CreditCard Тарифы link
- `lib/auth/guards.ts` - Added ensureSuperAdmin() export

## Decisions Made
- `ensureSuperAdmin` added to `guards.ts` rather than inlined in `admin-plans.ts` — centralizes the pattern and avoids duplication across future admin server actions
- `AdminNav` extracted as a separate `'use client'` component — this matches the pattern in the main branch and ensures `layout.tsx` remains a server component (required for session access)
- Single `editingId` state — only one row is editable at a time, preventing concurrent save conflicts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added ensureSuperAdmin to lib/auth/guards.ts**
- **Found during:** Task 1 (updateSubscriptionPlan Server Action)
- **Issue:** Plan specified `import { ensureSuperAdmin } from '@/lib/auth/guards'` but `ensureSuperAdmin` was not exported from `guards.ts` — it existed only as a private inline function in `lib/actions/admin.ts`
- **Fix:** Added `export async function ensureSuperAdmin(): Promise<void>` to `guards.ts` following the same logic as `admin.ts` (checks SUPERADMIN role or admin@omnibook.com fallback)
- **Files modified:** lib/auth/guards.ts
- **Verification:** Import resolves, guard invoked in Task 1 server action
- **Committed in:** d578c01 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Created app/admin/admin-nav.tsx**
- **Found during:** Task 2 (Admin plans page + nav link)
- **Issue:** The worktree branch (starting from pre-neumorphism commit b93f408) does not have `admin-nav.tsx` — it was created in commit `93fdab4` on the main branch. The plan's Task 2 requires adding the Тарифы link to `admin-nav.tsx`
- **Fix:** Created `admin-nav.tsx` matching the version from `93fdab4` plus the new Тарифы/CreditCard entry after Компании
- **Files modified:** app/admin/admin-nav.tsx (new file)
- **Verification:** grep "/admin/plans" passes, CreditCard imported, Тарифы label present
- **Committed in:** 1658e07 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin plan editor complete — super admin can now update SubscriptionPlan pricing/limits at runtime without code deploys
- Plan 04 (billing UI) can proceed: tenant-facing billing page needs plan data, which is now editable from admin
- No blockers

---
*Phase: 10-saas-monetization-enterprise-tier-platform-payments*
*Completed: 2026-04-02*
