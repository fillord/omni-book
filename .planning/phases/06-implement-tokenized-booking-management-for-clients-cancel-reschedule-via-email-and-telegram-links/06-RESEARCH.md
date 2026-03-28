# Phase 6: Tokenized Booking Management - Research

**Researched:** 2026-03-28
**Domain:** Next.js App Router public pages, Prisma schema extension, token generation, booking mutation, Neumorphism UI, email/Telegram notifications
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Add `manageToken` field (unique, URL-safe token) to the Booking Prisma model
- Token generated at booking creation time and stored in DB
- Route: `/manage/[token]` — public, no login, no session required
- Page reads booking details via `manageToken` lookup
- Display: service name, date/time, resource, business name
- **4-hour rule**: if current time > 4h before booking start → cancel/reschedule enabled; if ≤ 4h → disabled, show message: "Для отмены или переноса, пожалуйста, свяжитесь с нами напрямую" plus business phone/WhatsApp
- Time comparison uses server time (not client time) to prevent manipulation
- Cancel: update booking status to `CANCELLED` (no further steps)
- Reschedule: open calendar component (reuse existing booking calendar) to pick new slot for same service/resource; update `startsAt` and `endsAt` in place (same booking record, new time)
- Notify business owner via Telegram with: client name/phone, service, old time → new time
- Management page uses Neumorphism Soft UI (same as dashboard: `var(--neu-bg)`, `.neu-raised`, `.neu-inset`)
- Update email confirmation template to include management link: `https://{domain}/manage/{manageToken}`
- Update Telegram confirmation message to include management link
- Both at booking creation time

### Claude's Discretion
- Token generation strategy (nanoid vs UUID vs crypto.randomBytes) — use nanoid or crypto.randomBytes for URL-safe unique token
- Exact Prisma migration approach (db push vs generate)
- Error handling for expired/invalid tokens (404 or dedicated error state)
- i18n coverage: RU at minimum, EN/KZ if straightforward
- Whether to add an expiry mechanism to the token (post-booking cutoff) — not required by user

### Deferred Ideas (OUT OF SCOPE)
- Token expiry (e.g., token becomes invalid after booking date passes) — not required in this phase
- Client-facing email after cancellation/reschedule — not mentioned by user, defer
- Admin override to extend the 4-hour window — defer
</user_constraints>

---

## Summary

Phase 6 adds a public, auth-free booking management surface. Clients receive a `manageToken` link in their booking confirmation (email and Telegram). Clicking the link opens `/manage/[token]` — a Next.js App Router page with no session requirements — where they can cancel or reschedule within the 4-hour cutoff rule.

The implementation spans four layers: (1) Prisma schema — add `manageToken String @unique` to Booking; (2) API — generate token on booking creation, add new public API routes for cancel and reschedule by token; (3) UI — a new public Next.js page reusing the existing `BookingForm` calendar/slot picker component; (4) Notifications — update email and Telegram confirmation templates to embed the management link, and send a Telegram notification to the tenant owner on reschedule.

**Primary recommendation:** Use `crypto.randomUUID()` (already used in `lib/auth/config.ts`) for token generation — no extra dependency, Node built-in, URL-safe after stripping hyphens or as-is. Add a new API route family `app/api/manage/[token]/` to keep the management surface fully separate from the authenticated booking API.

---

## Standard Stack

