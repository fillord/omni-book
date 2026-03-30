# Phase 7: Bookings Dashboard CRM Overhaul and Manual Booking Creation — Research

**Researched:** 2026-03-30
**Domain:** Next.js App Router dashboard, Prisma/PostgreSQL, Neumorphism Soft UI, Server Actions, i18n
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Manual booking creation: "➕ Новая запись" button opens a Sheet (slide-over) using Neumorphism Soft UI style
- Form fields: Date picker, Resource selector, Service selector, Time Slot selector (dynamic, based on Date+Resource+Service), Client Name (text), Client Phone (text)
- Save via Server Action — direct DB insert, bypasses public booking link/token logic (manageToken null/omitted)
- Slot availability must respect existing bookings (collision detection)
- Replace flat table with date-grouped sections; each group has a sticky header with human-readable label: "Сегодня, 30 Марта", "Завтра, 31 Марта", specific date for further days
- Time column styled bold/large for vertical scan readability
- Booking rows show: Time, Client Name, Service, Resource, Status
- CANCELLED bookings excluded by default — admin sees only PENDING + CONFIRMED + COMPLETED
- Toggle "Отменено" (or filter chip) allows showing cancelled bookings on demand
- Filter state: client-side only (no URL param required, but acceptable if added)
- All new UI strictly follows Neumorphism: `var(--neu-bg)`, `.neu-raised`, `.neu-inset` and rounded corners

### Claude's Discretion

- Exact slot generation logic: reuse existing `/api/bookings/slots` endpoint or replicate inline
- Whether to use Sheet or Dialog — Sheet preferred per user notes
- i18n keys structure (follow existing booking i18n namespace patterns)
- Form validation library (follow existing form patterns — react-hook-form + zod)
- Pagination or infinite scroll for grouped view (keep existing pagination if present, adapt to groups)

### Deferred Ideas (OUT OF SCOPE)

- Editing existing bookings from the dashboard
- Filtering by Resource or Service (beyond resource filter already present)
- Calendar view (grid/week view)
- Public booking flow changes
- Token management system changes
- Existing booking edit/cancel logic changes

</user_constraints>

---

## Summary

Phase 7 redesigns the `/dashboard/bookings` page from a raw paginated table into a CRM-style scheduling view, and adds admin manual booking creation via a Sheet slide-over. The existing `BookingsDashboard` component (`components/bookings-dashboard.tsx`) is the single file to overhaul — it already fetches bookings from `/api/bookings` via client-side fetch, manages status transitions, and renders a table+calendar tab structure with pagination.

The manual booking Server Action does not need a new API route — it should call `createBooking()` from `lib/booking/engine.ts` directly from a `'use server'` action, setting `manageToken: null` (since `manageToken` is nullable per the schema). The existing engine already handles collision detection with Serializable transactions. For slot availability in the form, the existing `/api/bookings/slots` endpoint accepts `tenantSlug`, `resourceId`, `serviceId`, `date` and is ready to reuse from the client.

The Neumorphism design system is fully defined. The Sheet component already exists at `components/ui/sheet.tsx` (using `@base-ui/react/dialog`), is already used in the sidebar for mobile navigation, and its `side="right"` variant is the correct choice. All form patterns follow `react-hook-form + zod + shadcn Form components` as established in `components/service-form.tsx` and `components/resource-form.tsx`.

**Primary recommendation:** Overhaul `BookingsDashboard` in-place with two additions — (1) grouping logic layer over the existing `tableData.data` array, and (2) a `ManualBookingSheet` sub-component + `createManualBooking` Server Action. Avoid rebuilding the fetch/filter/pagination infrastructure — only replace how fetched data is rendered.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | installed | Form state management | Already used in service-form, resource-form |
| zod | installed | Schema validation | Project-wide validation standard |
| @hookform/resolvers | installed | Zod adapter for RHF | Already present in deps |
| date-fns | installed | Date arithmetic for grouping logic | Already used in booking engine |
| date-fns-tz | installed | Timezone-aware date formatting | Already used for slot generation |
| sonner | installed | Toast notifications | Already used in BookingsDashboard |
| lucide-react | installed | Icons | Project-wide icon standard |

### Supporting — UI Primitives Already in Place
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @base-ui/react/dialog | installed | Powers Sheet (slide-over) | Manual booking sheet panel |
| class-variance-authority | installed | Variant styles | Button/badge variants |

