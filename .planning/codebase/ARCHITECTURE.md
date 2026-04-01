# Architecture

**Analysis Date:** 2026-04-01

## Pattern Overview

**Multi-tenant SaaS** built on Next.js App Router. Architecture centers on:
1. **Tenant isolation via Prisma extension** — `getTenantPrisma` auto-injects `tenantId` into every qualifying query
2. **Server Actions as mutation layer** — dashboard CRUD uses `'use server'` actions instead of API routes
3. **Explicit parameter passing** — no AsyncLocalStorage or global state; `tenantId` is always passed explicitly
4. **Middleware-based routing & auth** — Edge-compatible JWT checks; subdomain → tenant slug header injection

## Layers

```
Browser / Client
     │
     ├── Client Components (React state, interactivity)
     │        └── components/*.tsx, components/ui/*, components/dashboard/*, components/landing/*
     │
     ├── Server Components (data fetching, page rendering)
     │        └── app/**/page.tsx, app/**/layout.tsx
     │
     ├── Server Actions (mutations, form submissions)
     │        └── lib/actions/*.ts  ['use server']
     │
     ├── API Routes (webhooks, booking API, public endpoints)
     │        └── app/api/**/*.ts
     │
     └── Middleware (auth guards, subdomain routing)
              └── middleware.ts  [Edge Runtime]

Business Logic
     ├── lib/booking/engine.ts       — slot generation, atomic booking creation
     ├── lib/payment-lifecycle.ts    — payment state machine
     ├── lib/subscription-lifecycle.ts — subscription state machine
     ├── lib/tenant/prisma-tenant.ts — Prisma tenant scoping extension
     └── lib/auth/guards.ts          — requireAuth(), requireRole()

Data
     └── PostgreSQL via Prisma ORM
```

## Tenant Isolation

Core mechanism: `lib/tenant/prisma-tenant.ts`

```typescript
// All feature code uses this instead of basePrisma directly
export function getTenantDB(tenantId: string) {
  return getTenantPrisma(basePrisma, tenantId)
}
```

`getTenantPrisma` uses Prisma `$extends/$allOperations` to:
- **WHERE ops** (`findMany`, `update`, `delete`, etc.): injects `tenantId` into `where`
- **DATA ops** (`create`, `createMany`): injects `tenantId` into `data`
- **UNIQUE ops** (`findUnique`): post-validates result ownership (Prisma unique constraints disallow extra WHERE fields)

Scoped models: `User`, `Resource`, `Service`, `Booking`
Unscoped models: `Tenant` (and others) pass through unchanged.

## Tenant Resolution (API Routes)

`lib/tenant/resolve.ts` resolves tenant from request in order:
1. `x-tenant-slug` header (set by middleware from subdomain)
2. `tenantSlug` query param (dev fallback)

Middleware (`middleware.ts`) sets `x-tenant-slug` by extracting subdomain from `Host` header.

## Authentication Architecture

`middleware.ts` (Edge-compatible, JWT-only, no DB):
- `PROTECTED_PREFIXES = ['/dashboard']` → requires any authenticated role
- `ADMIN_PREFIXES = ['/admin']` → requires `SUPERADMIN`
- `OWNER_API_PREFIXES = ['/api/resources', '/api/tenants']` → requires `OWNER` or `SUPERADMIN`
- `AUTH_ONLY_PATHS = ['/login', '/register']` → redirect to dashboard if already signed in

Roles: `OWNER`, `STAFF`, `SUPERADMIN`

Server-side guards (`lib/auth/guards.ts`):
```typescript
requireAuth()          // throws UnauthorizedError (401) if no session
requireRole(session, ['OWNER', 'STAFF'])  // throws ForbiddenError (403)
```

IP change detection: if user's IP changes between sessions, OTP re-verification is triggered.

## Data Flow — Public Booking

```
User visits /{slug} → (tenant) route group
  → app/(tenant)/[slug]/page.tsx (Server Component)
  → resolves tenant from slug via DB
  → renders TenantPublicPage component

User selects slot → POST /api/bookings/slots (resource + date)
  → lib/booking/engine.ts: generateSlots()
  → returns available time slots

User submits form → POST /api/bookings
  → resolveTenant() from request
  → lib/booking/engine.ts: createBooking()
  → atomic Prisma transaction (slot conflict check + insert)
  → sends email confirmation (Resend) + Telegram notification
  → returns booking with manageToken
```

## Data Flow — Dashboard Mutations

```
Dashboard page (Server Component) fetches data via lib/actions/*.ts
  → requireAuth() + requireRole() guards
  → getTenantDB(session.tenantId) for scoped queries

Form submit → Server Action (lib/actions/*.ts)
  → Zod validation
  → getTenantDB(tenantId) mutation
  → revalidatePath('/dashboard/...')
```

## Error Handling Pattern

Custom error classes with `statusCode` property (HTTP status code):

```typescript
export class BookingConflictError extends Error {
  readonly statusCode = 409
  constructor() {
    super("Это время уже занято.")  // Russian user-facing message
    this.name = 'BookingConflictError'
  }
}
```

All custom errors follow this pattern. API routes catch and return `{ error: message }` with appropriate status.

Type guard: `isAuthError(err)` to distinguish auth errors from other errors.

## i18n Architecture

- **Locales:** `ru` (default), `kz`, `en`
- **Storage:** Cookie (`omnibook-locale`) + header (`x-omnibook-locale`)
- **Server:** `lib/i18n/server.ts` — `getServerT()` reads header/cookie, returns `t(section, key)` function
- **Translations:** `lib/i18n/translations.ts` — flat nested object (locale → section → key)
- **DB translations:** `lib/i18n/db-translations.ts` — translated DB field labels

## Niche System

Tenants declare a `niche` (`beauty`, `horeca`, `sports`, `medicine`). `lib/niche/config.ts` provides:
- Per-niche resource types (e.g. "barber", "room", "doctor")
- Labels (resourceLabel, serviceLabel, bookingLabel)
- Attribute fields for resources
- Theme accent classes

Booking form, resource cards, and public page adapt based on the tenant's niche.

## Entry Points

| Entry Point | Purpose |
|-------------|---------|
| `app/layout.tsx` | Root layout (providers, theme) |
| `app/(marketing)/page.tsx` | Landing page |
| `app/(tenant)/[slug]/page.tsx` | Public booking page per tenant |
| `app/dashboard/layout.tsx` | Dashboard shell (auth-gated) |
| `app/admin/layout.tsx` | Superadmin panel |
| `app/(auth)/login/page.tsx` | Login flow |
| `app/manage/[token]/page.tsx` | Guest booking management |
| `middleware.ts` | Auth guards + subdomain routing |
| `lib/db/index.ts` | DB client singleton + `getTenantDB()` |
