---
phase: 05-client-ui-outreach-polish
plan: 03
subsystem: ui
tags: [react, nextjs, prisma, telegram, crm, i18n, neumorphism]

# Dependency graph
requires:
  - phase: 05-01
    provides: i18n translation keys for clients section (27 keys per locale)
  - phase: 04-client-data-foundation
    provides: Client model with hasTelegram boolean, guestPhone booking pattern, syncClients action

provides:
  - Client detail page at /dashboard/clients/[clientId] with booking history table
  - sendTelegramToClient server action with ownership guard and chat ID lookup from booking
  - ClientDetail client component with conditional Telegram send form
affects: [future-crm-phases, outreach-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "guestPhone booking query: bookings fetched by guestPhone + tenantId (no Client->Booking[] relation)"
    - "hasTelegram conditional render: Telegram section conditionally mounted only when hasTelegram=true"
    - "Chat ID from booking: telegramChatId fetched from most recent booking, not Client model"
    - "Date serialization: server component converts Dates to ISO strings before passing to client components"
    - "useTransition for non-blocking server actions in client components"

key-files:
  created:
    - app/dashboard/clients/[clientId]/page.tsx
    - components/client-detail.tsx
  modified:
    - lib/actions/clients.ts

key-decisions:
  - "sendTelegramToClient fetches telegramChatId from booking (not Client model) — hasTelegram is boolean-only flag per Phase 4 decision"
  - "Empty message guard runs before requireAuth() to prevent Telegram API 400 errors and unnecessary auth checks"
  - "Cross-tenant access returns 404 via notFound() — consistent with Next.js App Router pattern"
  - "Telegram send section absent (not just disabled) for hasTelegram=false clients — replaced with informational notice card"

patterns-established:
  - "Client detail server page: getServerSession + ownership check + guestPhone booking query + date serialization"
  - "Conditional Telegram UI: hasTelegram gate controls entire send section mount, not just button disabled state"

requirements-completed: [CRM-09, CRM-10]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 5 Plan 03: Client Detail Page Summary

**CRM drill-down with booking history table and conditional Telegram outreach using sendTelegramToClient server action**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T16:11:13Z
- **Completed:** 2026-03-25T16:13:26Z
- **Tasks:** 2
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments

- `sendTelegramToClient` server action added to `lib/actions/clients.ts` with tenant ownership guard, empty message guard, and chat ID lookup from most recent booking
- Client detail page at `/dashboard/clients/[clientId]` renders client info card and booking history table (date, service, resource, price, status)
- `ClientDetail` client component conditionally shows Telegram send form for `hasTelegram=true` clients and an informational notice card for `hasTelegram=false` clients
- All 25 CRM-06 through CRM-12 tests pass (Plans 01+02+03 complete)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sendTelegramToClient server action** - `f455d82` (feat)
2. **Task 2: Create client detail page + ClientDetail component** - `b5af78c` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `lib/actions/clients.ts` - Appended sendTelegramToClient with empty message guard, ownership check, booking-based chat ID lookup
- `app/dashboard/clients/[clientId]/page.tsx` - Server page: session check, ownership check (notFound on mismatch), guestPhone booking query, date serialization
- `components/client-detail.tsx` - Client component: booking history table, conditional Telegram send form (hasTelegram=true), notice card (hasTelegram=false), useTransition for non-blocking send

## Decisions Made

- `sendTelegramToClient` fetches `telegramChatId` from the most recent booking (`orderBy: { startsAt: 'desc' }`) rather than the Client model — `hasTelegram` is a boolean-only flag per Phase 4 decision (no `telegramChatId` field on Client)
- Empty message guard `!message.trim()` executes before `requireAuth()` to short-circuit before unnecessary auth DB call
- Cross-tenant access returns 404 via `notFound()` rather than a custom error, consistent with Next.js App Router conventions
- Telegram send UI section is entirely absent (not just disabled) for `hasTelegram=false` clients — conditional mounting matches CRM-10 requirement

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Plan's verification command used `npx vitest run` but the project uses Jest (`npm test`). Tests were run with `npx jest` instead. All 25 CRM-06–CRM-12 tests passed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plans 01+02+03 complete: Phase 5 (Client UI, Outreach & Polish) is fully shipped
- All CRM-06 through CRM-12 tests pass (25/25)
- Client CRM surface complete: sidebar link, clients list with search, client detail with booking history and Telegram outreach

---
*Phase: 05-client-ui-outreach-polish*
*Completed: 2026-03-25*
