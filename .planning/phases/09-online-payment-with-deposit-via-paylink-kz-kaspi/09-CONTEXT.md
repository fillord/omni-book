# Phase 9: Online Payment with Deposit via Paylink.kz (Kaspi) - Context

**Gathered:** 2026-03-30 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Allow tenants to optionally require a deposit from clients when booking online. The booking is created as PENDING, the client is redirected to Paylink.kz (Kaspi) checkout, and upon payment confirmation via webhook the booking becomes CONFIRMED. Unpaid PENDING bookings are auto-cancelled after a configurable timeout via a dedicated cron. Tenant configures the deposit toggle and amount in their billing/settings page.

**Out of scope:**
- Refunds or partial payments
- Multiple payment providers (Paylink.kz / Kaspi only for now)
- Payment history/receipts UI beyond booking status
- Manual payment recording by staff
</domain>

<decisions>
## Implementation Decisions

### D-01: Prisma Schema Extension
- **D-01a:** `Tenant` model gains three fields: `requireDeposit Boolean @default(false)`, `depositAmount Int @default(0)` (tenge tiyn, minor units), `paylinkApiKey String?`
- **D-01b:** `Booking` model gains `paymentExpiresAt DateTime?` — stamped at creation time using tenant's configured timeout (default 30 min). Drives cron query via simple `lte: now` on indexed column.
- **D-01c:** No new `Payment` model. Phase scope is status transitions only — no transaction persistence or refund tracking.

### D-02: Booking Creation Flow
- **D-02a:** `POST /api/bookings/route.ts` conditionally branches: when `tenant.requireDeposit` is true, the booking engine is called with `status: "PENDING"`, `paymentExpiresAt` is stamped, a Paylink checkout URL is requested, and the response shape is `{ booking, checkoutUrl }`.
- **D-02b:** When `requireDeposit` is false, existing flow is unchanged — `status: "CONFIRMED"`, no checkout URL.
- **D-02c:** The `status` field in `lib/booking/engine.ts` becomes a parameter passed from the route handler so the engine remains reusable.

### D-03: Client-Side Redirect
- **D-03a:** `components/booking-form.tsx` — after successful POST, if `data.checkoutUrl` is present, execute `window.location.href = checkoutUrl` instead of showing the success screen.
- **D-03b:** No polling or WebSocket. The redirect is one-way. The client lands on Paylink.kz and the return URL (after payment) goes back to the public booking page or a dedicated `/booking/[id]/status` page showing payment confirmation.

### D-04: Slot Blocking (No change needed)
- **D-04:** PENDING bookings already block slots in `lib/booking/engine.ts` — `status: { in: ["CONFIRMED", "PENDING"] }` is already in the collision check. No code change required.

### D-05: Webhook Handler
- **D-05a:** New route at `app/api/webhooks/paylink/route.ts` (follows existing `app/api/webhooks/meta/route.ts` pattern — one provider per sub-directory).
- **D-05b:** HMAC-SHA256 signature verification using `PAYLINK_WEBHOOK_SECRET` env variable.
- **D-05c:** On successful payment event: find booking by order ID, update `status` to CONFIRMED, clear `paymentExpiresAt`.
- **D-05d:** Idempotent: if booking is already CONFIRMED, return 200 without re-processing.
- **D-05e:** The existing `app/api/webhooks/route.ts` stub remains untouched.

### D-06: Payment Timeout Cron
- **D-06a:** New dedicated route: `app/api/cron/pending-payments/route.ts` (separate from subscriptions cron — different schedule, different concern).
- **D-06b:** New lifecycle function: `lib/payment-lifecycle.ts` → `cancelExpiredPendingBookings()` (mirrors `lib/subscription-lifecycle.ts` pattern).
- **D-06c:** Vercel cron schedule: `*/10 * * * *` (every 10 minutes — project already runs `0,30 * * * *` for reminders, confirming sub-daily crons are available).
- **D-06d:** Protected by same `CRON_SECRET` Bearer header pattern as `app/api/cron/subscriptions/route.ts`.

### D-07: Tenant Configuration UI
- **D-07a:** Deposit toggle and amount fields added to `app/dashboard/settings/billing/billing-content.tsx` as a new "Оплата / Депозит" section.
- **D-07b:** Toggle: `requireDeposit` checkbox/switch. Amount: number input (tenge, converted to tiyn on save). API key field: password-type input for `paylinkApiKey`.
- **D-07c:** New Server Action: `updatePaymentSettings(tenantId, { requireDeposit, depositAmount, paylinkApiKey })` — follows existing `updateBillingSettings` pattern in `lib/actions/`.
- **D-07d:** Show deposit section only if tenant is on PRO or higher plan (gate behind subscription check, same as other premium features).

### D-08: Public Booking UX
- **D-08a:** `components/tenant-public-page.tsx` / `components/booking-form.tsx` — show deposit amount and "оплата обязательна" message near the submit button when tenant has `requireDeposit: true`. Passed as prop from public page data fetch.
- **D-08b:** After redirect back from Paylink (on success/failure), the public booking page or `/manage/[token]` page shows the current booking status clearly.

