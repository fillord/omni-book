---
phase: 06-implement-tokenized-booking-management-for-clients-cancel-reschedule-via-email-and-telegram-links
verified: 2026-03-28T00:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Visit /manage/[valid-token] in browser — confirm booking details render"
    expected: "Tenant name, service, specialist, date/time, and status badge all visible"
    why_human: "Server-side rendering with DB lookup — cannot verify visual output programmatically"
  - test: "Click 'Отменить запись' while canManage=true"
    expected: "Button triggers POST to /api/manage/[token]/cancel; UI switches to green 'Запись отменена' message"
    why_human: "Client-side state transition after async fetch — requires browser interaction"
  - test: "Click 'Перенести', select a date, pick a slot, click 'Подтвердить перенос'"
    expected: "Booking updates to new time; UI shows 'Запись перенесена'; no new booking record created"
    why_human: "Full reschedule flow requires real DB + slot availability state"
  - test: "Visit /manage/invalid-or-missing-token"
    expected: "Next.js 404 page shown"
    why_human: "notFound() behavior requires a running Next.js app"
  - test: "Create a booking within 4 hours of its start time; visit its manage link"
    expected: "Buttons are disabled; message 'Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую' shown with phone link if available"
    why_human: "canManage=false branch depends on live time comparison computed server-side"
  - test: "Create a booking via the public booking form and inspect email received"
    expected: "Email contains 'Управление записью' row with a clickable /manage/{token} link"
    why_human: "Email rendering requires Resend delivery and a real manageToken in the DB"
---

# Phase 06: Tokenized Booking Management Verification Report

