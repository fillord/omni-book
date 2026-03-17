# Codebase Structure

**Analysis Date:** 2026-03-17

## Directory Layout

```
omni-book/
├── app/                        # Next.js App Router pages and API routes
│   ├── (auth)/                 # Auth group: login, register, OTP verification
│   ├── (marketing)/            # Public marketing pages (landing)
│   ├── (tenant)/               # Tenant public booking interface (dynamic [slug])
│   ├── admin/                  # Superadmin platform
│   ├── api/                    # REST API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── bookings/           # Booking CRUD and availability endpoints
│   │   ├── resources/          # Resource management (owner-only)
│   │   ├── tenants/            # Tenant management (owner-only)
│   │   ├── upload/             # File uploads (logo)
│   │   ├── telegram/           # Telegram webhook endpoint
│   │   ├── cron/               # Scheduled tasks (reminders)
│   │   ├── webhooks/           # Third-party webhooks (payments)
│   │   └── force-signout/      # Session termination endpoint
│   ├── book/                   # Deprecated: legacy booking page (see (tenant)/[slug])
│   ├── banned/                 # Banned user fallback page
│   ├── dashboard/              # Admin dashboard root
│   │   ├── settings/           # Tenant settings, billing
│   │   ├── bookings/           # Bookings list/detail
│   │   ├── resources/          # Resource management UI
│   │   ├── services/           # Service management UI
│   │   ├── staff/              # Staff/team management UI
│   │   └── analytics/          # Analytics dashboard
│   ├── layout.tsx              # Root layout (locale, theme setup)
│   └── globals.css             # Global Tailwind styles
│
├── lib/                        # Shared business logic and utilities
│   ├── actions/                # Server actions (use server) for mutations
│   │   ├── services.ts         # Service CRUD operations
│   │   ├── resources.ts        # Resource CRUD operations
│   │   ├── staff.ts            # Staff/user management
│   │   ├── tenant-settings.ts  # Tenant config updates
│   │   ├── account.ts          # User account operations
│   │   ├── billing.ts          # Billing/subscription actions
│   │   ├── analytics.ts        # Analytics data fetching
│   │   ├── admin.ts            # Superadmin operations
│   │   └── otp.ts              # OTP operations
│   │
│   ├── auth/                   # Authentication & authorization
│   │   ├── config.ts           # NextAuth.js configuration
│   │   ├── types.ts            # Session type augmentation
│   │   ├── guards.ts           # Authorization helper functions
│   │   ├── utils.ts            # Auth utility functions
│   │   ├── otp.ts              # OTP generation & verification
│   │   └── index.ts            # Barrel exports
│   │
│   ├── booking/                # Booking domain logic
│   │   └── engine.ts           # Slot generation, availability, creation logic
│   │
│   ├── db/                     # Database client management
│   │   └── index.ts            # Prisma singleton, tenant-scoped client factory
│   │
│   ├── tenant/                 # Tenant isolation and context
│   │   ├── context.ts          # AsyncLocalStorage tenant context
│   │   ├── resolve.ts          # Tenant resolution from request
│   │   ├── guard.ts            # Tenant validation middleware
│   │   ├── prisma-tenant.ts    # Prisma middleware for tenant scoping
│   │   └── index.ts            # Barrel exports
│   │
│   ├── email/                  # Email delivery
│   │   ├── resend.ts           # Resend SDK integration
│   │   └── reminders.ts        # Reminder email logic
│   │
│   ├── i18n/                   # Internationalization
│   │   ├── translations.ts     # Static translation keys (Russian)
│   │   ├── db-translations.ts  # DB translation queries
│   │   └── server.ts           # Server-side i18n helpers
│   │
│   ├── utils/                  # Utilities
│   │   ├── index.ts            # General utils (cn(), formatting, etc.)
│   │   └── phone.ts            # Phone number normalization
│   │
│   ├── resources/              # Resource service layer
│   │   └── (resource-related utilities)
│   │
│   ├── niche/                  # Niche-specific configuration
│   │   └── config.ts           # Niche branding & feature flags
│   │
│   ├── validations/            # Zod schemas for input validation
│   │   ├── service.ts          # Service creation/update schemas
│   │   ├── resource.ts         # Resource creation/update schemas
│   │   └── tenant-settings.ts  # Settings update schemas
│   │
│   ├── telegram.ts             # Telegram bot integration
│   └── utils.ts                # Additional utilities
│
├── components/                 # React components (client & server)
│   ├── ui/                     # Atomic UI components (shadcn-inspired)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── sonner.tsx          # Toast notifications
│   │   └── ... (20+ UI primitives)
│   │
│   ├── shared/                 # Shared composite components
│   │   └── (navbar, footer, layout components)
│   │
│   ├── booking/                # Booking-specific components
│   │   └── (booking flow, calendar, form parts)
│   │
│   ├── dashboard/              # Dashboard-specific components
│   │   └── (sidebar, card layouts, etc.)
│   │
│   ├── landing/                # Landing page components
│   │   └── (hero, features, pricing, etc.)
│   │
│   ├── marketing/              # Marketing page components
│   │   └── (CTAs, testimonials, etc.)
│   │
│   ├── providers.tsx           # React context providers
│   ├── theme-providers.tsx     # Dark mode and theme providers
│   ├── session-monitor.tsx     # Session state monitoring
│   │
│   ├── analytics-dashboard.tsx # Analytics visualization
│   ├── booking-form.tsx        # Main booking form
│   ├── booking-calendar.tsx    # Calendar widget for date selection
│   ├── bookings-dashboard.tsx  # Admin bookings view
│   ├── service-form.tsx        # Service editor form
│   ├── resource-form.tsx       # Resource editor form
│   ├── settings-form.tsx       # Tenant settings form
│   ├── staff-manager.tsx       # Staff management UI
│   ├── services-manager.tsx    # Services management UI
│   ├── resources-manager.tsx   # Resources management UI
│   ├── tenant-public-page.tsx  # Tenant landing page component
│   └── ... (other page-level components)
│
├── prisma/                     # Prisma schema & migrations
│   ├── schema.prisma           # Database schema definition
│   └── migrations/             # Database migration history
│
├── public/                     # Static assets (images, icons)
│   └── ... (branding, logos, etc.)
│
├── __tests__/                  # Test files
│   └── lib/tenant/             # Unit tests for tenant isolation
│
├── scripts/                    # Utility scripts
│   └── (database seed, etc.)
│
├── .planning/                  # GSD documentation (auto-generated)
│   └── codebase/               # Architecture & structure docs
│
├── middleware.ts               # Next.js middleware (auth, tenant routing)
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & scripts
├── jest.config.js              # Jest test configuration
└── ... (other config files)
```