### Core (all already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5.12 | `/manage/[token]` public page, API routes | Project standard |
| Prisma | ^6.7.0 | Schema extension, `manageToken` unique field | Project ORM |
| `@prisma/client` | ^6.7.0 | Type-safe DB access | Project standard |
| `date-fns` | ^4.1.0 | 4-hour cutoff arithmetic, date formatting | Already used in bookings |
| `date-fns-tz` | ^3.2.0 | Timezone-aware date display on management page | Already used in engine |
| Node `crypto` | built-in | Token generation via `crypto.randomUUID()` | Already used in auth/config.ts |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nanoid` | present in node_modules | Shorter URL-safe tokens (21 chars vs 36) | If UUID feels too long for links |
| Resend | present | Email notifications | Updating confirmation email |
| Telegram Bot API | via lib/telegram.ts | Tenant/client notifications | Reschedule notification |
| `zod` | present | API request validation | Validating reschedule body |

### Token Generation Decision
`crypto.randomUUID()` is recommended because:
- Already used in `lib/auth/config.ts` for session IDs — zero new patterns
- 36-char UUID is acceptable in a URL
- No new import/dependency
- Alternative: `nanoid(32)` (also in node_modules) produces shorter tokens if URL brevity matters

**Installation:** No new packages required — all dependencies are already in the project.

---

## Architecture Patterns

### Recommended File Structure

```
app/
└── manage/
    └── [token]/
        └── page.tsx            # Server Component: load booking by token, pass to client

app/api/manage/
└── [token]/
    ├── cancel/
    │   └── route.ts            # POST — sets status CANCELLED
    └── reschedule/
        └── route.ts            # POST — updates startsAt/endsAt, notifies tenant

components/
└── booking-manage-page.tsx     # Client Component: cancel/reschedule UI, slot picker

lib/
└── actions/
    └── manage-token.ts         # (optional) Server Action helpers for token lookup
```

### Pattern 1: Public Server Page with Token Lookup

The `/manage/[token]` page is a Next.js App Router Server Component. It uses `basePrisma.booking.findUnique({ where: { manageToken: token } })` to load booking data including the tenant (for phone/WhatsApp display). The 4-hour check is performed server-side. The component renders a Client Component (`BookingManagePage`) that receives booking data as props, keeping auth-free access clean.

```typescript
// app/manage/[token]/page.tsx
import { notFound } from 'next/navigation'
import { basePrisma } from '@/lib/db'
import { BookingManagePage } from '@/components/booking-manage-page'

