# Architecture

**Analysis Date:** 2026-03-17

## Pattern Overview

**Overall:** Multi-tenant SaaS with Next.js App Router, layered server/client separation, tenant-scoped data access via AsyncLocalStorage context.

**Key Characteristics:**
- Multi-tenant isolation enforced at database level (tenant scoping via Prisma middleware)
- Subdomain-based tenant routing with header propagation through middleware
- Server-first architecture: API routes, server actions, and server components for auth/data access
- Role-based access control (CUSTOMER, STAFF, OWNER, SUPERADMIN) at middleware and action levels
- Explicit tenantId parameter passing in business logic functions—no global state reliance

## Layers

**Presentation Layer (React):**
- Purpose: Tenant-facing booking UI, dashboard admin UI, public landing pages
- Location: `app/(tenant)/*`, `app/dashboard/*`, `app/(marketing)/*`, `components/*`
- Contains: Page components, client-side forms, dashboard widgets, booking flows
- Depends on: Server actions in `lib/actions/*` for data mutations, API routes for client-side fetches
- Used by: Browser clients via routing

**API Layer (Route Handlers):**
- Purpose: RESTful endpoints for public booking flows, platform-level operations, webhooks
- Location: `app/api/*`
- Contains: Next.js route handlers (GET, POST, PUT, DELETE) handling request parsing, tenant resolution, error mapping
- Depends on: Business logic in `lib/booking/`, `lib/email/`, `lib/db`, validation schemas in `lib/validations/`
- Used by: External clients, mobile apps, webhook consumers, browser forms

**Server Actions Layer:**
- Purpose: Thin RPC-like functions called from server components and client components for data mutations
- Location: `lib/actions/*`
- Contains: Exported async functions marked with `'use server'`, authentication guards, DB mutations via `getTenantDB()`
- Depends on: Auth guards (`lib/auth/guards`), tenant context via `getTenantId()`
- Used by: React components via `<form action={...}>` or client-side calls

**Business Logic Layer:**
- Purpose: Core domain logic: booking slot generation, availability checks, email delivery
- Location: `lib/booking/`, `lib/email/`, `lib/auth/`, `lib/utils/`
- Contains: Pure functions receiving explicit parameters (no global state), custom error classes with statusCode
- Depends on: Database client `getTenantDB()` for data access
- Used by: Route handlers, server actions, other logic modules

**Data Access Layer:**
- Purpose: Tenant-scoped database client factory, Prisma singleton management
- Location: `lib/db/index.ts`
- Contains: `basePrisma` singleton, `getTenantDB(tenantId)` factory returning tenant-scoped Prisma client
- Depends on: Prisma client, tenant Prisma middleware extension
- Used by: Business logic, route handlers, server actions

**Tenant Context Layer:**
- Purpose: AsyncLocalStorage-based tenant isolation for concurrent request safety
- Location: `lib/tenant/context.ts`
- Contains: `setTenantContext()`, `getTenantId()`, `requireTenantId()` using Node.js AsyncLocalStorage
- Depends on: Nothing external—pure async context management
- Used by: Route handlers wrapping business logic, server actions

**Authentication Layer:**
- Purpose: NextAuth.js JWT-based session management, OTP, IP verification, concurrent session control
- Location: `lib/auth/*`
- Contains: Auth config, credential/Google providers, guards, OTP generation, session validation
- Depends on: `basePrisma` for user lookup, bcryptjs for password hashing
- Used by: Middleware for route protection, server actions for authorization checks

## Data Flow

**Tenant Resolution → Scoped Context → Business Logic:**

1. Middleware (`middleware.ts`) extracts tenant slug from subdomain or query param, sets `x-tenant-slug` header
2. Route handler (e.g., `/api/bookings/slots`) calls `resolveTenant(request)` which fetches tenant from `basePrisma`
3. Route handler wraps business logic in `setTenantContext(tenantId, callback)` to establish async context
4. Business logic (e.g., `getAvailableSlots()`) receives explicit tenantId parameter, never reads global state
5. Business logic calls `getTenantDB(tenantId)` to get tenant-scoped Prisma client for queries
6. Response returned to client with tenant-specific data