## Directory Purposes

**`app/(auth)/`:**
- Purpose: Authentication pages (login, register, OTP verification)
- Contains: Page components for signin, OTP verification flow
- Key files: `layout.tsx` wraps with dark theme provider, page.tsx files for each auth step
- Route group: `(auth)` prefix hidden from URL

**`app/(marketing)/`:**
- Purpose: Public landing page and marketing content
- Contains: Unauthenticated marketing pages
- Key files: `page.tsx` for `/`, `layout.tsx`
- Route group: `(marketing)` prefix hidden from URL

**`app/(tenant)/`:**
- Purpose: Public tenant booking interface (dynamic per tenant slug)
- Contains: `[slug]` dynamic route for tenant-specific public pages
- Key files: `layout.tsx` for theme, `[slug]/page.tsx` renders tenant public page with booking form
- Route group: `(tenant)` prefix hidden from URL

**`app/dashboard/`:**
- Purpose: Admin dashboard for tenant managers
- Contains: Multi-page admin interface for managing bookings, resources, services, staff, analytics, settings
- Key files: `layout.tsx` requires auth, redirects superadmin to `/admin`, renders sidebar
- Subdirectories: `bookings/`, `resources/`, `services/`, `staff/`, `analytics/`, `settings/`

**`app/admin/`:**
- Purpose: Superadmin platform for managing platform-wide operations
- Contains: Tenant list, superadmin user management, platform analytics
- Key files: `layout.tsx`, `page.tsx` (tenants list), `tenants/page.tsx`

