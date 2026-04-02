# Phase 10: SaaS Monetization, Enterprise Tier & Platform Payments — Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the platform's own monetization layer in three interconnected areas:

1. **Dynamic Pricing Config** — Move hardcoded plan prices and limits (currently scattered across `lib/actions/admin.ts` and `billing-content.tsx`) into a `SubscriptionPlan` DB model. Super Admin edits plan data at `/admin/plans` without code deploys.

2. **Enterprise Tier & Calculator** — Wire the existing `ENTERPRISE` Plan enum value into a fully functional tier with dynamic pricing (no fixed price). Build an interactive Neumorphic pricing calculator on the billing page: a slider for resource count shows a calculated monthly/yearly price in real-time.

3. **Mock Platform Payment Flow** — Replace the current "copy bank card number → click 'I paid' → wait for admin" with a proper payment UX using a mock Kaspi QR / Paylink-style checkout adapter. When a tenant clicks Upgrade/Renew: generate a `PlatformPayment` record, show a waiting modal with a mock QR code, and simulate a webhook that auto-activates the subscription. This mock adapter is designed to be swapped for a real Paylink.kz integration once the legal entity (ИП) is registered.

**Out of scope:**
- Client-to-tenant payment flows (those live in Phase 9 — `kaspiMerchantId`/`kaspiApiKey` on the Tenant model)
- Actual Paylink.kz API integration (legal entity pending)
- Refunds or billing history pages
- Per-feature gating changes beyond what already exists
</domain>

<decisions>
## Implementation Decisions

### D-01: SubscriptionPlan Model
- **D-01a:** New Prisma model `SubscriptionPlan` with fields: `id String @id`, `plan Plan @unique` (references existing `Plan` enum: FREE/PRO/ENTERPRISE), `displayName String`, `maxResources Int`, `priceMonthly Int` (KZT, 0 = free, -1 = dynamic/enterprise), `priceYearly Int` (-1 = dynamic), `pricePerResource Int @default(0)` (used for Enterprise dynamic calc), `isActive Boolean @default(true)`, `features String[]` (marketing bullet points).
- **D-01b:** Seed migration: create three initial rows matching current hardcoded values — FREE (0 KZT, 1 resource), PRO (10,000 KZT/month, 20 resources), ENTERPRISE (-1 dynamic, 100 resources, pricePerResource = 1000 KZT).
- **D-01c:** `PLAN_DEFAULT_MAX_RESOURCES` in `lib/actions/admin.ts` is **removed**. Admin plan actions (`updateTenantPlan`, `activateSubscription`) fetch `maxResources` from `SubscriptionPlan` DB record instead.
- **D-01d:** `billing-content.tsx` hardcoded `10 000 ₸` price is **removed**. Price fetched from `SubscriptionPlan.priceMonthly` server-side and passed as prop.

### D-02: Super Admin Plan Editor
- **D-02a:** New page: `app/admin/plans/page.tsx` — server component that fetches all `SubscriptionPlan` rows and renders `PlanEditorClient`.
- **D-02b:** New component: `app/admin/plans/plan-editor-client.tsx` — client component with an inline-edit table. Each row: plan name badge, editable `displayName`, editable `maxResources`, editable `priceMonthly`, editable `pricePerResource` (for Enterprise). Save per-row via Server Action.
- **D-02c:** New Server Action: `lib/actions/admin-plans.ts` → `updateSubscriptionPlan(planId, data)` — `ensureSuperAdmin()` guard, `basePrisma.subscriptionPlan.update(...)`, `revalidatePath('/admin/plans')`.
- **D-02d:** Add "Тарифы" link to the existing admin sidebar (`app/admin/layout.tsx` or wherever the sidebar nav lives).