**No new dependencies required.** All necessary libraries are already installed.

**Version verification:** No npm installs needed — all packages present in `package.json`.

---

## Architecture Patterns

### Recommended File Structure for Phase 7

```
components/
├── bookings-dashboard.tsx          # MODIFY: add grouping, default filter, "Новая запись" button
├── manual-booking-sheet.tsx        # NEW: Sheet slide-over with the admin booking form
lib/
├── actions/
│   └── bookings.ts                 # NEW: createManualBooking Server Action
lib/
├── validations/
│   └── booking.ts                  # NEW (or inline): Zod schema for manual booking input
lib/
├── i18n/
│   └── translations.ts             # MODIFY: add new keys to 'dashboard' section in all 3 locales
__tests__/
└── bookings-crm-surface.test.ts    # NEW: static assertions for phase requirements
```

### Pattern 1: Day-Grouping Over Existing Fetch

**What:** The existing `/api/bookings` endpoint already returns bookings sorted by `startsAt desc`. The grouping is a pure client-side transformation over `tableData.data`. No server changes needed.

**When to use:** Always in table view (replace existing flat `tableData.data.map(...)` rendering).

**Implementation approach:**

```typescript
// Source: project pattern from bookings-dashboard.tsx + date-fns
import { format, isToday, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

function groupBookingsByDay(bookings: BookingRow[], timezone: string) {
  const groups: Map<string, BookingRow[]> = new Map()
  for (const b of bookings) {
    const localDate = toZonedTime(new Date(b.startsAt), timezone)
    const key = format(localDate, 'yyyy-MM-dd')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(b)
  }
  return groups
}

function getDayLabel(dateKey: string, timezone: string): string {
  // "Сегодня, 30 Марта" / "Завтра, 31 Марта" / "2 Апреля"
  const d = toZonedTime(new Date(dateKey + 'T12:00:00'), timezone)
  const dayMonth = format(d, 'd MMMM', { locale: ru })
  if (isToday(d)) return `Сегодня, ${dayMonth}`
  if (isTomorrow(d)) return `Завтра, ${dayMonth}`
  return dayMonth
}
```

**Critical note:** The API returns `startsAt desc` (newest first). For a CRM scheduling view showing upcoming bookings, the query ordering should change to `startsAt asc` or the default filter should emphasize future bookings. Evaluate whether to add `?orderBy=asc` to the fetch call, or handle locally.

### Pattern 2: Default CANCELLED Filter Exclusion

**What:** On mount, `selectedStatuses` defaults to `['PENDING', 'CONFIRMED', 'COMPLETED']` instead of `[]` (all).

**Current behavior:** `useState<BookingStatusValue[]>([])` = no status filter = all returned including CANCELLED.

**New behavior:**

```typescript
// In BookingsDashboard initial state:
const [showCancelled, setShowCancelled] = useState(false)

// Statuses sent to API:
const effectiveStatuses = showCancelled
  ? selectedStatuses  // user's manual selection
  : selectedStatuses.length > 0
    ? selectedStatuses.filter(s => s !== 'CANCELLED')
    : ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW']
```

**Toggle UI:** A single chip/toggle "Отменено" outside the status chip row, visually distinct (e.g., muted by default, neu-inset when active).

### Pattern 3: Manual Booking Sheet — Server Action

**What:** A `'use server'` action that calls `createBooking()` from the engine directly, bypassing the public HTTP route (no manageToken generation, or set to null).

**CRITICAL insight:** The existing `createBooking()` engine function ALWAYS generates a `manageToken` via `crypto.randomUUID()`. For admin manual bookings, there are two options:
1. Add an optional `skipToken?: boolean` param to the engine (cleaner, but modifies shared code)
2. Create a separate `createManualBooking` path that calls `basePrisma.booking.create()` directly, reusing the collision-check Serializable transaction pattern — with `manageToken: null`

**Recommended approach:** Option 2 — write `createManualBooking` Server Action that implements the same collision-detection transaction as the engine but sets `manageToken: null`. This avoids modifying the public booking flow and is consistent with the "admin bypass" semantics.

**Server Action pattern** (follows `lib/actions/services.ts` conventions):

