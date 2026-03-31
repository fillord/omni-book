# Phase 9: Online Deposit Payments via Kaspi Pay (Direct Invoice) - Research

**Researched:** 2026-03-31
**Domain:** Payment integration (Kaspi Pay direct invoice), Next.js App Router, Prisma, cron lifecycle, webhook pattern
**Confidence:** HIGH (project-internal patterns fully verified; Kaspi API mock — no external API calls required in Phase 9)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Prisma Schema Extension**
- D-01a: `Tenant` model gains: `requireDeposit Boolean @default(false)`, `depositAmount Int @default(0)` (tenge tiyn), `paylinkApiKey String?`
- D-01b: `Booking` model gains `paymentExpiresAt DateTime?` — stamped at creation time; drives cron query via `lte: now` on indexed column
- D-01c: No new `Payment` model — scope is status transitions only

**D-02: Booking Creation Flow**
- D-02a: `POST /api/bookings` conditionally branches on `tenant.requireDeposit` — when true: `status: "PENDING"`, stamp `paymentExpiresAt`, request checkout/invoice, return `{ booking, checkoutUrl or invoiceCreated: true }`
- D-02b: When `requireDeposit` is false, existing flow unchanged
- D-02c: `status` field in `lib/booking/engine.ts` becomes a parameter from the route handler — engine stays pure

**D-03 DIVERGENCE NOTE:** CONTEXT.md (D-03) documents a Paylink.kz redirect flow (`window.location.href = checkoutUrl`). ROADMAP.md PAY-02/PAY-03/PAY-04 supersede this with **Kaspi direct invoice model** — no redirect. The Kaspi adapter pushes an invoice to the client's Kaspi mobile app; the booking form shows a waiting screen. The planner must follow PAY-02/PAY-03/PAY-04 (direct invoice / no redirect).

**D-04: Slot Blocking** — PENDING already in collision query; no code change needed

**D-05: Webhook Handler**
- D-05a: New route `app/api/webhooks/kaspi/route.ts` (per PAY-05; provider sub-directory pattern)
- D-05b: HMAC-SHA256 signature verification using env var (mock for Phase 9)
- D-05c: On payment event: find booking by invoiceId, update to CONFIRMED, clear `paymentExpiresAt`
- D-05d: Idempotent — already CONFIRMED returns 200 without re-processing

**D-06: Payment Timeout Cron**
- D-06a: New route: `app/api/cron/pending-payments/route.ts`
- D-06b: New lifecycle function: `lib/payment-lifecycle.ts` → `cancelExpiredPendingBookings()`
- D-06c: Vercel cron schedule: `*/5 * * * *` (per PAY-06) or `*/10 * * * *` per CONTEXT.md — PAY-06 says `*/5`, use that
- D-06d: Protected by same `CRON_SECRET` Bearer header pattern

**D-07: Tenant Configuration UI**
- D-07a: Deposit settings in `app/dashboard/settings/billing/billing-content.tsx` as new "Оплата / Депозит" section
- D-07b: Toggle `requireDeposit`, amount (tenge → tiyn on save), `kaspiMerchantId` + `kaspiApiKey` fields (per PAY-01)
- D-07c: New Server Action `updatePaymentSettings(tenantId, { requireDeposit, depositAmount, kaspiMerchantId, kaspiApiKey })`
- D-07d: PRO+ gate

**D-08: Public Booking UX** — deposit amount + "оплата обязательна" near submit; passed as prop

**D-09: i18n** — New keys in RU/EN/KZ

### Claude's Discretion
- Exact Kaspi Pay API endpoint and payload shape (mock implementations only in Phase 9 — no real API calls needed)
- Return URL strategy (not relevant for direct invoice model — client pays inside Kaspi app)
- Whether to send Telegram notification to tenant when payment received
- Exact HMAC signing string construction (mock for Phase 9)
- Prisma migration name convention

