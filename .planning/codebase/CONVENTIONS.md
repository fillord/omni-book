# Coding Conventions

**Analysis Date:** 2026-04-01

## Naming Patterns

### Files
- **Feature components:** kebab-case (`booking-form.tsx`, `bookings-dashboard.tsx`)
- **Landing components:** PascalCase (`HeroSection.tsx`, `FeaturesGrid.tsx`)
- **Server Actions:** kebab-case grouped by domain (`lib/actions/bookings.ts`)
- **API routes:** always `route.ts` (Next.js convention)
- **Lib modules:** kebab-case (`prisma-tenant.ts`, `payment-lifecycle.ts`)

### Code
- **React components:** PascalCase (`BookingForm`, `ManualBookingSheet`)
- **Functions:** camelCase (`createBooking`, `getTenantDB`, `sendBookingConfirmation`)
- **Auth guards:** `requireX` prefix (`requireAuth`, `requireRole`)
- **Server actions:** verb+noun (`createManualBooking`, `updateTenantSettings`, `cancelExpiredBooking`)
- **Error classes:** PascalCase + `Error` suffix (`BookingConflictError`, `TenantNotFoundError`)
- **Zod schemas:** noun+`Schema` (`manualBookingSchema`, `serviceSchema`, `resourceSchema`)
- **Type guards:** `isX` prefix (`isAuthError`)
- **Constants / Sets:** UPPER_SNAKE_CASE (`TENANT_SCOPED`, `WHERE_OPS`, `PROTECTED_PREFIXES`)

## Module Structure

### Server Actions (`lib/actions/*.ts`)

Always start with `'use server'` directive. Pattern:

```typescript
'use server'

export async function createThing(data: ThingInput) {
  try {
    const session = await requireAuth()
    requireRole(session, ['OWNER', 'STAFF'])
    const tenantId = session.user.tenantId!
    const parsed = thingSchema.parse(data)

    await getTenantDB(tenantId).thing.create({ data: parsed })
    revalidatePath('/dashboard/things')
    return { success: true }
  } catch (err) {
    if (err instanceof ZodError) return { error: 'Validation failed' }
    return { error: 'Operation failed' }
  }
}
```

### API Routes

Pattern for authenticated endpoints:

```typescript
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant(request)
    const body = await request.json()
    const parsed = schema.parse(body)
    // ... business logic
    return NextResponse.json({ result })
  } catch (err) {
    if (err instanceof TenantNotFoundError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Custom Errors

All domain errors carry `statusCode` (HTTP status) and Russian user-facing messages:

```typescript
export class BookingConflictError extends Error {
  readonly statusCode = 409
  constructor() {
    super("Это время уже занято. Пожалуйста, выберите другой слот.")
    this.name = 'BookingConflictError'
  }
}
```

Errors are caught at route handler level and returned as `{ error: message }` with `statusCode`.

## TypeScript Patterns

- **Strict mode** enabled (`tsconfig.json`)
- **Path alias:** `@/*` maps to project root — always prefer over relative imports
- **Type inference from Zod:** `type ThingInput = z.infer<typeof thingSchema>`
- **Prisma types:** imported directly from `@prisma/client`
- **Return types on public functions:** explicit, especially for Server Actions
- **`!` non-null assertions** used on `session.user.tenantId` (post-auth guard, guaranteed non-null)

## Code Style

### Imports

Organized by category (no enforced linter rule, but convention):
1. Node built-ins (`crypto`, `fs`, `path`)
2. Next.js / React (`next/headers`, `react`)
3. Third-party (`date-fns`, `zod`, `next-auth`)
4. Internal via `@/` alias (`@/lib/db`, `@/lib/auth/guards`)

### Section Comments

Long files use `// ---- Section name ----` dividers:

```typescript
// ---- Errors ----------------------------------------------------------------

// ---- Resolver --------------------------------------------------------------

// ---- Helpers ---------------------------------------------------------------
```

### JSDoc

Used on exported utility functions and public API:

```typescript
/**
 * Returns a PrismaClient scoped to a specific tenant.
 * Uses $allOperations extension to automatically inject `tenantId`.
 */
export function getTenantPrisma<T extends PrismaClient>(client: T, tenantId: string) {
```

### Component patterns

- Server Components by default (no `'use client'`)
- Mark `'use client'` only when needed (event handlers, state, browser APIs)
- Pass data down as props from Server Components
- Mutations via Server Actions (forms), not client-side fetch

## Validation Pattern

Zod schemas defined in `lib/validations/*.ts`, imported in both Server Actions and API routes:

```typescript
// lib/validations/booking.ts
export const manualBookingSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().min(7),
  serviceId: z.string().cuid(),
  resourceId: z.string().cuid(),
  startsAt: z.coerce.date(),
})
export type ManualBookingInput = z.infer<typeof manualBookingSchema>
```

## Database Access Patterns

- **Feature code:** always use `getTenantDB(tenantId)` — auto-scopes to tenant
- **Cross-tenant / auth operations:** use `basePrisma` directly (e.g. `resolveTenant`, auth callbacks)
- **Transactions:** `basePrisma.$transaction(async (tx) => {...})` — booking creation uses tx for conflict-safe inserts
- Never import `PrismaClient` directly in feature code; always go through `lib/db`

## Russian Locale Convention

User-facing error messages and email templates are in Russian. English is used for:
- Code identifiers, comments, variable names
- Log messages (`console.log`, `console.error`)
- Internal error names (`BookingConflictError.name`)

## Neumorphic UI

Dashboard uses a neumorphic design system with CSS custom properties:
- `neu-inset`, `neu-flat`, `neu-raised` utility classes
- `bg-[var(--neu-bg)]` for consistent surface color
- `text-foreground`, `text-muted-foreground` semantic color tokens
- These classes appear throughout dashboard components and admin forms