```typescript
// lib/actions/bookings.ts
'use server'

import { requireAuth, requireRole } from '@/lib/auth/guards'
import { basePrisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createManualBooking(data: ManualBookingInput) {
  const session = await requireAuth()
  requireRole(session, ['OWNER', 'STAFF', 'SUPERADMIN'])
  const tenantId = session.user.tenantId!

  // Zod validation
  const parsed = manualBookingSchema.parse(data)

  return basePrisma.$transaction(async (tx) => {
    // Lock resource row (same pattern as engine)
    await tx.$queryRaw`SELECT id FROM "Resource" WHERE id = ${parsed.resourceId} FOR UPDATE`

    // Collision check (same as engine, no phone-limit check for admin)
    const collision = await tx.booking.findFirst({ ... })
    if (collision) throw new BookingConflictError()

    return tx.booking.create({
      data: {
        tenantId,
        resourceId: parsed.resourceId,
        serviceId: parsed.serviceId,
        guestName: parsed.clientName,
        guestPhone: normalizePhone(parsed.clientPhone),
        startsAt: new Date(parsed.startsAt),
        endsAt: new Date(parsed.endsAt),
        status: 'CONFIRMED',
        manageToken: null,  // admin booking — no client management link
      },
    })
  }, { isolationLevel: 'Serializable' })
}
```

After creation: `revalidatePath('/dashboard/bookings')` to refresh the page data.

### Pattern 4: Slot Loading in Manual Booking Form

**What:** When user selects Date + Resource + Service, fetch slots from the existing `/api/bookings/slots` endpoint. This endpoint requires `tenantSlug` (not `tenantId`), which must be passed down as a prop to `ManualBookingSheet`.

**Fetch pattern** (client-side, matches existing `booking-form.tsx` approach):

```typescript
const [slots, setSlots] = useState<SlotResult[]>([])
const [slotsLoading, setSlotsLoading] = useState(false)

async function loadSlots(date: string, resourceId: string, serviceId: string) {
  if (!date || !resourceId || !serviceId) return
  setSlotsLoading(true)
  const params = new URLSearchParams({ tenantSlug, date, resourceId, serviceId })
  const res = await fetch(`/api/bookings/slots?${params}`)
  const json = await res.json()
  setSlots(json.slots ?? [])
  setSlotsLoading(false)
}

useEffect(() => {
  loadSlots(selectedDate, selectedResourceId, selectedServiceId)
}, [selectedDate, selectedResourceId, selectedServiceId])
```

**Important:** The slots endpoint calls `getAvailableSlots()` which enforces `bookingWindowDays`. Admin manual booking may need to book beyond this window. Either: (a) accept this limitation for v1, or (b) call `getAvailableSlots()` server-side from the Server Action path and bypass the window check. Decision is Claude's discretion — recommend (a) for simplicity.

### Pattern 5: Service-by-Resource Filtering in Form

**What:** When the admin selects a Resource, the Service dropdown should show only services linked to that resource (via `ResourceService` join table).

**How to source this data:** The `BookingsPage` server component already fetches `resources`. It should also fetch `services` with their linked resource IDs. The `ManualBookingSheet` receives this data as props and filters services client-side when a resource is selected.

**Fetch pattern in page.tsx:**

```typescript
const [tenant, resources, services, t] = await Promise.all([
  basePrisma.tenant.findUnique({ ... }),
  basePrisma.resource.findMany({ where: { tenantId, isActive: true }, ... }),
  basePrisma.service.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true, durationMin: true, resources: { select: { resourceId: true } } },
    orderBy: { name: 'asc' },
  }),
  getServerT(),
])
```

Client-side filtering: `services.filter(s => s.resources.some(r => r.resourceId === selectedResourceId))`.

### Pattern 6: Sheet Usage (Confirmed by Codebase)

The Sheet component is `@base-ui/react/dialog` based (NOT Radix UI). It is already in use in `dashboard-sidebar.tsx`. Key usage pattern:

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
    <SheetHeader className="p-4">
      <SheetTitle>Новая запись</SheetTitle>
    </SheetHeader>
    {/* form content */}
    <SheetFooter className="p-4">
      <Button onClick={handleSubmit}>Сохранить</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Neumorphism Sheet note:** Per STATE.md Phase 01 decision: "Sheet side borders removed — neu-raised box-shadow provides visual panel separation, hard borders conflict with Neumorphism borderless design." The Sheet component already has `neu-raised` applied in its `SheetContent` className.

### Anti-Patterns to Avoid