**Phase Goal:** Clients can cancel or reschedule their bookings via tokenized links sent in email and Telegram confirmations — no login required.
**Verified:** 2026-03-28
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every new booking gets a unique manageToken stored in the database | VERIFIED | `prisma/schema.prisma:196` has `manageToken String? @unique`; `lib/booking/engine.ts:337` generates `crypto.randomUUID()` and `engine.ts:350` passes it to `tx.booking.create` |
| 2 | Visiting /manage/[valid-token] shows booking details (service, date, resource, business name) | VERIFIED | `app/manage/[token]/page.tsx` queries booking with full include (service, resource, tenant) via `basePrisma.booking.findUnique({ where: { manageToken: token } })`; serialized data passed to `BookingManagePage` which renders all fields |
| 3 | When more than 4 hours before booking start, Cancel and Reschedule buttons are enabled | VERIFIED | `app/manage/[token]/page.tsx:26-27` computes `canManage = now < cutoff && ['CONFIRMED','PENDING'].includes(status)`; component renders enabled buttons when `canManage=true` |
| 4 | When within 4 hours of booking start, buttons are disabled and Russian message is shown | VERIFIED | `components/booking-manage-page.tsx:343-344` renders `"Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую"` when `canManage=false` |
| 5 | Clicking Cancel changes booking status to CANCELLED — no auth required | VERIFIED | `app/api/manage/[token]/cancel/route.ts` has no `getServerSession`/`requireAuth`; updates `status: "CANCELLED"` after 4-hour server-side re-check |
| 6 | Client can pick a new available slot and reschedule the booking in place | VERIFIED | `components/booking-manage-page.tsx` fetches `/api/bookings/slots`, displays slot grid, POSTs to `/api/manage/${token}/reschedule` with `startsAt`/`endsAt` |
| 7 | Reschedule updates the existing booking record (no new booking created) | VERIFIED | `app/api/manage/[token]/reschedule/route.ts:90-96` uses `tx.booking.update` on `booking.id` within a Serializable transaction; no `tx.booking.create` present |
| 8 | Tenant owner receives Telegram notification on reschedule | VERIFIED | `app/api/manage/[token]/reschedule/route.ts:114-121` calls `sendTelegramMessage` with Russian header "Перенос записи!" including old and new times |
| 9 | Email booking confirmation includes a management link | VERIFIED | `lib/email/resend.ts:15` adds `manageToken` to `BookingEmailData`; line 45-51 renders `/manage/${data.manageToken}` link in HTML table row; `app/api/bookings/route.ts:164` passes `manageToken: booking.manageToken` |
| 10 | Telegram booking confirmation includes a management link | VERIFIED | `app/api/bookings/route.ts:181` appends `🔗 Управление: ${appUrl}/manage/${booking.manageToken}` to the Telegram message array |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `__tests__/booking-manage-surface.test.ts` | Static file assertion tests for entire phase (TOK-01 through TOK-07) | VERIFIED | 24 tests, all passing |
| `prisma/schema.prisma` | `manageToken String? @unique` on Booking model | VERIFIED | Line 196 |
| `lib/booking/engine.ts` | Token generation via `crypto.randomUUID()` in `createBooking` | VERIFIED | Lines 6, 337, 350 |
| `app/manage/[token]/page.tsx` | Server component with token lookup and 4-hour check | VERIFIED | Substantive: 56 lines, full DB include, canManage computation, date serialization |
| `components/booking-manage-page.tsx` | Client component with cancel/reschedule UI | VERIFIED | Substantive: 367 lines, full reschedule calendar with slot picker, Neumorphism styling |
| `app/api/manage/[token]/cancel/route.ts` | Auth-free cancel endpoint | VERIFIED | No auth imports; 4-hour server-side re-check; `CANCELLED` status update |
| `app/api/manage/[token]/reschedule/route.ts` | Auth-free reschedule with conflict check and Telegram notification | VERIFIED | Serializable transaction, `FOR UPDATE` lock, collision detection, `sendTelegramMessage` |
| `lib/email/resend.ts` | Updated email template with management link | VERIFIED | `manageToken` field on interface; conditional `/manage/` link in HTML |
| `app/api/bookings/route.ts` | Updated Telegram confirmation with management link | VERIFIED | Line 181 appends management link to Telegram message |
| `lib/i18n/translations.ts` | Translation keys for management page in RU, EN, KZ | VERIFIED | `manage:` section at lines 621 (ru), 1254 (kz), 1887 (en) with 22 keys each |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/booking/engine.ts` | `prisma/schema.prisma` | `manageToken` field in `tx.booking.create` data | WIRED | `engine.ts:350` includes `manageToken` in create data |
| `app/manage/[token]/page.tsx` | `components/booking-manage-page.tsx` | Server passes `booking + canManage + token` props | WIRED | Line 3 imports `BookingManagePage`; line 49 renders it with all props |
| `components/booking-manage-page.tsx` | `app/api/manage/[token]/cancel/route.ts` | `fetch POST /api/manage/${token}/cancel` | WIRED | Line 108 in `handleCancel()` |
| `components/booking-manage-page.tsx` | `app/api/manage/[token]/reschedule/route.ts` | `fetch POST /api/manage/${token}/reschedule` with `{ startsAt, endsAt }` | WIRED | Line 125 in `handleReschedule()` |
| `components/booking-manage-page.tsx` | `app/api/bookings/slots` | `fetch GET /api/bookings/slots?tenantSlug=...` | WIRED | Line 96 in `useEffect` slot fetcher |
| `app/api/manage/[token]/cancel/route.ts` | `prisma/schema.prisma` | `basePrisma.booking.findUnique({ where: { manageToken } })` | WIRED | Line 11-13 |
| `app/api/manage/[token]/reschedule/route.ts` | `lib/telegram.ts` | `sendTelegramMessage` to tenant chatId | WIRED | Line 4 imports; line 121 calls fire-and-forget |
| `app/api/bookings/route.ts` | `lib/email/resend.ts` | passes `manageToken: booking.manageToken` to `sendBookingConfirmation` | WIRED | Line 164 |
| `app/api/bookings/route.ts` | `lib/telegram.ts` | Telegram message includes `/manage/` link | WIRED | Line 181 |

### Requirements Coverage

TOK-01 through TOK-07 are internal requirement identifiers defined in the phase plans — they do not appear in `.planning/REQUIREMENTS.md` (which only covers CRM requirements for v1.4). No orphaned REQUIREMENTS.md entries map to this phase. All internal plan requirements are fully satisfied:

| Requirement | Plan | Description | Status |
|-------------|------|-------------|--------|
| TOK-01 | 06-01 | `manageToken` field on Booking model + token generation in `createBooking` | SATISFIED |
| TOK-02 | 06-02 | Public `/manage/[token]` page with booking details display | SATISFIED |
| TOK-03 | 06-02 | 4-hour cutoff rule: enabled/disabled UI state | SATISFIED |
| TOK-04 | 06-02 | Auth-free cancel API route | SATISFIED |
| TOK-05 | 06-03 | Auth-free reschedule API route with conflict check | SATISFIED |
| TOK-06 | 06-03 | Telegram notification to owner on reschedule | SATISFIED |
| TOK-07 | 06-04 | Management link in email and Telegram confirmations + i18n keys | SATISFIED |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/api/manage/[token]/reschedule/route.ts` | 86 | `return null` inside transaction callback | Info | Intentional collision-signalling pattern: sets `conflicted = true` outer flag, outer code returns 409. Not a stub. |
| `__tests__/neumorphism-surface.test.ts` | 14, 18, 97, 109, 206-207 | TS1501: regex `s` flag requires `es2018` target | Info | Pre-existing TypeScript config issue unrelated to phase 06. No new TS errors introduced by this phase. |
| `lib/email/resend.ts` | 78, 211 | `console.log` for dev/mock mode | Info | Both are explicit dev-mode guards (`no RESEND_API_KEY`, `Dev mock OTP email`). Acceptable non-production logging patterns. |

