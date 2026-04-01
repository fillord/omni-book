# Testing Patterns

**Analysis Date:** 2026-04-01

## Test Framework

| Tool | Purpose |
|------|---------|
| Jest 29 | Test runner |
| ts-jest | TypeScript transformer (CommonJS mode) |
| @playwright/test 1.58.2 | E2E browser tests |

**Jest config:** `jest.config.ts`
- Preset: `ts-jest`
- Environment: `node` (not jsdom)
- Test match: `__tests__/**/*.test.ts` only
- Module alias: `@/*` → `<rootDir>/*`
- `clearMocks: true`, `restoreMocks: true` between tests
- TypeScript override: `module: 'commonjs'` for Jest compatibility

## Test File Locations

All tests in `__tests__/` directory (mirrors source structure for lib tests):

```
__tests__/
├── lib/
│   └── tenant/
│       ├── prisma-tenant.test.ts   — Prisma extension unit tests
│       ├── resolve.test.ts         — Tenant resolver unit tests
│       └── context.test.ts         — Tenant context tests
├── booking-surface.test.ts         — Booking component CSS/markup surface
├── booking-manage-surface.test.ts  — Booking manage page surface
├── bookings-crm-surface.test.ts    — CRM bookings surface
├── cleanup-surface.test.ts         — Cleanup/cancellation surface
├── client-data-surface.test.ts     — Client data surface
├── client-ui-surface.test.ts       — Client UI surface
├── dashboard-auth-surface.test.ts  — Dashboard auth surface
├── data-display.test.ts            — Data display correctness
├── god-mode-surface.test.ts        — Admin/superadmin surface
├── infrastructure-validation.test.ts — Infrastructure checks
├── landing-surface.test.ts         — Landing page surface
├── mobile-ui.test.ts               — Mobile UI patterns
├── neumorphism-surface.test.ts     — Neumorphic design system surface
├── payment-surface.test.ts         — Payment UI surface
├── service-form.test.ts            — Service form tests
└── subscription-lifecycle-surface.test.ts — Subscription UI surface
```

## Test Categories

### 1. Unit Tests — Prisma Extension

Tests in `__tests__/lib/tenant/prisma-tenant.test.ts`. Tests the `getTenantPrisma` Prisma extension in isolation using a mock Prisma client:

```typescript
function makeMockPrisma(tenantId: string) {
  let capturedHandler: ... | null = null
  const mockClient = {
    $extends(ext) {
      capturedHandler = ext?.query?.$allModels?.$allOperations
      return this
    },
    async _invoke(model, operation, args) {
      const query = jest.fn().mockResolvedValue(...)
      await capturedHandler({ model, operation, args, query })
      return { queryArgs: query.mock.calls[0]?.[0] }
    },
  }
  getTenantPrisma(mockClient, tenantId)
  return mockClient
}
```

Covers: WHERE injection, DATA injection, UNIQUE post-validation, non-scoped models pass-through.

### 2. Surface Tests (File-reading tests)

Surface tests read component source files directly using `fs.readFileSync` and assert on CSS class presence/absence:

```typescript
import fs from 'fs'
import path from 'path'

const COMPONENTS_DIR = path.resolve(__dirname, '..', 'components')
const readComponent = (name: string) =>
  fs.readFileSync(path.join(COMPONENTS_DIR, name), 'utf-8')

describe('BOOK-01: no hardcoded bg colors in tenant-public-page.tsx', () => {
  it('root div does not use bg-white', () => {
    const source = readComponent('tenant-public-page.tsx')
    expect(source).not.toMatch(/min-h-screen\s+bg-white/)
  })
})
```

**Purpose:** Enforce design system compliance (no hardcoded colors, semantic tokens only) without running a browser.

**Pattern:** Each test group has a tag (`BOOK-01`, `DASH-03`) matching UAT criteria.

### 3. Infrastructure Tests

`infrastructure-validation.test.ts` validates structural invariants:
- Required files exist
- Key exports are present
- No forbidden patterns

## Test Patterns

### Describe structure

```typescript
describe('ComponentName / FeatureName', () => {
  describe('scenario', () => {
    it('does the right thing', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### Mock placement

Module-level mocks before imports (Jest hoisting):

```typescript
jest.mock('@/lib/db', () => ({
  basePrisma: { booking: { findUnique: jest.fn() } },
}))
jest.mock('@/lib/auth/guards', () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}))
```

### Async tests

All async tests use `async/await`. Error testing via `.rejects.toThrow()`:

```typescript
it('throws when tenant not found', async () => {
  mockPrisma.tenant.findUnique.mockResolvedValue(null)
  await expect(resolveTenant(request)).rejects.toThrow(TenantNotFoundError)
})
```

## Coverage Gaps (as of 2026-04-01)

| Area | Status |
|------|--------|
| Prisma tenant extension | Covered (unit tests) |
| Booking engine | Partially (surface tests check UI; logic unit tests missing) |
| Server Actions (`lib/actions/`) | No direct tests |
| API route handlers | No direct tests |
| Auth flow (OTP, IP check) | No tests |
| Email sending | No tests |
| Telegram notifications | No tests |
| E2E (Playwright) | Config present; test files not yet written |
| Payment lifecycle | Surface tests only |
| Subscription lifecycle | Surface tests only |

## Running Tests

```bash
npm test              # Run all Jest tests
npx jest --watch      # Watch mode
npx jest booking      # Run matching test files
npx playwright test   # Run E2E tests (separate config)
```