- **Don't rebuild the fetch/status-change infrastructure.** The existing `fetchTable`, `handleStatusChange`, pagination, and resource filter are working — only replace the rendering layer.
- **Don't use `border-border` on new UI elements.** `--border: transparent` in the Neumorphism theme — use `neu-raised`/`neu-inset` for visual separation.
- **Don't use `dark:` Tailwind overrides.** The Neumorphism system handles dark mode via CSS custom properties on `.dark`. Adding `dark:` classes conflicts.
- **Don't use `bg-card`, `bg-background` shortcuts on Neumorphism surfaces.** Use `bg-[var(--neu-bg)]` explicitly on components that need shadow depth (STATE.md decision: "Explicit bg-[var(--neu-bg)] on component roots required for shadow depth").
- **Don't skip `SelectTrigger` inset pattern.** `SelectTrigger` requires `neu-inset bg-[var(--neu-bg)]` — `bg-transparent` breaks shadow rendering.
- **Don't call `createBooking()` from the engine for manual bookings without considering the `BookingLimitError`.** The engine checks `MAX_ACTIVE_BOOKINGS_PER_PHONE = 2` — admin bookings should bypass this check.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slot availability | Custom slot calculator | `/api/bookings/slots` endpoint | Engine handles schedule, lunch breaks, DST, collision detection |
| Collision detection | Custom overlap check | `basePrisma.$transaction` with `SELECT FOR UPDATE` (same as engine) | Race condition safety requires database-level locking |
| Form validation | Manual field checks | `zod` schema + `react-hook-form` + `zodResolver` | Already in use throughout project |
| Phone normalization | Custom regex | `normalizePhone()` from `lib/utils/phone` | Already handles all formats |
| Toast notifications | Custom notification UI | `sonner` / `toast()` | Already imported in BookingsDashboard |
| Date formatting with timezone | Custom formatter | `date-fns-tz` `toZonedTime` + `date-fns` `format` | Already handles DST transitions |

---

## Current Bookings Page — Full Inventory

### What it does today:
1. `BookingsPage` (Server Component): fetches tenant timezone + resources, renders `BookingsDashboard` with `tenantSlug`, `timezone`, `canEdit`, `resources`
2. `BookingsDashboard` (Client Component):
   - Two tabs: Table and Calendar (calendar is separate component, not in scope)
   - Status filter chips (ALL_STATUSES: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW) — all unselected by default = no filter = shows all
   - Resource select dropdown
   - Date range inputs (dateFrom, dateTo)
   - Fetches from `/api/bookings?tenantSlug=...&page=...&limit=20&status=...&resourceId=...`
   - Renders mobile cards + desktop table (hidden/visible via `sm:hidden`/`hidden sm:table`)
   - Pagination: 20 per page, ChevronLeft/Right buttons with page counter
   - Status change: optimistic update via `PATCH /api/bookings/[id]/status`

### What changes in Phase 7:
- Default status filter changes from "none" (all) to "PENDING, CONFIRMED, COMPLETED, NO_SHOW" (excludes CANCELLED)
- Flat table rendering replaced by day-grouped sections with sticky headers
- "➕ Новая запись" button added to page header
- `ManualBookingSheet` component added
- `createManualBooking` Server Action added to `lib/actions/bookings.ts`
- New i18n keys in `dashboard` section

### What stays the same:
- Fetch infrastructure (`fetchTable`, `useCallback`, API endpoint `/api/bookings`)
- Calendar tab and `BookingCalendar` component
- Status change handling (`handleStatusChange`, PATCH route)
- Resource filter dropdown
- Date range filter
- Pagination (adapt to group view — "show pagination below each group" or global)
- Mobile card layout (adapt to show bold time, or keep same)

---

## Common Pitfalls

### Pitfall 1: API Returns `startsAt desc` — Grouping Shows Future Bookings Last
**What goes wrong:** The existing API orders bookings newest-first (`orderBy: { startsAt: 'desc' }`). Day-grouped sections for a CRM scheduling view should show today first, then future dates.
**Why it happens:** The original table was designed to show "most recent" at top for review purposes.
**How to avoid:** Pass `orderBy=asc` as a query param to the bookings API for the grouped view, OR add `?upcoming=true` filter to the fetch. The planner must address this — either extend the `/api/bookings` route to accept `orderBy`, or sort the fetched data client-side before grouping.
**Warning signs:** Day groups appear in reverse chronological order (e.g., "2 Апреля" before "Сегодня").

