# Phase 6: Tokenized Booking Management - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Source:** User context capture (inline)

<domain>
## Phase Boundary

Clients receive a personalized, tokenized management link in their confirmation email/Telegram message. Clicking the link opens a public page (no login required) at `/manage/[token]` where they can cancel or reschedule their booking, subject to a 4-hour cutoff rule. The business owner is notified via Telegram when a reschedule occurs.

</domain>

<decisions>
## Implementation Decisions

### Booking Model Extension
- Add `manageToken` field (unique, URL-safe token) to the Booking Prisma model
- Token generated at booking creation time and stored in DB
- Token-based lookup replaces any auth requirement for the management page

### Public Management Page
- Route: `/manage/[token]` — public, no login, no session required
- Page reads booking details via `manageToken` lookup
- Display: service name, date/time, resource, business name

### 4-Hour Rule (Locked)
- **If current time > 4 hours before booking start**: show enabled Cancel and Reschedule buttons
- **If current time ≤ 4 hours before booking start**: disable both buttons, show message: "Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую" plus business phone/WhatsApp number
- Time comparison uses server time (not client time) to prevent manipulation

### Cancel Flow
- Clicking Cancel: update booking status to `CANCELED`
- No further steps required (simple status update)
- Show confirmation UI after cancellation

### Reschedule Flow
- Clicking Reschedule: open calendar component (reuse existing booking calendar) to pick a new available slot
- Calendar shows only available slots for the same service/resource
- After slot selection: update booking `startsAt` and `endsAt` in place (same booking record, new time)
- After update: notify business owner via Telegram with rescheduled details

### Telegram Notification on Reschedule
- Send Telegram message to tenant's `telegramChatId` when a client reschedules
- Message includes: client name/phone, service, old time → new time

### UI Style
- Management page uses Neumorphism Soft UI (same as dashboard: `var(--neu-bg)`, `.neu-raised`, `.neu-inset`)
- Consistent brand visual identity, not a plain/minimal public page

### Confirmation Message Updates
- Update email confirmation template to include the management link: `https://{domain}/manage/{manageToken}`
- Update Telegram confirmation message to include the same management link
- Both send this at booking creation time

### Claude's Discretion
- Token generation strategy (nanoid vs UUID vs crypto.randomBytes) — use nanoid or crypto.randomBytes for URL-safe unique token
- Exact Prisma migration approach (db push vs generate)
- Error handling for expired/invalid tokens (404 or dedicated error state)
- i18n coverage: RU at minimum, EN/KZ if straightforward
- Whether to add an expiry mechanism to the token (post-booking cutoff) — not required by user

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Booking Model & API
- `lib/booking/engine.ts` — slot availability logic, booking creation (reuse for reschedule slot check)
- `app/api/bookings/route.ts` — booking creation API (add manageToken generation here)
- `app/api/bookings/[id]/status/route.ts` — booking status update (used for cancel)
- `app/api/bookings/slots/route.ts` — slot availability API (reuse for reschedule calendar)

### Email & Telegram Confirmations
- `lib/email/reminders.ts` — email templates (update to include management link)
- Look for Telegram confirmation send logic in booking creation flow

### Public Booking Surface (reference for public page patterns)
- `components/tenant-public-page.tsx` — public booking page (pattern for public-facing Neumorphic UI)
- `components/booking-form.tsx` — calendar/slot picker component (reuse in reschedule flow)

### Neumorphism Design System
- `app/globals.css` — CSS variables (`--neu-bg`, `.neu-raised`, `.neu-inset`)
- `components/ui/button.tsx` — Neumorphic button variants

### Auth & Session Patterns
- `lib/actions/auth-session.ts` — auth helpers (management page must NOT use requireAuth)

### i18n
- `lib/i18n/translations.ts` — translation keys structure (add new keys for management page)

### Prisma Schema
- `prisma/schema.prisma` — Booking model (add `manageToken String? @unique`)

</canonical_refs>

<specifics>
## Specific Ideas

- Disabled state message (exact copy): "Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую"
- Show business phone/WhatsApp alongside disabled message (read from tenant profile)
- Management link format: `https://{domain}/manage/{token}` — token is URL-safe
- Calendar reuse: same slot picker used on public booking page, filtered to same service/resource
- Reschedule updates the existing booking record (same ID), does not create a new one
- Cancellation sets status to `CANCELED` (existing enum value)

</specifics>

<deferred>
## Deferred Ideas

- Token expiry (e.g., token becomes invalid after booking date passes) — not required in this phase
- Client-facing email after cancellation/reschedule — not mentioned by user, defer
- Admin override to extend the 4-hour window — defer

</deferred>

---

*Phase: 06-implement-tokenized-booking-management*
*Context gathered: 2026-03-28 via inline user input*