### D-03: Enterprise Tier — Dynamic Pricing Calculator
- **D-03a:** On the billing page, when `plan === 'ENTERPRISE'` OR when the tenant clicks "Learn about Enterprise": show a Neumorphic card with an interactive slider.
- **D-03b:** Slider range: 1–200 resources. Real-time formula: `monthly = SubscriptionPlan.priceMonthly (base) + slider * SubscriptionPlan.pricePerResource`. Yearly = monthly * 10 (2 months free). Display both figures.
- **D-03c:** The `BillingContent` component receives `enterprisePlan: { priceMonthly, pricePerResource }` as a prop fetched server-side from `SubscriptionPlan` where `plan = ENTERPRISE`.
- **D-03d:** "Request Enterprise" CTA sends a Telegram notification to admin with the selected resource count and calculated price — uses `lib/telegram.ts`. No immediate subscription change; sets `planStatus = PENDING`.

### D-04: PlatformPayment Model
- **D-04a:** New Prisma model `PlatformPayment` with fields: `id String @id @default(cuid())`, `tenantId String` (FK → Tenant), `amount Int` (KZT), `planTarget Plan` (the plan being purchased), `status PaymentStatus @default(PENDING)` (new enum: PENDING, PAID, FAILED, EXPIRED), `mockQrCode String?` (base64 or placeholder URL), `mockPaylink String?`, `expiresAt DateTime`, `paidAt DateTime?`, `createdAt DateTime @default(now())`.
- **D-04b:** New enum `PaymentStatus` added to `schema.prisma`.

### D-05: Mock Payment Adapter
- **D-05a:** New file: `lib/platform-payment.ts` — functions: `createPlatformPayment(tenantId, plan, amount)` → creates `PlatformPayment` record, generates a mock QR placeholder (SVG or static image URL), returns `{ paymentId, mockQrCode, mockPaylink }`. `mockPaylink` = `https://mock-kaspi.local/pay?id={paymentId}` (clearly fake, never opened).
- **D-05b:** New Server Action: `lib/actions/billing.ts` → `initiateSubscriptionPayment()` — replaces `requestProActivation()` as the primary upgrade action. Calls `createPlatformPayment`, returns `{ paymentId, mockQrCode, amount }` to the client. Sets `planStatus = PENDING` on tenant.
- **D-05c:** The existing `requestProActivation()` and `renewSubscription()` actions in `billing.ts` are **kept** but deprecated — `initiateSubscriptionPayment()` is the new path. The old "I paid" dialog is replaced.

### D-06: Waiting-for-Payment Modal
- **D-06a:** In `billing-content.tsx`, replace the current manual-transfer Dialog with a two-step flow:
  - **Step 1 — Initiate:** Button "Оплатить через Kaspi" → calls `initiateSubscriptionPayment()` → transitions modal to Step 2.
  - **Step 2 — Waiting:** Shows mock QR image (`mockQrCode`), amount, a countdown timer (countdown from `expiresAt`), and a "Симулировать оплату" button (for dev/demo — calls the simulate endpoint).
- **D-06b:** "Симулировать оплату" button is shown only in `NODE_ENV !== 'production'` OR behind a `NEXT_PUBLIC_MOCK_PAYMENTS=true` env flag.

### D-07: Mock Webhook / Payment Simulation
- **D-07a:** New route: `app/api/mock-payment/simulate/route.ts` — POST handler, accepts `{ paymentId }`. Protected by `CRON_SECRET` or a dedicated `MOCK_PAYMENT_SECRET`. Calls `processPlatformPayment(paymentId)`.
- **D-07b:** New function in `lib/platform-payment.ts`: `processPlatformPayment(paymentId)`:
  1. Finds `PlatformPayment` by ID, verifies status is PENDING and not expired.
  2. Updates `PlatformPayment.status = PAID`, `paidAt = now()`.
  3. Calls the existing `activateSubscription(tenantId, planTarget)` logic (same as what super-admin does) — sets `planStatus = ACTIVE`, `subscriptionExpiresAt = now + 30 days`, unfreezes resources.
  4. Creates audit log: `event_type = 'saas_payment_received'`, details `{ paymentId, amount, plan }`.
  5. Sends Telegram notification to admin: "Получена оплата подписки {plan} от {tenantName} — {amount} ₸".