### Pitfall 2: isToday/isTomorrow Use Local Machine Time, Not Tenant Timezone
**What goes wrong:** `date-fns` `isToday()` / `isTomorrow()` check against the machine's local timezone, not the tenant's timezone. For a tenant in `Asia/Almaty` (+5), a booking at 01:00 local might register as yesterday in UTC.
**Why it happens:** `date-fns` does not support timezone-aware `isToday`.
**How to avoid:** Convert the date key to the tenant timezone first, then compare against "today" also in the tenant timezone using `date-fns-tz`. Or: compare just the YYYY-MM-DD string of the current date in the tenant timezone against the booking's date key.
**Warning signs:** "Сегодня" label doesn't match the tenant's current date.

### Pitfall 3: `createBooking()` Engine Throws `BookingLimitError` for Admin
**What goes wrong:** If `createManualBooking` calls the engine directly, it will enforce `MAX_ACTIVE_BOOKINGS_PER_PHONE = 2`. An admin booking for a client who already has 2 active bookings will fail.
**Why it happens:** The engine is designed for the public flow where spam protection is needed.
**How to avoid:** Write `createManualBooking` as a separate path that omits the per-phone active booking count check (admin has override authority). Still keep the collision check.
**Warning signs:** Admin gets 429 error when trying to book a client who has 2 existing bookings.

### Pitfall 4: Slot Picker `bookingWindowDays` Blocks Admin Bookings
**What goes wrong:** The `/api/bookings/slots` endpoint returns `[]` for dates beyond `bookingWindowDays`. Admin may need to book further ahead.
**Why it happens:** `getAvailableSlots()` has a max-date check that silently returns empty slots.
**How to avoid:** For v1, document this limitation. The admin date picker should constrain to `bookingWindowDays + N` or display a warning when no slots appear.

### Pitfall 5: Sheet Content Overflow Without `overflow-y-auto`
**What goes wrong:** The `SheetContent` for the manual booking form may overflow vertically on small screens if slots list is long.
**Why it happens:** `SheetContent` uses `flex flex-col` but height is set to full viewport — no scroll by default.
**How to avoid:** Add `overflow-y-auto` to `SheetContent` className, and ensure form sections inside use flex-grow appropriately.

### Pitfall 6: Services Not Filtered to Show Only Those Linked to Selected Resource
**What goes wrong:** Admin selects a resource, but service dropdown still shows all tenant services including unlinked ones.
**Why it happens:** ResourceService join table not consulted during form filtering.
**How to avoid:** Fetch services with `resources: { select: { resourceId: true } }` in the page Server Component, and filter client-side in the sheet when resource changes.

### Pitfall 7: `SelectTrigger` Shadow Depth Broken
**What goes wrong:** Select dropdowns in the form appear flat (no inset shadow) breaking Neumorphism consistency.
**Why it happens:** `bg-transparent` on SelectTrigger prevents the shadow from showing correctly against the panel background.
**How to avoid:** Use `SelectTrigger className="neu-inset bg-[var(--neu-bg)]"` — same pattern as existing dashboard selects.

---

## Code Examples

### Day-Grouped Table Section (HTML/JSX Structure)

```tsx
// Source: pattern derived from existing bookings-dashboard.tsx table structure

{groupedBookings.map(([dateKey, dayBookings]) => (
  <div key={dateKey}>
    {/* Sticky day header */}
    <div className="sticky top-0 z-10 bg-[var(--neu-bg)] py-2 px-4">
      <span className="text-sm font-semibold text-muted-foreground">
        {getDayLabel(dateKey, timezone)}
      </span>
    </div>

    {/* Day's bookings */}
    <div className="space-y-1 pb-4">
      {dayBookings.map((booking) => {
        const { time } = formatDateTimeRu(booking.startsAt, timezone)
        const clientName = booking.user?.name ?? booking.guestName
        return (
          <div key={booking.id} className="flex items-center gap-4 rounded-lg neu-raised bg-[var(--neu-bg)] px-4 py-2">
            {/* Bold time */}
            <span className="text-lg font-bold tabular-nums w-14 shrink-0">{time}</span>
            {/* Client */}
            <span className="font-medium min-w-0 truncate flex-1">{clientName ?? '—'}</span>
            {/* Service */}
            <span className="text-sm text-muted-foreground hidden md:block flex-1 min-w-0 truncate">
              {booking.service?.name ?? '—'}
            </span>
            {/* Resource */}
            <span className="text-sm text-muted-foreground hidden lg:block flex-1 min-w-0 truncate">
              {booking.resource.name}
            </span>
            {/* Status */}
            <BookingStatusBadge status={booking.status} />
          </div>
        )
      })}
    </div>
  </div>
))}
```

