# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:**
- Jest 29 (`jest` ^29)
- Config: `jest.config.ts` (TypeScript)
- Environment: Node.js (not jsdom)

**Assertion Library:**
- Jest built-in matchers (expect API)

**Run Commands:**
```bash
npm test                # Run all tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage report
```

**Configuration Details:**
- Preset: `ts-jest` for TypeScript support
- Module name mapper: `@/*` paths resolved to project root
- Test match pattern: `__tests__/**/*.test.ts` (only files in `__tests__/` directory)
- Mocks: Cleared and restored between tests (`clearMocks: true, restoreMocks: true`)
- Transform: ts-jest with CommonJS override for test environment

From `jest.config.ts`:
```typescript
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  clearMocks: true,
  restoreMocks: true,
}
```

## Test File Organization

**Location:**
- Co-located in `__tests__/` directory at project root
- Mirror source structure: `__tests__/lib/tenant/` mirrors `lib/tenant/`
- Naming: `{module}.test.ts`

**Current Test Files:**
- `__tests__/lib/tenant/resolve.test.ts` — tenant resolution logic
- `__tests__/lib/tenant/context.test.ts` — async local storage context
- `__tests__/lib/tenant/prisma-tenant.test.ts` — Prisma extension behavior

**Naming Convention:**
- File: `{subject}.test.ts`
- Suite: `describe('{FunctionName}()')`
- Test case: `it('{specific scenario}')`
- Nested suites for organized test structure

## Test Structure

**Suite Organization Pattern:**
All tests follow a similar structure with clear describe blocks for grouped functionality:

```typescript
// From __tests__/lib/tenant/resolve.test.ts
describe('resolveTenant()', () => {
  describe('slug resolution — x-tenant-slug header (middleware path)', () => {
    it('resolves tenant from x-tenant-slug header', async () => {
      // Test body
    })
  })

  describe('slug resolution — tenantSlug query param (dev fallback)', () => {
    it('resolves tenant from tenantSlug query parameter', async () => {
      // Test body
    })
  })

  describe('error cases', () => {
    it('throws TenantSlugMissingError (400) when no slug provided', async () => {
      // Test body
    })
  })
})
```

**Patterns:**

1. **Setup with describe blocks:**
   - Top-level: function name
   - Mid-level: logical feature groups or scenarios
   - Leaf-level: individual test cases

2. **Test structure (Arrange-Act-Assert):**
   ```typescript
   it('description', async () => {
     // Arrange: set up test data and mocks
     mockFindUnique.mockResolvedValueOnce(ACTIVE_TENANT)
     const req = makeRequest({ headers: { 'x-tenant-slug': 'city-polyclinic' } })

     // Act: call the function
     const tenant = await resolveTenant(req)

     // Assert: verify behavior
     expect(tenant.id).toBe('tenant-001')
     expect(mockFindUnique).toHaveBeenCalledWith({ where: { slug: 'city-polyclinic' } })
   })
   ```

3. **Test data constants:**
   - Define reusable test data as module-level constants
   - Spread to create variations

   ```typescript
   const ACTIVE_TENANT = {
     id: 'tenant-001',
     slug: 'city-polyclinic',
     name: 'City Polyclinic',
     niche: 'medicine',
     plan: 'pro',
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date(),
   }

   const INACTIVE_TENANT = { ...ACTIVE_TENANT, isActive: false }
   ```

4. **Helper functions:**
   - Extract setup code into reusable functions
   - Keep test intent clear at call site

   ```typescript
   function makeRequest(options: {
     url?: string
     headers?: Record<string, string>
   } = {}): NextRequest {
     const url = options.url ?? 'http://localhost:3000/api/bookings'
     return new NextRequest(url, {
       headers: options.headers ?? {},
     })
   }
   ```

## Mocking

**Framework:** Jest mocks (`jest.mock()`, `jest.fn()`)

**Pattern for Database Mocks:**
Mock at the module level before importing dependent code:

```typescript
// __tests__/lib/tenant/resolve.test.ts
jest.mock('@/lib/db', () => ({
  basePrisma: {
    tenant: {
      findUnique: jest.fn(),
    },
  },
  prisma: {},
}))

// Import AFTER the mock is registered
import { basePrisma } from '@/lib/db'
const mockFindUnique = basePrisma.tenant.findUnique as jest.Mock
```

