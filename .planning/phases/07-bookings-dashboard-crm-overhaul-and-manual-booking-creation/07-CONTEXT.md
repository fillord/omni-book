# Phase 7: Bookings Dashboard CRM Overhaul and Manual Booking Creation — Context

**Gathered:** 2026-03-30
**Status:** Ready for planning
**Source:** User-provided PRD via plan-phase context prompt

<domain>
## Phase Boundary

Redesign the `/dashboard/bookings` page from a raw database table view into a proper CRM scheduling interface, and add a manual booking creation feature for admins. No changes to public-facing booking flows or the tokenized management system.

**In scope:**
- Manual booking creation (admin-only, Server Action, bypasses public link/token logic)
- Day-grouped bookings view with sticky date headers and bold time emphasis
- Default filter: CANCELLED bookings hidden unless toggled on
- All new UI in Neumorphism Soft UI style

**Out of scope:**
- Public booking flow changes
- Token management system changes
- Existing booking edit/cancel logic changes

</domain>

<decisions>
## Implementation Decisions

### Manual Booking Creation
- Add a prominent primary button **"➕ Новая запись"** at the top of the bookings page
- Clicking opens a **Slide-over panel (Sheet)** using Neumorphism Soft UI style
- Form fields: Date picker, Resource selector, Service selector, Time Slot selector (dynamic based on Date+Resource+Service), Client Name (text), Client Phone (text)
- Save via a **Server Action** — direct DB insert, bypasses public booking link/token logic (manageToken should be null or omitted)
- Slot availability must respect existing bookings (collision detection)

### Smart Table Grouping (By Day)
- Replace flat table with **date-grouped sections**
- Each group has a **sticky header** with human-readable label: "Сегодня, 30 Марта", "Завтра, 31 Марта", specific date for further days
- **Time column** styled bold/large for vertical scan readability
- Booking rows show: Time, Client Name, Service, Resource, Status

### Default Filters
- **CANCELLED bookings excluded by default** — admin sees only PENDING + CONFIRMED + COMPLETED
- A toggle labeled **"Отменено"** (or filter chip) allows showing cancelled bookings on demand
- Filter state: client-side only (no URL param required, but acceptable if added)

### UI Design
- All new elements (button, sheet/modal, group headers, table rows) strictly follow Neumorphism Soft UI: `var(--neu-bg)`, `.neu-raised` for cards/buttons, `.neu-inset` for inputs/form fields
- Rounded corners, soft shadows consistent with existing dashboard components

### Claude's Discretion
- Exact slot generation logic (reuse existing `/api/bookings/slots` endpoint or replicate inline)
- Whether to use Sheet (slide-over) or Dialog (modal) — Sheet preferred per user notes
- i18n keys structure (follow existing booking i18n namespace patterns)
- Form validation library (follow existing form patterns — react-hook-form + zod)
- Pagination or infinite scroll for grouped view (keep existing pagination if present, adapt to groups)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Bookings Page
- `app/dashboard/bookings/page.tsx` — current implementation to overhaul

### Booking API & Actions
- `app/api/bookings/slots/route.ts` — existing slot availability endpoint (reuse for manual booking form)

### Data Model
- `prisma/schema.prisma` — Booking model, manageToken field, status enum

### Neumorphism Design System
- `app/globals.css` — CSS variables: `var(--neu-bg)`, `.neu-raised`, `.neu-inset`
- `components/ui/button.tsx` — Button variants including neu-btn
- `components/booking-form.tsx` — existing booking form pattern for reference

### State & Decisions
- `.planning/STATE.md` — accumulated project decisions (Phase 06-01: manageToken nullable, crypto.randomUUID, collision detection patterns)

### i18n
- `public/locales/` — existing translation files, follow existing namespace patterns

</canonical_refs>

<specifics>
## Specific Ideas

- Group header format: "Сегодня, 30 Марта" / "Завтра, 31 Марта" / "2 Апреля" (relative labels for today/tomorrow, absolute for rest)
- Time display: bold, larger font for quick vertical scanning of schedule
- "➕ Новая запись" — primary CTA button, top-right of page header
- Sheet component from shadcn/ui for the slide-over panel

</specifics>

<deferred>
## Deferred Ideas

- Editing existing bookings from the dashboard (not in scope for this phase)
- Filtering by Resource or Service (not mentioned, can be future)
- Calendar view (grid/week view) — possible future phase

</deferred>

---

*Phase: 07-bookings-dashboard-crm-overhaul-and-manual-booking-creation*
*Context gathered: 2026-03-30 via user PRD*
