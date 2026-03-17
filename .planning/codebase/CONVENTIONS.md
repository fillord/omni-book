# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- PascalCase for components and classes: `UserCard.tsx`, `TenantPrismaClient`
- camelCase for utilities, services, and functions: `maskEmail.ts`, `getAvailableSlots`
- kebab-case for API routes: `bookings/slots/route.ts`, `api/tenants/route.ts`
- Test files: `*.test.ts` suffix (e.g., `resolve.test.ts`)

**Functions:**
- camelCase for all function and method names: `resolveTenant()`, `getTenantId()`, `requireAuth()`
- Prefix with `get` for accessors: `getTenantId()`, `getAvailableSlots()`
- Prefix with `set` for mutators: `setTenantContext()`
- Prefix with `require` for functions that throw on missing context: `requireTenantId()`, `requireAuth()`
- Prefix with `is` or `use` for predicates/hooks: `isTenantError()`, `useI18n()`

**Variables:**
- camelCase for all variables: `tenantId`, `guestName`, `activeBookings`
- ALL_CAPS for constants: `MAX_ACTIVE_BOOKINGS_PER_PHONE`, `TENANT_SCOPED` (Sets/arrays), `BOOKING_INCLUDE` (const objects)
- Prefixed with `$` for Prisma extensions: `$extends`, `$allModels`, `$allOperations`

**Types:**
- PascalCase for all TypeScript types, interfaces, and classes
- Custom error classes: `TenantNotFoundError`, `BookingConflictError`, `UnauthorizedError`
- Type inference from Zod: use `z.infer<typeof schema>` pattern
- Interfaces for context values: `TenantStore`, `I18nContextValue`

**Error Classes:**
- Extend `Error` class
- Set `readonly statusCode` property matching HTTP status codes
- Set `this.name` to class name for debugging
- Include descriptive messages (often in user locale when possible)

Examples from codebase:
```typescript
// lib/tenant/resolve.ts
export class TenantNotFoundError extends Error {
  readonly statusCode = 404
  constructor(slug: string) {
    super(`Tenant not found: "${slug}"`)
    this.name = 'TenantNotFoundError'
  }
}

// lib/booking/engine.ts
export class BookingConflictError extends Error {
  readonly statusCode = 409
  constructor() {
    super("Это время уже занято. Пожалуйста, выберите другой слот.")
    this.name = "BookingConflictError"
  }
}
```

## Code Style

**Formatting:**
- ESLint: `eslint` v9 with Next.js config
- Config file: `.eslintrc.json` extends `next/core-web-vitals` and `next/typescript`
- No explicit Prettier config found (likely using Next.js defaults)
- Quotes: double quotes throughout
- Semicolons: required
- Line length: appears to follow standard 80-100 character wrapping

**Linting:**
- Extends Next.js recommended rules
- Extends TypeScript strict mode rules
- Configured via: `.eslintrc.json`
- Run: `npm run lint` (delegates to `next lint`)

## Import Organization

**Order:**
1. External/third-party packages: `react`, `next`, `@prisma/client`, etc.
2. Type imports: `import { type SomeType } from 'module'`
3. Internal absolute imports: `import { functionName } from '@/lib/...'`
4. Relative imports: rare, use absolute aliases instead

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- All internal imports use `@/` prefix: `@/lib/`, `@/app/`, `@/components/`
- Never use relative `../` paths in new code

**Module exports:**
- Barrel files (index.ts) re-export public API
- Example: `lib/auth/index.ts` exports from `./config` and `./guards`
- Most modules use `export` directly; barrel files consolidate

```typescript
// lib/auth/index.ts
export { authConfig } from './config'
export {
  requireAuth,
  requireRole,
  requireTenant,
  requireAuthWithRole,
  isAuthError,
  UnauthorizedError,
  ForbiddenError,
} from './guards'
```

## Error Handling

**Patterns:**
- Custom error classes with `statusCode` property for HTTP responses
- Type guard functions to check error type: `isTenantError()`, `isAuthError()`
- Route handlers wrap in try/catch and return NextResponse with error status
- Server actions return discriminated union types: `{ success: true } | { success: false, error?: string, fieldErrors?: ... }`

Example from `lib/actions/account.ts`:
```typescript
export type ChangePasswordResult =
  | { success: true }
  | {
      success: false
      fieldErrors?: Partial<Record<keyof ChangePasswordInput, string>>
      error?: string
    }

export async function changePassword(data: ChangePasswordInput): Promise<ChangePasswordResult> {
  // validation errors return early with fieldErrors
  // other errors return success: false with error message
}
```

Example from route handler (`app/api/bookings/route.ts`):
```typescript
export async function GET(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req)
    // ... process
    return NextResponse.json({ data })
  } catch (err) {
    if (isTenantError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    // generic error handling
  }
}
```

