# Phase 10: SaaS Monetization, Enterprise Tier & Platform Payments — Research

**Researched:** 2026-04-01
**Domain:** Prisma schema extension, Server Actions, payment modal UX, admin plan editor
**Confidence:** HIGH (all findings verified against live source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: SubscriptionPlan Model**
- New Prisma model `SubscriptionPlan` with fields: `id String @id`, `plan Plan @unique`, `displayName String`, `maxResources Int`, `priceMonthly Int` (KZT, 0 = free, -1 = dynamic/enterprise), `priceYearly Int` (-1 = dynamic), `pricePerResource Int @default(0)`, `isActive Boolean @default(true)`, `features String[]`.
- Seed: FREE (0 KZT, 1 resource), PRO (10,000 KZT/month, 20 resources), ENTERPRISE (-1 dynamic, 100 resources, pricePerResource = 1000 KZT).
- `PLAN_DEFAULT_MAX_RESOURCES` in `lib/actions/admin.ts` is **removed**. `updateTenantPlan` and `activateSubscription` fetch `maxResources` from DB instead.
- `billing-content.tsx` hardcoded `10 000 ₸` is **removed**. Price fetched from `SubscriptionPlan.priceMonthly` server-side.

**D-02: Super Admin Plan Editor**
- New page: `app/admin/plans/page.tsx` (RSC) + `app/admin/plans/plan-editor-client.tsx` (client component, inline-edit table).
- New Server Action: `lib/actions/admin-plans.ts` → `updateSubscriptionPlan(planId, data)` with `ensureSuperAdmin()` guard.
- Add "Тарифы" link to `app/admin/admin-nav.tsx` NAV_LINKS array.

**D-03: Enterprise Tier — Dynamic Pricing Calculator**
- Billing page shows Neumorphic slider when `plan === 'ENTERPRISE'` or on "Learn about Enterprise" click.
- Slider range 1–200. Formula: `monthly = priceMonthly + resources × pricePerResource`. Yearly = monthly × 10.
- `BillingContent` receives `enterprisePlan: { priceMonthly, pricePerResource }` as prop.
- "Request Enterprise" CTA: Telegram notification to admin + `planStatus = PENDING`.

**D-04: PlatformPayment Model**
- New Prisma model `PlatformPayment`: `id String @id @default(cuid())`, `tenantId String`, `amount Int`, `planTarget Plan`, `status PaymentStatus @default(PENDING)`, `mockQrCode String?`, `mockPaylink String?`, `expiresAt DateTime`, `paidAt DateTime?`, `createdAt DateTime @default(now())`.
- New enum `PaymentStatus`: PENDING, PAID, FAILED, EXPIRED.

**D-05: Mock Payment Adapter**
- `lib/platform-payment.ts`: `createPlatformPayment(tenantId, plan, amount)`, `processPlatformPayment(paymentId)`.
- New Server Action `initiateSubscriptionPayment()` in `lib/actions/billing.ts` — replaces `requestProActivation()` as primary upgrade path.
- `requestProActivation()` and `renewSubscription()` kept but deprecated.

**D-06: Waiting-for-Payment Modal**
- Two-step flow: Step 1 (Initiate) → Step 2 (mock QR + countdown + "Симулировать оплату").
- "Симулировать оплату" button shown only in `NODE_ENV !== 'production'` OR `NEXT_PUBLIC_MOCK_PAYMENTS=true`.

**D-07: Mock Webhook / Simulate Endpoint**
- `app/api/mock-payment/simulate/route.ts` POST handler, protected by `CRON_SECRET` or `MOCK_PAYMENT_SECRET`.
- `processPlatformPayment(paymentId)`: verify PENDING + not expired → PAID → `activateSubscription` logic → audit log → Telegram.

**D-08: Billing Page Refactor**
- `billing/page.tsx` fetches: tenant + `SubscriptionPlan` rows + active `PlatformPayment` (pending).
- `BillingContent` receives: `subscriptionPlans: SubscriptionPlan[]`, `pendingPayment: PlatformPayment | null`, `enterprisePlan: { priceMonthly, pricePerResource }`.
- If `pendingPayment` exists, modal opens directly to Step 2 on page load.
- Card number block (lines 229–243 in current billing-content.tsx) is **removed**.

**D-09: i18n**
- New keys (RU/EN/KZ): `billing.payWithKaspi`, `billing.waitingForPayment`, `billing.scanQr`, `billing.simulatePayment`, `billing.paymentExpired`, `billing.enterpriseCalculator`, `billing.resourceCount`, `billing.monthlyPrice`, `billing.yearlyPrice`, `admin.plans.title`, `admin.plans.editPlan`.

### Claude's Discretion
- Exact mock QR image strategy (static SVG placeholder vs. real QR library)
- Whether countdown timer auto-polls or uses manual "refresh status" button
- Exact Telegram message wording for payment receipt and enterprise inquiries
- Whether to add PlatformPayment history table to admin tenant drill-down
- Exact `expiresAt` window (suggested: 24h)

### Deferred Ideas (OUT OF SCOPE)
- Real Paylink.kz integration — pending ИП registration
- Platform billing history / invoice download page
- Promo codes or discount system
- Automatic dunning emails for failed/expired payments
- Per-feature entitlements beyond `maxResources`
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MON-01 | SubscriptionPlan DB model with plan@unique, displayName, maxResources, priceMonthly, priceYearly, pricePerResource, features[]; seeded FREE/PRO/ENTERPRISE | Schema design section; seed data values |
| MON-02 | Remove PLAN_DEFAULT_MAX_RESOURCES from admin.ts; remove hardcoded 10 000 ₸ from billing-content.tsx; all plan actions fetch from DB | Existing code audit section; all 3 callsites mapped |
| MON-03 | /admin/plans page with inline-edit table; updateSubscriptionPlan() Server Action with ensureSuperAdmin() guard | Admin UI pattern section; AdminNav mutation pattern |
| MON-04 | Enterprise slider on billing page; formula monthly = base + resources × pricePerResource; yearly = monthly × 10 | Billing page refactor map; component props section |
| MON-05 | "Request Enterprise" CTA sends Telegram notification + sets planStatus = PENDING | Integration risk map; sendTelegramMessage() signature confirmed |
| MON-06 | PlatformPayment model with tenantId, amount, planTarget, PaymentStatus enum, mockQrCode, expiresAt, paidAt | Schema design section; full field list with Prisma syntax |
| MON-07 | lib/platform-payment.ts with createPlatformPayment() and processPlatformPayment(); initiateSubscriptionPayment() Server Action | Integration risk map; processPlatformPayment logic walkthrough |
| MON-08 | Two-step payment modal with mock QR + countdown + simulate button behind NEXT_PUBLIC_MOCK_PAYMENTS flag; resume on refresh | Billing page refactor map; state machine section |
| MON-09 | app/api/mock-payment/simulate/route.ts calls processPlatformPayment(): PAID, activates sub, Telegram, audit log saas_payment_received | Existing code audit (cron auth pattern); audit-log section |
</phase_requirements>

---

## Summary

Phase 10 has three interconnected tracks that share a single data foundation: (1) a `SubscriptionPlan` DB model replaces every hardcoded pricing constant, (2) an Enterprise tier calculator and plan editor allow runtime changes without code deploys, and (3) a mock platform payment adapter (Kaspi/Paylink-style) replaces the manual card-transfer UX with an automated QR + webhook flow.

The codebase is in excellent shape for this phase. The Phase 3 subscription lifecycle already implemented `activateSubscription()` with the exact transaction pattern (`basePrisma.$transaction`, bulk resource unfreeze) that `processPlatformPayment` will reuse. The Phase 9 webhook route (`app/api/webhooks/paylink/route.ts` does not exist in main — it was out of scope for Phase 9 final code) provides the design reference, not actual code to modify. The `admin.ts` file contains the three `PLAN_DEFAULT_MAX_RESOURCES` callsites that must be replaced (lines 55, 87, 153). The `billing-content.tsx` has two hardcoded price strings (lines 174, 213) and one card number block (lines 229–243) to remove. The `app/admin/analytics/page.tsx` has a fourth hardcoded pricing constant (`PLAN_MRR`) that must also be updated to read from DB.

**Primary recommendation:** Build in wave order — schema first (MON-01, MON-06), then server logic (MON-02, MON-07, MON-09), then UI (MON-03, MON-04, MON-05, MON-08), then i18n (MON-09 keys). The `processPlatformPayment` function is the critical path: it must be idempotent (duplicate webhook calls must be safe) and must call `activateSubscription`-equivalent logic without the `ensureSuperAdmin()` guard.

---

## Existing Code Audit

### File 1: `prisma/schema.prisma` — Current State

**Confirmed enums present:**
- `Plan { FREE, PRO, ENTERPRISE }` — used as the `@unique` key for `SubscriptionPlan`
- `PlanStatus { ACTIVE, PENDING, EXPIRED, BANNED, CANCELED }` — no `PaymentStatus` enum exists yet

**Confirmed models present:** Tenant, Announcement, Notification, AuditLog, User, OtpCode, Resource, Schedule, Service, ResourceService, Booking, Client

**What must be added:**
- Enum `PaymentStatus` (PENDING, PAID, FAILED, EXPIRED)
- Model `SubscriptionPlan`
- Model `PlatformPayment` with FK to Tenant

**Key observation:** `Booking` already has `paymentInvoiceId` and `paymentExpiresAt` from Phase 9. The `PlatformPayment` model is platform-level (separate concern) — no collision.

---

### File 2: `lib/actions/admin.ts` — Hardcoded Constant Callsites

```
lib/actions/admin.ts:22   — PLAN_DEFAULT_MAX_RESOURCES definition (FREE=1, PRO=20, ENTERPRISE=100)
lib/actions/admin.ts:55   — maxResources: PLAN_DEFAULT_MAX_RESOURCES[plan]  (upgrade branch in updateTenantPlan)
lib/actions/admin.ts:87   — maxResources: PLAN_DEFAULT_MAX_RESOURCES[plan]  (downgrade branch in updateTenantPlan)
lib/actions/admin.ts:153  — maxResources: PLAN_DEFAULT_MAX_RESOURCES.PRO    (activateSubscription — hardcoded PRO)
```

**Full `activateSubscription()` logic (lines 140–179):**
1. `ensureSuperAdmin()` guard
2. Calculates `expiresAt = now + 30 days`
3. `basePrisma.$transaction([tenant.update({plan:'PRO', planStatus:'ACTIVE', expiresAt, maxResources: 20}), resource.updateMany({isFrozen:false}), service.updateMany({isFrozen:false})])`
4. `createAuditLog(tenantId, 'plan_upgrade', { activatedBy:'superadmin', newExpiry })`
5. `revalidatePath` on 3 paths

**Critical for MON-07:** `processPlatformPayment()` needs the same transaction logic WITHOUT `ensureSuperAdmin()`. It must accept `planTarget: Plan` dynamically (not hardcoded PRO). Solution: extract a `performActivation(tenantId, plan, triggeredBy)` helper in `lib/platform-payment.ts` that is called by both `activateSubscription()` and `processPlatformPayment()`.

**`updateTenantPlan()` full behavior:**
- Uses `PLAN_ORDER = {FREE:0, PRO:1, ENTERPRISE:2}` to detect upgrade vs downgrade
- Upgrade: 30-day expiry + bulk isFrozen=false + audit log `plan_upgrade`
- Downgrade: clears expiry, freezes all resources/services except oldest, audit log `plan_downgrade`
- Status-only change (same plan): plain tenant.update without lifecycle fields

---

### File 3: `lib/actions/billing.ts` — Current State

**`requestProActivation()`:**
- Guard: `requireAuth()` + `requireRole(session, ['OWNER'])`
- Checks `planStatus !== PENDING` (dedupe guard)
- Sets `planStatus = PENDING` only (no plan change)
- Sends Telegram to `ADMIN_TELEGRAM_CHAT_ID`
- `revalidatePath('/dashboard/settings/billing')`

**`renewSubscription()`:**
- Same guard pattern
- Sets `plan = 'PRO'` + `planStatus = PENDING`
- Sends Telegram to `ADMIN_TELEGRAM_CHAT_ID`

**What `initiateSubscriptionPayment()` replaces:**
- Both functions above for the happy-path payment flow
- Both functions are kept (deprecated) — they still work for the old manual flow if needed

**New `initiateSubscriptionPayment()` signature:**
```typescript
export async function initiateSubscriptionPayment(plan: Plan = 'PRO'): Promise<{
  success: boolean
  paymentId?: string
  mockQrCode?: string
  amount?: number
  expiresAt?: string
  error?: string
}>
```

---

### File 4: `app/dashboard/settings/billing/billing-content.tsx` — Current Props and Hardcoded Lines

**Current props type:**
```typescript
type TenantInfo = {
  plan: string
  planStatus: string
  subscriptionExpiresAt: Date | null
  kaspiMerchantId: string | null
  kaspiApiKey: string | null
}

export function BillingContent({ tenant }: { tenant: TenantInfo })
```

**Hardcoded values to remove:**
- Line 174: `<span className="text-4xl font-bold text-foreground">10 000 ₸</span>` (price display card)
- Line 213: `<p className="text-3xl font-bold text-foreground">10 000 ₸</p>` (dialog payment amount)
- Lines 229–243: Card number copy block (entire div with onClick clipboard + card number + recipient name)

**Imported actions (lines 29–30):**
```typescript
import { requestProActivation, renewSubscription } from "@/lib/actions/billing"
import { updatePaymentSettings } from "@/lib/actions/payment-settings"
```
After Phase 10, `requestProActivation` and `renewSubscription` imports are replaced by `initiateSubscriptionPayment`.

**Current dialog state management:**
- `const [isOpen, setIsOpen] = useState(false)` — single boolean
- `const [loading, setLoading] = useState(false)` — loading state

After Phase 10, dialog needs a `step: 'initiate' | 'waiting' | 'success' | 'expired'` state machine.

---

### File 5: `app/dashboard/settings/billing/page.tsx` — Server Component Fetch Shape

**Current:** Instantiates `new PrismaClient()` directly (not `basePrisma`) and fetches the full `tenant` row.

**Issues to fix in Phase 10:**
1. Uses `new PrismaClient()` instead of `basePrisma` — the planner should note this inconsistency and fix it (use `basePrisma` from `@/lib/db`)
2. Passes entire tenant object to `BillingContent` — Phase 10 must add `subscriptionPlans` and `pendingPayment` fetches

**New fetch shape:**
```typescript
const [tenant, subscriptionPlans, pendingPayment] = await Promise.all([
  basePrisma.tenant.findUnique({ where: { id: tenantId } }),
  basePrisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { plan: 'asc' } }),
  basePrisma.platformPayment.findFirst({
    where: { tenantId, status: 'PENDING', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  }),
])
const enterprisePlan = subscriptionPlans.find(p => p.plan === 'ENTERPRISE')
```

---

### File 6: `lib/subscription-lifecycle.ts` — maxResources Usage

**Line 67:** `maxResources: 1` — hardcoded in the expiry downgrade branch:
```typescript
await basePrisma.tenant.update({
  where: { id: tenant.id },
  data: { plan: 'FREE', planStatus: 'EXPIRED', maxResources: 1 },  // ← hardcoded
})
```

**MON-02 requires this to use the DB value.** The lifecycle function must be updated to look up `SubscriptionPlan` where `plan = 'FREE'` and use `subscriptionPlan.maxResources`.

**Pattern to follow:** Add a DB lookup before the downgrade update:
```typescript
const freePlan = await basePrisma.subscriptionPlan.findUnique({ where: { plan: 'FREE' } })
const freeMaxResources = freePlan?.maxResources ?? 1  // safe fallback
```

---

### File 7: `lib/actions/audit-log.ts` — Signature

```typescript
export type AuditEventType =
  | 'login' | 'plan_upgrade' | 'plan_downgrade'
  | 'service_deleted' | 'resource_deleted' | 'staff_deleted'

export async function createAuditLog(
  tenantId: string,
  eventType: AuditEventType,
  details: Record<string, unknown> = {}
): Promise<void>
```

**Problem for MON-09:** `saas_payment_received` is not in `AuditEventType`. Must add it to the union type.

---

### File 8: `lib/telegram.ts` — Signatures

```typescript
export async function sendTelegramMessage(chatId: string, text: string): Promise<void>
export async function sendTelegramMessageWithButtons(chatId: string, text: string, buttons: InlineButton[]): Promise<void>
export async function deleteTelegramMessage(chatId: string, messageId: number): Promise<void>
```

Reads `TELEGRAM_BOT_TOKEN` from env. No-op if token absent (safe for dev). Uses HTML parse mode.
Admin chat ID env var: `process.env.ADMIN_TELEGRAM_CHAT_ID`.

---

### File 9: `app/admin/tenants/[tenantId]/page.tsx` — Admin Tenant Detail Pattern

Structure: RSC with `Promise.all` fetching tenant + services + resources + staff. Uses `<Tabs>` from shadcn. Has "Управление подпиской" section at bottom using `<ActivateSubscriptionForm tenantId={tenantId} />`.

**For Phase 10:** The CONTEXT.md mentions adding a plan editor link here. The simplest approach is a Link button to `/admin/plans`.

---

### File 10: `app/admin/layout.tsx` — Admin Sidebar Nav

Uses `<AdminNav hasTenantLink={...} />` client component from `app/admin/admin-nav.tsx`.

**AdminNav structure (confirmed):** `NAV_LINKS` array with entries `{ href, label, icon, exact? }`. Currently 5 entries:
- `/admin` — Обзор (LayoutDashboard, exact)
- `/admin/analytics` — Аналитика (BarChart3)
- `/admin/tenants` — Компании (Users)
- `/admin/audit-logs` — Логи действий (FileText)
- `/admin/announcements` — Объявления (Megaphone)

**For MON-03:** Add `{ href: '/admin/plans', label: 'Тарифы', icon: CreditCard }` to `NAV_LINKS`.

---

### File 11: `app/api/webhooks/paylink/route.ts` — DOES NOT EXIST

The file referenced in CONTEXT.md as webhook pattern does not exist in the main branch. The Phase 9 implementation shipped a `lib/payments/kaspi.ts` mock and `app/api/webhooks/kaspi/route.ts` (client-to-tenant webhooks) but the `paylink` route was out-of-scope.

**For the mock simulate endpoint,** use the cron auth pattern from `app/api/cron/subscriptions/route.ts` instead:
```typescript
// GET pattern from cron — adapt to POST for simulate
const authHeader = request.headers.get('authorization')
const secret = process.env.CRON_SECRET  // or MOCK_PAYMENT_SECRET
if (secret && authHeader !== `Bearer ${secret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### File 12: `app/api/cron/subscriptions/route.ts` — Cron Auth Pattern

Uses `CRON_SECRET` Bearer token auth. GET handler only (Vercel Cron constraint). Calls `processSubscriptionLifecycle()` and returns `{ success, warned, processed }`.

---

### File 13: `vercel.json` — Current Cron Entries

Three crons already exist:
```json
{ "path": "/api/cron/reminders",      "schedule": "0,30 * * * *" }
{ "path": "/api/cron/subscriptions",  "schedule": "0 2 * * *"   }
{ "path": "/api/cron/pending-payments","schedule": "*/5 * * * *" }
```
Vercel free tier supports 2 crons. Project is already over that limit (3). The mock simulate endpoint is a POST route (not a cron) so **no new vercel.json entry is needed** for Phase 10.

---

### File 14: `app/admin/analytics/page.tsx` — Fourth Hardcoded Price

```typescript
// Line 11 — Prices in KZT (major units) — must match billing-content.tsx plan pricing
const PLAN_MRR: Record<string, number> = { FREE: 0, PRO: 10000, ENTERPRISE: 29900 }
```

This is a **fourth hardcoded pricing location** not listed in CONTEXT.md canonical refs. After Phase 10, this analytics page must query `SubscriptionPlan` from DB to compute MRR dynamically.

---

### `PLAN_DEFAULT_MAX_RESOURCES` — Complete Callsite Map (source files only)

| File | Line | Usage |
|------|------|-------|
| `lib/actions/admin.ts` | 22 | Definition `const PLAN_DEFAULT_MAX_RESOURCES: Record<Plan, number> = { FREE: 1, PRO: 20, ENTERPRISE: 100 }` |
| `lib/actions/admin.ts` | 55 | `maxResources: PLAN_DEFAULT_MAX_RESOURCES[plan]` — upgrade branch |
| `lib/actions/admin.ts` | 87 | `maxResources: PLAN_DEFAULT_MAX_RESOURCES[plan]` — downgrade branch |
| `lib/actions/admin.ts` | 153 | `maxResources: PLAN_DEFAULT_MAX_RESOURCES.PRO` — `activateSubscription()` |
| `lib/subscription-lifecycle.ts` | 67 | `maxResources: 1` — equivalent hardcoded value in expiry downgrade |

All five must be replaced by DB lookups in Phase 10.

---

### Hardcoded Plan Prices — Complete Map

| File | Line(s) | Value | Context |
|------|---------|-------|---------|
| `app/dashboard/settings/billing/billing-content.tsx` | 174 | `10 000 ₸` | PRO price display card |
| `app/dashboard/settings/billing/billing-content.tsx` | 213 | `10 000 ₸` | Dialog payment amount |
| `app/dashboard/settings/billing/billing-content.tsx` | 232–243 | Card `4400 4303 8983 0552` | Remove entirely |
| `app/admin/analytics/page.tsx` | 11 | `PRO: 10000, ENTERPRISE: 29900` | MRR calculation constant |

---

## Schema Design

### Proposed `SubscriptionPlan` Model

```prisma
model SubscriptionPlan {
  id               String   @id @default(cuid())
  plan             Plan     @unique
  displayName      String
  maxResources     Int
  priceMonthly     Int      // KZT. 0 = free, -1 = dynamic (enterprise)
  priceYearly      Int      // KZT. -1 = dynamic
  pricePerResource Int      @default(0)  // for enterprise dynamic calc
  isActive         Boolean  @default(true)
  features         String[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**No FK to Tenant** — `SubscriptionPlan` is platform configuration, not per-tenant. The `Plan` enum key (`@unique`) is the join surface with `Tenant.plan`.

### Proposed `PaymentStatus` Enum

```prisma
enum PaymentStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
}
```

**Note:** `PENDING` collides with `PlanStatus.PENDING` name but they are separate enums — no problem in Prisma/PostgreSQL since enum names are namespaced.

### Proposed `PlatformPayment` Model

```prisma
model PlatformPayment {
  id           String        @id @default(cuid())
  tenantId     String
  amount       Int           // KZT
  planTarget   Plan
  status       PaymentStatus @default(PENDING)
  mockQrCode   String?       // SVG data URI or placeholder URL
  mockPaylink  String?       // https://mock-kaspi.local/pay?id={id}
  expiresAt    DateTime
  paidAt       DateTime?
  createdAt    DateTime      @default(now())
  tenant       Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([status, expiresAt])
  @@index([tenantId, status])
}
```

**Tenant relation:** Must add `platformPayments PlatformPayment[]` to the `Tenant` model.

### Migration Strategy

Follow established project pattern: **`prisma db push`** (no migration files). Confirmed in STATE.md key patterns:
> "prisma db push (not migrate dev) for schema sync — no migration files, just schema state sync"

Sequence:
1. Edit `prisma/schema.prisma` — add enum `PaymentStatus`, model `SubscriptionPlan`, model `PlatformPayment`, relation field on `Tenant`
2. Run `npx prisma db push` (manual step requiring live DB, as noted in Phase 4 and 6 patterns)
3. Run `npx prisma generate` (updates Prisma Client types)
4. Run seed for `SubscriptionPlan` rows

### Seed Data — Exact Values

```typescript
// prisma/seed-plans.ts or in prisma/seed.ts
await prisma.subscriptionPlan.upsert({
  where: { plan: 'FREE' },
  update: {},
  create: {
    plan: 'FREE',
    displayName: 'Бесплатный',
    maxResources: 1,
    priceMonthly: 0,
    priceYearly: 0,
    pricePerResource: 0,
    features: ['1 ресурс', 'Онлайн-запись', 'Email уведомления'],
  },
})
await prisma.subscriptionPlan.upsert({
  where: { plan: 'PRO' },
  update: {},
  create: {
    plan: 'PRO',
    displayName: 'PRO',
    maxResources: 20,
    priceMonthly: 10000,
    priceYearly: 100000,  // 10 months = 2 months free
    pricePerResource: 0,
    features: ['До 20 ресурсов', 'Безлимит бронирований', 'Email и СМС уведомления', 'Аналитика', 'Приоритетная поддержка'],
  },
})
await prisma.subscriptionPlan.upsert({
  where: { plan: 'ENTERPRISE' },
  update: {},
  create: {
    plan: 'ENTERPRISE',
    displayName: 'Enterprise',
    maxResources: 100,
    priceMonthly: -1,       // dynamic
    priceYearly: -1,        // dynamic
    pricePerResource: 1000, // KZT per resource
    features: ['До 100+ ресурсов', 'Индивидуальная цена', 'Выделенная поддержка', 'Кастомизация'],
  },
})
```

**Note on `upsert`:** Use `upsert` (not `create`) so the seed script is re-runnable without error.

---

## Integration Risk Map

### Risk 1: `PLAN_DEFAULT_MAX_RESOURCES` — All Callsites Must Be Updated Atomically

The constant and all three usages live in `lib/actions/admin.ts`. The lifecycle usage is the equivalent value `1` in `lib/subscription-lifecycle.ts:67`. All five must be replaced in a single plan to avoid a broken intermediate state where some code reads DB and other code still uses the hardcoded constant.

**Replacement pattern for `updateTenantPlan` and `activateSubscription`:**
```typescript
// At start of function, before transaction:
const planRecord = await basePrisma.subscriptionPlan.findUnique({
  where: { plan },  // or 'PRO' for activateSubscription
  select: { maxResources: true },
})
const maxResources = planRecord?.maxResources ?? FALLBACK_VALUE
```

**Fallback values (if DB record missing):** FREE=1, PRO=20, ENTERPRISE=100 — as TypeScript constants used only as last-resort fallback, not primary source.

### Risk 2: `processPlatformPayment` — Race Condition on Concurrent Calls

Two simultaneous webhook deliveries for the same `paymentId` would both find status `PENDING` and both call `activateSubscription`. Fix with an optimistic lock:

```typescript
// Use updateMany with status filter — only one call will succeed
const updated = await basePrisma.platformPayment.updateMany({
  where: { id: paymentId, status: 'PENDING' },
  data: { status: 'PAID', paidAt: new Date() },
})
if (updated.count === 0) {
  // Already processed — idempotent exit
  return { success: true, alreadyProcessed: true }
}
// Only the winner proceeds to activateSubscription logic
```

This is superior to a transaction-based lock because `updateMany` with a filter condition is atomic at the Postgres row level.

### Risk 3: `requestProActivation()` / `renewSubscription()` Deprecation Path

These functions currently:
- Set `planStatus = PENDING` (requestPro) or `plan = 'PRO', planStatus = PENDING` (renewSub)
- Send Telegram to admin
- `revalidatePath`

The new `initiateSubscriptionPayment()` also sets `planStatus = PENDING` (via `createPlatformPayment`). If a tenant calls the old function then the new one, `planStatus` is already PENDING — the PENDING dedup guard in the old functions prevents double-submission.

**Safe to keep both** — old functions are dead code paths once the UI is updated. Do NOT delete them until Phase 10 is verified green, so a rollback path remains.

### Risk 4: `admin/analytics/page.tsx` PLAN_MRR Constant

This constant (`{ FREE: 0, PRO: 10000, ENTERPRISE: 29900 }`) will diverge from DB values after Phase 10. While not explicitly in CONTEXT.md, the analytics page will show wrong MRR numbers if not updated. The ENTERPRISE value (29900) is already wrong vs the current pricing (10000 PRO, dynamic ENTERPRISE).

**Recommended action:** Update analytics page in the same wave as billing page refactor. Replace `PLAN_MRR` with a DB query:
```typescript
const planPrices = await basePrisma.subscriptionPlan.findMany({
  select: { plan: true, priceMonthly: true }
})
const PLAN_MRR = Object.fromEntries(
  planPrices.map(p => [p.plan, p.priceMonthly < 0 ? 0 : p.priceMonthly])
)
```

### Risk 5: `AuditEventType` Needs Extension

`lib/actions/audit-log.ts` uses a TypeScript union type for `eventType`. Adding `saas_payment_received` requires updating the type union. Since `createAuditLog` is used fire-and-forget across multiple files, TypeScript will catch mismatches at compile time — this is the safest approach. Update the union type in the same plan that adds `processPlatformPayment`.

### Risk 6: Tenant Model Needs PlatformPayment Relation

The `PlatformPayment` model has a `Tenant` relation. The `Tenant` model must gain `platformPayments PlatformPayment[]` relation field. This is a schema change that requires regenerating the Prisma Client before any TS files that use `basePrisma.platformPayment` can compile.

---

## Admin UI Pattern

### RSC + Client Component Split (from admin/tenants/[tenantId]/page.tsx)

```
app/admin/plans/
├── page.tsx              ← RSC: fetches SubscriptionPlan[] + passes to PlanEditorClient
└── plan-editor-client.tsx ← 'use client': inline-edit table with form state
```

**RSC pattern:**
```typescript
// app/admin/plans/page.tsx
import { basePrisma } from '@/lib/db'
import { PlanEditorClient } from './plan-editor-client'

export default async function AdminPlansPage() {
  const plans = await basePrisma.subscriptionPlan.findMany({
    orderBy: { plan: 'asc' },
  })
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Тарифы</h1>
      <PlanEditorClient plans={plans} />
    </div>
  )
}
```

**Client component pattern (from ActivateSubscriptionForm):**
- `useState` for editing state per row
- `useTransition` + async Server Action calls
- `toast.success` / `toast.error` feedback
- `revalidatePath` called inside the Server Action

### Adding Nav Item to AdminNav

`app/admin/admin-nav.tsx` — add to `NAV_LINKS` array:
```typescript
import { CreditCard } from 'lucide-react'
// In NAV_LINKS array, after 'Аналитика':
{ href: '/admin/plans', label: 'Тарифы', icon: CreditCard },
```

The `isActive` function handles path matching automatically — no other changes needed.

---

## Billing Page Refactor Map

### Current Props → New Props

| Prop | Current | New | Source |
|------|---------|-----|--------|
| `tenant` | `TenantInfo` (plan, planStatus, expiresAt, kaspiMerchantId, kaspiApiKey) | Same + no change | billing/page.tsx |
| `subscriptionPlans` | Not passed | `SubscriptionPlan[]` | billing/page.tsx new fetch |
| `pendingPayment` | Not passed | `PlatformPayment \| null` | billing/page.tsx new fetch |
| `enterprisePlan` | Not passed | `{ priceMonthly: number, pricePerResource: number }` | Derived from subscriptionPlans |

**Updated BillingContent signature:**
```typescript
type SubscriptionPlanInfo = {
  plan: string
  displayName: string
  maxResources: number
  priceMonthly: number
  priceYearly: number
  pricePerResource: number
  features: string[]
}