### Deferred Ideas (OUT OF SCOPE)
- Refund flow
- Payment history / receipt page
- Multiple payment providers
- Staff manual payment marking ("mark as paid offline")
- Partial deposits
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Tenant deposit configuration — `requireDeposit`, `depositAmount` (tiyn), `kaspiMerchantId?`, `kaspiApiKey?` on Tenant model; billing/settings page PRO+ gate | Prisma flat-fields pattern confirmed. Billing page extension pattern confirmed. |
| PAY-02 | Kaspi adapter — `lib/payments/kaspi.ts` with mock `createKaspiInvoice()` and `verifyKaspiWebhook()` | New `lib/payments/` directory. Mock pattern is straightforward — no external deps needed Phase 9. |
| PAY-03 | Booking creation PENDING + invoice push — `paymentInvoiceId` and `paymentExpiresAt` on Booking, response `{ booking, invoiceCreated: true }` | Route conditional branch pattern documented. Booking model extension confirmed. |
| PAY-04 | Waiting-for-payment UI — Neumorphic screen with countdown timer, no redirect | booking-form.tsx SuccessScreen pattern to parallel. useState + setInterval for countdown. |
| PAY-05 | Kaspi webhook handler — POST /api/webhooks/kaspi, mock signature verify, CONFIRMED transition, email + Telegram | Webhook sub-directory pattern confirmed from meta/route.ts. |
| PAY-06 | Payment timeout cron — `*/5 * * * *`, cancels PENDING where `paymentExpiresAt < now` | Cron pattern confirmed from subscriptions/route.ts + lifecycle.ts. GET handler (Vercel cron constraint). |
| PAY-07 | Slot blocking for PENDING — already implemented | Verified in engine.ts: `status: { in: ["CONFIRMED", "PENDING"] }` already in collision check. No code change. |
| PAY-08 | Neumorphism design adherence | All patterns documented in project STATE.md and confirmed in existing components. |
</phase_requirements>

---

## Summary

Phase 9 adds Kaspi Pay direct invoice payment to the public booking flow. When a tenant enables the deposit requirement, the booking API creates a PENDING booking, calls the Kaspi adapter (mock in Phase 9) to push an invoice to the client's Kaspi mobile app, and returns `invoiceCreated: true`. The booking form replaces the success screen with a Neumorphic "waiting for payment" screen showing a countdown. A Kaspi webhook handler confirms the payment by transitioning the booking to CONFIRMED. A new cron job auto-cancels PENDING bookings whose `paymentExpiresAt` has passed.

All integration patterns are well-established in the codebase: the lifecycle function pattern (`lib/subscription-lifecycle.ts`), the cron route pattern (`app/api/cron/subscriptions/route.ts`), the webhook sub-directory pattern (`app/api/webhooks/meta/route.ts`), and the flat-field tenant settings pattern. This phase introduces no new architectural concepts — it applies existing patterns to a new domain.

The Kaspi adapter ships as a **mock** in Phase 9. `createKaspiInvoice()` returns a synthetic invoice ID and logs "would push to Kaspi"; `verifyKaspiWebhook()` accepts any payload. This makes Phase 9 fully implementable without real Kaspi credentials. Real API wiring is deferred to Phase 9b/10.

**Primary recommendation:** Implement mock adapter first, wire the route conditional branch, wire the webhook handler for CONFIRMED transition, add the countdown UI, then add the cron. Test each layer with Jest static-assertion tests following the project's established `fs.readFileSync + regex` pattern.

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | existing | Schema extension (Tenant + Booking fields), DB queries | Already project ORM |
| Next.js App Router | existing | Route handlers (cron, webhook, bookings) | Already project framework |
| zod | existing | Input validation in route handlers | Already in bookings/route.ts |
| crypto (Node built-in) | built-in | HMAC-SHA256 signature verification in webhook | Built-in, no install needed |
| date-fns | existing | Date arithmetic for `paymentExpiresAt` calculation | Already imported in bookings/route.ts |

### New (Phase 9 specific)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | Phase 9 ships mock only — no Kaspi SDK exists | When real API is wired (Phase 9b) |

**Installation:** No new packages required. Phase 9 uses only existing dependencies.

**Version verification:** All packages are pre-installed in the project.

---

## Architecture Patterns

### Existing Patterns to Follow Precisely

**Pattern 1: Lifecycle Function**
```typescript
// Source: lib/subscription-lifecycle.ts — the exact model to mirror
export async function cancelExpiredPendingBookings(): Promise<{ cancelled: number }> {
  const now = new Date()
  // find all PENDING bookings where paymentExpiresAt <= now
  const result = await basePrisma.booking.updateMany({
    where: {
      status: 'PENDING',
      paymentExpiresAt: { lte: now },
    },
    data: { status: 'CANCELLED' },
  })
  return { cancelled: result.count }
}
```
Key: uses `basePrisma`, returns a typed result object, no external side-effects.

