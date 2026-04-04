---
quick_task: 260404-g9o
subsystem: notifications/email/telegram
tags: [timezone, email, telegram, bugfix]
key-files:
  modified:
    - lib/email/resend.ts
    - lib/actions/bookings.ts
    - app/api/bookings/route.ts
    - lib/actions/services.ts
    - lib/i18n/translations.ts
decisions:
  - Asia/Almaty is the correct default for fmtDateTime — KZ market primary timezone
  - formatInTimeZone from date-fns-tz replaces bare format() for all notification date strings
  - tenant.timezone fetched explicitly in createManualBooking (was not included in select)
metrics:
  duration: "~15 minutes"
  completed: "2026-04-04"
  tasks: 1
  files_changed: 5
---

# Quick Task 260404-g9o: Fix Timezone Bug in Email Notifications

**One-liner:** Fixed UTC timezone default in all booking notification paths — emails and Telegram now show Asia/Almaty time using tenant.timezone with Asia/Almaty fallback.

## What Was Done

### Task 1: Fix fmtDateTime default and add timezone to all notification callers

**lib/email/resend.ts**
- Changed `fmtDateTime` default from `tz = 'UTC'` to `tz = 'Asia/Almaty'`
- This provides a safety net so any caller that omits timezone still gets correct KZ time

**lib/actions/bookings.ts** (createManualBooking)
- Added `timezone: true` to the tenant select query
- Added `timezone: tenant?.timezone ?? 'Asia/Almaty'` to `sendBookingConfirmation` call
- Replaced `import { format } from 'date-fns'` with `import { formatInTimeZone } from 'date-fns-tz'`
- Replaced bare `format(startsAtDate, ...)` calls with `formatInTimeZone(startsAtDate, tz, ...)` for Telegram notifications

**app/api/bookings/route.ts** (POST handler)
- Added `timezone: tenant.timezone ?? 'Asia/Almaty'` to `sendBookingConfirmation` call
- Replaced `import { format } from 'date-fns'` with `import { formatInTimeZone } from 'date-fns-tz'`
- Replaced bare `format(startsAt, ...)` calls with `formatInTimeZone(startsAt, tz, ...)` for Telegram notifications

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Remove requireDeposit/depositAmount from services.ts Prisma create/update**
- **Found during:** npm run build verification
- **Issue:** `lib/actions/services.ts` still referenced `requireDeposit` and `depositAmount` in Prisma calls, but these fields were removed from the Service model in Phase 12 (Kaspi Pay removal). Build failed with `TS2353`/`TS2339` type errors.
- **Fix:** Removed both field assignments from `db.service.create({ data: {...} })` and from `updateData.requireDeposit`/`updateData.depositAmount` lines in `updateService`.
- **Files modified:** `lib/actions/services.ts`
- **Commit:** 68ccbcf

**2. [Rule 1 - Bug] Remove duplicate `payment` translation keys in all 3 locales**
- **Found during:** npm run build verification
- **Issue:** `lib/i18n/translations.ts` had duplicate `payment:` object keys in ru, kz, and en locales. Phase 12 added a small `payment: { whatsappPrepayment: '...' }` block alongside an existing larger `payment: { ... }` block that already contained `whatsappPrepayment`. TypeScript error `TS1117: An object literal cannot have multiple properties with the same name`.
- **Fix:** Removed the small standalone `payment` blocks added in Phase 12 for all 3 locales (ru, kz, en). The `whatsappPrepayment` key was already present in each locale's main `payment` block.
- **Files modified:** `lib/i18n/translations.ts`
- **Commit:** 68ccbcf

## Verification Results

- `grep -n "tz = 'UTC'" lib/email/resend.ts` — returns nothing (UTC default removed)
- `grep -n "Asia/Almaty" lib/email/resend.ts lib/actions/bookings.ts app/api/bookings/route.ts` — timezone present in all three files
- `grep -n "format(startsAt\|format(startsAtDate" lib/actions/bookings.ts app/api/bookings/route.ts` — returns nothing (bare format calls replaced)
- `npx tsc --noEmit` — no errors in modified files (pre-existing test file regex flag warnings only)
- `npm run build` — clean build, all pages compiled successfully

## Known Stubs

None — all notification paths now wire tenant timezone correctly.

## Self-Check: PASSED

- [x] `lib/email/resend.ts` modified — fmtDateTime defaults to Asia/Almaty
- [x] `lib/actions/bookings.ts` modified — formatInTimeZone + timezone passed to email
- [x] `app/api/bookings/route.ts` modified — formatInTimeZone + timezone passed to email
- [x] Commit 68ccbcf exists
- [x] Build passes clean