type PendingPaymentInfo = {
  id: string
  amount: number
  planTarget: string
  mockQrCode: string | null
  expiresAt: Date
} | null

type EnterpriseCalcInfo = {
  priceMonthly: number     // -1 for fully dynamic
  pricePerResource: number
}

export function BillingContent({
  tenant,
  subscriptionPlans,
  pendingPayment,
  enterprisePlan,
}: {
  tenant: TenantInfo
  subscriptionPlans: SubscriptionPlanInfo[]
  pendingPayment: PendingPaymentInfo
  enterprisePlan: EnterpriseCalcInfo | null
})
```

### Price Display Refactor

Replace hardcoded `10 000 ₸` with DB value:
```typescript
const proPlan = subscriptionPlans.find(p => p.plan === 'PRO')
const displayPrice = proPlan?.priceMonthly
  ? `${proPlan.priceMonthly.toLocaleString('ru-RU')} ₸`
  : '...'
```

### State Machine for Two-Step Payment Modal

```typescript
type PaymentModalStep = 'idle' | 'initiate' | 'waiting' | 'success' | 'expired'

const [paymentStep, setPaymentStep] = useState<PaymentModalStep>(
  pendingPayment ? 'waiting' : 'idle'  // resume if pendingPayment exists
)
const [activePayment, setActivePayment] = useState<{
  paymentId: string
  mockQrCode: string | null
  amount: number
  expiresAt: string
} | null>(
  pendingPayment ? {
    paymentId: pendingPayment.id,
    mockQrCode: pendingPayment.mockQrCode,
    amount: pendingPayment.amount,
    expiresAt: pendingPayment.expiresAt.toISOString(),
  } : null
)

