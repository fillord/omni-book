# Phase 3: Subscription Lifecycle and Automated Resource Freezing - Research

**Researched:** 2026-03-24
**Domain:** Next.js App Router, Prisma ORM, subscription lifecycle automation, cron API routes
**Confidence:** HIGH

## Summary

This phase makes an already-built billing system automated. The foundation is solid: `subscriptionExpiresAt`, `planStatus`, `plan`, and `maxResources` all exist on the Tenant model. The Notification and AuditLog models from Phase 2 are live and tested. What's missing is: (1) `isFrozen` fields on Resource and Service, (2) the `CANCELED` enum value in PlanStatus, (3) the cron API route that does the actual expiry detection and freezing, and (4) UI changes that reflect frozen state.

The existing cron pattern (`app/api/cron/reminders/route.ts`) is the direct template for the new `app/api/cron/subscriptions/route.ts`. It uses `Authorization: Bearer ${CRON_SECRET}` header validation, wraps business logic in a separate function, returns JSON, and is registered in `vercel.json`. This exact pattern must be replicated.

The frozen UI additions are surgical: both `resources-manager.tsx` and `services-manager.tsx` follow the same card/table pattern, and frozen items need only a badge added next to the existing status badge, plus `disabled` on Edit/Delete buttons. The `staff-manager.tsx` needs only the Invite button disabled when `planStatus === 'EXPIRED'` — no per-row changes. The admin tenant detail page needs a new "Activate Subscription" action block added below the existing notification form.

**Primary recommendation:** Implement in four sequenced modules — (1) schema changes + `prisma db push`, (2) cron API route with business logic, (3) frozen UI in manager components, (4) billing page enhancements and admin activation action.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Module 1 — Database Schema Expansion**
- Use `subscriptionExpiresAt` (existing field) as-is — do NOT rename to `planExpiresAt`; alias only in display layer
- Add `isFrozen Boolean @default(false)` to Resource model
- Add `isFrozen Boolean @default(false)` to Service model
- Staff (User) freeze: do NOT add `isFrozen` to User; handle at action/UI level by checking `tenant.planStatus`
- PlanStatus enums: keep ACTIVE, PENDING, EXPIRED, BANNED. Add `CANCELED` to PlanStatus enum (referenced in billing-content.tsx but missing from schema)

**Module 2 — Automated Lifecycle Cron API**
- Route: `POST /api/cron/subscriptions` — secured via `CRON_SECRET` header check (`Authorization: Bearer ${process.env.CRON_SECRET}`)
- Trigger: Called daily externally. Not an internal cron daemon.
- Action 1 — 3-Day Warning: Find tenants where `subscriptionExpiresAt` is between now+2 days and now+4 days AND `planStatus = ACTIVE` — create in-app Notification with renewal reminder. Only create if no warning notification exists for this tenant in the last 24h (dedup check).
- Action 2 — Downgrade & Freeze: Find tenants where `subscriptionExpiresAt < now()` AND `planStatus = ACTIVE` (or PENDING):
  1. Set tenant `plan = FREE`, `planStatus = EXPIRED`, `maxResources = 1`
  2. Keep oldest 1 resource (`createdAt ASC, take 1`) active, set all others `isFrozen = true`
  3. Keep oldest 1 service active, set all others `isFrozen = true`
  4. Staff: no changes to User records
  5. Create audit log entry: `event_type = 'plan_downgrade'` with details `{ reason: 'subscription_expired', previousPlan: 'PRO' }`
- Response: Return JSON `{ processed: N, warned: M }`

**Module 3 — Frozen State UI (Dashboard)**
- Resources table: If `resource.isFrozen === true`, show badge "Заморожен" (amber/orange, `.neu-inset`). Disable Edit and Delete buttons for frozen items. Tooltip: "Разморозьте подписку PRO, чтобы управлять этим объектом"
- Services table: Same pattern — "Заморожен" badge, disabled Edit/Delete, same tooltip
- Staff management: When tenant `planStatus === 'EXPIRED'`, disable "Invite staff" button and show read-only notice. No frozen badge on individual staff rows.
- Badge design: `.neu-inset bg-[var(--neu-bg)] text-orange-500 text-xs font-medium rounded-full px-2.5 py-1`