**`app/api/`:**
- Purpose: REST API routes consumed by public clients, webhooks, scheduled tasks
- Contains: Route handlers for bookings, resources, auth, webhooks, cron jobs
- Pattern: Each route.ts file handles GET/POST/PUT/DELETE, returns JSON

**`app/api/bookings/`:**
- Purpose: Booking CRUD and availability queries
- Key files:
  - `route.ts`: POST (create booking), GET (list bookings)
  - `slots/route.ts`: GET (available slots for resource+service+date)
  - `[id]/route.ts`: GET/PUT/DELETE single booking
  - `[id]/status/route.ts`: PATCH booking status

**`app/api/auth/`:**
- Purpose: Authentication endpoints
- Key files:
  - `[...nextauth]/route.ts`: NextAuth.js route handler
  - `register/route.ts`: POST new user registration
  - `check-session/route.ts`: GET current session info

**`lib/actions/`:**
- Purpose: Server actions for dashboard mutations (services, resources, staff, settings)
- Pattern: Each file exports multiple async functions marked `'use server'`
- Usage: Called from server components via `<form action={...}>` or client components via `startTransition()`
- Auth: Each action calls `requireAuth()`, checks tenantId, may check role

**`lib/auth/`:**
- Purpose: Authentication system (NextAuth.js, OTP, guards)
- Key files:
  - `config.ts`: NextAuth configuration with credential/Google providers
  - `guards.ts`: `requireAuth()`, `requireRole()`, `requireTenant()` helpers
  - `types.ts`: Session type augmentation (adds tenantId, role, phone to JWT)
  - `otp.ts`: OTP generation, IP verification, code expiry logic

**`lib/booking/`:**
- Purpose: Booking domain logic—slot generation, conflict checking, creation
- Key file: `engine.ts` (500+ lines)
- Exports: `getAvailableSlots()`, `createBooking()`, custom error classes

**`lib/db/`:**
- Purpose: Database client management
- Key file: `index.ts`
- Exports: `basePrisma` (raw singleton), `getTenantDB(tenantId)` (scoped factory)

**`lib/tenant/`:**
- Purpose: Tenant isolation system
- Key files:
  - `context.ts`: AsyncLocalStorage for per-request tenant context
  - `resolve.ts`: Tenant lookup from request headers/params
  - `prisma-tenant.ts`: Prisma middleware injecting tenantId filter

**`lib/email/`:**
- Purpose: Email delivery via Resend
- Key files:
  - `resend.ts`: Resend client setup
  - `reminders.ts`: Reminder email logic (cron trigger)

**`lib/i18n/`:**
- Purpose: Internationalization (Russian primary)
- Key files:
  - `translations.ts`: Static translation keys
  - `db-translations.ts`: Query translations from Tenant/Resource/Service records

**`lib/utils/`:**
- Purpose: Utility functions used throughout codebase
- Key files:
  - `index.ts`: `cn()` (class merging), date formatting, type helpers
  - `phone.ts`: Phone number normalization and validation

**`components/`:**
- Purpose: React components (mix of client and server)
- Subdirectories: `ui/` (primitives), `shared/` (reusable), `booking/`, `dashboard/`, `landing/`, `marketing/`
- Pattern: Functional components, hooks for state, CSS modules or Tailwind

**`prisma/`:**
- Purpose: Database schema and migrations
- Key file: `schema.prisma` defines Tenant, User, Booking, Resource, Service, Schedule, etc.
- Migrations: Auto-generated by `prisma migrate` command