### Manual Booking Zod Schema

```typescript
// Source: pattern from lib/validations/service.ts
import { z } from 'zod'

export const manualBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверный формат даты'),
  resourceId: z.string().min(1, 'Выберите ресурс'),
  serviceId: z.string().min(1, 'Выберите услугу'),
  startsAt: z.string().min(1, 'Выберите время'),  // UTC ISO string from slot
  endsAt: z.string().min(1, 'Время окончания обязательно'),
  clientName: z.string().min(1, 'Введите имя клиента').max(100),
  clientPhone: z.string().min(7, 'Введите номер телефона'),
})

export type ManualBookingInput = z.infer<typeof manualBookingSchema>
```

### i18n New Keys (dashboard section, ru locale)

```typescript
// Add to translations.ts dashboard section, all 3 locales (ru/kz/en):
newBooking:       'Новая запись',       // Button label
newBookingTitle:  'Создать запись',     // Sheet title
bookingCreated:   'Запись создана',     // Success toast
selectDate:       'Выберите дату',      // Date picker placeholder
selectResource:   'Выберите ресурс',   // Resource dropdown
selectService:    'Выберите услугу',   // Service dropdown
selectTime:       'Выберите время',    // Time slot
clientName:       'Имя клиента',       // Field label
clientPhone:      'Телефон клиента',   // Field label
showCancelled:    'Отменено',          // Toggle chip label
noSlotsOnDate:    'Нет слотов на эту дату', // Empty state in slot picker
today:            'Сегодня',           // Day header (already exists in dashboard)
tomorrow:         'Завтра',            // Day header — NEW key
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-rendered table | Client-side fetch + state | Existing | Filters/pagination without page reload |
| shadcn/ui Sheet (Radix) | @base-ui/react/dialog Sheet | Phase 01 | Same API surface, different import path |
| All bookings visible | CANCELLED hidden by default | Phase 7 | Cleaner CRM view — admin sees actionable bookings |

**Deprecated/outdated:**
- `dark:` Tailwind variants on dashboard components: replaced by CSS custom property approach in Neumorphism refactor

---

## Booking Model: Required Fields for Manual Booking

From `prisma/schema.prisma`:

| Field | Required | Value for Manual Booking |
|-------|---------|-------------------------|
| `tenantId` | Yes | From session |
| `resourceId` | Yes | Admin selects |
| `serviceId` | No (String?) | Admin selects — should always set |
| `guestName` | No (String?) | Admin enters client name |
| `guestPhone` | No (String?) | Admin enters client phone |
| `guestEmail` | No | Omit for manual booking |
| `startsAt` | Yes (DateTime) | From selected slot |
| `endsAt` | Yes (DateTime) | Computed from slot endsAt |
| `status` | Default CONFIRMED | Use CONFIRMED for admin-created |
| `manageToken` | No (String? @unique) | **null** — admin booking, no client self-manage link |
| `userId` | No | Omit (no user account linkage) |
| `notes` | No | Omit or add optional field to form |

---

## Open Questions

1. **API ordering for grouped view**
   - What we know: `/api/bookings` currently orders `startsAt desc` (newest first)
   - What's unclear: Does the planner want to extend the API to support `?orderBy=asc`, or sort client-side after fetch?
   - Recommendation: Add `orderBy` query param to `/api/bookings` GET handler (small server change) to properly support future-first scheduling view. Alternative: client-side sort before grouping (simpler but wasteful if paginating).

2. **Pagination strategy in grouped view**
   - What we know: Current pagination is 20 bookings per page, with Previous/Next controls
   - What's unclear: Should pagination operate at the global level (show 20 bookings across groups), or per-group?
   - Recommendation: Keep global pagination (20/page), group whatever is on the current page. This preserves the existing API contract. Add date-range filters to navigate to past/future periods.

3. **Admin booking window bypass**
   - What we know: `/api/bookings/slots` silently returns `[]` beyond `bookingWindowDays`
   - What's unclear: Should admin be able to book beyond the window?
   - Recommendation: For v1, accept the same window limit. Document as future enhancement.

4. **`today` i18n key collision**
   - What we know: `dashboard.today` key already exists (`'Сегодня'`)
   - What's unclear: Whether the existing key covers the group header use case
   - Recommendation: Reuse `dashboard.today` for the group header label; add `dashboard.tomorrow` as new key.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — this phase is purely code changes to existing Next.js app with existing DB schema)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest) |
| Config file | `jest.config.ts` at project root |
| Quick run command | `jest __tests__/bookings-crm-surface.test.ts --no-coverage` |
| Full suite command | `jest --no-coverage` |

Tests in this project use static file assertions (`fs.readFileSync` + regex) — they test that source files contain required patterns, not runtime behavior. This is the established pattern across all existing test files.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-B01 | BookingsDashboard default state excludes CANCELLED from API params | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B01"` | ❌ Wave 0 |
| CRM-B02 | "Отменено" toggle chip present in BookingsDashboard | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B02"` | ❌ Wave 0 |
| CRM-B03 | BookingsDashboard renders day-group headers with sticky positioning | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B03"` | ❌ Wave 0 |
| CRM-B04 | Time column uses bold/large font class in booking rows | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B04"` | ❌ Wave 0 |
| CRM-B05 | ManualBookingSheet component exists and is imported by BookingsDashboard | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B05"` | ❌ Wave 0 |
| CRM-B06 | createManualBooking Server Action exists in lib/actions/bookings.ts | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B06"` | ❌ Wave 0 |
| CRM-B07 | createManualBooking sets manageToken: null (not randomUUID) | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B07"` | ❌ Wave 0 |
| CRM-B08 | ManualBookingSheet uses Sheet component from @/components/ui/sheet | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B08"` | ❌ Wave 0 |
| CRM-B09 | Neumorphism: neu-raised/neu-inset classes used in booking rows and sheet | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B09"` | ❌ Wave 0 |
| CRM-B10 | i18n: dashboard section contains newBooking, tomorrow keys in all 3 locales | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B10"` | ❌ Wave 0 |
| CRM-B11 | createManualBooking uses requireAuth + requireRole guard | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B11"` | ❌ Wave 0 |
| CRM-B12 | Slot picker calls /api/bookings/slots with tenantSlug+resourceId+serviceId+date | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B12"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `jest __tests__/bookings-crm-surface.test.ts --no-coverage`
- **Per wave merge:** `jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/bookings-crm-surface.test.ts` — covers CRM-B01 through CRM-B12