### D-09: i18n
- New translation keys for: deposit label, "payment required" notice, "awaiting payment" status, "payment expired" cancellation message — in RU/EN/KZ following existing `lib/i18n/translations/` pattern.

### Claude's Discretion
- Exact Paylink.kz API endpoint and payload shape — depends on official API docs (see Needs External Research)
- Return URL strategy after Paylink redirect (back to public page vs. dedicated status page)
- Whether to send a Telegram notification to the tenant when a payment is received
- Exact HMAC signing string construction (depends on Paylink.kz docs)
- Prisma migration name convention
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Booking Creation
- `app/api/bookings/route.ts` — POST handler to extend with conditional payment branch
- `lib/booking/engine.ts` — Core booking engine; `status` must become a parameter

### Cron Lifecycle Pattern
- `app/api/cron/subscriptions/route.ts` — Cron route pattern (CRON_SECRET auth, error handling)
- `lib/subscription-lifecycle.ts` — Lifecycle function pattern to mirror for `cancelExpiredPendingBookings()`
- `vercel.json` — Add new cron entry for `/api/cron/pending-payments`

### Webhook Pattern
- `app/api/webhooks/meta/route.ts` — Provider-per-subdirectory pattern, signature verification approach
- `app/api/webhooks/route.ts` — Existing stub (do not modify)

### Client-Side Booking Form
- `components/booking-form.tsx` — `handleSubmit` submit handler (lines ~423-445) and `SuccessScreen` component
- `components/tenant-public-page.tsx` — Public page entry point; passes tenant data as props

### Tenant Settings
- `app/dashboard/settings/billing/billing-content.tsx` — Billing page to extend with deposit section
- `prisma/schema.prisma` — Tenant and Booking models to extend

### Token Management (reference for /manage/[token] status display)
- `app/manage/[token]/` — Existing token management page to extend with payment status display

### i18n
- `lib/i18n/translations/` — Add new keys in all three locales (RU/EN/KZ)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/booking/engine.ts` — Booking engine with collision detection; already handles PENDING status in slot-blocking query
- `lib/subscription-lifecycle.ts` — Pattern for background lifecycle jobs (find-expired → batch-update → notify)
- `app/api/cron/subscriptions/route.ts` — Cron route boilerplate (Bearer auth, try/catch, JSON response)
- `app/api/webhooks/meta/route.ts` — Webhook route with signature verification pattern
- `lib/telegram.ts` — Telegram notification sender (reusable for payment-received alerts if desired)

### Established Patterns
- **Tenant inline config:** All per-tenant settings are flat fields on the `Tenant` model (no separate settings table). New payment fields follow this pattern.
- **Cron auth:** All cron routes use `Authorization: Bearer ${CRON_SECRET}` header verification.
- **Server Actions:** Tenant mutations use Server Actions in `lib/actions/`. New `updatePaymentSettings` follows same shape.
- **Neumorphism UI:** All new UI surfaces use `var(--neu-bg)`, `.neu-raised` for cards/buttons, `.neu-inset` for inputs.
- **i18n:** All user-visible strings use `useI18n()` / `getServerT()` with RU/EN/KZ keys.

### Integration Points
- `POST /api/bookings` — Conditional branch added here (not in the engine) to keep engine pure
- `billing-content.tsx` — New deposit section rendered after existing subscription info
- `app/api/webhooks/paylink/route.ts` — New webhook route, reads `PAYLINK_WEBHOOK_SECRET` env var
- `vercel.json` — New `crons` entry for pending-payments cancellation job
- `lib/i18n/translations/` — New payment-related keys across all three locale files
</code_context>

<specifics>
## Specific Ideas

- Paylink.kz supports Kaspi payment — this is the primary KZ market payment rail; the integration must support Kaspi QR/redirect flows as handled by Paylink.kz
- Deposit amount stored in **tiyn** (minor units, like tenge cents) in DB — same approach as `service.price` (confirmed in `lib/booking/engine.ts`)
- Payment window default: **30 minutes** — tenant-configurable per PAY-05 (stored via `paymentExpiresAt` at booking creation time)
- The deposit configuration should be gated to PRO+ tenants only (same subscription gating as other premium features)
- `app/api/webhooks/route.ts` has a pre-existing TODO comment explicitly mentioning payments — confirms the architecture was already planned for this
</specifics>

<deferred>
## Deferred Ideas

- Refund flow — separate phase if/when needed
- Payment history / receipt page for clients — backlog
- Multiple payment providers (e.g., Stripe for international clients) — future milestone
- Staff manual payment marking ("mark as paid offline") — backlog
- Partial deposits (e.g., 50% of service price) — backlog

None — analysis stayed within phase scope.
</deferred>

---

*Phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi*
*Context gathered: 2026-03-30*