No blocker or warning anti-patterns found. All patterns are either intentional or pre-existing.

### Human Verification Required

#### 1. Booking details page renders correctly

**Test:** Create a booking via the public form, copy the `manageToken` from the DB, visit `/manage/{token}` in a browser.
**Expected:** Page displays tenant name, service name, specialist/resource, formatted date/time, and status badge. Neumorphism styling applied (neu-raised card on light/dark background).
**Why human:** Server-side rendering with live DB lookup and Intl.DateTimeFormat locale formatting.

#### 2. Cancel flow end-to-end

**Test:** Visit `/manage/{token}` for a booking more than 4 hours in the future. Click "Отменить запись".
**Expected:** POST fires to `/api/manage/{token}/cancel`; green "Запись отменена" confirmation appears; booking status changes to CANCELLED in DB; buttons disappear.
**Why human:** Client-side state transition after async fetch requires browser + live DB.

#### 3. Reschedule flow end-to-end

**Test:** Visit `/manage/{token}`, click "Перенести", navigate to a date with available slots, select a slot, click "Подтвердить перенос".
**Expected:** POST fires to `/api/manage/{token}/reschedule`; UI shows "Запись перенесена" with new date; existing booking record updated (no new booking); tenant receives Telegram notification if `telegramChatId` is set.
**Why human:** Full slot availability, DB transaction, and Telegram delivery require live environment.

#### 4. 404 for invalid token

**Test:** Visit `/manage/totally-invalid-token`.
**Expected:** Next.js 404 page displayed.
**Why human:** `notFound()` behavior requires a running Next.js app.

#### 5. Within-4-hours disabled state

**Test:** Create a booking starting in 2 hours; visit its manage link.
**Expected:** Cancel and Reschedule buttons absent; "Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую" shown; tenant phone displayed as a `tel:` link if configured.
**Why human:** `canManage` depends on live time comparison computed server-side.

#### 6. Email confirmation management link

**Test:** Book with a valid guest email address; inspect the received confirmation email.
**Expected:** Email contains a table row labelled "Управление записью" with a clickable "Отменить или перенести" link pointing to `https://omni-book.site/manage/{token}`.
**Why human:** Requires Resend delivery and inspection of rendered HTML email.

### Gaps Summary

No gaps. All automated checks passed. The phase goal is fully implemented: every artifact exists and is substantive, all key links are wired, and the test scaffold (24 tests) is entirely green. The only remaining verification is human testing of the live end-to-end flows listed above.

---

_Verified: 2026-03-28_
_Verifier: Claude (gsd-verifier)_