**Mocking Prisma Extensions:**
For complex Prisma logic, create a mock client that supports the `$extends` interface:

```typescript
// __tests__/lib/tenant/prisma-tenant.test.ts
function makeMockPrisma(tenantId: string) {
  let capturedHandler: ((params: {...}) => Promise<unknown>) | null = null

  const mockClient = {
    $extends(ext: { query?: { $allModels?: { $allOperations?: (params: unknown) => Promise<unknown> } } }) {
      capturedHandler = ext?.query?.$allModels?.$allOperations as typeof capturedHandler ?? null
      return this
    },

    async _invoke(model: string, operation: string, args: Record<string, unknown>) {
      if (!capturedHandler) throw new Error('Extension not installed')
      const where = (args.where as Record<string, unknown>) ?? {}
      const query = jest.fn().mockResolvedValue({ id: '1', tenantId, ...where })
      const result = await capturedHandler({ model, operation, args, query })
      return { result, queryArgs: query.mock.calls[0]?.[0], query }
    },
  }

  getTenantPrisma(mockClient as never, tenantId)
  return mockClient
}
```

**What to Mock:**
- External service calls (database, APIs)
- Modules with side effects
- Time-dependent operations (dates, timers)
- Return value variations using `mockResolvedValueOnce()`, `mockRejectedValueOnce()`

**What NOT to Mock:**
- Pure utility functions (keep them real)
- Core business logic unless you're testing its integration points
- Zod validation (test with real schemas)
- Error classes (test with real instances)

## Fixtures and Factories

**Test Data Pattern:**
Define test data as module-level constants, not in beforeEach:

```typescript
// __tests__/lib/tenant/resolve.test.ts
const ACTIVE_TENANT = { id: 'tenant-001', slug: 'city-polyclinic', isActive: true, ... }
const INACTIVE_TENANT = { ...ACTIVE_TENANT, isActive: false }

// In tests:
it('throws when inactive', async () => {
  mockFindUnique.mockResolvedValueOnce(INACTIVE_TENANT)
  // ...
})
```

**Location:**
- Defined at top of test file, after mock setup
- Shared across all tests in that suite
- No dynamic creation unless varying specific fields

**Factory Pattern:**
Use factory functions for complex setup:

```typescript
function makeRequest(options: { ... } = {}): NextRequest {
  // Encapsulates request creation logic
}

describe('concurrent request isolation', () => {
  it('isolates context between concurrent operations', async () => {
    const results: string[] = []

    // Use factory to create multiple test scenarios
    await Promise.all([
      setTenantContext('tenant-A', async () => { ... }),
      setTenantContext('tenant-B', async () => { ... }),
    ])
  })
})
```

## Coverage

**Requirements:** Not enforced (no coverage thresholds in config)

**View Coverage:**
```bash
npm test -- --coverage
```

**Current Status:**
- Core tenant logic is well tested: 3 test files covering isolation, context, and Prisma extension
- Coverage gaps likely in route handlers and UI components (no tests found in `app/` or component directories)

## Test Types

**Unit Tests:**
- Scope: Single function or module in isolation
- Approach: Mock all external dependencies
- Example: `__tests__/lib/tenant/context.test.ts` tests `setTenantContext()`, `getTenantId()`, `requireTenantId()`
- Assertions focus on: return values, thrown errors, mock calls

```typescript
describe('getTenantId()', () => {
  it('returns undefined outside of any context', () => {
    expect(getTenantId()).toBeUndefined()
  })

  it('returns the tenantId set by setTenantContext()', async () => {
    let captured: string | undefined

    await setTenantContext('tenant-abc', async () => {
      captured = getTenantId()
    })

    expect(captured).toBe('tenant-abc')
  })
})
```

**Integration Tests:**
- Scope: Multiple functions working together, focus on behavior
- Approach: Mock external I/O (database), keep business logic real
- Example: `__tests__/lib/tenant/prisma-tenant.test.ts` tests Prisma extension with mock client
- Assertions: Verify correct WHERE/DATA injection across operations

