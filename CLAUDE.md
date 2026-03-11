# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.
**Read this file COMPLETELY before making any changes.**

## Project Overview

**omni-book** — universal multi-tenant SaaS booking platform for 4 niches:
- **Medicine** — clinics, psychologists, lawyers
- **Beauty** — hairdressers, barbers, tattoo artists
- **HoReCa** — cafes, restaurants, anti-cafes
- **Sports** — courts, photo studios, hourly lofts

Multiple businesses can share the same niche (e.g., two clinics). Each business is a separate **tenant** isolated by `tenantId`. Niche only determines UI template.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.12 |
| Runtime | React | 19.0.0 |
| Language | TypeScript | ^5 |
| ORM | Prisma | 6.7.0 |
| Database | PostgreSQL | 16-alpine (Docker) |
| CSS | Tailwind CSS | 4.2.1 |
| UI | shadcn/ui | 4.0.2 (New York, Zinc) |
| Forms | react-hook-form + Zod | 7.71.2 / 4.3.6 |
| Auth | NextAuth | 4.24.11 |
| Email | Resend | 6.9.3 |
| Toasts | sonner | — |
| Date/TZ | date-fns + date-fns-tz | — |
| Passwords | bcryptjs | — |
| Icons | lucide-react | 0.577.0 |
| Dev port | **3030** (NOT 3000) | — |

## Commands

```bash
npm run dev                        # Dev server on port 3030
npm run build                      # Production build
npx tsc --noEmit                   # Type check
npx prisma db push                 # Sync schema
npx prisma db push --force-reset   # Reset DB + sync
npx prisma db seed                 # Seed 5 tenants
npx prisma studio                  # DB browser :5555
docker compose up -d               # Start postgres
```

## Critical Rules

### 1. Tenant Isolation (MOST IMPORTANT)
- **Every DB query MUST include explicit `where: { tenantId }`**
- **Use `basePrisma`** (not extended client) — AsyncLocalStorage is unreliable in Next.js 15
- **tenantId from `session.user.tenantId`** (Dashboard) or `resolveTenant()` (API)
- **NEVER from client input, NEVER hardcoded**
- Before create/update/delete: verify record belongs to tenant via `findFirst({ where: { id, tenantId } })`

### 2. Niche System
- All niche behavior driven by `lib/niche/config.ts` — NEVER hardcode niche logic
- `getNicheConfig(niche)` returns labels, colors, resource types, attribute fields, hero text
- Fallback to medicine for unknown/null niches

### 3. Schedule on Resource Creation
- Creating a resource MUST also create default Schedule entries
- Without Schedule → "Не работает в этот день" for ALL days
- Defaults: medicine Mon-Fri 09-18, beauty Mon-Sat 09-19, horeca daily 10-23, sports daily 07-22

### 4. Tailwind 4 Constraint
- **NEVER use template literals for Tailwind classes** (e.g., `` `bg-${color}-600` ``)
- Use static string records/objects (COLORS map)

### 5. Zod Pattern
- Project uses manual `.safeParse()` in submit handlers, NOT zodResolver (TS dual-types issue)
- Keep this pattern consistent

### 6. Date Handling
- API: always YYYY-MM-DD, sanitize on server
- Store UTC in DB, display in tenant timezone (`Tenant.timezone`)

### 7. Phone Numbers
- `formatPhone()` for display: +7 (XXX) XXX XX XX
- `normalizePhone()` for DB storage: +7XXXXXXXXXX
- `PhoneInput` component: formats on blur
- Anti-spam uses normalizedPhone for comparison

### 8. Port
- NEXTAUTH_URL must be http://localhost:3030
- Mismatch causes auth redirect to wrong server in WSL

### 9. Images
- Use `<img>` tag (not `next/image`) for external URLs, OR configure `hostname: "**"` in next.config.ts
- Image preview in settings: `onError` hides broken images

### 10. Price Units
- Form input: major units (tenge)
- DB storage: minor units (tiyins = ×100)

## Architecture

### Key Files
```
lib/db/index.ts              # basePrisma (raw) + prisma (tenant-extended)
lib/niche/config.ts          # ★ Central niche definitions
lib/booking/engine.ts        # getAvailableSlots + createBooking (FOR UPDATE)
lib/email/resend.ts          # Email notifications (no-op without RESEND_API_KEY)
lib/utils/phone.ts           # formatPhone + normalizePhone
lib/actions/resources.ts     # Server Actions with Schedule creation
lib/actions/services.ts      # Server Actions
lib/actions/tenant-settings.ts # Settings CRUD (OWNER only)
```

### Routing
```
/                             # Marketing landing
/[slug]                       # Public tenant page (dynamic)
/login, /register             # Auth
/dashboard/*                  # Protected (session required)
/clinic                       # Legacy redirect → /city-polyclinic
```

### API
```
POST /api/bookings            # Create booking (201/409/422/429)
GET  /api/bookings            # List with pagination/filters
GET  /api/bookings/slots      # Available time slots
GET  /api/bookings/calendar   # Week view grouped by resource
GET  /api/bookings/busy       # Busy time windows
PATCH /api/bookings/[id]/status # Change status (auth required)
POST /api/auth/register       # Create tenant + user
```

### Booking Flow
1. POST creates booking with FOR UPDATE transaction lock
2. Anti-spam: max 2 active bookings per phone per tenant
3. Fire-and-forget email via Resend (no-op in dev)
4. Status transitions: PENDING→CONFIRMED→COMPLETED/CANCELLED/NO_SHOW

### Auth
- NextAuth JWT: CredentialsProvider (email + bcrypt)
- Session: `{ id, email, name, role, tenantId, tenantSlug }`
- Roles: SUPERADMIN, OWNER, STAFF, CUSTOMER
- STAFF: read-only in settings, can manage bookings

### Mobile Pattern
- Desktop: `<table className="hidden sm:table">`
- Mobile: card list `<div className="sm:hidden">`
- FAB button: `fixed bottom-6 right-6` (mobile only)
- Sidebar: Sheet on mobile, fixed aside on desktop

## Test Accounts (password: `password123`)

| Email | Tenant | Niche |
|-------|--------|-------|
| clinic-owner@test.com | city-polyclinic | medicine |
| zdorovie@test.com | zdorovie-med | medicine |
| salon-owner@test.com | beauty-studio | beauty |
| bistro-owner@test.com | bistro-central | horeca |
| sport-owner@test.com | sport-arena | sports |

## Environment

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omni_book"
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3030
ROOT_DOMAIN=omnibook.com
RESEND_API_KEY=                # Optional; emails disabled if absent
```

## Before Every Task

1. Read this file
2. `npx tsc --noEmit` — fix type errors first
3. Verify isolation: `grep -rn "findMany\|count\|findFirst" --include="*.ts" --include="*.tsx" app/dashboard/ lib/actions/ | grep -v tenantId` → must be empty
4. After schema changes: `npx prisma db push && npx prisma db seed`
5. Test: public pages (4 niches) + login each account + verify data isolation
6. Mobile check: DevTools 375px width on key pages