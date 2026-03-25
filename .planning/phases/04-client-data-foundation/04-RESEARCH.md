# Phase 4: Client Data Foundation - Research

**Researched:** 2026-03-25
**Domain:** Prisma ORM schema design, aggregation queries, upsert/sync patterns, Next.js Server Actions
**Confidence:** HIGH

## Summary

This phase is a pure backend/data layer phase — no UI, no Telegram, no i18n. The goal is to introduce a `Client` Prisma model and a sync action that aggregates existing `Booking` records into one `Client` record per unique phone/email under each tenant.

The Booking model already carries all required source data: `guestPhone`, `guestEmail`, `guestName`, `tenantId`, `status` (COMPLETED filter), `startsAt` (for last visit), `service.price` (for revenue sum), and `telegramChatId` (for Telegram status). No new booking fields are needed. The `Client` model is entirely derived from Bookings — it is a materialized view-like record that caches aggregated metrics to avoid runtime computation in the UI.

The identity key for client deduplication is `(tenantId, phone)` where phone is the primary key. Email is supplementary — some bookings will have `guestEmail`, some will not. The sync action must be idempotent via `upsert` so it can be re-run safely against existing data at any time. Aggregation happens at the application layer (not via raw SQL), using Prisma's `groupBy` or a `findMany` + reduce pattern, both of which are valid within the established project patterns.

**Primary recommendation:** Define `Client` model with `(tenantId, phone)` as unique identity, use Prisma `upsert` in a `syncClients` server action that queries all COMPLETED bookings per tenant and derives metrics in TypeScript — matching the existing `lib/subscription-lifecycle.ts` pattern of pure business logic in a `lib/` file, called from a server action.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRM-01 | Tenant owner's booking history is aggregated into a `Client` Prisma model per unique phone/email, synced from existing bookings via a seeding action | `Client` model design + `syncClients` upsert action |
| CRM-02 | Each client record exposes total completed visits count | Derived from `_count` of COMPLETED bookings per phone+tenantId |
| CRM-03 | Each client record exposes total revenue from completed bookings (sum of `price` on COMPLETED bookings) | Derived from sum of `service.price` on COMPLETED bookings |
| CRM-04 | Each client record exposes last visit date (most recent COMPLETED booking date) | Derived from `max(startsAt)` on COMPLETED bookings |
| CRM-05 | Each client record shows whether client has an active Telegram connection (`telegramChatId` present on related bookings) | Derived from `some(telegramChatId != null)` on related bookings |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | existing in project | Schema addition, `upsert`, `groupBy`, `findMany` | Project standard; `prisma db push` pattern established in Phase 2 |
| Next.js Server Actions (`'use server'`) | existing | `syncClients` action callable from UI or seed script | Established project pattern for all mutations |
| `basePrisma` from `@/lib/db` | internal | Database client in server actions and lib files | Project-standard Prisma client instance |
| `requireAuth` / `requireRole` from `@/lib/auth/guards` | internal | Owner-only guard for sync action | Established auth pattern used in billing.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `revalidatePath` from `next/cache` | Next.js built-in | Cache invalidation after sync | After `syncClients` completes to bust dashboard cache |
| `createAuditLog` from `@/lib/actions/audit-log` | internal | Optional: log sync event | Fire-and-forget if audit trail is desired |

**No new npm packages required.** This phase uses only existing infrastructure.

**Version verification:** N/A — no new packages. All dependencies are existing project dependencies.

---

## Architecture Patterns

### Recommended Project Structure
```
prisma/
└── schema.prisma             # Add Client model

lib/
└── actions/
    └── clients.ts            # syncClients() server action + getClients() query action

__tests__/
└── client-data-surface.test.ts  # Static file assertion test scaffold
```

### Pattern 1: Client Model Design

**What:** New Prisma model `Client` with `(tenantId, phone)` as composite unique key. Phone is the primary deduplication axis — it is always present on bookings (`guestPhone` is required by booking form). Email is supplementary and stored but not used as identity.