**`middleware.ts`:**
- Purpose: Next.js middleware for auth, tenant routing, locale propagation
- Runs at: Edge level for all requests matching config.matcher pattern
- Responsibilities: JWT validation, route protection, tenant slug extraction from subdomain, header injection

**`__tests__/`:**
- Purpose: Unit and integration tests
- Current coverage: Tenant isolation tests in `__tests__/lib/tenant/`
- Framework: Jest (configured in `jest.config.js`)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout—establishes locale context, providers, globals.css
- `app/(marketing)/page.tsx`: Public landing page (`/`)
- `app/(tenant)/[slug]/page.tsx`: Tenant public booking page (`:slug.omnibook.com`)
- `app/dashboard/layout.tsx`: Admin dashboard entry—requires auth, renders sidebar
- `app/admin/layout.tsx`: Superadmin platform entry—requires SUPERADMIN role

**Configuration:**
- `middleware.ts`: Route protection, tenant routing, header injection
- `lib/auth/config.ts`: NextAuth.js configuration
- `lib/niche/config.ts`: Niche-specific branding/feature flags
- `prisma/schema.prisma`: Database schema
- `tsconfig.json`: TypeScript path aliases (`@/*`)

**Core Logic:**
- `lib/booking/engine.ts`: Booking slot generation, conflict checking, creation
- `lib/auth/guards.ts`: Authorization checks
- `lib/tenant/context.ts`: Tenant context isolation
- `lib/db/index.ts`: Database client factory

**Testing:**
- `jest.config.js`: Jest configuration
- `__tests__/lib/tenant/context.test.ts`: Tenant context isolation tests

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- Layout components: `layout.tsx` (Next.js convention)
- Route handlers: `route.ts` (Next.js convention)
- Server actions: Action-specific names (e.g., `services.ts`, `resources.ts`)
- UI components: PascalCase (e.g., `BookingForm.tsx`, `ServiceManager.tsx`)
- Utilities: camelCase with descriptive names (e.g., `getNicheConfig`, `normalizePhone`)
- Validation schemas: Descriptive (e.g., `createServiceSchema`, `updateResourceSchema`)

**Directories:**
- Route groups: Parentheses (e.g., `(auth)`, `(tenant)`, `(marketing)`) — hidden from URL
- Dynamic segments: Brackets (e.g., `[slug]`, `[id]`) — passed as params
- Feature modules: PascalCase feature name (e.g., `booking/`, `tenant/`, `email/`)
- UI component collections: Feature-based (e.g., `booking/`, `dashboard/`, `landing/`)

**Functions:**
- Action/business logic: `verbNoun` pattern (e.g., `getServices`, `createBooking`, `sendReminders`)
- Guards/checks: `requireX` pattern (e.g., `requireAuth`, `requireTenant`, `requireRole`)
- Getters/queries: `get...` or `fetch...` (e.g., `getAvailableSlots`, `fetchUserBookings`)
- Setters/mutations: `create...`, `update...`, `delete...` (e.g., `createBooking`, `updateResource`)
- Helpers: Descriptive lowercase (e.g., `normalizePhone`, `formatDate`, `cn`)

**Types/Interfaces:**
- Entity types from Prisma: PascalCase (e.g., `Tenant`, `Booking`, `Resource`, `Service`)
- Type augmentation: Suffix `WithRelations` (e.g., `ServiceWithRelations`)
- Input types: Suffix `Input` or Prisma `GetPayload` (e.g., `CreateServiceInput`)
- Schema names: Suffix `Schema` (e.g., `createServiceSchema`)
- Error classes: Suffix `Error` (e.g., `BookingConflictError`, `TenantNotFoundError`)

## Where to Add New Code