- **D-07c:** Real webhook integration path is designed: when Paylink.kz is ready, create `app/api/webhooks/platform-payment/route.ts` that verifies HMAC and calls `processPlatformPayment()`. The mock route and the real webhook route share the same `processPlatformPayment` business logic.

### D-08: Billing Page Refactor
- **D-08a:** `app/dashboard/settings/billing/page.tsx` (server component) fetches: tenant plan status + `SubscriptionPlan` rows (for price display) + active `PlatformPayment` if any pending.
- **D-08b:** `BillingContent` receives new props: `subscriptionPlans: SubscriptionPlan[]`, `pendingPayment: PlatformPayment | null`, `enterprisePlan: { priceMonthly, pricePerResource }`.
- **D-08c:** If a `pendingPayment` exists, the modal opens directly to Step 2 (Waiting) on page load — tenant can resume the payment flow after a page refresh.
- **D-08d:** The hardcoded card number (`4400 4303 8983 0552`) and "Перевод на карту" block are **removed** from the dialog.

### D-09: i18n
- New keys: `billing.payWithKaspi`, `billing.waitingForPayment`, `billing.scanQr`, `billing.simulatePayment`, `billing.paymentExpired`, `billing.enterpriseCalculator`, `billing.resourceCount`, `billing.monthlyPrice`, `billing.yearlyPrice`, `admin.plans.title`, `admin.plans.editPlan` — in RU/EN/KZ following `lib/i18n/translations/` pattern.

### Claude's Discretion
- Exact mock QR image strategy (static SVG placeholder vs. a real QR library encoding the mock URL)
- Whether countdown timer in the modal auto-polls or relies on manual "refresh status" button
- Exact Telegram message wording for payment receipt and enterprise inquiries
- Whether to add a `PlatformPayment` history table to the admin tenant drill-down page
- Exact `expiresAt` window for platform payments (suggest 24h — longer than client booking deposits at 30 min)
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Hardcoded Pricing (to be replaced)
- `lib/actions/admin.ts:22` — `PLAN_DEFAULT_MAX_RESOURCES` hardcoded map (FREE=1, PRO=20, ENTERPRISE=100)
- `app/dashboard/settings/billing/billing-content.tsx:174` — hardcoded `10 000 ₸` price
- `app/dashboard/settings/billing/billing-content.tsx:213` — hardcoded `10 000 ₸` in dialog
- `app/dashboard/settings/billing/billing-content.tsx:232–243` — hardcoded card number block to remove

### Existing Billing Actions
- `lib/actions/billing.ts` — `requestProActivation()`, `renewSubscription()` (to be superseded by `initiateSubscriptionPayment()`)
- `lib/actions/admin.ts` — `activateSubscription()`, `updateTenantPlan()` — reuse activation logic

### Existing Admin Infrastructure
- `app/admin/tenants/[tenantId]/activate-subscription-form.tsx` — Super-admin activation form pattern
- `app/admin/tenants/[tenantId]/page.tsx` — Admin tenant detail page (add plan editor link here)
- `app/admin/layout.tsx` — Admin nav (add "Тарифы" link)

### Subscription Lifecycle (must stay in sync with new pricing)
- `lib/subscription-lifecycle.ts` — `processSubscriptionLifecycle()` — reads `maxResources` constant; must switch to DB after D-01c
- `app/api/cron/subscriptions/route.ts` — Cron route that calls lifecycle (no change expected)

### Phase 9 Payment Infra (do not conflict)
- `app/api/webhooks/paylink/route.ts` — Client-to-tenant payment webhook (different from platform payments)
- `lib/payment-lifecycle.ts` — `cancelExpiredPendingBookings()` — client booking payments (unrelated)
- `Tenant.kaspiMerchantId / kaspiApiKey` — Client payment credentials (different from platform payment)