**Schema:**
```prisma
model Client {
  id             String    @id @default(cuid())
  tenantId       String
  phone          String
  name           String
  email          String?
  totalVisits    Int       @default(0)
  totalRevenue   Int       @default(0)
  lastVisitAt    DateTime?
  hasTelegram    Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  tenant         Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, phone])
  @@index([tenantId])
}
```

**Design decisions:**
- `totalRevenue` stored as `Int` (KZT, integer) — matches `Service.price: Int?` in existing schema
- `lastVisitAt` is `DateTime?` — null for clients with zero COMPLETED bookings (edge case)
- `hasTelegram Boolean` — a single boolean is sufficient for CRM-05; the UI just needs "connected" vs "not connected"
- `onDelete: Cascade` from Tenant — client records die with the tenant (consistent with all other tenant-scoped models)
- `name` stored as `String` (latest booking's `guestName`) — non-nullable; sync takes `guestName` from the most recent COMPLETED booking
- No direct relation to Booking model — Client is a materialized aggregate, not a join table. Avoids schema complexity and keeps sync logic self-contained.

**When to use:** Always. Phase 5 will query `Client` directly; no runtime Booking aggregation in the UI.

### Pattern 2: Sync Action — Upsert Loop

**What:** `syncClients(tenantId: string)` server action in `lib/actions/clients.ts`. Fetches all COMPLETED bookings for the tenant, groups by phone, computes metrics, then upserts each `Client` record.

**When to use:** On demand (owner-triggered from dashboard — a "Sync" button is a Phase 5 concern). Also callable from a seed script or admin trigger.

**Algorithm:**
```typescript
// Source: based on lib/subscription-lifecycle.ts pattern + Prisma upsert docs
export async function syncClients(tenantId: string) {
  // 1. Fetch all COMPLETED bookings for this tenant
  const bookings = await basePrisma.booking.findMany({
    where: { tenantId, status: 'COMPLETED' },
    include: { service: { select: { price: true } } },
    orderBy: { startsAt: 'desc' },
  })

  // 2. Group by phone
  const byPhone = new Map<string, typeof bookings>()
  for (const b of bookings) {
    if (!b.guestPhone) continue
    const phone = b.guestPhone
    if (!byPhone.has(phone)) byPhone.set(phone, [])
    byPhone.get(phone)!.push(b)
  }

  // 3. Upsert each client
  let synced = 0
  for (const [phone, clientBookings] of byPhone) {
    const totalVisits = clientBookings.length
    const totalRevenue = clientBookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0)
    const lastVisitAt = clientBookings[0]?.startsAt ?? null  // already ordered desc
    const hasTelegram = clientBookings.some(b => b.telegramChatId != null)
    const name = clientBookings[0]?.guestName ?? phone
    const email = clientBookings.find(b => b.guestEmail)?.guestEmail ?? null

    await basePrisma.client.upsert({
      where: { tenantId_phone: { tenantId, phone } },
      create: { tenantId, phone, name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
      update: { name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
    })
    synced++
  }

  return { synced }
}
```

**Key details:**
- Ordered by `startsAt: 'desc'` so `clientBookings[0]` is the most recent booking — used for `lastVisitAt` and `name`
- `guestPhone` is always present on real bookings (required by booking form), but the guard `if (!b.guestPhone) continue` prevents crashes on edge cases
- `upsert` uses the `@@unique([tenantId, phone])` constraint as the `where` key — Prisma generates a compound unique field `tenantId_phone`
- `service.price` can be `null` (optional field) — `?? 0` ensures revenue computation never crashes
- `telegramChatId` lives directly on the Booking model (not on Service/Resource) — confirmed from schema

### Pattern 3: Prisma db push (Not migrate dev)

**What:** After adding the `Client` model to `schema.prisma`, sync the database with `npx prisma db push`, then regenerate the client with `npx prisma generate`.

**When to use:** Always — this project uses `prisma db push` exclusively. Established in Phase 2 (no migration files).

```bash
npx prisma db push
npx prisma generate
```

### Pattern 4: Tenant Relation Addition

**What:** The `Tenant` model must gain a `clients Client[]` relation field to make Prisma's relation management work correctly. This is a schema-only addition — no data impact.

```prisma
model Tenant {
  // ... existing fields ...
  clients   Client[]   // Add this line
}
```

### Pattern 5: getClients Query Action

**What:** `getClients(tenantId: string)` action that returns all `Client` records for a tenant, used by Phase 5 UI. Define in the same `lib/actions/clients.ts` file.

```typescript
export async function getClients(tenantId: string) {
  return basePrisma.client.findMany({
    where: { tenantId },
    orderBy: { totalVisits: 'desc' },
  })
}
```

**Why include now:** Phase 5 will import this. Defining it in Phase 4 keeps the data layer complete and self-contained.

### Anti-Patterns to Avoid

- **Using `guestEmail` as the deduplication key:** Email is optional on bookings (`guestEmail` field is optional). Phone is always present. Using email as identity would miss guest-only bookings or create phantom duplicates.
- **Storing a direct `Booking[]` relation on `Client`:** This would require adding `clientId` to the Booking model — a breaking change that touches the booking form, engine, and all existing bookings. Phase 5 should query bookings by `guestPhone + tenantId` for the detail page, not via a relation.
- **Runtime aggregation in Phase 5 UI:** The entire purpose of this phase is to pre-compute metrics so Phase 5 can do a simple `SELECT * FROM Client WHERE tenantId = ?`. Never aggregate at render time.
- **Using `prisma migrate dev` instead of `prisma db push`:** This project explicitly uses `db push`. Any `migrate dev` command would create migration files that are not part of the project pattern.
- **Forgetting to add `clients Client[]` on Tenant:** Prisma requires both sides of a relation to be declared. Omitting the back-relation on Tenant will cause a `prisma db push` validation error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent sync | Manual delete-all + re-insert | `prisma.client.upsert` | Atomic per-record, re-runnable, preserves any future manually-added fields |
| Revenue sum | Raw SQL `SUM()` query | TypeScript `reduce()` over fetched bookings | Consistent with project's no-raw-SQL pattern; performance is fine at tenant scale |
| Deduplication logic | Custom unique check before insert | Prisma `@@unique` + upsert `where` | Database enforces the constraint; upsert handles race conditions |
| Date comparison for last visit | Manual date sort | `orderBy: { startsAt: 'desc' }` + `[0]` | Prisma handles null safety; no custom sort needed |
| Type-safe metric accumulation | `any[]` reduce | TypeScript `Map<string, Booking[]>` grouping | Type safety throughout, no runtime type errors |

**Key insight:** The bookings table already contains all necessary raw data. This phase is purely about materialization — mapping existing facts into a denormalized cache. No new data collection, no external APIs.

---

## Common Pitfalls

### Pitfall 1: `tenantId_phone` Compound Unique Name

**What goes wrong:** Prisma generates a compound unique field accessor named after the fields in the `@@unique` directive. For `@@unique([tenantId, phone])`, the accessor is `tenantId_phone`. If the upsert `where` clause uses a different name (e.g., `tenantId_guestPhone`), Prisma throws a type error.

**Why it happens:** Auto-generated name is not always obvious.

**How to avoid:** After `prisma generate`, confirm the generated name in the Prisma client types. The pattern `{ tenantId_phone: { tenantId, phone } }` will be correct for the schema as written.

**Warning signs:** TypeScript error "Argument of type... does not contain required property tenantId_phone".

### Pitfall 2: `service.price` Is Optional

**What goes wrong:** `Service.price` is `Int?` (nullable) in the existing schema. If `b.service?.price` is `null`, summing directly produces `NaN` or incorrect totals.

**Why it happens:** Not all services have a price set; historical bookings may have been created before price was added.

**How to avoid:** Always coerce: `(b.service?.price ?? 0)` in the reduce. This is already shown in the code pattern above.

**Warning signs:** `totalRevenue` is `NaN` or unexpectedly 0 for tenants with priced services.

### Pitfall 3: Booking `service` Relation Is Optional

**What goes wrong:** `Booking.serviceId` is `String?` (optional). A booking with no service will have `b.service === null`. Attempting `b.service.price` without optional chaining throws at runtime.

**Why it happens:** The booking model allows service-free bookings.

**How to avoid:** Always use `b.service?.price ?? 0` (double guard: optional chaining + nullish coalescing).

**Warning signs:** Runtime TypeError "Cannot read properties of null (reading 'price')".

### Pitfall 4: `lastVisitAt` from Zero-COMPLETED-Bookings Client

**What goes wrong:** If a phone number appears in COMPLETED bookings, this case cannot happen (the group only exists because there are bookings). However, if `syncClients` is called and a booking has `startsAt` as `undefined` or invalid, `lastVisitAt` will be wrong.

**Why it happens:** Edge case on corrupted data.

**How to avoid:** Since `startsAt` is `DateTime` (non-nullable) in the Booking model, this cannot happen in practice. No guard needed beyond the standard `?? null`.

### Pitfall 5: Re-running Sync Inflates Nothing (Verify Idempotency)

**What goes wrong:** If the sync action uses `create` instead of `upsert`, running it twice creates duplicate `Client` records (violating the `@@unique` constraint and throwing a Prisma error).

**Why it happens:** Developer uses `createMany` for performance, forgetting idempotency.

**How to avoid:** Always `upsert`. The `@@unique([tenantId, phone])` constraint guarantees correctness, and `upsert` guarantees idempotency.

**Warning signs:** Prisma unique constraint violation error: "Unique constraint failed on the fields: (tenantId, phone)".

### Pitfall 6: Tenant Relation Back-Reference Missing

**What goes wrong:** Adding `Client` model to schema without adding `clients Client[]` to `Tenant` model causes `prisma db push` to fail with a relation validation error.

**Why it happens:** Prisma requires explicit declaration of both sides of a relation.

**How to avoid:** Always add both: `Client.tenant Tenant @relation(...)` AND `Tenant.clients Client[]`.

**Warning signs:** `prisma db push` error: "Error validating: The relation field 'clients' on Model 'Tenant' is missing an opposite relation field on the model 'Client'."

### Pitfall 7: `name` Is Non-Nullable but Bookings May Have Null `guestName`

**What goes wrong:** `Booking.guestName` is `String?` (nullable in the Prisma schema). If the most recent booking has `guestName: null`, setting `Client.name = null` violates the `NOT NULL` constraint.

**Why it happens:** While the booking form requires `guestName`, edge cases (API-created bookings, legacy data) may have null.

**How to avoid:** Use fallback: `const name = clientBookings[0]?.guestName ?? phone`. The phone number is always present and non-null, making it a safe fallback display name.

**Warning signs:** Prisma error "Argument 'name': Got invalid value null. Expected String, provided Null."

---

## Code Examples

### Client Model (complete)
```prisma
// Source: New addition to prisma/schema.prisma
model Client {
  id             String    @id @default(cuid())
  tenantId       String
  phone          String
  name           String
  email          String?
  totalVisits    Int       @default(0)
  totalRevenue   Int       @default(0)
  lastVisitAt    DateTime?
  hasTelegram    Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  tenant         Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, phone])
  @@index([tenantId])
}
```

### Tenant Back-Relation Addition
```prisma
// Source: prisma/schema.prisma — add to existing Tenant model
model Tenant {
  // ... existing fields (do not change) ...
  clients      Client[]   // ADD this line
}
```

### syncClients Server Action (complete)
```typescript
// Source: lib/actions/clients.ts — new file
'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { basePrisma } from '@/lib/db'

export async function syncClients() {
  const session = await requireAuth()
  requireRole(session, ['OWNER'])
  const tenantId = session.user.tenantId
  if (!tenantId) throw new Error('Tenant ID missing from session')

  const bookings = await basePrisma.booking.findMany({
    where: { tenantId, status: 'COMPLETED' },
    include: { service: { select: { price: true } } },
    orderBy: { startsAt: 'desc' },
  })

  const byPhone = new Map<string, typeof bookings>()
  for (const b of bookings) {
    if (!b.guestPhone) continue
    const existing = byPhone.get(b.guestPhone) ?? []
    existing.push(b)
    byPhone.set(b.guestPhone, existing)
  }

  let synced = 0
  for (const [phone, clientBookings] of byPhone) {
    const totalVisits = clientBookings.length
    const totalRevenue = clientBookings.reduce((sum, b) => sum + (b.service?.price ?? 0), 0)
    const lastVisitAt = clientBookings[0]?.startsAt ?? null
    const hasTelegram = clientBookings.some(b => b.telegramChatId != null)
    const name = clientBookings[0]?.guestName ?? phone
    const email = clientBookings.find(b => b.guestEmail != null)?.guestEmail ?? null

    await basePrisma.client.upsert({
      where: { tenantId_phone: { tenantId, phone } },
      create: { tenantId, phone, name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
      update: { name, email, totalVisits, totalRevenue, lastVisitAt, hasTelegram },
    })
    synced++
  }

  revalidatePath('/dashboard/clients')
  return { synced }
}

export async function getClients(tenantId: string) {
  return basePrisma.client.findMany({
    where: { tenantId },
    orderBy: { totalVisits: 'desc' },
  })
}
```

### Test Scaffold Pattern (safeRead)
```typescript
// Source: __tests__/god-mode-surface.test.ts — established test pattern
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..')
const safeRead = (relPath: string): string => {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return ''
  return fs.readFileSync(full, 'utf-8')
}

describe('CRM-01: Client model in schema', () => {
  const schema = safeRead('prisma/schema.prisma')
  it('schema.prisma contains model Client', () => {
    expect(schema).toContain('model Client {')
  })
  it('Client model has tenantId_phone unique constraint', () => {
    expect(schema).toContain('@@unique([tenantId, phone])')
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime aggregation of bookings for CRM metrics | Pre-computed `Client` model with materialized metrics | Phase 4 (this phase) | Phase 5 UI can query a single table, no JOIN aggregation at render time |
| Client identity implied from bookings at query time | Explicit `Client` records with `@@unique([tenantId, phone])` | Phase 4 (this phase) | Deduplication guaranteed at database level, not application logic |

**No deprecated patterns to replace** — this is a greenfield addition. The existing Booking model is untouched.

---

## Open Questions

1. **Should `syncClients` be callable by OWNER only or also SUPERADMIN?**
   - What we know: Current server action pattern uses `requireRole(session, ['OWNER'])` for tenant-scoped mutations
   - What's unclear: Whether superadmin needs to trigger sync from admin panel (Phase 5 scope)
   - Recommendation: Implement as OWNER-only for Phase 4. SUPERADMIN can call `syncClients(tenantId)` variant (bypass auth check) if needed in Phase 5 for admin-triggered seeding.

2. **Should `syncClients` be called automatically on booking completion?**
   - What we know: Requirements say "synced from existing bookings via a seeding action" — implies manual/on-demand trigger
   - What's unclear: Whether continuous sync (hook on booking status change to COMPLETED) is in scope
   - Recommendation: Out of scope for Phase 4. Requirements explicitly say "seeding action." Automatic sync is CRM-F01 territory (future).

3. **`totalRevenue` currency handling**
   - What we know: `Service.price` is `Int` in KZT; `Service.currency` defaults to `KZT`
   - What's unclear: Whether multi-currency tenants exist in practice
   - Recommendation: Store `totalRevenue` as `Int` in KZT (same as `Service.price`). No currency conversion needed for v1.4. If currency becomes relevant, it's a future concern.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/client-data-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-01 | `model Client` exists in `schema.prisma` | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-01" --no-coverage` | ❌ Wave 0 |
| CRM-01 | `@@unique([tenantId, phone])` present in Client model | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-01" --no-coverage` | ❌ Wave 0 |
| CRM-01 | `lib/actions/clients.ts` exists and contains `syncClients` | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-01" --no-coverage` | ❌ Wave 0 |
| CRM-01 | `syncClients` contains `upsert` (idempotency) | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-01" --no-coverage` | ❌ Wave 0 |
| CRM-02 | `syncClients` contains `totalVisits` and `clientBookings.length` | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-02" --no-coverage` | ❌ Wave 0 |
| CRM-03 | `syncClients` contains `totalRevenue` and `reduce` | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-03" --no-coverage` | ❌ Wave 0 |
| CRM-04 | `syncClients` contains `lastVisitAt` and `startsAt` | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-04" --no-coverage` | ❌ Wave 0 |
| CRM-05 | `syncClients` contains `hasTelegram` and `telegramChatId` | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-05" --no-coverage` | ❌ Wave 0 |
| CRM-01 | `Tenant` model in schema contains `clients` back-relation | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-01" --no-coverage` | ❌ Wave 0 |
| CRM-01 | `Client` model has `onDelete: Cascade` | static file assertion | `npx jest __tests__/client-data-surface.test.ts -t "CRM-01" --no-coverage` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/client-data-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/client-data-surface.test.ts` — covers CRM-01 through CRM-05 static assertions using the `safeRead` pattern from `god-mode-surface.test.ts` and `subscription-lifecycle-surface.test.ts`

---

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` — Confirmed: Booking model structure (guestPhone, guestEmail, guestName, telegramChatId, status, startsAt), Service.price is Int?, Tenant model structure, all cascade patterns
- `lib/subscription-lifecycle.ts` — Confirmed: business logic in lib/ file pattern (pure function, no 'use server'), called from server action
- `lib/actions/billing.ts` — Confirmed: `requireAuth() + requireRole()` guard pattern for tenant-scoped server actions
- `lib/actions/audit-log.ts` — Confirmed: AuditEventType union, fire-and-forget pattern
- `app/api/bookings/route.ts` — Confirmed: BOOKING_INCLUDE pattern, how bookings are queried with service include
- `app/dashboard/layout.tsx` — Confirmed: `basePrisma.tenant.findUnique` pattern for tenant data in server components
- `__tests__/god-mode-surface.test.ts` — Confirmed: `safeRead` helper, test file structure, Jest describe/it pattern
- `__tests__/subscription-lifecycle-surface.test.ts` — Confirmed: CRM-style test structure (SUB-01 through SUB-06 describe blocks), schema section extraction regex pattern
- `jest.config.ts` — Confirmed: ts-jest, node environment, `__tests__/**/*.test.ts` pattern

### Secondary (MEDIUM confidence)
- None — all findings verified against actual source files

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present and in use in the codebase
- Architecture (Client model design): HIGH — Booking model source fields confirmed from schema; upsert pattern confirmed from Prisma docs and project patterns
- Architecture (sync algorithm): HIGH — pattern mirrors existing subscription-lifecycle.ts; all field names confirmed from schema
- Pitfalls: HIGH — identified from actual schema field types (nullable price, optional service, optional guestName)
- Validation: HIGH — test framework confirmed (jest.config.ts), safeRead pattern confirmed in two existing test files

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days — stable Prisma + Next.js versions, no fast-moving dependencies)