**Module 4 — Billing & Renewal UI**
- Show `subscriptionExpiresAt` clearly when plan is PRO/ACTIVE — format: "Подписка активна до: 24 апреля 2026"
- EXPIRED alert: When `planStatus === EXPIRED`, show a prominent `.neu-inset` alert block (red/orange) above the renewal card — "Ваша подписка истекла. Ваши данные заморожены."
- "Renew / Buy PRO" action (new server action `renewSubscription` in `lib/actions/billing.ts`): Sets tenant `plan = PRO`, `planStatus = PENDING`; sends Telegram notification to admin; does NOT automatically unfreeze
- Super-admin activation (`lib/actions/admin.ts` — add `activateSubscription` action): Sets `plan = PRO`, `planStatus = ACTIVE`, `subscriptionExpiresAt = now() + 30 days`, `maxResources = 20`; unfreezes all resources and services; creates audit log `plan_upgrade`; available from admin tenant detail page

**Neumorphism Design Adherence**
- All new UI: `var(--neu-bg)`, `.neu-raised` for cards/panels, `.neu-inset` for alert blocks and badges
- No hard `border-border` on new components — depth via shadow only

### Claude's Discretion
- Exact dedup strategy for 3-day warning notifications (timestamp check vs. count check)
- Whether to show frozen item count in the billing page EXPIRED alert (e.g., "3 resources frozen")
- Exact wording of Telegram message for renewal requests
- Whether `CANCELED` status gets the same freeze treatment as EXPIRED in the cron job

### Deferred Ideas (OUT OF SCOPE)
- None — discussion covered all modules within phase scope
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | existing in project | Schema mutations, `updateMany`, `findMany` with `orderBy createdAt ASC` | Project standard; `prisma db push` pattern established |
| Next.js App Router | existing | API route at `app/api/cron/subscriptions/route.ts` | Project standard; cron reminders route is the template |
| next-auth | existing | `getServerSession` for `ensureSuperAdmin()` guard in admin actions | Established project auth pattern |
| `@prisma/client` | existing | Enum imports: `Plan`, `PlanStatus` after schema addition of `CANCELED` | Direct import pattern used throughout |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sendTelegramMessage` from `@/lib/telegram` | internal | Renewal notification to admin | Used in `renewSubscription` server action |
| `createAuditLog` from `@/lib/actions/audit-log` | internal | Freeze/unfreeze audit events | Fire-and-forget, never block primary action |
| `revalidatePath` from `next/cache` | Next.js built-in | Cache invalidation after mutations | After every server action mutation |
| `basePrisma` from `@/lib/db` | internal | Database client in server actions and cron route | Project-standard Prisma client |

**No new packages required.** This phase is entirely built on existing infrastructure.

---

## Architecture Patterns

### Recommended File Structure for Phase 3
```
app/api/cron/subscriptions/
└── route.ts                  # New POST cron endpoint

lib/actions/
├── billing.ts                # Add renewSubscription() action
└── admin.ts                  # Add activateSubscription(tenantId) action

lib/actions/audit-log.ts      # Add 'subscription_freeze' and 'subscription_unfreeze' event types

prisma/
└── schema.prisma             # Add isFrozen to Resource + Service; add CANCELED to PlanStatus

components/
├── resources-manager.tsx     # Add isFrozen badge + disable actions
├── services-manager.tsx      # Add isFrozen badge + disable actions
└── staff-manager.tsx         # Disable invite when planStatus === EXPIRED

app/dashboard/settings/billing/
└── billing-content.tsx       # Add expiry date display + EXPIRED alert block

app/admin/tenants/[tenantId]/
└── page.tsx                  # Add Activate Subscription action block

vercel.json                   # Add daily schedule for /api/cron/subscriptions
```

### Pattern 1: Cron Route — Mirror of Reminders Route

**What:** Next.js `POST` route handler with `CRON_SECRET` auth, delegating to a pure business logic function.

**When to use:** Any automated background job triggered by external scheduler.

**Example (from existing `app/api/cron/reminders/route.ts`):**
```typescript
// Source: app/api/cron/reminders/route.ts — exact template to replicate
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processSubscriptionLifecycle()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Subscription cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