**Pattern 2: Cron Route (GET handler — Vercel cron constraint)**
```typescript
// Source: app/api/cron/subscriptions/route.ts — exact pattern
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await cancelExpiredPendingBookings()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Pending-payments cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```
CRITICAL: Vercel Cron jobs call GET, not POST. Confirmed in subscriptions/route.ts.

**Pattern 3: Webhook Route**
```typescript
// Source: app/api/webhooks/meta/route.ts — provider sub-directory pattern
// New file: app/api/webhooks/kaspi/route.ts
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-kaspi-signature') ?? ''
  if (!verifyKaspiWebhook({ rawBody, signature })) {
    return new NextResponse(null, { status: 403 })
  }
  const payload = JSON.parse(rawBody)
  // ... transition booking to CONFIRMED
  return new NextResponse(null, { status: 200 })
}
```

**Pattern 4: Booking Route Conditional Branch**
The route handler (not the engine) should branch on `tenant.requireDeposit`. The engine receives `status` as a parameter so it stays pure:
```typescript
// In app/api/bookings/route.ts POST handler
const tenant = await resolveTenant(req) // already done
// After validation:
const requireDeposit = tenant.requireDeposit ?? false
const bookingStatus = requireDeposit ? 'PENDING' : 'CONFIRMED'
const paymentExpiresAt = requireDeposit
  ? new Date(Date.now() + 10 * 60 * 1000) // 10 minutes per PAY-06
  : null

const booking = await createBooking({ ...params, status: bookingStatus, paymentExpiresAt })

if (requireDeposit) {
  const invoice = await createKaspiInvoice(
    booking.guestPhone!, booking.depositAmount, booking.id, tenantKeys
  )
  return NextResponse.json({ booking, invoiceCreated: true, invoiceId: invoice.id }, { status: 201 })
}
// existing flow:
return NextResponse.json({ booking }, { status: 201 })
```

**Pattern 5: engine.ts status parameter**
Current `createBooking` hardcodes `status: "CONFIRMED"`. Phase 9 adds an optional `status` and `paymentExpiresAt` parameter:
```typescript
// In lib/booking/engine.ts CreateBookingParams interface
export interface CreateBookingParams {
  // ... existing fields ...
  status?: BookingStatus         // defaults to 'CONFIRMED'
  paymentExpiresAt?: Date | null // stamped only when PENDING
  paymentInvoiceId?: string | null
}
```
The engine passes these through to `tx.booking.create`. This keeps the route handler in charge of the decision.

**Pattern 6: Kaspi Adapter Mock**
```typescript
// lib/payments/kaspi.ts — new file, mock implementation
export interface KaspiInvoiceResult {
  invoiceId: string
  status: 'created' | 'error'
}

export async function createKaspiInvoice(
  phone: string,
  amount: number,
  bookingId: string,
  tenantKeys: { kaspiMerchantId?: string | null; kaspiApiKey?: string | null }
): Promise<KaspiInvoiceResult> {
  // Phase 9: mock implementation — logs intent, returns synthetic invoiceId
  console.log(`[Kaspi Mock] Would create invoice: phone=${phone} amount=${amount} bookingId=${bookingId}`)
  return { invoiceId: `mock-inv-${bookingId}`, status: 'created' }
}

export function verifyKaspiWebhook(payload: { rawBody: string; signature: string }): boolean {
  // Phase 9: mock — accepts all webhooks (no real signature check)
  // Phase 9b: real HMAC-SHA256 verification against KASPI_WEBHOOK_SECRET
  console.log('[Kaspi Mock] Webhook received, skipping signature verification')
  return true
}
```

**Pattern 7: Waiting-for-Payment UI (booking-form.tsx)**
The booking form has an established state machine: step → successId triggers `SuccessScreen`. Phase 9 adds a parallel state:
- `pendingPaymentId: string | null` — set when `data.invoiceCreated === true`
- When `pendingPaymentId` is set, render `WaitingForPaymentScreen` instead of (or before) `SuccessScreen`
- WaitingForPaymentScreen: countdown timer via `useState` + `useEffect` + `setInterval`, Neumorphic card
- On countdown reaching zero: show "Время вышло. Ваша запись отменена." message, offer to re-book
- No polling, no WebSocket — pure client-side countdown