export default async function ManageTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const booking = await basePrisma.booking.findUnique({
    where: { manageToken: token },
    include: {
      service:  { select: { id: true, name: true, durationMin: true } },
      resource: { select: { id: true, name: true } },
      tenant:   { select: { name: true, phone: true, slug: true } },
    },
  })
  if (!booking) notFound()

  const now = new Date()
  const cutoff = new Date(booking.startsAt.getTime() - 4 * 60 * 60 * 1000)
  const canManage = now < cutoff

  return (
    <BookingManagePage
      booking={/* serialized */}
      canManage={canManage}
      token={token}
    />
  )
}
```

**Key:** The Server Component computes `canManage` server-side before passing to the client — no client-side time manipulation possible.

### Pattern 2: Dedicated Public API Routes (No Auth)

Cancel and reschedule endpoints live under `app/api/manage/[token]/` — separate from the authenticated `app/api/bookings/[id]/status/` route. These routes authenticate only via the token (knowledge of the token = authorization). They MUST NOT call `getServerSession`.

```typescript
// app/api/manage/[token]/cancel/route.ts
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const booking = await basePrisma.booking.findUnique({
    where: { manageToken: token },
    include: { tenant: { select: { name: true, timezone: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
    return NextResponse.json({ error: 'Cannot cancel' }, { status: 422 })
  }
  // Re-check 4h rule server-side
  const now = new Date()
  const cutoff = new Date(booking.startsAt.getTime() - 4 * 60 * 60 * 1000)
  if (now >= cutoff) {
    return NextResponse.json({ error: 'Too close to booking time' }, { status: 422 })
  }
  await basePrisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
  return NextResponse.json({ ok: true })
}
```

### Pattern 3: Reschedule — Slot Picker Reuse

The reschedule flow reuses the existing `/api/bookings/slots` endpoint as-is (it takes `tenantSlug`, `resourceId`, `serviceId`, `date` — all known from the booking record). The `BookingManagePage` client component renders the date-picker/slot-picker UI in a conditional `rescheduleMode` state. On slot selection, it calls `POST /api/manage/[token]/reschedule` with `{ startsAt, endsAt }`.

The reschedule API route:
1. Validates token → loads booking
2. Re-checks 4-hour rule
3. Checks the new slot for conflicts (reuse `getAvailableSlots` or a direct collision query)
4. Updates booking `startsAt` and `endsAt` in place (same `id`)
5. Sends Telegram notification to `tenant.telegramChatId` with old → new time

```typescript
// Message format for reschedule Telegram notification to tenant
const msg = [
  '🔄 <b>Перенос записи!</b>',
  `👤 Клиент: ${booking.guestName} (${booking.guestPhone})`,
  `🛠 Услуга: ${service?.name ?? ''}`,
  `📅 Было: ${oldDateStr}`,
  `📅 Стало: ${newDateStr}`,
].join('\n')
```

### Pattern 4: manageToken Generation at Booking Creation

In `createBooking()` (`lib/booking/engine.ts`), add `manageToken` generation before the `tx.booking.create(...)` call:

```typescript
import crypto from 'crypto'
// ...
const manageToken = crypto.randomUUID().replace(/-/g, '') // 32-char hex, URL-safe
return tx.booking.create({
  data: {
    // ... existing fields ...
    manageToken,
  },
})
```

Alternatively, keep UUID with hyphens (36 chars) — also URL-safe.

### Pattern 5: Slot API Reuse for Reschedule Calendar

The reschedule calendar component can call the existing `/api/bookings/slots` endpoint directly:
- `tenantSlug` — from `booking.tenant.slug`
- `resourceId` — from `booking.resourceId`
- `serviceId` — from `booking.serviceId`
- `date` — user-selected date in the calendar

This requires no new slot-fetching logic. The `BookingForm` component is the reference for how slot-fetching + date-picker is orchestrated (it uses `RadioGroup`, day-by-day fetching via fetch, etc.).

### Booking Form Architecture (Reference)

`components/booking-form.tsx` is a large multi-step Client Component. For the reschedule flow, **do not embed the entire `BookingForm`** — instead, extract/replicate only the datetime step (calendar + slot grid). The `BookingForm` has distinct steps: `service → resource → datetime → confirm`. The reschedule flow only needs the `datetime` step since service and resource are already locked.

Key patterns from `BookingForm` to replicate:
- Day navigation with `useState` for `selectedDate`
- `useEffect` fetch to `/api/bookings/slots?...` on date change
- Slot grid with `RadioGroup`-style time buttons
- `.neu-raised` on slot buttons, `.neu-inset` on pressed/selected

### Anti-Patterns to Avoid

- **Never call `getServerSession` in `/manage/` routes** — this is a public, tokenized surface
- **Never reuse `app/api/bookings/[id]/status/route.ts` directly** — that route requires session + OWNER/STAFF role; create separate `/api/manage/[token]/cancel/` and `/api/manage/[token]/reschedule/`
- **Never perform 4-hour check only on the client** — client time can be manipulated; always re-validate server-side in the API route
- **Never create a new Booking record on reschedule** — update `startsAt`/`endsAt` in place on the existing booking ID
- **Avoid importing `BookingForm` directly in the manage page** — it expects full service/resource selection context; build a focused `RescheduleCalendar` sub-component instead

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slot availability for reschedule | Custom slot query | `GET /api/bookings/slots` (existing) | Already handles schedules, conflicts, frozen state, lunch breaks, booking window |
| Booking conflict check on reschedule | Custom overlap SQL | `getAvailableSlots()` + trust available: true, or replicate the `collision` query from `createBooking` | Handles edge cases (lunch, dayOff, isFrozen, time zone) |
| Date/time formatting | Custom formatters | `date-fns` + `date-fns-tz` `formatInTimeZone` | Already used in reminders.ts; handles tenant timezone |
| Telegram notification | New HTTP client | `sendTelegramMessage()` from `lib/telegram.ts` | No-op if bot token absent; error handling pattern established |
| Token uniqueness | Custom collision-retry | `@unique` Prisma constraint + UUID collision probability (negligible) | 128-bit UUID: collision probability astronomically low; Prisma throws P2002 on collision if it ever occurs |

**Key insight:** This phase is largely assembly — all infrastructure (slot engine, Telegram, email, Prisma, auth patterns) already exists. The new work is wiring it through a token-gated public surface.

---

## Common Pitfalls

### Pitfall 1: BookingStatus Enum Spelling
**What goes wrong:** CONTEXT.md says `CANCELED` but the Prisma schema and all existing code use `CANCELLED` (double L). Using the wrong spelling causes a Prisma type error.
**Why it happens:** CONTEXT.md was written with the American spelling.
**How to avoid:** Use `'CANCELLED'` everywhere in this phase — verified in `prisma/schema.prisma` line 238 and `app/api/bookings/[id]/status/route.ts`.
**Warning signs:** TypeScript error: `Type '"CANCELED"' is not assignable to type 'BookingStatus'`

### Pitfall 2: Booking Already Cancelled — Allow Cancel API Called Twice
**What goes wrong:** Client clicks Cancel twice or token is reused; second call tries to cancel an already-CANCELLED booking.
**Why it happens:** No guard in the cancel route.
**How to avoid:** In the cancel API, check `booking.status` before updating. Return 422 if status is already `CANCELLED` or a terminal state (COMPLETED, NO_SHOW).

### Pitfall 3: manageToken Missing on Old Bookings
**What goes wrong:** Existing bookings in the database have `manageToken = null` (since it wasn't set before). Lookups by `manageToken` work fine for new bookings, but old confirmation emails won't have links.
**Why it happens:** `manageToken` is added as nullable with no default.
**How to avoid:** Define field as `manageToken String? @unique` (nullable). The public page handles null token → 404. Old bookings simply have no management page. No backfill needed.

### Pitfall 4: Date Serialization in Server → Client Component
**What goes wrong:** Passing `Date` objects from Server Component to Client Component throws Next.js App Router serialization error ("Only plain objects... are supported").
**Why it happens:** Next.js requires serializable props when crossing the Server/Client boundary.
**How to avoid:** Convert `booking.startsAt` and `booking.endsAt` to ISO strings (`.toISOString()`) before passing as props. Reference: `app/dashboard/clients/page.tsx` — same pattern used for Client date serialization in Phase 5.

### Pitfall 5: 4-Hour Check Race Condition
**What goes wrong:** Client checks 4-hour rule at page load time; user leaves tab open; comes back hours later and submits cancel/reschedule when now inside the 4-hour window.
**Why it happens:** Client-side state is snapshot at page load.
**How to avoid:** ALWAYS re-check the 4-hour rule inside the cancel and reschedule API routes (server-side), even if the UI already disabled the buttons.

### Pitfall 6: Reschedule Conflict Not Checked
**What goes wrong:** Client selects a slot from the calendar; by the time the API processes it, another booking was created for that slot.
**Why it happens:** Race condition between slot display and booking update.
**How to avoid:** Run a collision check inside the reschedule API route (same pattern as `createBooking` — check for overlapping CONFIRMED/PENDING bookings on the same resource). Use a transaction with `Serializable` isolation or at minimum a collision query before updating.

### Pitfall 7: `neu-raised`/`neu-inset` Requires `bg-[var(--neu-bg)]`
**What goes wrong:** Neumorphic box-shadows appear invisible or washed out on the public manage page.
**Why it happens:** The shadow effect requires the exact `--neu-bg` background color. Using `bg-background` or `bg-white` breaks the visual.
**How to avoid:** Apply `bg-[var(--neu-bg)]` to the root container and all card surfaces. Reference `components/tenant-public-page.tsx` for established pattern.

### Pitfall 8: `prisma db push` Required After Schema Change
**What goes wrong:** Schema updated but database not synced; Prisma queries referencing `manageToken` fail at runtime.
**Why it happens:** Project uses `db push` (not `migrate dev`) — no migration files.
**How to avoid:** After updating `prisma/schema.prisma`, run `prisma db push` against the live database. Then run `prisma generate` to update the client types. Reference from STATE.md: "prisma db push (not migrate dev) for schema sync — no migration files, just schema state sync"

---

## Code Examples

### Token Generation (in createBooking)
```typescript
// Source: lib/auth/config.ts pattern (crypto.randomUUID already used in project)
import crypto from 'crypto'

// Inside createBooking, before tx.booking.create:
const manageToken = crypto.randomUUID()  // e.g. "550e8400-e29b-41d4-a716-446655440000"
// URL-safe as-is; hyphens are valid in URLs
```

### Prisma Schema Addition
```prisma
// Source: prisma/schema.prisma — Booking model
model Booking {
  // ... existing fields ...
  manageToken    String?       @unique  // URL-safe unique token for public management page
  // ... existing relations ...
}
```

### 4-Hour Cutoff Check
```typescript
// Reusable helper — use in both page.tsx (for UI state) and API routes (for enforcement)
function isWithinCutoff(startsAt: Date): boolean {
  const now = new Date()
  const cutoff = new Date(startsAt.getTime() - 4 * 60 * 60 * 1000)
  return now >= cutoff  // true means BLOCKED (within or past cutoff)
}
```

### Reschedule Telegram Notification to Tenant
```typescript
// Source: app/api/bookings/route.ts pattern for Telegram sends
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const fmt = (d: Date) => format(d, 'd MMMM yyyy, HH:mm', { locale: ru })
const msg = [
  '🔄 <b>Перенос записи!</b>',
  `👤 Клиент: ${booking.guestName} (${booking.guestPhone})`,
  `🛠 Услуга: ${serviceName}`,
  `📅 Было: ${fmt(oldStartsAt)}`,
  `📅 Стало: ${fmt(newStartsAt)}`,
].join('\n')
sendTelegramMessage(tenantChatId, msg).catch(console.error)
```

### Email Confirmation Update (adding management link)
```typescript
// Source: lib/email/resend.ts — sendBookingConfirmation function
// Add manageToken param to BookingEmailData and inject into HTML:
// New table row in the confirmation email:
`<tr>
  <td style="padding:6px 0;color:#6b7280">Управление записью</td>
  <td style="padding:6px 0">
    <a href="https://omni-book.site/manage/${data.manageToken}" style="color:#4299e1">
      Отменить или перенести
    </a>
  </td>
</tr>`
```

### Telegram Confirmation Update (adding management link)
```typescript
// Source: app/api/bookings/route.ts — Telegram send block
// Add to existing message array:
`🔗 Управление: https://omni-book.site/manage/${booking.manageToken}`
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Authenticated cancel (OWNER/STAFF only via dashboard) | Token-based public cancel page | Clients can self-serve without login |
| No management link in confirmations | Email + Telegram include `/manage/[token]` | Reduces owner workload for reschedule/cancel requests |

---

## Open Questions

1. **Domain for management links**
   - What we know: Email sends from `noreply@omni-book.site`; Telegram messages reference the business
   - What's unclear: Is the domain always `omni-book.site` or per-tenant custom domain?
   - Recommendation: Use `process.env.NEXT_PUBLIC_APP_URL` or `process.env.APP_URL` as the base URL (same pattern other hosted Next.js apps use). Check if this env var exists; if not, hardcode `https://omni-book.site` for now.

2. **Slot picker in reschedule: which date range to show?**
   - What we know: `bookingWindowDays` is per-tenant (from tenant model, default 14)
   - What's unclear: CONTEXT.md doesn't specify if reschedule respects the same booking window
   - Recommendation: Apply the same `bookingWindowDays` constraint — consistent with the existing booking engine behavior.

3. **Reschedule conflict handling: transactional?**
   - What we know: `createBooking` uses `Serializable` transaction + row lock for conflict prevention
   - What's unclear: The reschedule update doesn't have the same atomic lock pattern described in CONTEXT.md
   - Recommendation: Wrap the reschedule slot check + booking update in a transaction (same `basePrisma.$transaction(..., { isolationLevel: 'Serializable' })` pattern). The current booking's slot is "freed" when its time is updated; race condition is low risk but worth protecting.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/booking-manage-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

This phase has no formal REQ-IDs assigned (new phase outside REQUIREMENTS.md). The test coverage maps to behavioral assertions:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| `manageToken` field present in Booking model (schema.prisma) | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "manageToken"` | Wave 0 |
| `/manage/[token]` page file exists | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "page"` | Wave 0 |
| Cancel API route exists at correct path | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "cancel route"` | Wave 0 |
| Reschedule API route exists at correct path | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "reschedule route"` | Wave 0 |
| Email confirmation template includes management link | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "management link"` | Wave 0 |
| Telegram confirmation message includes management link | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "telegram link"` | Wave 0 |
| Cancel route does NOT import `getServerSession` | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "no auth"` | Wave 0 |
| Reschedule route does NOT import `getServerSession` | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "no auth"` | Wave 0 |
| `CANCELLED` (not `CANCELED`) used in cancel route | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "CANCELLED"` | Wave 0 |
| BookingManagePage component file exists | Static file assertion | `npx jest __tests__/booking-manage-surface.test.ts -t "component"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/booking-manage-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/booking-manage-surface.test.ts` — covers all behavioral assertions above (static file pattern, same approach as existing `booking-surface.test.ts`)

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read — `prisma/schema.prisma`: Booking model fields, BookingStatus enum (`CANCELLED` with double L), Prisma relationships
- Codebase direct read — `lib/booking/engine.ts`: `createBooking` transaction pattern, conflict detection, `BookingConflictError`
- Codebase direct read — `app/api/bookings/route.ts`: Token generation insertion point, Telegram notification pattern, email confirmation pattern
- Codebase direct read — `app/api/bookings/[id]/status/route.ts`: Status transitions, authenticated cancel pattern (NOT to be reused — shows what to avoid)
- Codebase direct read — `lib/email/resend.ts`: Email template structure, `BookingEmailData` interface
- Codebase direct read — `lib/telegram.ts`: `sendTelegramMessage` signature
- Codebase direct read — `lib/auth/config.ts`: `crypto.randomUUID()` usage pattern
- Codebase direct read — `app/globals.css`: Neumorphism CSS variables and utility classes
- Codebase direct read — `components/tenant-public-page.tsx`: Public page pattern (no auth, Neumorphic styling)
- Codebase direct read — `components/booking-form.tsx`: Slot picker architecture, step pattern, niche color system
- Codebase direct read — `app/api/bookings/slots/route.ts`: Slot API parameters (tenantSlug, resourceId, serviceId, date)
- Codebase direct read — `.planning/STATE.md`: `prisma db push` pattern, date serialization pattern from Phase 5

### Secondary (MEDIUM confidence)
- npm registry — `nanoid` version 5.1.7 confirmed present in node_modules (URL-safe alternative to crypto.randomUUID)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly verified in package.json and node_modules
- Architecture: HIGH — patterns derived directly from existing codebase (engine.ts, route.ts files read)
- Pitfalls: HIGH — most derived from direct code reading (BookingStatus spelling, db push pattern, date serialization from STATE.md)

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain — Next.js App Router patterns, Prisma, no fast-moving libraries)