```typescript
describe('getTenantPrisma (Prisma extension)', () => {
  describe('findMany / findFirst / count', () => {
    it.each(['findMany', 'findFirst', 'count'])(
      'injects tenantId into WHERE for %s',
      async (operation) => {
        const mock = makeMockPrisma('tenant-XYZ')
        const { queryArgs } = await mock._invoke('Booking', operation, { where: { status: 'CONFIRMED' } })
        expect(queryArgs?.where).toEqual({ status: 'CONFIRMED', tenantId: 'tenant-XYZ' })
      }
    )
  })
})
```

**E2E Tests:**
- Not currently implemented
- Playwright dev dependency present (`@playwright/test` ^1.58.2) but no test files found
- Would be used for full user flows (booking creation, authentication, etc.)

## Common Patterns

**Async Testing:**
All test functions using async/await are marked `async`:

```typescript
it('resolves tenant from x-tenant-slug header', async () => {
  mockFindUnique.mockResolvedValueOnce(ACTIVE_TENANT)
  const req = makeRequest({ headers: { 'x-tenant-slug': 'city-polyclinic' } })

  const tenant = await resolveTenant(req)

  expect(tenant.id).toBe('tenant-001')
})
```

**Error Testing:**
Use Jest's `.rejects.toThrow()` matcher:

```typescript
it('throws TenantSlugMissingError when no slug provided', async () => {
  const req = makeRequest()
  await expect(resolveTenant(req)).rejects.toThrow(TenantSlugMissingError)
})

it('throws with correct statusCode property', () => {
  const err = new TenantNotFoundError('ghost')
  expect(err.statusCode).toBe(404)
})
```

**Type Guards / Predicates:**
Test that type guards work correctly:

```typescript
describe('isTenantError()', () => {
  it('returns true for all tenant error types', () => {
    expect(isTenantError(new TenantSlugMissingError())).toBe(true)
    expect(isTenantError(new TenantNotFoundError('x'))).toBe(true)
    expect(isTenantError(new TenantInactiveError('x'))).toBe(true)
  })

  it('returns false for generic errors', () => {
    expect(isTenantError(new Error('oops'))).toBe(false)
    expect(isTenantError(null)).toBe(false)
    expect(isTenantError('string error')).toBe(false)
  })
})
```

**Context Isolation:**
Test that AsyncLocalStorage isolation works:

```typescript
it('isolates context between concurrent async operations', async () => {
  const results: string[] = []

  await Promise.all([
    setTenantContext('tenant-A', async () => {
      await new Promise((r) => setTimeout(r, 10))
      results.push(getTenantId()!)
    }),
    setTenantContext('tenant-B', async () => {
      await new Promise((r) => setTimeout(r, 5))
      results.push(getTenantId()!)
    }),
  ])

  expect(results).toContain('tenant-A')
  expect(results).toContain('tenant-B')
  expect(results).toHaveLength(2)
})
```

**Parametrized Tests:**
Use `.each()` for testing multiple scenarios:

```typescript
it.each(['findMany', 'findFirst', 'count'])(
  'injects tenantId into WHERE for %s',
  async (operation) => {
    const mock = makeMockPrisma('tenant-XYZ')
    const { queryArgs } = await mock._invoke('Booking', operation, { where: { status: 'CONFIRMED' } })
    expect(queryArgs?.where).toEqual({ status: 'CONFIRMED', tenantId: 'tenant-XYZ' })
  }
)
```

## Test Gaps

**Areas without tests:**
- Route handlers (`app/api/**/*.ts`) — all endpoint logic untested
- Server actions (`lib/actions/*.ts`) — Zod validation and business logic untested
- React components — no component tests
- Email/Telegram integrations — no integration tests
- Booking engine complex logic — operations like slot generation untested
- Error handling in route handlers — no tests for error response formats

**Recommendation:**
Add integration tests for critical paths:
1. Booking creation (slots → conflict detection → database)
2. Authentication flow (sign-in, OTP, session)
3. Tenant isolation (verify cross-tenant queries blocked)

---

*Testing analysis: 2026-03-17*