### Neumorphism Design System
- `app/globals.css` — `.neu-raised`, `.neu-inset` utility classes
- `.planning/phases/01-refactor.../01-CONTEXT.md` — Design system decisions

### Audit Log & Notifications
- `lib/actions/audit-log.ts` — `createAuditLog(tenantId, eventType, details)`
- `lib/telegram.ts` — Telegram notifications to admin

### i18n
- `lib/i18n/translations/` — RU/EN/KZ translation files
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/subscription-lifecycle.ts` — pattern for post-payment unfreezing (already has unfreeze logic)
- `lib/telegram.ts` — admin notifications (reuse for payment received + Enterprise inquiry)
- `lib/actions/audit-log.ts` — `createAuditLog()` ready for `saas_payment_received` event
- `app/api/webhooks/paylink/route.ts` — webhook route pattern (HMAC verify + business logic call) — mirror for future real platform payment webhook
- `app/api/cron/subscriptions/route.ts` — cron auth pattern (`CRON_SECRET` Bearer) — reuse for mock simulate endpoint auth

### Established Patterns
- **Server Actions** in `lib/actions/` with `basePrisma` + `requireAuth()` or `ensureSuperAdmin()` guards
- **Prisma enum** additions use `prisma db push` (no migration files — confirmed pattern in Phase 3)
- **Neumorphism UI**: `var(--neu-bg)`, `.neu-raised` cards, `.neu-inset` for alerts/inputs
- **Feature gating**: `isPro = tenant.plan === 'PRO' || tenant.plan === 'ENTERPRISE'` in billing-content
- **Tenant inline config**: flat fields on `Tenant` model (Phase 9 payment fields follow this)

### Integration Points
- `prisma/schema.prisma` — Add `SubscriptionPlan` model, `PlatformPayment` model, `PaymentStatus` enum
- `lib/actions/admin.ts` — Remove `PLAN_DEFAULT_MAX_RESOURCES` constant; fetch from DB in `updateTenantPlan` and `activateSubscription`
- `lib/subscription-lifecycle.ts` — Replace hardcoded maxResources with DB lookup in downgrade path
- `app/dashboard/settings/billing/billing-content.tsx` — Major refactor: remove hardcoded price + card number; add step-based payment modal + Enterprise calculator
- New: `lib/platform-payment.ts`, `lib/actions/admin-plans.ts`, `lib/actions/billing.ts` (extend), `app/admin/plans/`, `app/api/mock-payment/simulate/route.ts`
</code_context>

<specifics>
## Specific Ideas

- `priceMonthly = -1` is the sentinel value for "dynamic/enterprise" — keeps the schema simple and avoids nullable pricing fields causing NULL checks everywhere
- The mock QR placeholder can be a static SVG embedding the fake URL — no QR library needed, keeps bundle size zero
- `NEXT_PUBLIC_MOCK_PAYMENTS=true` env flag controls "Симулировать оплату" button visibility — set it in `.env.local`, never in production
- Platform payment `expiresAt = 24h` from creation — much longer than the 30-min client booking deposit timeout
- The `PlatformPayment` model enables future analytics: total platform revenue, conversion funnel (PENDING → PAID), churn signals
- Enterprise inquiry via Telegram (not immediate activation) keeps the admin in control for large accounts — consistent with the manual approval culture already in the codebase
- Yearly pricing = monthly × 10 (2 months free, i.e., 16.7% discount) — matches common SaaS pricing conventions
</specifics>

<deferred>
## Deferred Ideas

- Real Paylink.kz integration for platform payments — pending ИП registration
- Platform billing history / invoice download page — backlog
- Promo codes or discount system — backlog
- Automatic dunning emails for failed/expired platform payments — backlog
- Per-feature entitlements beyond `maxResources` (e.g., SMS quota, API rate limits) — future milestone

</deferred>

---

*Phase: 10-saas-monetization-enterprise-tier-platform-payments*
*Context gathered: 2026-04-01*