**Booking Creation Flow:**

1. Tenant public page (`/[slug]`) renders booking form component
2. Form submission calls `POST /api/bookings` with tenantSlug, resourceId, serviceId, date, customer info
3. Route handler: resolves tenant, validates input with Zod schema, calls `createBooking()` from engine
4. Engine: generates slots, checks conflicts in tenant-scoped DB, creates booking record atomically
5. On success: sends confirmation email via Resend, posts message to Telegram
6. On conflict/error: returns 409 or 422 with localized error message (Russian)

**Admin/Dashboard Data Mutations:**

1. Authenticated user loads dashboard (`/dashboard/*`)
2. Dashboard layout (`app/dashboard/layout.tsx`) fetches tenant info, checks session role
3. Admin form (e.g., service manager) submits via server action (e.g., `createService()` in `lib/actions/services.ts`)
4. Server action: calls `requireAuth()` guard, checks session.user.tenantId, calls `getTenantDB(tenantId)`
5. Server action performs mutation, calls `revalidatePath()` to invalidate Next.js cache
6. Browser receives response, component re-renders with fresh data

**State Management:**

- **Session State:** JWT token stored in secure HTTP-only cookie, validated by middleware and auth guards
- **Per-Tenant State:** Stored in Postgres via Prisma, isolated at schema level (every table has tenantId foreign key except Tenant itself)
- **Request State:** Tenant context via AsyncLocalStorage—lives for duration of request/async chain
- **UI State:** React component state (forms, filters) in browser—no Redux/Zustand needed for current scope
- **Cache:** Next.js App Router with `revalidatePath()` for on-demand ISR

## Key Abstractions

**Tenant Scoping:**
- Purpose: Ensure every query, mutation, and computation is scoped to the correct tenant
- Examples: `getTenantDB(tenantId)` returns Prisma client with automatic tenantId injection via middleware extension (`lib/tenant/prisma-tenant.ts`)
- Pattern: Function receives `tenantId` as explicit parameter, never infers from global/session context directly in business logic

**Custom Error Classes with HTTP Status:**
- Purpose: Uniform error handling from business logic through route handlers to HTTP responses
- Examples: `BookingConflictError` (409), `TenantNotFoundError` (404), `UnauthorizedError` (401)
- Pattern: Each error extends Error, includes `readonly statusCode` property, descriptive messages in Russian/English

**Auth Guards:**
- Purpose: Composable authorization checks for routes and actions
- Examples: `requireAuth()`, `requireRole()`, `requireTenant()`, `requireAuthWithRole()`
- Pattern: Guard functions throw error on failure; caller catches and maps to HTTP response

**Validation Schemas:**
- Purpose: Zod-based input validation for API routes and server actions
- Examples: `createServiceSchema`, `createResourceSchema`, `querySchema` for bookings list
- Pattern: Schemas colocated with actions/routes, `safeParse()` used for error mapping

**Locale & i18n:**
- Purpose: Multi-language support (Russian primary, extensible)
- Examples: Middleware reads `omnibook-locale` cookie, sets `x-omnibook-locale` header, root layout extracts locale
- Pattern: Locale header/context passed to database translations, email templates use locale-aware formatting

## Entry Points

**Browser - Public Booking:**
- Location: `app/(tenant)/[slug]/page.tsx`
- Triggers: User visits `tenant-slug.omnibook.com` or `/book?tenantSlug=...`
- Responsibilities: Render public-facing booking page with tenant branding, fetch available resources/services, submit bookings to `/api/bookings`

**Browser - Admin Dashboard:**
- Location: `app/dashboard/layout.tsx`
- Triggers: Authenticated user visits `/dashboard`
- Responsibilities: Check session, fetch tenant info, render admin sidebar, route to subpages (services, staff, bookings, analytics, settings)

**Browser - Authentication:**
- Location: `app/(auth)/` (login, verify-OTP pages)
- Triggers: Unauthenticated user visits `/login`, `/register`, OTP verification flow
- Responsibilities: Credential/email capture, server action calls to auth endpoints, session establishment