**Pattern 8: vercel.json Cron Entry**
```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0,30 * * * *" },
    { "path": "/api/cron/subscriptions", "schedule": "0 2 * * *" },
    { "path": "/api/cron/pending-payments", "schedule": "*/5 * * * *" }
  ]
}
```
Note: Vercel free tier supports up to 2 cron jobs. The project already has 2. Adding a third may require a paid Vercel plan. The planner should flag this as a deployment consideration.

### Recommended Project Structure (new files)

```
lib/
└── payments/
    └── kaspi.ts              # Kaspi adapter (mock implementation)
lib/
└── payment-lifecycle.ts      # cancelExpiredPendingBookings()

app/api/
├── bookings/route.ts         # EXTEND — conditional branch + invoice push
├── cron/
│   └── pending-payments/
│       └── route.ts          # NEW — GET handler, cron auth
└── webhooks/
    └── kaspi/
        └── route.ts          # NEW — POST webhook handler

app/dashboard/settings/billing/
└── billing-content.tsx       # EXTEND — deposit section (PRO+ gated)

components/
└── booking-form.tsx          # EXTEND — WaitingForPaymentScreen + pendingPaymentId state
```

### Anti-Patterns to Avoid

- **Putting payment branching logic inside `lib/booking/engine.ts`:** The engine is a pure booking validator/creator. Payment is a route-handler concern. Branch in the route, pass `status` as a param to the engine.
- **Using POST for cron routes:** Vercel Cron calls GET. Using POST will cause cron to fail silently (404 from Next.js router). Confirmed from existing `subscriptions/route.ts`.
- **Reading rawBody after calling `request.json()`:** Node.js request body is a stream — can only be consumed once. For webhook signature verification, use `request.text()` first, then `JSON.parse(rawBody)`.
- **Skipping idempotency on the webhook:** Kaspi may deliver a webhook more than once. Check `booking.status === 'CONFIRMED'` before updating; return 200 without re-processing.
- **Storing tiyn incorrectly:** `depositAmount` is stored in tiyn (minor units) in DB, same as `service.price`. Convert tenge → tiyn on save in the Server Action (`amount * 100`). Display tiyn → tenge in UI (`amount / 100`).
- **Countdown UI blocking the success path:** If `requireDeposit` is false, `invoiceCreated` will be absent/false — the existing success screen must still render correctly. Guard with `data.invoiceCreated === true` before showing waiting screen.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC-SHA256 signature | Custom hash function | `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')` | Built-in Node.js, battle-tested |
| Countdown timer | Complex custom hook | `useState` + `useEffect` + `setInterval` | 10-15 lines, no library needed for a simple countdown |
| Batch update for expired bookings | Row-by-row loop | `prisma.booking.updateMany({ where: { status: 'PENDING', paymentExpiresAt: { lte: now } } })` | Single atomic DB call, correct |
| Payment state machine | Complex state | Simple `pendingPaymentId` state + conditional render in `booking-form.tsx` | UI is simple: waiting screen vs success screen |

---

## Common Pitfalls

### Pitfall 1: Schema Fields Missing Index on `paymentExpiresAt`
**What goes wrong:** Cron query scans entire bookings table for `paymentExpiresAt < now` without index.
**Why it happens:** Prisma `db push` doesn't auto-create indexes unless `@@index` is declared.
**How to avoid:** Add `@@index([status, paymentExpiresAt])` to the Booking model in schema.prisma.
**Warning signs:** Slow cron execution on tables with many bookings.

### Pitfall 2: Vercel Cron Limit on Free Tier
**What goes wrong:** Third cron job in vercel.json silently fails to register — Vercel free tier allows only 2 cron jobs.
**Why it happens:** Vercel Hobby/Free plan restriction.
**How to avoid:** Document this in the plan. Options: (a) use Vercel Pro plan, (b) combine pending-payments check into the existing subscriptions cron route (different concern but same route), (c) accept manual triggering for now.
**Warning signs:** No PENDING bookings get auto-cancelled after deployment.