// Step 1: "Оплатить через Kaspi" button
async function handleInitiatePayment() {
  setLoading(true)
  const res = await initiateSubscriptionPayment()
  setLoading(false)
  if (res.error) { toast.error(res.error); return }
  setActivePayment({ paymentId: res.paymentId!, mockQrCode: res.mockQrCode!, amount: res.amount!, expiresAt: res.expiresAt! })
  setPaymentStep('waiting')
}

// Step 2: "Симулировать оплату" (dev/demo only)
async function handleSimulate() {
  const res = await fetch('/api/mock-payment/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_PAYMENT_SECRET}` },
    body: JSON.stringify({ paymentId: activePayment?.paymentId }),
  })
  if (res.ok) { setPaymentStep('success'); router.refresh() }
}
```

**Countdown timer implementation (Claude's Discretion):**
- Use `useEffect` + `setInterval(fn, 1000)` to count down from `expiresAt`
- On timer reaching 0: `setPaymentStep('expired')`
- No auto-polling (simpler, consistent with current "I paid" manual UX)

**"Симулировать оплату" button visibility:**
```typescript
const showSimulate = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true'
// or
const showSimulate = typeof window !== 'undefined' && process.env.NODE_ENV !== 'production'
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `jest.config.ts` (root) |
| Test location | `__tests__/*.test.ts` |
| Quick run command | `npx jest __tests__/monetization-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MON-01 | `SubscriptionPlan` model in schema.prisma | Static file assertion | `npx jest __tests__/monetization-surface.test.ts -t "MON-01"` | Wave 0 |
| MON-01 | `PaymentStatus` enum in schema.prisma | Static file assertion | same | Wave 0 |
| MON-01 | `PlatformPayment` model in schema.prisma | Static file assertion | same | Wave 0 |
| MON-02 | `PLAN_DEFAULT_MAX_RESOURCES` NOT in any TS file | Static file assertion | same | Wave 0 |
| MON-02 | `10 000 ₸` NOT in billing-content.tsx | Static file assertion | same | Wave 0 |
| MON-03 | `app/admin/plans/page.tsx` exists | Static file assertion | same | Wave 0 |
| MON-03 | `updateSubscriptionPlan` in lib/actions/admin-plans.ts | Static file assertion | same | Wave 0 |
| MON-03 | AdminNav includes `/admin/plans` link | Static file assertion | same | Wave 0 |
| MON-04 | `enterprisePlan` prop in BillingContent | Static file assertion | same | Wave 0 |
| MON-04 | slider or range input present in billing-content | Static file assertion | same | Wave 0 |
| MON-05 | `planStatus = PENDING` in initiateSubscriptionPayment or enterprise action | Static file assertion | same | Wave 0 |
| MON-06 | `PlatformPayment` model exists in schema.prisma | Static file assertion (covered MON-01) | same | Wave 0 |
| MON-07 | `lib/platform-payment.ts` exports `createPlatformPayment` | Static file assertion | same | Wave 0 |
| MON-07 | `lib/platform-payment.ts` exports `processPlatformPayment` | Static file assertion | same | Wave 0 |
| MON-07 | `initiateSubscriptionPayment` in billing.ts (not requestProActivation as primary) | Static file assertion | same | Wave 0 |
| MON-08 | `NEXT_PUBLIC_MOCK_PAYMENTS` referenced in billing-content.tsx | Static file assertion | same | Wave 0 |
| MON-08 | `pendingPayment` prop in BillingContent | Static file assertion | same | Wave 0 |
| MON-09 | `app/api/mock-payment/simulate/route.ts` exists | Static file assertion | same | Wave 0 |
| MON-09 | `saas_payment_received` in audit-log.ts AuditEventType | Static file assertion | same | Wave 0 |

### Key Unit Tests (beyond file existence)

```typescript
// In __tests__/monetization-surface.test.ts

