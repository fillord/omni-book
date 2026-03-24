---
phase: 02-super-admin-god-mode-and-platform-management
plan: 04
subsystem: ui
tags: [next.js, prisma, server-actions, notifications, announcements, neumorphism, lucide]

# Dependency graph
requires:
  - phase: 02-01
    provides: Announcement and Notification Prisma models in schema
  - phase: 02-03
    provides: Admin layout with nav links pattern, god-mode test scaffold

provides:
  - Global announcement banner system (dismissible via localStorage)
  - Targeted in-app notification bell with unread badge
  - Admin announcement management UI at /admin/announcements
  - Super-admin notification send form on tenant drill-down page

affects: [dashboard, admin, notifications, announcements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server actions with ensureSuperAdmin guard for announcement/notification mutations
    - Client component with useState(false) + useEffect localStorage check to prevent hydration mismatch
    - Promise.all in dashboard layout for parallel data fetching (tenant + announcement + notifications)
    - Bell component receives initialUnreadCount/initialNotifications as props from server; manages state locally

key-files:
  created:
    - lib/actions/announcements.ts
    - lib/actions/notifications.ts
    - components/announcement-banner.tsx
    - components/notification-bell.tsx
    - app/admin/announcements/page.tsx
    - app/admin/announcements/announcement-form.tsx
    - app/admin/announcements/announcement-list.tsx
    - app/admin/tenants/[tenantId]/send-notification-form.tsx
  modified:
    - app/dashboard/layout.tsx
    - components/dashboard-sidebar.tsx
    - app/admin/tenants/[tenantId]/page.tsx
    - app/admin/layout.tsx
    - lib/i18n/translations.ts

key-decisions:
  - "AnnouncementBanner uses useState(false) initially — only shows after useEffect confirms localStorage key absent — prevents hydration mismatch between server HTML and client state"
  - "Only one announcement active at a time: createAnnouncement deactivates all existing before creating new one"
  - "NotificationBell receives initial data as props from server (SSR) and manages local state for optimistic UI updates"
  - "Inline Russian strings used in Bell dropdown and banners (admin notifications are Russian-only); translation keys added for future tenant-facing use"

patterns-established:
  - "Client component + props pattern: server fetches data, passes to client as initialX props, client manages local state + router.refresh() after mutations"
  - "Optimistic UI: update local state immediately, then call server action + router.refresh()"
  - "Announcement creation replaces active: deactivate all then create new (single active at a time)"

requirements-completed: [GOD-03, GOD-04, GOD-06]

# Metrics
duration: 30min
completed: 2026-03-24
---

# Phase 02 Plan 04: Announcement Banner and Notification Bell Summary

**Dismissible global announcement banner + Bell notification system: server actions, dashboard injection via Promise.all, admin /announcements page with create/deactivate/delete controls**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-24T09:30:00Z
- **Completed:** 2026-03-24T10:00:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Built complete global announcement pipeline: super-admin creates via `/admin/announcements` form, banner appears on all tenant dashboards, dismissible per-session via localStorage
- Built targeted notification system: super-admin sends from tenant drill-down page, Bell icon with unread badge in sidebar dropdown, mark-read and mark-all-read actions
- All 42 god-mode tests pass including GOD-03, GOD-04, GOD-06

## Task Commits

Each task was committed atomically:

1. **Task 1: Create announcement and notification server actions** - `8ecfeb3` (feat)
2. **Task 2: Create announcement banner, notification bell, wire into dashboard** - `d0583e1` (feat)
3. **Task 3: Create announcement management UI in admin panel** - `5506cb0` (feat)

## Files Created/Modified

- `lib/actions/announcements.ts` - Server actions: createAnnouncement (deactivates others first), deactivateAnnouncement, deleteAnnouncement, getAnnouncements with ensureSuperAdmin guard
- `lib/actions/notifications.ts` - Server actions: sendNotification (guarded), markNotificationRead, markAllNotificationsRead, getNotifications
- `components/announcement-banner.tsx` - Client component with useState(false) + useEffect localStorage check for dismiss persistence
- `components/notification-bell.tsx` - Bell icon with unread badge, DropdownMenu with mark-read/mark-all-read, neumorphic styling
- `app/dashboard/layout.tsx` - Extended to fetch announcement + notifications in Promise.all; renders AnnouncementBanner; passes tenantId/unreadCount/notifications to sidebar
- `components/dashboard-sidebar.tsx` - Extended Props type with tenantId/unreadCount/notifications; renders NotificationBell in avatar section
- `app/admin/announcements/page.tsx` - Server component with auth guard, fetches and renders AnnouncementForm + AnnouncementList
- `app/admin/announcements/announcement-form.tsx` - Client form with title + body inputs calling createAnnouncement
- `app/admin/announcements/announcement-list.tsx` - Client list with active badge, EyeOff (deactivate) and Trash2 (delete) buttons
- `app/admin/tenants/[tenantId]/send-notification-form.tsx` - Inline notification send form for super-admin
- `app/admin/tenants/[tenantId]/page.tsx` - Added Send Notification card below tabs
- `app/admin/layout.tsx` - Added Megaphone icon + /admin/announcements nav link
- `lib/i18n/translations.ts` - Added announcement/dismissBanner/notifications/noNotifications/markAllRead keys to ru, kz, en locales

## Decisions Made

- `useState(false)` initial value in AnnouncementBanner prevents hydration mismatch — server renders nothing, client enables banner after localStorage check in useEffect
- Only one announcement active at a time: `createAnnouncement` runs `updateMany({ isActive: false })` before creating new one — simplifies dashboard banner query to `findFirst`
- NotificationBell receives server-fetched data as `initialX` props for SSR, manages local state optimistically for instant UI feedback + `router.refresh()` for consistency
- Inline Russian strings in bell/banner UIs (admin-only context); i18n keys added to all 3 locales for tenant-facing future use

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Announcement banner system fully operational: super-admin creates/manages at /admin/announcements, tenants see banner on dashboard
- Notification bell fully operational: super-admin sends from drill-down, tenants see Bell with unread badge and can mark read
- GOD-03, GOD-04, GOD-06 requirements satisfied and tests passing
- Ready for wave 3 plans (02-05)

---
*Phase: 02-super-admin-god-mode-and-platform-management*
*Completed: 2026-03-24*

## Self-Check: PASSED

All created files verified present on disk. Task commits 8ecfeb3, d0583e1, 5506cb0 exist in git log.