**API - Public Bookings:**
- Location: `app/api/bookings/` (route.ts for POST create, GET list; slots/route.ts for slot availability)
- Triggers: External clients POST to `/api/bookings`, GET `/api/bookings/slots?tenantSlug=...&resourceId=...&date=...`
- Responsibilities: Parse query/body, resolve tenant, validate, call booking engine, return JSON

**API - Webhooks:**
- Location: `app/api/webhooks/route.ts`, `app/api/telegram/webhook/route.ts`
- Triggers: External services (payment processor, Telegram) POST to webhook URLs
- Responsibilities: Verify signature, update booking status, trigger notifications

**Cron - Reminder Emails:**
- Location: `app/api/cron/reminders/route.ts`
- Triggers: External scheduler (Vercel Cron, external service) calls endpoint
- Responsibilities: Query bookings due within 24h, send reminder emails, track sent status

**Admin Platform:**
- Location: `app/admin/`, `app/api/admin/*`
- Triggers: Superadmin user visits `/admin`
- Responsibilities: Platform-level operations: view all tenants, suspend/activate, view usage, manage superadmin users

## Error Handling

**Strategy:** Layered error translation—business logic throws domain errors, route handlers map to HTTP responses, middleware provides auth-level rejection.

**Patterns:**

1. **Domain Errors:** Business logic throws custom errors (e.g., `BookingConflictError`). Include `statusCode` property and user-facing message.

   ```typescript
   // lib/booking/engine.ts
   export class BookingConflictError extends Error {
     readonly statusCode = 409
     constructor() {
       super("Это время уже занято...")
       this.name = "BookingConflictError"
     }
   }
   ```

2. **Route Handler Mapping:** Catch domain errors, return JSON with status code.

   ```typescript
   // app/api/bookings/route.ts
   try {
     const booking = await createBooking(...)
     return NextResponse.json({ booking }, { status: 201 })
   } catch (err) {
     if (err instanceof BookingConflictError) {
       return NextResponse.json({ error: err.message }, { status: err.statusCode })
     }
     return NextResponse.json({ error: 'Server error' }, { status: 500 })
   }
   ```

3. **Tenant Resolution Errors:** `resolveTenant()` throws specific errors (`TenantNotFoundError`, `TenantInactiveError`). Helper `isTenantError()` determines if error is expected.

   ```typescript
   // app/api/bookings/slots/route.ts
   try {
     const tenant = await resolveTenant(request)
   } catch (err) {
     if (isTenantError(err)) {
       return NextResponse.json({ error: err.message }, { status: (err as any).statusCode })
     }
   }
   ```

4. **Server Actions:** Use guards (`requireAuth()`, `requireRole()`) which throw; caller catches in error boundary or try-catch.

   ```typescript
   // lib/actions/services.ts
   async function getServices() {
     const session = await requireAuth()
     if (!session.user.tenantId) redirect('/login')
     const db = getTenantDB(session.user.tenantId)
     return db.service.findMany(...)
   }
   ```

## Cross-Cutting Concerns

**Logging:** Console.log used throughout (cloudflare.com style). TODO: Replace with structured logging (pino/winston) before production. Sample: `console.log("[SLOTS API] params:", { tenantSlug, ... })`.

**Validation:** Zod schemas for input validation in route handlers and server actions. No automatic request body validation—explicit `z.parse()` or `safeParse()` calls.

**Authentication:** NextAuth.js JWT + custom session extension for tenantId/role. Middleware validates token at edge level, guards validate in route handlers/actions.

**Internationalization:** Translations for UI and error messages stored in JSON (Tenant.translations, Resource.translations, Service.translations). Locale set via cookie/header, passed to components via context/prop.

**Database Transactions:** Booking creation uses Prisma transaction (`basePrisma.$transaction()`) to ensure atomicity. Example: create booking + deduct capacity in one TX.

**Rate Limiting:** IP-based OTP attempt limiting (not shown but references in `lib/auth/otp.ts`). TODO: Implement global API rate limiting middleware.

**Tenant Middleware Extension:** Custom Prisma middleware (`lib/tenant/prisma-tenant.ts`) automatically filters all queries by tenantId. Reduces boilerplate but requires bypassing with `basePrisma` for Tenant-level queries.

---

*Architecture analysis: 2026-03-17*