Note: The CONTEXT.md specifies `POST` for the new route. The existing reminders route uses `GET`. Use `POST` for `/api/cron/subscriptions` as decided, but be aware Vercel Cron sends `GET` by default. If using Vercel Cron, either use `GET` or configure Vercel to POST. The schedule registration in `vercel.json` uses standard cron syntax and only supports `GET`. **Recommendation (Claude's discretion): use `GET` to match Vercel Cron behavior and the project's established pattern** — the CONTEXT says `POST` but the constraint exists at the infrastructure level. Flag this for the planner to decide, or use `GET` and note it.

### Pattern 2: Prisma Schema Addition — `prisma db push`

**What:** Add fields directly to schema, run `prisma db push` (no migration files).

**When to use:** This project uses `prisma db push` exclusively (established in Phase 02-01).

**Schema additions:**
```prisma
// Add to Resource model:
isFrozen  Boolean  @default(false)

// Add to Service model:
isFrozen  Boolean  @default(false)

// Add to PlanStatus enum:
enum PlanStatus {
  ACTIVE
  PENDING
  EXPIRED
  BANNED
  CANCELED    // <-- add this
}
```

After adding: run `npx prisma db push` then `npx prisma generate` to update the Prisma client.

### Pattern 3: Freeze Logic — Prisma Transaction

**What:** Use `basePrisma.$transaction([...])` to atomically: update tenant, identify oldest resource/service, freeze others.

**When to use:** Multi-table mutation where partial failure would leave data inconsistent.

**Example approach:**
```typescript
// Source: project pattern — basePrisma in lib/actions/
const [oldestResource] = await basePrisma.resource.findMany({
  where: { tenantId },
  orderBy: { createdAt: 'asc' },
  take: 1,
  select: { id: true },
})

// Freeze all except oldest
await basePrisma.resource.updateMany({
  where: { tenantId, id: { not: oldestResource?.id } },
  data: { isFrozen: true },
})
```

### Pattern 4: Frozen Badge in Manager Components

**What:** Inline badge next to the active/inactive status badge. For `resources-manager.tsx` both mobile cards and desktop table need updating.

**Badge design (from CONTEXT.md):**
```tsx
// Source: billing-content.tsx existing badge pattern — extend for frozen
{resource.isFrozen && (
  <span
    className="neu-inset bg-[var(--neu-bg)] text-orange-500 text-xs font-medium rounded-full px-2.5 py-1"
    title="Разморозьте подписку PRO, чтобы управлять этим объектом"
  >
    Заморожен
  </span>
)}
```

**Button disabling pattern (from existing code):**
```tsx
// Edit button — add isFrozen to disabled condition
<Button
  size="sm" variant="ghost"
  disabled={isPending || resource.isFrozen}
  onClick={() => setEditResource(resource)}
>
  <Pencil className="h-3.5 w-3.5" />
</Button>
```

### Pattern 5: Server Action — `activateSubscription`

**What:** New server action in `lib/actions/admin.ts` that calls `ensureSuperAdmin()`, then performs: tenant update (plan, planStatus, subscriptionExpiresAt, maxResources), bulk unfreeze of all resources and services, and audit log creation.

**Critical detail:** Uses `PLAN_DEFAULT_MAX_RESOURCES` constant that already exists in `admin.ts` — `PRO` maps to `20`.

```typescript
// Source: lib/actions/admin.ts — existing pattern to extend
export async function activateSubscription(tenantId: string) {
  await ensureSuperAdmin()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await basePrisma.$transaction([
    basePrisma.tenant.update({
      where: { id: tenantId },
      data: { plan: 'PRO', planStatus: 'ACTIVE', subscriptionExpiresAt: expiresAt, maxResources: 20 }
    }),
    basePrisma.resource.updateMany({
      where: { tenantId, isFrozen: true },
      data: { isFrozen: false }
    }),
    basePrisma.service.updateMany({
      where: { tenantId, isFrozen: true },
      data: { isFrozen: false }
    }),
  ])

  createAuditLog(tenantId, 'plan_upgrade', { activatedBy: 'superadmin', newExpiry: expiresAt.toISOString() })
  revalidatePath(`/admin/tenants/${tenantId}`)
  revalidatePath('/admin/tenants')
  return { success: true }
}
```

### Pattern 6: AuditLog Event Type Extension

**What:** `lib/actions/audit-log.ts` has a TypeScript union type `AuditEventType`. New event types must be added to it.

**Current union:**
```typescript
export type AuditEventType =
  | 'login'
  | 'plan_upgrade'
  | 'plan_downgrade'
  | 'service_deleted'
  | 'resource_deleted'
  | 'staff_deleted'
```

**Required additions:** Add `'subscription_expired'` (for cron-triggered downgrade) if differentiating from manual downgrade, OR reuse `'plan_downgrade'` with `details.reason = 'subscription_expired'` (simpler — avoids union change). The CONTEXT specifies using `event_type = 'plan_downgrade'` with details `{ reason: 'subscription_expired' }`. This means NO type union change needed for the downgrade. `activateSubscription` can reuse `'plan_upgrade'`.

### Pattern 7: Notification Dedup for 3-Day Warning

**What (Claude's discretion):** Check whether a warning notification was sent in the last 24 hours before creating a new one.

**Recommended approach (timestamp-based, efficient):**
```typescript
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
const existingWarning = await basePrisma.notification.findFirst({
  where: {
    tenantId,
    message: { contains: 'истекает' },  // or a specific marker
    createdAt: { gte: yesterday },
  },
})
if (!existingWarning) {
  await basePrisma.notification.create({ ... })
  warned++
}
```

**Alternative:** Store a type/category field in the message, or use a dedicated `notificationType` field. Since the Notification model has no `type` field, use `message contains` or a specific prefix like `[RENEWAL_WARNING]` for reliable dedup.

### Anti-Patterns to Avoid

- **Running cron logic as a Server Action (not an API route):** Cron callers are external HTTP clients, not Next.js action clients. Must be an API route.
- **Using `prisma migrate dev` instead of `prisma db push`:** Project explicitly uses `db push` — established in Phase 02-01.
- **Adding `isFrozen` to the User model:** Decided against — use `tenant.planStatus` check at action and UI level instead.
- **Forgetting to update `ResourceWithRelations` type:** The TypeScript type returned from `lib/actions/resources.ts` must include `isFrozen` field, otherwise `resources-manager.tsx` won't have access to it. Same for services.
- **Calling `revalidatePath` without covering admin path:** After `activateSubscription`, revalidate both `/admin/tenants/${tenantId}` and `/dashboard/settings/billing` (if possible) so both sides reflect the change immediately.
- **Sending the cron route with `GET` vs `POST` mismatch:** Vercel Cron only supports `GET`. If the route is `POST`, Vercel's built-in scheduler won't trigger it. Either use `GET` (matching existing pattern) or rely on an external scheduler for `POST`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bulk freeze of N resources | Loop + individual updates | `prisma.resource.updateMany()` | Single DB round trip, atomic |
| Subscription expiry date calculation | Custom date arithmetic | `new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)` | Sufficient — no timezone edge cases for 30-day window |
| Cron authentication | Custom token system | `CRON_SECRET` env var + Bearer header | Already established in reminders route |
| Audit logging | Custom logging | `createAuditLog()` fire-and-forget | Already implemented in `lib/actions/audit-log.ts` |
| Telegram admin notification | Direct API call | `sendTelegramMessage()` from `@/lib/telegram` | Already implemented and used in billing.ts |

**Key insight:** Every infrastructure primitive needed for this phase already exists. This phase is about wiring them together into a lifecycle, not building new primitives.

---

## Common Pitfalls

### Pitfall 1: TypeScript Type for `isFrozen` Not Propagated to UI

**What goes wrong:** The `resources-manager.tsx` component uses `ResourceWithRelations` type from `lib/actions/resources.ts`. If that type definition doesn't include `isFrozen: boolean`, TypeScript will error when accessing `resource.isFrozen` in the template.

**Why it happens:** Prisma types regenerate on `prisma generate` but TypeScript-defined `ResourceWithRelations` types may narrow the selection. The Prisma client query in the action may use a `select` that omits `isFrozen`.

**How to avoid:** After adding `isFrozen` to the schema and running `prisma generate`, check `lib/actions/resources.ts` for the `ResourceWithRelations` type and the Prisma query to ensure `isFrozen` is included in the select clause. Same for `ServiceWithRelations` in `lib/actions/services.ts`.

**Warning signs:** TypeScript error "Property 'isFrozen' does not exist on type ResourceWithRelations" at build time.

### Pitfall 2: `CANCELED` Enum Added to Schema but Not to Prisma Client Type

**What goes wrong:** After adding `CANCELED` to `PlanStatus` enum in `schema.prisma`, if `prisma generate` is not run, imports of `PlanStatus` from `@prisma/client` won't include `CANCELED`. Code that checks `planStatus === PlanStatus.CANCELED` will have TypeScript errors.

**Why it happens:** `schema.prisma` changes require explicit `prisma generate` to update the generated client types.

**How to avoid:** Run `npx prisma db push` first (which also runs generate), then verify `node_modules/.prisma/client` includes `CANCELED`.

**Warning signs:** TypeScript error "Property 'CANCELED' does not exist on type typeof PlanStatus".

### Pitfall 3: Cron GET vs POST Mismatch with Vercel

**What goes wrong:** CONTEXT specifies `POST /api/cron/subscriptions`. Vercel Cron (configured in `vercel.json`) only calls `GET`. If the route only exports `POST`, Vercel's scheduler will get a 405 Method Not Allowed.

**Why it happens:** The CONTEXT decision was made independently of Vercel's constraint.

**How to avoid:** Export `GET` handler (consistent with `app/api/cron/reminders/route.ts`). Add the schedule to `vercel.json`. If the external caller needs POST, add a `POST` handler that delegates to the same business logic.

**Warning signs:** Vercel cron invocations return 405 in logs.

### Pitfall 4: Oldest Resource/Service Selection Edge Case

**What goes wrong:** If a tenant has 0 resources (or 0 services) at expiry time, `findMany({ orderBy: createdAt, take: 1 })` returns an empty array. The subsequent `updateMany({ where: { id: { not: undefined } } })` would freeze ALL records (since `not: undefined` is treated differently by Prisma — it may match all records or throw).

**Why it happens:** Destructuring the first element of an empty array gives `undefined`.

**How to avoid:** Check for empty result before building the `not` filter:
```typescript
const oldest = await prisma.resource.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } })
if (oldest) {
  await prisma.resource.updateMany({
    where: { tenantId, id: { not: oldest.id } },
    data: { isFrozen: true }
  })
}
// If no resources, nothing to freeze — skip entirely
```

**Warning signs:** All resources of a tenant with 0 items get frozen (impossible but defensive), or Prisma error on `not: undefined`.

### Pitfall 5: `billing-content.tsx` TenantInfo Type is Narrow

**What goes wrong:** The `BillingContent` component receives `tenant: TenantInfo` where `TenantInfo = { plan: string; planStatus: string }`. It does NOT include `subscriptionExpiresAt`. Displaying the expiry date requires passing this new field in the type and from the page component.

**Why it happens:** The type was defined narrowly — only the fields currently needed.

**How to avoid:** Extend `TenantInfo` in `billing-content.tsx` to include `subscriptionExpiresAt: Date | null`, and update the server component (`billing/page.tsx`) to select and pass this field.

**Warning signs:** `Property 'subscriptionExpiresAt' does not exist on type TenantInfo`.

### Pitfall 6: Staff Manager Has No `planStatus` Prop

**What goes wrong:** `StaffManager` component currently takes no props — it calls `getStaffMembers()` internally. It has no way to know if `planStatus === 'EXPIRED'` to disable the invite button.

**Why it happens:** The component was designed without lifecycle awareness.

**How to avoid:** Pass `planStatus: string` as a prop to `StaffManager`. The parent page must fetch and pass the tenant's `planStatus`. This requires a props interface change.

**Warning signs:** Runtime error accessing undefined `planStatus` or invite button never disabled.

### Pitfall 7: Super-Admin Activation Page Requires Server Action + Client Component

**What goes wrong:** The admin tenant detail page (`app/admin/tenants/[tenantId]/page.tsx`) is currently a server component. Adding an interactive "Activate Subscription" button requires either a Client Component wrapper or using a `<form>` with a server action.

**Why it happens:** Interactive buttons in server components require wrapping.

**How to avoid:** Add a small `ActivateSubscriptionForm` client component (like the existing `SendNotificationForm`) that calls `activateSubscription(tenantId)`. Keep the page itself as a server component.

**Warning signs:** "Event handlers cannot be passed to Client Component props" React error.

---

## Code Examples

Verified patterns from existing project sources:

### Cron Route Security Pattern
```typescript
// Source: app/api/cron/reminders/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ...
}
```

### Bulk UpdateMany Pattern
```typescript
// Source: lib/actions/admin.ts — existing updateMany equivalent
await basePrisma.tenant.update({ where: { id: tenantId }, data: { planStatus: PlanStatus.BANNED } })
// For bulk unfreeze:
await basePrisma.resource.updateMany({
  where: { tenantId, isFrozen: true },
  data: { isFrozen: false }
})
```

### Audit Log Creation (Fire-and-Forget)
```typescript
// Source: lib/actions/audit-log.ts
createAuditLog(tenantId, 'plan_downgrade', {
  reason: 'subscription_expired',
  previousPlan: 'PRO'
})
// Note: no await — fire-and-forget per project convention
```

### Notification Creation Pattern
```typescript
// Source: Notification model in prisma/schema.prisma — used in Phase 2
await basePrisma.notification.create({
  data: {
    tenantId,
    message: 'Ваша подписка истекает через 3 дня. Продлите подписку PRO, чтобы избежать заморозки данных.',
  }
})
```

### Neumorphic Status Badge Pattern
```typescript
// Source: app/dashboard/settings/billing/billing-content.tsx
<span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full neu-raised bg-[var(--neu-bg)] text-orange-600 text-xs font-medium">
  <AlertTriangle size={14} />
  Истек
</span>
// Frozen badge variant (neu-inset, no icon):
<span className="neu-inset bg-[var(--neu-bg)] text-orange-500 text-xs font-medium rounded-full px-2.5 py-1">
  Заморожен
</span>
```

### Telegram Renewal Notification
```typescript
// Source: lib/actions/billing.ts — requestProActivation pattern
const msg = [
  '🔄 <b>Заявка на продление PRO!</b>',
  `🏢 Компания: ${tenant.name}`,
  `📅 Подписка истекла: ${tenant.subscriptionExpiresAt?.toLocaleDateString('ru-RU') ?? 'неизвестно'}`,
].join('\n')
sendTelegramMessage(adminChatId, msg).catch(console.error)
```

### Vercel Cron Registration
```json
// Source: vercel.json — existing reminders cron pattern
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 * * * *" },
    { "path": "/api/cron/subscriptions", "schedule": "0 2 * * *" }
  ]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual plan management via admin UI only | Automated expiry detection via cron | Phase 3 (this phase) | Tenants no longer require manual intervention to expire |
| No `isFrozen` state on resources/services | `isFrozen Boolean @default(false)` on both models | Phase 3 (this phase) | Dashboard UI can reflect frozen state without relying on plan check alone |
| `CANCELED` enum referenced in UI but absent from schema | `CANCELED` added to `PlanStatus` enum | Phase 3 (this phase) | Removes TypeScript/runtime inconsistency |

**Deprecated/outdated:**
- Hard-coded EXPIRED check in `app/dashboard/layout.tsx` uses plain string `'EXPIRED'` — this remains valid but the frozen badge approach provides per-resource granularity rather than blunt plan-level messaging.

---

## Open Questions

1. **`POST` vs `GET` for cron route**
   - What we know: CONTEXT says `POST`, Vercel Cron only sends `GET`, existing project pattern uses `GET`
   - What's unclear: Whether this will be triggered by Vercel's built-in cron or an external scheduler
   - Recommendation: Export `GET` handler to match Vercel Cron and existing pattern; optionally also export `POST` delegating to same function for external callers. Add both to be safe.

2. **Whether `CANCELED` status triggers freeze in cron**
   - What we know: CONTEXT marks this as Claude's discretion
   - What's unclear: Whether CANCELED tenants should auto-freeze on subscription expiry the same way EXPIRED does
   - Recommendation: Yes — treat `CANCELED` the same as `EXPIRED` in the freeze condition (`planStatus IN [ACTIVE, PENDING]` AND `subscriptionExpiresAt < now()`). CANCELED tenants with active resources should be frozen just like EXPIRED ones. Keep the cron condition as `planStatus IN ['ACTIVE', 'PENDING']` — CANCELED is likely already frozen or should be.

3. **Count of frozen items in billing EXPIRED alert**
   - What we know: CONTEXT marks this as Claude's discretion
   - What's unclear: Whether to query and display `N resources frozen` in the billing alert
   - Recommendation: Yes — pass frozen counts from the billing page server component. Provides actionable context ("3 resources and 2 services frozen"). Requires counting `resources.filter(r => r.isFrozen).length` at the page level.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/subscription-lifecycle-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| `isFrozen` field exists in Resource model (schema.prisma) | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "schema"` | Wave 0 |
| `isFrozen` field exists in Service model (schema.prisma) | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "schema"` | Wave 0 |
| `CANCELED` added to PlanStatus enum (schema.prisma) | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "schema"` | Wave 0 |
| Cron route `app/api/cron/subscriptions/route.ts` exists | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "cron"` | Wave 0 |
| Cron route contains `CRON_SECRET` auth check | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "cron"` | Wave 0 |
| Cron route contains expiry logic (`subscriptionExpiresAt`) | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "cron"` | Wave 0 |
| `resources-manager.tsx` contains `isFrozen` badge | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "frozen-ui"` | Wave 0 |
| `services-manager.tsx` contains `isFrozen` badge | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "frozen-ui"` | Wave 0 |
| `staff-manager.tsx` contains `planStatus` prop | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "frozen-ui"` | Wave 0 |
| `billing-content.tsx` contains `subscriptionExpiresAt` display | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "billing"` | Wave 0 |
| `lib/actions/admin.ts` contains `activateSubscription` | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "admin"` | Wave 0 |
| Admin tenant detail page contains activate subscription UI | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "admin"` | Wave 0 |
| Neu-raised/neu-inset present on new UI elements | static file assertion | `npx jest __tests__/subscription-lifecycle-surface.test.ts -t "neumorphism"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/subscription-lifecycle-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/subscription-lifecycle-surface.test.ts` — covers all lifecycle requirements listed above (static file assertions using the `safeRead` pattern from `god-mode-surface.test.ts`)

---

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` — Confirmed: Tenant model fields, Resource/Service models, current PlanStatus enum (ACTIVE/PENDING/EXPIRED/BANNED — CANCELED missing)
- `lib/actions/billing.ts` — Confirmed: `requestProActivation()` pattern, Telegram notification, PENDING status flow
- `lib/actions/admin.ts` — Confirmed: `ensureSuperAdmin()`, `PLAN_DEFAULT_MAX_RESOURCES`, `updateTenantPlan()` pattern
- `lib/actions/audit-log.ts` — Confirmed: `createAuditLog()` signature, `AuditEventType` union
- `app/api/cron/reminders/route.ts` — Confirmed: exact cron route pattern with `CRON_SECRET` auth
- `vercel.json` — Confirmed: cron config structure, `schedule` field
- `components/resources-manager.tsx` — Confirmed: `ResourceWithRelations` usage, button patterns, badge rendering
- `components/services-manager.tsx` — Confirmed: same pattern as resources-manager
- `components/staff-manager.tsx` — Confirmed: no props currently, internal `getStaffMembers()` call, `dialogOpen` state
- `app/dashboard/settings/billing/billing-content.tsx` — Confirmed: `TenantInfo` type narrowness, existing badge pattern
- `app/admin/tenants/[tenantId]/page.tsx` — Confirmed: server component, `SendNotificationForm` client component pattern
- `app/dashboard/layout.tsx` — Confirmed: existing EXPIRED banner, `tenantPlanStatus` string check

### Secondary (MEDIUM confidence)
- None — all findings verified against actual source files

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present and in use in the codebase
- Architecture: HIGH — all patterns verified against existing code
- Pitfalls: HIGH — identified from actual TypeScript type mismatches visible in source files
- Validation: HIGH — test framework confirmed (jest.config.ts), pattern confirmed (god-mode-surface.test.ts)

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days — stable framework, no fast-moving dependencies)