### Pitfall 3: `paymentInvoiceId` Not on Booking Model
**What goes wrong:** Webhook handler can't find booking by `invoiceId` — no matching field.
**Why it happens:** PAY-03 specifies `paymentInvoiceId` on Booking, but CONTEXT.md D-01c only mentions `paymentExpiresAt`. Both are needed.
**How to avoid:** Add both `paymentInvoiceId String?` and `paymentExpiresAt DateTime?` to Booking model in schema extension.
**Warning signs:** Webhook handler throws "booking not found" even with valid invoice IDs.

### Pitfall 4: Booking Form Props Not Extended
**What goes wrong:** `<BookingForm>` doesn't receive `requireDeposit` or `depositAmount` — UI can't show deposit notice or switch to waiting screen.
**Why it happens:** `tenant-public-page.tsx` fetches tenant but doesn't pass new fields as props.
**How to avoid:** Update `Props` interface in `booking-form.tsx` to include `requireDeposit?: boolean` and `depositAmount?: number`. Pass from `tenant-public-page.tsx`.
**Warning signs:** Deposit amount notice never appears even when tenant has `requireDeposit: true`.

### Pitfall 5: Cron Secret Not Set in Dev/Test
**What goes wrong:** Cron route rejects all calls during local testing because `CRON_SECRET` is not set.
**Why it happens:** The guard reads `process.env.CRON_SECRET` — if undefined, it skips auth check (this is intentional per existing pattern: `if (cronSecret && authHeader !== ...)`). So it actually works without `CRON_SECRET` set — this is the correct behavior.
**How to avoid:** Understand the guard: when `CRON_SECRET` is not set, all calls pass. Set `CRON_SECRET` in production. Do NOT add a mandatory auth check that blocks when the variable is missing.

### Pitfall 6: CONTEXT.md vs ROADMAP.md Payment Model Divergence
**What goes wrong:** Planner implements Paylink.kz redirect flow (D-03 from CONTEXT.md) instead of Kaspi direct invoice (PAY-02/PAY-03/PAY-04 from ROADMAP.md).
**Why it happens:** CONTEXT.md was drafted before the requirements were finalized. ROADMAP.md requirements supersede CONTEXT.md D-03.
**How to avoid:** Follow PAY-02/PAY-03/PAY-04. No redirect. Kaspi adapter pushes invoice to client's phone. Booking form shows countdown. `data.checkoutUrl` is NOT in the response — use `data.invoiceCreated: true`.
**Warning signs:** Planner tasks reference `window.location.href` or `checkoutUrl`.

### Pitfall 7: Schema Extension Uses Wrong Field Names
**What goes wrong:** PAY-01 specifies `kaspiMerchantId` and `kaspiApiKey`. CONTEXT.md D-01a uses `paylinkApiKey` (Paylink model). Phase 9 must use Kaspi-namespaced fields.
**Why it happens:** CONTEXT.md was written under the older Paylink model.
**How to avoid:** Add `kaspiMerchantId String?` and `kaspiApiKey String?` to Tenant (not `paylinkApiKey`).

---

## Code Examples

Verified patterns from canonical project files:

### Booking Engine Status Parameter Extension
```typescript
// lib/booking/engine.ts — extend CreateBookingParams
export interface CreateBookingParams {
  tenantId: string
  resourceId: string
  serviceId: string
  startsAt: string
  guestName: string
  guestPhone: string
  guestEmail?: string | null
  // Phase 9 additions:
  status?: 'CONFIRMED' | 'PENDING'   // defaults to CONFIRMED
  paymentExpiresAt?: Date | null
  paymentInvoiceId?: string | null
}

// In tx.booking.create data:
data: {
  tenantId,
  resourceId,
  serviceId,
  guestName: guestName.trim(),
  guestPhone: normalizedPhone,
  guestEmail: guestEmail?.trim() || null,
  startsAt: startsAtDate,
  endsAt: endsAtDate,
  status: params.status ?? 'CONFIRMED',   // Phase 9
  paymentExpiresAt: params.paymentExpiresAt ?? null,  // Phase 9
  paymentInvoiceId: params.paymentInvoiceId ?? null,  // Phase 9
  manageToken,
}
```

### Tenant Schema Fields
```prisma
// prisma/schema.prisma — Tenant model additions
model Tenant {
  // ... existing fields ...
  requireDeposit   Boolean  @default(false)
  depositAmount    Int      @default(0)     // tiyn (minor units)
  kaspiMerchantId  String?
  kaspiApiKey      String?
  // ... existing relations ...
}
```

