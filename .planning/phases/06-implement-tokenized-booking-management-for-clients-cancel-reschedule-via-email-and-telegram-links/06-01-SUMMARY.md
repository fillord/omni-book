---
phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links
plan: "01"
subsystem: database
tags: [prisma, crypto, uuid, booking, token, testing]

# Dependency graph
requires:
  - phase: 05-client-ui-outreach-and-polish
    provides: Booking model with telegramChatId, createBooking function in engine.ts

provides:
  - manageToken String? @unique field on Booking model in Prisma schema
  - crypto.randomUUID() token generation in createBooking
  - Static test scaffold (booking-manage-surface.test.ts) covering TOK-01 through TOK-07

affects:
  - 06-02 (public manage page uses manageToken for DB lookup)
  - 06-03 (cancel/reschedule API routes consume manageToken)
  - 06-04 (email/Telegram confirmation templates embed manage link)

# Tech tracking
tech-stack:
  added: [Node.js built-in crypto module]
  patterns: [safeRead static file assertion test pattern, crypto.randomUUID() for URL-safe tokens]

key-files:
  created:
    - __tests__/booking-manage-surface.test.ts
  modified:
    - prisma/schema.prisma
    - lib/booking/engine.ts

key-decisions:
  - "manageToken is String? (nullable) — existing bookings lack tokens, nullable avoids migration failure"
  - "@unique constraint on manageToken for indexed fast token lookups in public API routes"
  - "crypto.randomUUID() used — built-in Node.js, no extra dependency, URL-safe v4 UUID"
  - "prisma generate run; prisma db push is a manual step requiring live DB connection before deployment"

patterns-established:
  - "safeRead helper (fs.existsSync + readFileSync) — returns empty string for missing files, avoids test crashes"
  - "Static file assertion tests with describe blocks per requirement ID (TOK-01 through TOK-07)"

requirements-completed: [TOK-01]

# Metrics
duration: 15min
completed: 2026-03-28
---

# Phase 06 Plan 01: manageToken Foundation and Test Scaffold Summary

**manageToken UUID field added to Booking Prisma model with @unique constraint, crypto.randomUUID() generation in createBooking, and static test scaffold covering all 7 TOK requirements for the phase**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-28T12:23:40Z
- **Completed:** 2026-03-28T12:38:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Static test scaffold (`__tests__/booking-manage-surface.test.ts`) created with 7 describe blocks (TOK-01 through TOK-07) and 24 individual assertions covering the entire phase surface
- `manageToken String? @unique` field added to Booking model — nullable for backward compatibility with existing records, unique for fast token-based lookups
- `crypto.randomUUID()` generates a URL-safe v4 UUID before `tx.booking.create` — every new booking gets a unique manage token stored atomically in the transaction
- `npx prisma generate` succeeded, Prisma client types updated

## Task Commits

1. **Task 1: Create static test scaffold for entire phase** - `8926b76` (test)
2. **Task 2: Add manageToken to Prisma schema and generate token in createBooking** - `0de9fdb` (feat)

## Files Created/Modified

- `__tests__/booking-manage-surface.test.ts` - Static file assertion test scaffold for all 7 TOK requirements
- `prisma/schema.prisma` - Added `manageToken String? @unique` to Booking model after `telegramChatId`
- `lib/booking/engine.ts` - Added `import crypto from "crypto"` and `const manageToken = crypto.randomUUID()` in createBooking transaction

## Decisions Made

- `manageToken` is nullable (`String?`) because existing bookings in the database have no token. A non-nullable field without a default would fail `prisma db push` on a non-empty database.
- `@unique` constraint selected over a plain index — token lookups by public API routes need both uniqueness guarantee and query performance.
- Node.js built-in `crypto.randomUUID()` used instead of `nanoid` or `uuid` package — no extra dependency, returns a standard v4 UUID which is URL-safe.
- `prisma generate` run by executor; `prisma db push` is a manual deployment step requiring a live database connection.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed regex double-backslash in test scaffold**
- **Found during:** Task 2 verification (running TOK-01 tests)
- **Issue:** Regex `/manageToken[^\\n]*@unique/` used `[^\\n]` (excludes backslash and `n`) instead of `[^\n]` (excludes newline), causing the @unique test to fail even after manageToken was added to schema
- **Fix:** Changed `[^\\n]` to `[^\n]` in the regex
- **Files modified:** `__tests__/booking-manage-surface.test.ts`
- **Verification:** TOK-01 4/4 tests pass after fix
- **Committed in:** `0de9fdb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test regex)
**Impact on plan:** Minimal — regex bug found immediately during first verification run, fixed inline before Task 2 commit.

## Issues Encountered

None beyond the regex fix above.

## User Setup Required

`prisma db push` must be run manually with a live database connection to apply the `manageToken` column to the production/staging database before plans 06-02 through 06-04 are deployed.

## Next Phase Readiness

- `manageToken` field ready in schema and Prisma client types — plans 06-02, 06-03, 06-04 can use `booking.manageToken` in queries and API routes
- Test scaffold in place — TOK-01 passes, TOK-02 through TOK-07 will pass as subsequent plans create the required files
- Pre-deployment checklist: run `npx prisma db push` on production database

---
*Phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links*
*Completed: 2026-03-28*
