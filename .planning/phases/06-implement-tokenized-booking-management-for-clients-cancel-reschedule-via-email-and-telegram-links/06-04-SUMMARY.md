---
phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links
plan: 04
subsystem: email, i18n, api
tags: [resend, telegram, i18n, translations, booking-confirmation]

# Dependency graph
requires:
  - phase: 06-01
    provides: manageToken field on Booking model via createBooking return value

provides:
  - Email confirmation includes management link row when manageToken present
  - Telegram owner notification includes management link when manageToken present
  - i18n manage section in ru/kz/en with 24 keys each for management page UI

affects: [booking-manage-page, manage-token-api, email-templates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional template row: ${token ? `<tr>...</tr>` : ''} pattern in email HTML"
    - "Spread conditional array items: ...(token ? [item] : []) for Telegram message arrays"
    - "NEXT_PUBLIC_APP_URL with fallback to hardcoded production URL for template base URLs"

key-files:
  created: []
  modified:
    - lib/email/resend.ts
    - app/api/bookings/route.ts
    - lib/i18n/translations.ts

key-decisions:
  - "Management link in Telegram goes to business OWNER (not client) — owner can access management page directly from notification"
  - "Email management row conditionally rendered — only shown when manageToken truthy (null-safe)"
  - "i18n manage section added with 24 keys per locale — covers all UI strings for management page, status labels, and action labels"

patterns-established:
  - "Conditional email table row: template literal ternary — ${token ? '<tr>...</tr>' : ''}"
  - "Conditional Telegram line: spread ternary — ...(token ? ['line'] : [])"

requirements-completed: [TOK-07]

# Metrics
duration: 12min
completed: 2026-03-28
---

# Phase 6 Plan 04: Confirmation Templates with Management Link Summary

**Email confirmation and Telegram notification updated to include /manage/{token} link, with 24-key i18n manage section added to ru/kz/en locales**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-28T12:13:53Z
- **Completed:** 2026-03-28T12:26:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `BookingEmailData` interface extended with optional `manageToken` field
- Booking confirmation email now includes "Управление записью" table row with `/manage/{token}` link when token is present
- Telegram owner notification now appends management link line when `booking.manageToken` is set
- Added `manage` section to all three locales (ru/kz/en) with 24 keys covering page title, booking details, action labels, status labels, success/error messages, and navigation
- All 24 TOK-01 through TOK-07 tests pass

## Task Commits

1. **Task 1: Update email template and Telegram message to include management link** - `c479454` (feat)
2. **Task 2: Add i18n translation keys for management page** - `09330d6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/email/resend.ts` - Added `manageToken?: string | null` to `BookingEmailData`, added conditional management link table row in HTML template
- `app/api/bookings/route.ts` - Pass `manageToken: booking.manageToken` to `sendBookingConfirmation`; add management link to Telegram message array
- `lib/i18n/translations.ts` - Added `manage` section to `ru`, `kz`, and `en` locales with 24 keys each

## Decisions Made
- Management link in Telegram goes to the business OWNER notification (as the notification block sends to the owner's chat). The client receives the link via their confirmation email if they provided one.
- Both email and Telegram use `process.env.NEXT_PUBLIC_APP_URL || 'https://omni-book.site'` for the base URL.
- Email table row and Telegram link are conditionally included only when `booking.manageToken` is truthy — backwards compatible with old bookings that may have null tokens.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures in `subscription-lifecycle-surface.test.ts` (SUB-02) were discovered: these 4 tests check the cron route for `subscriptionExpiresAt`, `isFrozen`, etc. — but the cron route in the uncommitted workspace was already refactored to delegate to `lib/subscription-lifecycle.ts`, moving those strings out of the route file. This is a pre-existing issue outside the scope of plan 06-04 changes. Logged to deferred items.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 6 is now complete: all 4 plans (01-04) delivered tokenized booking management
- Clients receive management links in booking confirmation emails
- Business owners see management links in Telegram booking notifications
- Management page UI (from plans 02-03) has i18n keys ready for localization
- Full test suite: 24/24 booking-manage-surface.test.ts tests pass

---
*Phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links*
*Completed: 2026-03-28*