### Booking Schema Fields
```prisma
// prisma/schema.prisma — Booking model additions
model Booking {
  // ... existing fields ...
  paymentInvoiceId  String?
  paymentExpiresAt  DateTime?
  // ... existing indexes ...
  @@index([status, paymentExpiresAt])   // for cron query efficiency
}
```

### Server Action Pattern (lib/actions/billing.ts shape)
```typescript
// lib/actions/payment-settings.ts — new file
'use server'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { basePrisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updatePaymentSettings(data: {
  requireDeposit: boolean
  depositAmount: number   // tenge (UI value — convert to tiyn here)
  kaspiMerchantId?: string
  kaspiApiKey?: string
}) {
  const session = await requireAuth()
  requireRole(session, ['OWNER'])
  const tenantId = session?.user?.tenantId
  if (!tenantId) return { error: 'Tenant ID not found' }

  // Gate: PRO+ only
  const tenant = await basePrisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true } })
  if (tenant?.plan === 'FREE') return { error: 'Требуется план PRO' }

  await basePrisma.tenant.update({
    where: { id: tenantId },
    data: {
      requireDeposit: data.requireDeposit,
      depositAmount: Math.round(data.depositAmount * 100),  // tenge → tiyn
      kaspiMerchantId: data.kaspiMerchantId || null,
      kaspiApiKey: data.kaspiApiKey || null,
    },
  })

  revalidatePath('/dashboard/settings/billing')
  return { success: true }
}
```

### i18n Keys to Add (booking section additions)
```typescript
// Pattern: add to existing 'booking' section in all three locales
// RU additions:
depositRequired: 'Требуется депозит',
depositAmount:   'Сумма депозита',
depositNotice:   'Для подтверждения записи необходима оплата депозита {amount}.',
waitingForPayment: 'Ожидание оплаты',
waitingInstructions: 'Мы выставили счет в ваше приложение Kaspi. Оплатите в течение 10 минут.',
paymentCountdown: 'Осталось времени: {time}',
paymentExpired:  'Время ожидания оплаты истекло. Запись отменена.',
paymentExpiredSub: 'Запись автоматически отменена. Вы можете записаться снова.',

// billing section additions:
depositSectionTitle: 'Оплата / Депозит',
requireDepositLabel: 'Требовать депозит при онлайн-записи',
depositAmountLabel:  'Размер депозита (тенге)',
kaspiMerchantIdLabel: 'Kaspi Merchant ID',
kaspiApiKeyLabel:    'Kaspi API Key',
depositProRequired:  'Настройка депозита доступна только на тарифе PRO.',
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `status: "CONFIRMED"` in engine | Status as parameter from route handler | Phase 9 | Engine stays pure — no payment logic bleeds in |
| Single notification path on booking | Conditional notifications (skip for PENDING — notify on CONFIRMED via webhook) | Phase 9 | Email/Telegram sent only after payment confirmed |
| No cron for bookings | Dedicated pending-payments cron | Phase 9 | PENDING bookings auto-expire cleanly |

**No deprecated patterns introduced.** All additions follow established project conventions.

---

## Open Questions

1. **Vercel Cron Limit**
   - What we know: Free/Hobby tier allows 2 cron jobs; project already has 2 (`/api/cron/reminders`, `/api/cron/subscriptions`)
   - What's unclear: Whether project is on paid Vercel plan
   - Recommendation: Planner should add a task to verify Vercel plan tier before adding third cron. Fallback: fold pending-payment check into subscriptions cron route (acceptable given different schedule would still be `*/5 * * * *` — this is a schedule clash concern). Or accept that pending-payment cron is added but billing is addressed separately.

2. **Countdown Duration: 10 min vs 30 min**
   - What we know: PAY-04/PAY-06 message says "10 minutes" and cron is `*/5 * * * *`; CONTEXT.md D-01b says "30 minutes default"
   - What's unclear: Which timeout to implement
   - Recommendation: PAY-04 UI copy explicitly says "10 минут" and the `*/5` cron implies 10-min window. Use 10 minutes. `paymentExpiresAt = now + 10 * 60 * 1000`.

3. **Telegram notification on payment received**
   - What we know: CONTEXT.md marks this as Claude's Discretion; email + Telegram is confirmed for PAY-05
   - Recommendation: PAY-05 explicitly says "triggers email + Telegram confirmation notifications" on CONFIRMED — this means the standard booking confirmation notifications fire from the webhook handler, including Telegram to the tenant owner. Include this.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js `crypto` | HMAC-SHA256 in webhook | Built-in | N/A | — |
| Prisma CLI | Schema migration (`prisma db push`) | Manual step (not run by executor) | existing | — |
| `CRON_SECRET` env var | Cron route auth | Available (existing pattern) | — | Auth skipped when not set (safe for dev) |
| `KASPI_WEBHOOK_SECRET` env var | Webhook signature (mock Phase 9) | Not set yet — mock skips check | — | Mock accepts all |
| `ADMIN_TELEGRAM_CHAT_ID` env var | Telegram notifications from webhook | Existing (used in bookings/route.ts) | — | Notification skipped if not set |

**Missing dependencies with no fallback:** None — Phase 9 ships mock implementations for all Kaspi-specific functionality.

**Missing dependencies with fallback:** `KASPI_WEBHOOK_SECRET` — mock implementation bypasses check.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/payment-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-01 | Tenant model has requireDeposit, depositAmount, kaspiMerchantId, kaspiApiKey | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-01"` | ❌ Wave 0 |
| PAY-02 | lib/payments/kaspi.ts exports createKaspiInvoice and verifyKaspiWebhook | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-02"` | ❌ Wave 0 |
| PAY-03 | Booking model has paymentInvoiceId and paymentExpiresAt; bookings route returns invoiceCreated | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-03"` | ❌ Wave 0 |
| PAY-04 | booking-form.tsx contains WaitingForPayment screen with countdown | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-04"` | ❌ Wave 0 |
| PAY-05 | app/api/webhooks/kaspi/route.ts exists with POST handler | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-05"` | ❌ Wave 0 |
| PAY-06 | app/api/cron/pending-payments/route.ts exists; vercel.json has pending-payments cron | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-06"` | ❌ Wave 0 |
| PAY-07 | Booking engine collision check includes PENDING status | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-07"` | ❌ Wave 0 (verify existing code) |
| PAY-08 | All new UI files contain var(--neu-bg), .neu-raised, .neu-inset | static assertion | `npx jest __tests__/payment-surface.test.ts -t "PAY-08"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/payment-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/payment-surface.test.ts` — covers PAY-01 through PAY-08 static assertions
- [ ] No new fixtures needed — project uses `safeRead` pattern (no setup required)