// Guard: PLAN_DEFAULT_MAX_RESOURCES removed
it("PLAN_DEFAULT_MAX_RESOURCES must not appear in any TypeScript source file", () => {
  const sourceFiles = [
    'lib/actions/admin.ts',
    'lib/actions/billing.ts',
    'lib/subscription-lifecycle.ts',
  ]
  for (const f of sourceFiles) {
    const content = safeRead(f)
    expect(content).not.toMatch(/PLAN_DEFAULT_MAX_RESOURCES/)
  }
})

// Guard: Hardcoded price removed
it("billing-content.tsx must not contain hardcoded '10 000 ₸' string", () => {
  const content = safeRead('app/dashboard/settings/billing/billing-content.tsx')
  expect(content).not.toMatch(/10 000 ₸/)
})

// Guard: Card number removed
it("billing-content.tsx must not contain the hardcoded card number", () => {
  const content = safeRead('app/dashboard/settings/billing/billing-content.tsx')
  expect(content).not.toMatch(/4400/)
})

// Schema: SubscriptionPlan
it("schema.prisma contains SubscriptionPlan model with required fields", () => {
  const schema = safeRead('prisma/schema.prisma')
  expect(schema).toMatch(/model SubscriptionPlan/)
  expect(schema).toMatch(/priceMonthly\s+Int/)
  expect(schema).toMatch(/pricePerResource\s+Int/)
  expect(schema).toMatch(/plan\s+Plan\s+@unique/)
})