## Logging

**Framework:** `console` (no dedicated logger library)

**Patterns:**
- Use `console.log()` for informational output
- Use `console.error()` for actual errors
- Prefix logs with context: `[SLOTS API]`, `📧`, `[Resend]`, `[tenant]`
- Fire-and-forget error logging: `promise.catch(console.error)` at call site
- Development-friendly emojis in log messages for readability

Examples from codebase:
```typescript
// lib/email/reminders.ts
console.log(`📧 Processing reminders: 24h=${bookings24h.length}, 2h=${bookings2h.length}, 1h=${bookings1h.length}`)
console.error(`Failed to send ${field} reminder for booking ${booking.id}:`, error)

// app/api/bookings/slots/route.ts
console.log("[SLOTS API] params:", { tenantSlug, resourceId, serviceId, date })
console.log("[SLOTS API] tenant:", tenant ? tenant.id : "NULL")

// lib/booking/engine.ts
// No logging — this is the core business logic layer
```

## Comments

**When to Comment:**
- JSDoc/TSDoc for public API functions and types (especially guards, utils, server actions)
- Section separators using `// ---- Comment ----` pattern for internal organization
- Explain "why" not "what" — code should be readable enough to show what it does

**JSDoc/TSDoc Pattern:**
- Used in library files (`lib/`) for function documentation
- Include parameter descriptions and return types
- Mark required vs optional context/preconditions

Examples from codebase:
```typescript
// lib/tenant/resolve.ts
/**
 * Resolves the current tenant from a NextRequest.
 *
 * Resolution order:
 *  1. x-tenant-slug request header (set by middleware from subdomain)
 *  2. `tenantSlug` query parameter (fallback for localhost/dev)
 *
 * Throws:
 *  - TenantSlugMissingError  (400) — no slug found anywhere
 *  - TenantNotFoundError     (404) — slug not in DB
 *  - TenantInactiveError     (403) — tenant exists but isActive = false
 */
export async function resolveTenant(request: NextRequest) { ... }

// lib/tenant/context.ts
/**
 * Runs `callback` inside a tenant context.
 * All code within the callback (and any async work it spawns) will see
 * the provided tenantId via getTenantId().
 *
 * AsyncLocalStorage guarantees isolation between concurrent requests —
 * each request gets its own store, even when running in parallel.
 */
export function setTenantContext<T>(tenantId: string, callback: () => Promise<T>): Promise<T>
```

**Section Markers:**
- Used to organize code within files
- Format: `// ---- Description ----`
- Typically separates: custom errors, types, constants, main functions, helpers

```typescript
// lib/tenant/resolve.ts structure:
// ---- Custom errors ---------------------------------------------------------
// [Error classes]

// ---- Resolver --------------------------------------------------------------
// [Functions]
```

## Function Design

**Size:**
- Aim for small, focused functions (typically under 30 lines)
- Tenant isolation logic extracted into `lib/tenant/prisma-tenant.ts` for reuse
- Engine logic (`lib/booking/engine.ts`) handles complex orchestration, stays readable via clear naming

**Parameters:**
- Use objects for multiple related parameters: `{ tenantId, resourceId, date, serviceId }`
- Explicit parameters for single values: `getIpAddress(headers: Headers)`
- Request/response objects from Next.js framework as-is

**Return Values:**
- Explicit error throwing for guards: `requireAuth()`, `requireTenantId()`
- Result objects for server actions: discriminated unions `{ success: true } | { success: false, ... }`
- Typed result interfaces for complex operations: `SlotResult[]`, pagination objects

## Module Design

**Exports:**
- Named exports for all public functions
- Barrel files (index.ts) consolidate public API
- Private utilities stay in files (no export)

**Organization:**
- `lib/` contains business logic, utilities, integrations
- `lib/auth/` contains authentication logic split into: `config.ts`, `guards.ts`, `utils.ts`, `otp.ts`, `types.ts`
- `lib/tenant/` contains tenant context and isolation logic
- `lib/booking/` contains booking engine and related errors
- `lib/actions/` contains server actions
- `lib/email/` contains email integrations
- Barrel files at each level export public API

**Type Safety:**
- Strict mode enabled in `tsconfig.json`
- All functions typed (no `any`)
- Zod schemas for runtime validation of external input
- Type inference from Zod with `z.infer<typeof schema>`

## Async/Await Patterns

- Async functions throughout for I/O-bound operations
- Use `await` for database calls, external APIs
- Use `Promise.all()` for concurrent non-dependent operations
- Proper error propagation in try/catch blocks

Example from `app/api/bookings/route.ts`:
```typescript
const [bookings, total] = await Promise.all([
  db.booking.findMany({ ... }),
  db.booking.count({ where }),
])
```

---

*Convention analysis: 2026-03-17*