---

## Sources

### Primary (HIGH confidence)
- `app/api/cron/subscriptions/route.ts` — Cron GET route pattern, CRON_SECRET auth
- `lib/subscription-lifecycle.ts` — Lifecycle function pattern (find-expired → updateMany → return count)
- `lib/booking/engine.ts` — Engine structure, collision query with PENDING, createBooking signature
- `app/api/bookings/route.ts` — Route handler structure, resolveTenant, notification fire-and-forget
- `app/api/webhooks/meta/route.ts` — Webhook sub-directory pattern
- `prisma/schema.prisma` — Tenant and Booking model structure, confirmed PENDING in BookingStatus enum
- `components/booking-form.tsx` — handleSubmit pattern (lines 415-446), SuccessScreen pattern
- `app/dashboard/settings/billing/billing-content.tsx` — Billing page component structure to extend
- `lib/actions/billing.ts` — Server Action pattern (requireAuth, requireRole, revalidatePath)
- `vercel.json` — Confirmed existing cron entries; third entry structure documented

### Secondary (MEDIUM confidence)
- `lib/i18n/translations.ts` — i18n structure and key naming conventions confirmed from source read
- `.planning/STATE.md` — Accumulated project decisions on Neumorphism patterns, cron GET constraint, prisma db push workflow

### Tertiary (LOW confidence)
- Kaspi Pay / Paylink.kz direct API documentation — not researched (mock only in Phase 9; no external verification needed)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries pre-existing, verified in source files
- Architecture: HIGH — patterns verified directly in canonical reference files; no assumptions
- Pitfalls: HIGH — most derived from direct code inspection (engine.ts collision query, vercel.json cron count, schema field names)
- Kaspi API specifics: N/A — mock only in Phase 9

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (stable patterns; Kaspi API details remain deferred to Phase 9b)