// Schema: PaymentStatus enum
it("schema.prisma contains PaymentStatus enum", () => {
  const schema = safeRead('prisma/schema.prisma')
  expect(schema).toMatch(/enum PaymentStatus/)
  expect(schema).toMatch(/PAID/)
  expect(schema).toMatch(/EXPIRED/)
})

// platform-payment.ts exports
it("lib/platform-payment.ts exports createPlatformPayment and processPlatformPayment", () => {
  const content = safeRead('lib/platform-payment.ts')
  expect(content).toMatch(/export.*createPlatformPayment/)
  expect(content).toMatch(/export.*processPlatformPayment/)
})

// Simulate endpoint
it("app/api/mock-payment/simulate/route.ts exists and uses POST", () => {
  const content = safeRead('app/api/mock-payment/simulate/route.ts')
  expect(content).toMatch(/export.*POST/)
  expect(content).toMatch(/processPlatformPayment/)
})
```

### Sampling Rate

- **Per task commit:** `npx jest __tests__/monetization-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/monetization-surface.test.ts` — covers all MON-01 through MON-09 static assertions
- Framework already installed: Jest 29 + ts-jest (from package.json)
- Config already exists: `jest.config.ts` (confirmed)

---

## Architecture Patterns

### Project Structure for Phase 10 New Files

```
app/
├── admin/
│   └── plans/
│       ├── page.tsx                        # RSC: fetches SubscriptionPlan[]
│       └── plan-editor-client.tsx          # 'use client': inline-edit table
├── api/
│   └── mock-payment/
│       └── simulate/
│           └── route.ts                    # POST: processPlatformPayment()
lib/
├── platform-payment.ts                     # createPlatformPayment, processPlatformPayment
└── actions/
    ├── admin-plans.ts                      # updateSubscriptionPlan() Server Action
    └── billing.ts                          # + initiateSubscriptionPayment() (new export)
