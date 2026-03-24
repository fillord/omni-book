---
phase: 02-super-admin-god-mode-and-platform-management
plan: 05
subsystem: audit
tags: [prisma, nextjs, server-actions, audit-log, neumorphism]

# Dependency graph
requires:
  - phase: 02-01
    provides: AuditLog Prisma model with tenantId, eventType, details, createdAt fields
  - phase: 02-02
    provides: Admin layout with sidebar nav pattern
provides:
  - Fire-and-forget createAuditLog helper (lib/actions/audit-log.ts)
  - Login audit hook in lib/auth/config.ts authorize()
  - Plan change audit hooks in lib/actions/admin.ts updateTenantPlan
  - Service deletion audit hook in lib/actions/services.ts deleteService
  - Resource deletion audit hook in lib/actions/resources.ts deleteResource
  - Staff deletion audit hook in lib/actions/staff.ts removeStaff
  - Filterable audit log viewer at /admin/audit-logs (tenant, event type, date range)
  - AuditLogFilters client component with from/to date inputs
  - Audit Logs nav link in admin sidebar
affects:
  - future super-admin pages that need to read audit logs
  - 02-super-admin-god-mode-and-platform-management

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget audit log pattern using .catch(() => {}) — never blocks primary action
    - Audit hook placement after primary DB operation, before revalidatePath
    - Server component reads searchParams for filter state; client component writes via router.push

key-files:
  created:
    - lib/actions/audit-log.ts
    - app/admin/audit-logs/page.tsx
    - app/admin/audit-logs/audit-log-filters.tsx
  modified:
    - lib/actions/admin.ts
    - lib/actions/services.ts
    - lib/actions/resources.ts
    - lib/actions/staff.ts
    - lib/auth/config.ts
    - app/admin/layout.tsx

key-decisions:
  - "createAuditLog is NOT a server action (no 'use server') — plain helper to avoid double-wrapping"
  - "Fire-and-forget: no await on createAuditLog calls; .catch(() => {}) in helper guarantees no crash"
  - "Login audit skips SUPERADMIN (tenantId null check) — audit only for tenant users"
  - "Plan change direction detected by PLAN_ORDER map (FREE=0, PRO=1, ENTERPRISE=2)"
  - "Date range filter uses T00:00:00.000Z and T23:59:59.999Z to capture full day boundaries"
  - "Service/resource metadata fetched before delete so name is available for audit details"

patterns-established:
  - "Audit hook pattern: fetch metadata before delete, fire createAuditLog after, before revalidatePath"
  - "AuditLogFilters: client component reads/writes URL searchParams; server page reads searchParams for Prisma where clause"

requirements-completed: [GOD-05, GOD-06]

# Metrics
duration: 25min
completed: 2026-03-24
---

# Phase 02 Plan 05: Audit & Activity Log System Summary

**Fire-and-forget createAuditLog helper hooked into 5 server actions (login, plan change, service/resource/staff delete) with filterable /admin/audit-logs viewer supporting tenant, event type, and date range filters**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-24T~09:10:00Z
- **Completed:** 2026-03-24T~09:35:00Z
- **Tasks:** 2 of 2
- **Files modified:** 9 (6 modified, 3 created)

## Accomplishments
- Created `lib/actions/audit-log.ts` with fire-and-forget `createAuditLog` helper — never blocks primary actions via `.catch(() => {})`
- Hooked audit logging into 5 critical actions: login (auth/config.ts), plan upgrade/downgrade (admin.ts), service deletion (services.ts), resource deletion (resources.ts), staff deletion (staff.ts)
- Built `/admin/audit-logs` server page with pagination and filters for tenant, event type, and date range (from/to date inputs)
- Added `AuditLogFilters` client component with neumorphism styling (neu-inset, no border-border)
- Added "Логи действий" nav link with FileText icon to admin sidebar

## Task Commits

Each task was committed atomically:

1. **Task 1: Create audit-log helper and hook into existing actions** - pending commit (feat)
2. **Task 2: Create audit log viewer page with filters and add nav link** - pending commit (feat)

**Plan metadata:** pending commit (docs)

## Files Created/Modified
- `lib/actions/audit-log.ts` — Fire-and-forget createAuditLog helper with AuditEventType union type
- `lib/actions/admin.ts` — Import + plan_upgrade/plan_downgrade audit in updateTenantPlan
- `lib/actions/services.ts` — Import + service_deleted audit in deleteService
- `lib/actions/resources.ts` — Import + resource_deleted audit in deleteResource
- `lib/actions/staff.ts` — Import + staff_deleted audit in removeStaff
- `lib/auth/config.ts` — Import + login audit in authorize() (skips SUPERADMIN with null tenantId)
- `app/admin/audit-logs/page.tsx` — Async server component with Prisma query + date range filter
- `app/admin/audit-logs/audit-log-filters.tsx` — 'use client' component with 2 date inputs + 2 selects
- `app/admin/layout.tsx` — Added FileText import + Логи действий nav link

## Decisions Made
- `createAuditLog` is a plain async helper (no `'use server'`) — server actions and auth config import it directly
- Fire-and-forget via `.catch(() => {})` in the helper itself, not at call sites — callers don't need to remember to suppress errors
- Login audit skips SUPERADMIN: `if (user.tenantId)` guard ensures null tenantId users (SUPERADMIN) are not logged
- Plan change direction computed via `PLAN_ORDER = { FREE: 0, PRO: 1, ENTERPRISE: 2 }` — upgrade if newOrder > oldOrder
- Date range filter adds `createdAt: { gte, lte }` to Prisma `where` clause using UTC day boundaries
- Service/resource metadata fetched with `findUnique` before delete to capture name for audit details

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Audit log system fully operational — createAuditLog can be imported anywhere for future hooks
- /admin/audit-logs viewer ready for super-admin use
- Phase 02 complete: all 5 plans shipped (01-schema, 02-tenant-mgmt, 03-analytics, 04-announcements, 05-audit-log)

---
*Phase: 02-super-admin-god-mode-and-platform-management*
*Completed: 2026-03-24*
