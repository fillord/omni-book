# Codebase Structure

**Analysis Date:** 2026-04-01

## Directory Layout

```
omni-book/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Route group: login, register, verify-otp
│   ├── (marketing)/            # Route group: landing page
│   ├── (tenant)/               # Route group: public booking pages per tenant
│   │   └── [slug]/             # Dynamic tenant public page
│   ├── admin/                  # Superadmin panel
│   │   ├── analytics/
│   │   ├── announcements/
│   │   ├── audit-logs/
│   │   └── tenants/[tenantId]/
│   ├── api/                    # API routes (webhooks, booking, auth)
│   │   ├── auth/               # NextAuth + register + session check
│   │   ├── bookings/           # Booking CRUD, slots, busy times, calendar
│   │   ├── cron/               # Scheduled tasks (payments, reminders, subscriptions)
│   │   ├── manage/[token]/     # Guest booking management (cancel, reschedule)
│   │   ├── resources/          # Resource listing (TODO: stub)
│   │   ├── telegram/           # Telegram bot endpoint
│   │   ├── tenants/            # Tenant API (TODO: stub)
│   │   ├── upload/logo/        # Logo upload
│   │   └── webhooks/           # kaspi, meta/WhatsApp, telegram
│   ├── banned/                 # Suspended tenant page
│   ├── book/                   # Public booking wizard (TODO: stub)
│   ├── dashboard/              # Tenant dashboard (auth-gated)
│   │   ├── analytics/
│   │   ├── bookings/
│   │   ├── clients/[clientId]/
│   │   ├── resources/
│   │   ├── services/
│   │   ├── settings/billing/
│   │   ├── settings/
│   │   └── staff/
│   ├── manage/[token]/         # Guest: view/cancel/reschedule own booking
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
│
├── components/                 # React components
│   ├── ui/                     # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── dashboard/              # Dashboard-specific sub-components
│   ├── landing/                # Landing page sections (Hero, Features, Pricing, etc.)
│   ├── shared/                 # Cross-cutting (ClientOnly)
│   └── *.tsx                   # Feature-level components (flat, not nested)
│
├── lib/                        # Business logic & utilities
│   ├── actions/                # Next.js Server Actions ('use server')
│   ├── auth/                   # NextAuth config, guards, OTP, types
│   ├── booking/                # Booking engine (slot generation, creation)
│   ├── db/                     # Prisma client singleton + getTenantDB factory
│   ├── email/                  # Resend email sending + reminders
│   ├── i18n/                   # Translations (ru/kz/en), server helper
│   ├── niche/                  # Niche config (beauty/horeca/sports/medicine)
│   ├── notifications/          # Notification orchestration (email + Telegram)
│   ├── payments/               # Kaspi Pay adapter (mock in Phase 9)
│   ├── resources/              # Resource type definitions
│   ├── tenant/                 # Tenant resolution, Prisma extension, guards
│   ├── utils/                  # Phone normalization, misc utils
│   ├── validations/            # Zod schemas (booking, resource, service, settings)
│   ├── payment-lifecycle.ts    # Payment state machine
│   ├── rate-limit.ts           # In-memory rate limiting
│   ├── subscription-lifecycle.ts # Subscription state machine
│   ├── telegram.ts             # Telegram Bot API client
│   └── utils.ts                # cn() and other shared utils
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration history
│   ├── seed.ts                 # Dev seed
│   └── seed-demo.ts            # Demo data seed
│
├── __tests__/                  # Jest test suite
│   ├── lib/tenant/             # Unit tests for tenant isolation
│   └── *.test.ts               # Surface/integration tests
│
├── public/assets/              # Static assets
├── middleware.ts               # Edge middleware (auth + subdomain routing)
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config (@/* path alias)
├── jest.config.ts              # Jest config (ts-jest, Node env)
├── .env.example                # Environment variable reference
└── package.json
```

## Key File Locations

| What | Where |
|------|-------|
| DB client / `getTenantDB` | `lib/db/index.ts` |
| Tenant Prisma extension | `lib/tenant/prisma-tenant.ts` |
| Tenant resolver | `lib/tenant/resolve.ts` |
| Auth config (NextAuth) | `lib/auth/config.ts` |
| Auth guards | `lib/auth/guards.ts` |
| Booking engine | `lib/booking/engine.ts` |
| Server Actions | `lib/actions/*.ts` |
| Zod schemas | `lib/validations/*.ts` |
| i18n translations | `lib/i18n/translations.ts` |
| Niche config | `lib/niche/config.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Route middleware | `middleware.ts` |
| Root providers | `components/providers.tsx` |

## Naming Conventions

### Files
- **Components:** PascalCase for landing (`HeroSection.tsx`), kebab-case for feature components (`booking-form.tsx`)
- **Server Actions:** kebab-case (`bookings.ts`, `tenant-settings.ts`)
- **API routes:** `route.ts` (Next.js convention)
- **Tests:** `*.test.ts` in `__tests__/`

### Functions & Variables
- **Components:** PascalCase (`BookingForm`, `DashboardSidebar`)
- **Functions:** camelCase (`createBooking`, `getTenantDB`, `requireAuth`)
- **Auth guards:** `requireX` prefix (`requireAuth`, `requireRole`)
- **Server actions:** verb+noun (`createManualBooking`, `updateTenantSettings`)
- **Zod schemas:** noun+`Schema` (`manualBookingSchema`, `serviceSchema`)
- **Error classes:** PascalCase + `Error` suffix (`BookingConflictError`, `TenantNotFoundError`)
- **Constants:** UPPER_SNAKE_CASE for sets/maps (`TENANT_SCOPED`, `WHERE_OPS`)

### Path Alias
All internal imports use `@/` alias (maps to project root):
```typescript
import { basePrisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/guards'
```

## Where to Add Code

| Task | Location |
|------|----------|
| New dashboard page | `app/dashboard/{feature}/page.tsx` |
| New server action | `lib/actions/{feature}.ts` (add `'use server'`) |
| New API endpoint | `app/api/{feature}/route.ts` |
| New Zod schema | `lib/validations/{feature}.ts` |
| New UI component | `components/{feature}.tsx` or `components/ui/` for primitives |
| New translation keys | `lib/i18n/translations.ts` (add to all 3 locales) |
| New email template | `lib/email/resend.ts` (add function) |
| New webhook handler | `app/api/webhooks/{service}/route.ts` |
| New test | `__tests__/{feature}.test.ts` |