prisma/
└── schema.prisma                           # + PaymentStatus enum, SubscriptionPlan, PlatformPayment
```

### Pattern 1: Inline-Edit Table (admin plan editor)

The `PlanEditorClient` follows the pattern from `app/admin/tenants/[tenantId]/send-notification-form.tsx` and `activate-subscription-form.tsx`:

```typescript
'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateSubscriptionPlan } from '@/lib/actions/admin-plans'

export function PlanEditorClient({ plans }: { plans: SubscriptionPlanRow[] }) {
  const [editing, setEditing] = useState<Record<string, Partial<SubscriptionPlanRow>>>({})
  const [isPending, startTransition] = useTransition()

  function handleSave(planId: string) {
    startTransition(async () => {
      const result = await updateSubscriptionPlan(planId, editing[planId] ?? {})
      if (result.error) toast.error(result.error)
      else { toast.success('Тариф обновлён'); setEditing(prev => { const n = {...prev}; delete n[planId]; return n }) }
    })
  }
  // ...
}
```

### Pattern 2: `processPlatformPayment` — Full Logic

```typescript
// lib/platform-payment.ts
export async function processPlatformPayment(paymentId: string): Promise<{
  success: boolean
  alreadyProcessed?: boolean
  error?: string
}> {
  // 1. Atomic optimistic lock — only one concurrent call wins
  const updated = await basePrisma.platformPayment.updateMany({
    where: { id: paymentId, status: 'PENDING', expiresAt: { gt: new Date() } },
    data: { status: 'PAID', paidAt: new Date() },
  })
  if (updated.count === 0) return { success: true, alreadyProcessed: true }

  // 2. Fetch payment details
  const payment = await basePrisma.platformPayment.findUnique({ where: { id: paymentId } })
  if (!payment) return { success: false, error: 'Payment not found' }

  // 3. Activate subscription (same as admin activateSubscription but for any planTarget)
  const planRecord = await basePrisma.subscriptionPlan.findUnique({
    where: { plan: payment.planTarget },
    select: { maxResources: true }
  })
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await basePrisma.$transaction([
    basePrisma.tenant.update({
      where: { id: payment.tenantId },
      data: { plan: payment.planTarget, planStatus: 'ACTIVE', subscriptionExpiresAt: expiresAt, maxResources: planRecord?.maxResources ?? 20 },
    }),
    basePrisma.resource.updateMany({ where: { tenantId: payment.tenantId, isFrozen: true }, data: { isFrozen: false } }),
    basePrisma.service.updateMany({ where: { tenantId: payment.tenantId, isFrozen: true }, data: { isFrozen: false } }),
  ])

  // 4. Audit log
  await createAuditLog(payment.tenantId, 'saas_payment_received', {
    paymentId, amount: payment.amount, plan: payment.planTarget
  })

  // 5. Telegram notification (fire-and-forget)
  const tenant = await basePrisma.tenant.findUnique({ where: { id: payment.tenantId }, select: { name: true } })
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID
  if (adminChatId && tenant) {
    sendTelegramMessage(adminChatId, `💳 <b>Получена оплата подписки ${payment.planTarget}</b>\n🏢 ${tenant.name} — ${payment.amount.toLocaleString('ru-RU')} ₸`).catch(console.error)
  }

  return { success: true }
}
```

### Anti-Patterns to Avoid

- **Do not use `new PrismaClient()` in server components** — the billing page currently does this (`page.tsx:7`). Use `basePrisma` from `@/lib/db` for connection pooling. Fix this in Plan 1 (schema migration plan) or billing refactor plan.
- **Do not call `ensureSuperAdmin()` inside `processPlatformPayment`** — it must work from the webhook route without admin session.
- **Do not use `prisma.subscriptionPlan` before `prisma db push`** — the Prisma Client won't have the type. Always run `prisma db push` + `prisma generate` before the implementation plans.
- **Do not hardcode `maxResources` fallback as the only source** — always attempt DB lookup first; fallback is only for missing seed data.
- **Do not delete `requestProActivation` / `renewSubscription` in Phase 10** — keep as deprecated, delete in a future cleanup phase.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code image for mock | Custom QR encoding | Static SVG placeholder with fake URL text | No QR library needed; placeholder is clearly mock; bundle size stays zero |
| Race condition protection | DB transactions with SELECT FOR UPDATE | `updateMany` with status filter predicate | Simpler, atomic, idiomatic Prisma |
| Countdown timer | Complex interval management | Simple `useEffect` + `setInterval` + `useState(secondsLeft)` | Phase 9 already shipped a countdown in WaitingForPaymentScreen — copy pattern |
| Admin auth in simulate route | Custom session check | `CRON_SECRET` or `MOCK_PAYMENT_SECRET` Bearer header (same as cron pattern) | Consistent with existing auth pattern; no session dependency |
| i18n namespace structure | New translation file format | Add keys to existing `translations` object in `lib/i18n/translations.ts` under `billing` and `admin` sections | Project uses single-file translations; follow the same structure |

---

## Common Pitfalls

### Pitfall 1: Prisma Client Stale Types After Schema Change
**What goes wrong:** After adding `SubscriptionPlan` and `PlatformPayment` to schema, TypeScript still shows `Property 'subscriptionPlan' does not exist on type PrismaClient`.
**Why it happens:** `prisma generate` regenerates the client types. `prisma db push` runs the DDL but `generate` must also run.
**How to avoid:** Run `npx prisma db push && npx prisma generate` before writing any TS code that references the new models. Note in plans that `prisma db push` requires a live DB connection — manual step.
**Warning signs:** TS errors referencing `basePrisma.subscriptionPlan` not existing.

### Pitfall 2: `billing/page.tsx` Uses `new PrismaClient()` (Not `basePrisma`)
**What goes wrong:** Multiple Prisma instances cause connection pool exhaustion in serverless (Vercel).
**Why it happens:** `page.tsx` was written early and uses `new PrismaClient()` directly.
**How to avoid:** Change import to `import { basePrisma } from '@/lib/db'` when refactoring the page.
**Warning signs:** Connection pool errors in production logs.

### Pitfall 3: `BillingContent` Receives `Date` from Server — Serialization Error
**What goes wrong:** `pendingPayment.expiresAt` is a `Date` object from Prisma. Next.js App Router cannot serialize `Date` across the server/client boundary.
**Why it happens:** The billing page is a RSC passing props to a client component. This exact pattern was documented in Phase 5: "Date serialization: server component converts Date to ISO string before passing to ClientsTable to satisfy Next.js App Router constraint."
**How to avoid:** Convert `expiresAt.toISOString()` server-side before passing to `BillingContent`. Use `string` type for `expiresAt` in the client prop type.
**Warning signs:** Next.js serialization error: "Only plain objects can be passed to Client Components from Server Components."

### Pitfall 4: `AuditEventType` Type Error for `saas_payment_received`
**What goes wrong:** `createAuditLog(tenantId, 'saas_payment_received', ...)` throws a TypeScript error because `'saas_payment_received'` is not in the union type.
**Why it happens:** `audit-log.ts` uses a typed union for event types.
**How to avoid:** Add `'saas_payment_received'` to `AuditEventType` union in the same plan that implements `processPlatformPayment`.
**Warning signs:** TS error: Argument of type '"saas_payment_received"' is not assignable to parameter of type 'AuditEventType'.

### Pitfall 5: `priceMonthly = -1` Enterprise Calculation Crash
**What goes wrong:** Enterprise `priceMonthly = -1` sentinel. If the billing page tries to display `priceMonthly.toLocaleString()` without checking the sentinel, it shows `-1 ₸` or crashes.
**Why it happens:** The -1 sentinel means "dynamic price" but is still an integer in the DB.
**How to avoid:** Always check `priceMonthly < 0` before displaying. Pattern: `priceMonthly >= 0 ? `${priceMonthly.toLocaleString()} ₸` : 'Индивидуально'`.
**Warning signs:** `-1 ₸` appearing in UI.

### Pitfall 6: Mock Simulate Endpoint Open Without Auth in Production
**What goes wrong:** `app/api/mock-payment/simulate/route.ts` endpoint is accessible without secret, allowing anyone to activate subscriptions for free.
**Why it happens:** Forgot to add Bearer token check.
**How to avoid:** Always check `CRON_SECRET` or `MOCK_PAYMENT_SECRET` at the top of the route handler, before any business logic. Return 401 if missing/wrong. Also: the `NEXT_PUBLIC_MOCK_PAYMENTS=true` env flag controls UI visibility only — server-side auth is the real protection.
**Warning signs:** Endpoint returning 200 without Authorization header in a test.

### Pitfall 7: Enterprise Plan `activateSubscription` Hardcodes `PRO`
**What goes wrong:** Current `activateSubscription()` in `admin.ts` hardcodes `plan: 'PRO'`. If used directly for Enterprise tenants, their plan is set to PRO instead.
**Why it happens:** `activateSubscription` was built for PRO-only activation (Phase 3).
**How to avoid:** `processPlatformPayment` must NOT call the existing `activateSubscription()` — it must implement the activation logic directly with `payment.planTarget` as the plan value. The `activateSubscription()` function in `admin.ts` should separately be updated to accept `plan` as a parameter for the Super Admin form.

---

## Environment Availability

Step 2.6: No new external dependencies for Phase 10. All functionality is:
- Prisma (already installed, PostgreSQL connection live — confirmed by Phases 1–9 running)
- Next.js Server Actions and API Routes (already in use)
- `lib/telegram.ts` (already in use)
- No new npm packages required (mock QR = SVG placeholder, no QR library)

**Skip condition:** No external dependencies beyond existing project stack.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `PLAN_DEFAULT_MAX_RESOURCES` | DB-backed `SubscriptionPlan.maxResources` | Phase 10 | Admin can change plan limits without code deploy |
| Manual "copy card number" payment UX | Mock QR + auto-activation via webhook | Phase 10 | Tenant sees professional payment UX; ready to swap real provider |
| Fixed plan pricing in source code | Dynamic pricing in DB | Phase 10 | Super Admin can adjust prices without code deploy or redeployment |
| `requestProActivation()` → admin manually approves | `initiateSubscriptionPayment()` → auto-activates on webhook | Phase 10 | Subscription activation no longer requires admin intervention |

**Deprecated in Phase 10:**
- `requestProActivation()` — kept but superseded by `initiateSubscriptionPayment()`
- `renewSubscription()` — kept but superseded by `initiateSubscriptionPayment()`
- Hardcoded `PLAN_DEFAULT_MAX_RESOURCES` constant — deleted

---

## Open Questions

1. **`activateSubscription()` in admin.ts — should it be updated to accept `plan` param or remain PRO-only?**
   - What we know: Currently hardcodes `plan: 'PRO'` (line 150). The admin form always activates PRO.
   - What's unclear: Should the super-admin form gain a plan selector, or remain PRO-only?
   - Recommendation: Keep it PRO-only for now (admin activation form doesn't change). `processPlatformPayment` handles all plan targets. When Enterprise activation is needed by admin, it goes through `updateTenantPlan` which already handles any plan.

2. **Where does the seed script run?**
   - What we know: Phase 4 notes "prisma generate run in executor context; prisma db push is a manual step." There is a `prisma/seed-demo.ts` file.
   - What's unclear: Is there a `prisma/seed.ts`? How is seeding triggered for the plan records?
   - Recommendation: Create `prisma/seed-plans.ts` with the upsert script. Document it as a manual step in the plan: `npx tsx prisma/seed-plans.ts`. Do not add to `package.json prisma.seed` unless the team wants it in the DB push flow.

3. **PlatformPayment on the admin tenant drill-down page — to include or skip?**
   - What we know: CONTEXT.md lists this as Claude's Discretion.
   - What's unclear: Whether the added complexity is worth it in Phase 10.
   - Recommendation: Skip for Phase 10. Add a "Payments" tab to the tenant drill-down as a future enhancement. This avoids complicating the admin tenant page refactor.

---

## Sources

### Primary (HIGH confidence — read directly from source files)
- `prisma/schema.prisma` — full schema, confirmed enums, no PaymentStatus or SubscriptionPlan
- `lib/actions/admin.ts` — full file, 3 PLAN_DEFAULT_MAX_RESOURCES callsites confirmed
- `lib/actions/billing.ts` — full file, requestProActivation + renewSubscription
- `app/dashboard/settings/billing/billing-content.tsx` — full file, two hardcoded prices + card number block
- `app/dashboard/settings/billing/page.tsx` — new PrismaClient() confirmed
- `lib/subscription-lifecycle.ts` — hardcoded maxResources:1 on line 67 confirmed
- `lib/actions/audit-log.ts` — AuditEventType union confirmed, saas_payment_received missing
- `lib/telegram.ts` — sendTelegramMessage signature confirmed
- `app/admin/admin-nav.tsx` — NAV_LINKS array confirmed, CreditCard icon not yet present
- `app/admin/tenants/[tenantId]/page.tsx` — RSC + client component pattern confirmed
- `app/api/cron/subscriptions/route.ts` — CRON_SECRET auth pattern confirmed
- `vercel.json` — 3 cron entries confirmed, no new entry needed
- `app/admin/analytics/page.tsx` — PLAN_MRR hardcoded constant at line 11 confirmed
- `jest.config.ts` — Jest 29 + ts-jest config, testMatch confirmed
- `.planning/config.json` — nyquist_validation: true confirmed

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — `prisma db push` pattern documented as project convention
- `.planning/phases/10-saas-monetization-enterprise-tier-platform-payments/10-CONTEXT.md` — all locked decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — read directly from package.json and source files
- Architecture patterns: HIGH — read directly from existing admin pages and action files
- Pitfalls: HIGH — derived from direct code reading + established project patterns in STATE.md
- Integration risk map: HIGH — all callsites verified by grep; race condition analysis based on code logic

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack; 30-day window)