*(No framework config changes needed — Jest is fully configured)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `components/bookings-dashboard.tsx` — complete current implementation analyzed
- Direct codebase read: `lib/booking/engine.ts` — `createBooking()`, `getAvailableSlots()` signatures and logic
- Direct codebase read: `prisma/schema.prisma` — Booking model, manageToken nullable field, BookingStatus enum
- Direct codebase read: `components/ui/sheet.tsx` — Sheet component using @base-ui/react/dialog
- Direct codebase read: `app/api/bookings/route.ts` — GET/POST handlers, query schema
- Direct codebase read: `app/api/bookings/slots/route.ts` — Slot endpoint signature
- Direct codebase read: `lib/i18n/translations.ts` — Full translation structure, all 3 locales, `dashboard` and `manage` sections
- Direct codebase read: `components/service-form.tsx` — react-hook-form + zod pattern
- Direct codebase read: `.planning/STATE.md` — All Neumorphism pitfalls and decisions

### Secondary (MEDIUM confidence)
- Codebase inference: `dashboard-sidebar.tsx` Sheet usage confirms `side="left"` works; `side="right"` for the booking sheet is the symmetrical choice
- Codebase inference: `lib/actions/services.ts` establishes the Server Action convention (requireAuth, requireRole, revalidatePath)

### Tertiary (LOW confidence)
- None — all findings sourced directly from codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified present in package.json
- Architecture: HIGH — BookingsDashboard fully analyzed, all integration points confirmed
- Pitfalls: HIGH — derived from STATE.md accumulated decisions + direct code inspection
- i18n keys: HIGH — translations.ts fully read, namespace/structure confirmed

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable stack, no fast-moving dependencies)