**New Booking Feature (e.g., recurring bookings):**
- Extend Prisma schema: `prisma/schema.prisma` (add `recurringRule` field to Booking)
- Database migration: `prisma migrate dev --name add_recurring_to_booking`
- Business logic: `lib/booking/engine.ts` (add `createRecurringBooking()` function)
- Validation: `lib/validations/booking.ts` (add `recurringBookingSchema`)
- API endpoint: `app/api/bookings/recurring/route.ts` (new POST route)
- Server action: `lib/actions/bookings.ts` (add `createRecurringBooking()` action)
- UI component: `components/booking/recurring-form.tsx` (form for recurring settings)
- Tests: `__tests__/lib/booking/recurring.test.ts`

**New Dashboard Page (e.g., reviews/ratings):**
- Page component: `app/dashboard/reviews/page.tsx`
- Sub-components: `components/dashboard/reviews-list.tsx`, `components/dashboard/review-detail.tsx`
- Server action: `lib/actions/reviews.ts` with `getReviews()`, `respondToReview()`
- Validation: `lib/validations/review.ts`
- Tests: `__tests__/lib/actions/reviews.test.ts`
- Update Prisma: Add Review model if needed
- Update sidebar: `components/dashboard-sidebar.tsx` (add link)

**New External Integration (e.g., payment provider Stripe):**
- Wrapper: `lib/payments/stripe.ts` (Stripe SDK init, helper functions)
- Webhook handler: `app/api/webhooks/stripe/route.ts` (verify signature, update booking)
- Server action: `lib/actions/billing.ts` (extend with `createPaymentIntent()`)
- Validation: `lib/validations/payment.ts` (schema for payment input)
- Environment: Add `STRIPE_SECRET_KEY` to `.env.local`
- Tests: `__tests__/lib/payments/stripe.test.ts`

**New Resource Type (e.g., online classes):**
- Extend Prisma: Add `resourceType` enum value in `schema.prisma`, add `onlineMeetingUrl` field
- Migration: `prisma migrate dev --name add_online_resource_type`
- Business logic: `lib/booking/engine.ts` (handle online resources in slot generation)
- Config: `lib/niche/config.ts` (add resource type feature flag if niche-specific)
- UI components: `components/booking/online-meeting-select.tsx`
- Tests: `__tests__/lib/booking/online-resources.test.ts`

**New Utility/Helper:**
- Location: `lib/utils/` or existing `lib/utils/index.ts` if short
- Pattern: Export from `lib/utils/index.ts` for barrel import
- Usage: Import as `import { myHelper } from '@/lib/utils'`
- Tests: `__tests__/lib/utils/my-helper.test.ts` if complex

## Special Directories

**`lib/actions/`:**
- Purpose: Server actions for mutations
- Generated: No—hand-written
- Committed: Yes
- Pattern: Each file is a module exporting multiple async functions with `'use server'` directive
- No imports from `app/` (avoids circular deps with components)

**`components/ui/`:**
- Purpose: Atomic, reusable UI primitives
- Generated: Partially—shadcn CLI may scaffold initial components
- Committed: Yes—customized versions
- Pattern: Functional components, Tailwind classes, Radix UI for complex interactions

**`.next/`:**
- Purpose: Build output directory (Next.js compiled code, source maps)
- Generated: Yes—on `npm run build`
- Committed: No (in `.gitignore`)
- Usage: Do not edit manually; clean with `rm -rf .next && npm run build`

**`prisma/migrations/`:**
- Purpose: Database migration history
- Generated: Yes—by `prisma migrate` command
- Committed: Yes—part of version control
- Pattern: Immutable once committed; create new migrations, don't edit old ones

**`db/data/`:**
- Purpose: Seed data (if present) or database files (SQLite)
- Generated: Possibly—dependent on DB type
- Committed: Generally not for production data
- Usage: Reference `prisma/seed.ts` for seed script

**`.planning/codebase/`:**
- Purpose: GSD documentation (auto-generated)
- Generated: Yes—by `/gsd:map-codebase` command
- Committed: Yes
- Files: `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`, `STACK.md`, `INTEGRATIONS.md`

---

*Structure analysis: 2026-03-17*
