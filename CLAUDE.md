# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
**Read this file COMPLETELY before making any changes.**

## Project Overview

**omni-book** is a universal multi-tenant SaaS booking platform that adapts to various niches:
- **Beauty** — hairdressers, barbers, tattoo artists
- **HoReCa** — cafes, restaurants, anti-cafes
- **Sports & Leisure** — courts, photo studios, hourly lofts
- **Medicine & Consulting** — psychologists, lawyers, clinics

Multiple businesses can use the same niche (e.g., two polyclinics). Each business is a separate **tenant** isolated by `tenantId`. The niche only determines UI template (colors, labels, form fields).

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.12 |
| UI Runtime | React | 19.0.0 |
| Language | TypeScript | ^5 |
| ORM | Prisma | 6.7.0 |
| Database | PostgreSQL | 16-alpine (Docker) |
| CSS | Tailwind CSS | 4.2.1 |
| UI Components | shadcn/ui | 4.0.2 (New York, Zinc) |
| Forms | react-hook-form + zod | 7.71.2 / 4.3.6 |
| Auth | next-auth | 4.24.11 |
| Icons | lucide-react | 0.577.0 |
| Testing | jest + ts-jest | ^29 |
| Package manager | npm | (system) |

## Common Commands

```bash
npm install                        # Install dependencies
npm run dev                        # Dev server (port 3030, NOT 3000)
npm run build                      # Production build
npx tsc --noEmit                   # Type check
npm test                           # Run tests

# Prisma
npx prisma db push                 # Sync schema to DB
npx prisma db push --force-reset   # Reset DB + sync
npx prisma db seed                 # Seed test data (5 tenants, all niches)
npx prisma studio                  # Visual DB browser on :5555

# Docker
docker compose up -d               # Start postgres
docker compose down                # Stop postgres
```

## Architecture

### Directory Layout

```
app/
├── (marketing)/page.tsx              # Landing page → /
├── (tenant)/
│   ├── [slug]/page.tsx               # PUBLIC tenant page → /beauty-studio, /city-polyclinic etc.
│   └── clinic/page.tsx               # Legacy redirect → /city-polyclinic
├── (auth)/login/page.tsx             # Login
├── (auth)/register/page.tsx          # Register (creates Tenant + User)
├── dashboard/
│   ├── layout.tsx                    # Reads tenant from session, provides nicheConfig
│   ├── page.tsx                      # Dashboard home (stats)
│   ├── bookings/page.tsx             # Bookings table + calendar
│   ├── resources/page.tsx            # Resources CRUD
│   ├── services/page.tsx             # Services CRUD
│   └── settings/page.tsx             # Settings
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── bookings/route.ts             # GET (list) + POST (create)
│   ├── bookings/slots/route.ts       # GET available time slots
│   ├── bookings/[id]/status/route.ts # PATCH status change
│   ├── bookings/calendar/route.ts    # GET week view data
│   └── bookings/busy/route.ts        # GET busy slots
components/
├── booking-form.tsx                  # 4-step booking wizard
├── tenant-public-page.tsx            # Niche-aware public page
├── resource-form.tsx                 # Dynamic resource form
├── service-form.tsx                  # Service form
├── ui/                               # shadcn/ui components
lib/
├── db/index.ts                       # Prisma singleton (basePrisma for direct queries)
├── auth/config.ts                    # NextAuth config (JWT + Credentials)
├── booking/engine.ts                 # getAvailableSlots + createBooking (with FOR UPDATE)
├── niche/config.ts                   # ★ Central niche definitions
├── tenant/context.ts                 # AsyncLocalStorage (UNRELIABLE — use basePrisma + explicit tenantId)
├── tenant/resolve.ts                 # Resolve tenant from request headers
├── validations/                      # Zod schemas
├── actions/                          # Server Actions (resources, services)
prisma/
├── schema.prisma
├── seed.ts                           # 5 tenants: medicine×2, beauty, horeca, sports
middleware.ts                         # x-tenant-slug header + auth route protection
```

### Multi-Tenancy Model

**CRITICAL RULES — READ CAREFULLY:**

1. **Every DB query MUST include explicit `where: { tenantId }`** — no exceptions
2. **Use `basePrisma` (not the extended client) for all queries** — AsyncLocalStorage is unreliable in Next.js 15
3. **tenantId comes from `session.user.tenantId`** (Dashboard) or `resolveTenant()` (API) — NEVER from client input
4. **NEVER hardcode a tenant slug** — always resolve dynamically
5. **Before create/update/delete: verify the record belongs to the tenant** via `findFirst({ where: { id, tenantId } })`

### Niche System

**All niche-specific behavior is driven by `lib/niche/config.ts`. Never hardcode niche logic.**

### Booking Engine

- `getAvailableSlots()` reads Schedule model to generate slots
- `createBooking()` uses Prisma `$transaction` with `FOR UPDATE` lock
- **A resource with no Schedule entries = no available slots = unbookable**
- **When creating a resource via Dashboard, default Schedule entries MUST be created too**

### Auth

NextAuth JWT: CredentialsProvider (email + bcrypt). Session contains `{ id, email, name, role, tenantId, tenantSlug }`.
After login/register → `/dashboard`. Roles: SUPERADMIN, OWNER, STAFF, CUSTOMER.

### Anti-Spam Booking Limits

- Max 2 active (PENDING/CONFIRMED) bookings per phone number per tenant
- Checked in POST /api/bookings BEFORE creating
- Exceeding limit → 429 "Превышен лимит бронирований"

## Known Issues & Rules

### Schedule on Resource Creation
- **Creating a resource via Dashboard MUST also create default Schedule entries**
- Without Schedule → "В этот день специалист не работает" for ALL days
- Defaults by niche: medicine Mon-Fri 09-18, beauty Mon-Sat 09-19, horeca daily 10-23, sports daily 07-22
- Dashboard should show schedule editing UI (or at minimum create defaults)

### Date Handling
- Always YYYY-MM-DD for API. Sanitize on server. Store UTC in DB.

### API Robustness
- try/catch everywhere, Zod validation, proper HTTP codes
- Never `findUniqueOrThrow` — use `findUnique` + null check

## Test Accounts

| Email | Password | Tenant | Niche |
|-------|----------|--------|-------|
| clinic-owner@test.com | password123 | city-polyclinic | medicine |
| zdorovie@test.com | password123 | zdorovie-med | medicine |
| salon-owner@test.com | password123 | beauty-studio | beauty |
| bistro-owner@test.com | password123 | bistro-central | horeca |
| sport-owner@test.com | password123 | sport-arena | sports |

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omni_book"
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3030
ROOT_DOMAIN=omnibook.com
```

## Before Every Task

1. Read this file completely
2. `npx tsc --noEmit` — fix type errors first
3. Verify tenant isolation: `grep -rn "findMany\|count\|findFirst" --include="*.ts" --include="*.tsx" app/dashboard/ lib/actions/ | grep -v tenantId` — must return empty
4. After DB changes: `npx prisma db push && npx prisma db seed`
5. Test: check public pages + login each account + verify data isolation