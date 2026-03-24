# Phase 3: Subscription Lifecycle and Automated Resource Freezing - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a 30-day subscription lifecycle with automated expiry detection, resource/service freezing, tenant warnings, and super-admin activation with expiry date management. The billing page, plan status enums, and `subscriptionExpiresAt` field already exist — this phase makes the lifecycle *automated* rather than purely manual.

This phase does NOT cover:
- New payment processors or invoicing
- Booking cancellation for existing future bookings on expiry
- Super-admin billing analytics (Phase 2 covers analytics)

</domain>

<decisions>
## Implementation Decisions

### Module 1 — Database Schema Expansion

- **`planExpiresAt` on Tenant**: The existing `subscriptionExpiresAt` field (DateTime?) is effectively the same thing — rename it to `planExpiresAt` OR use `subscriptionExpiresAt` as the canonical field (decision: use `subscriptionExpiresAt` as-is to avoid migration complexity, but alias it as `planExpiresAt` in display layer)
- **`isFrozen` on Resource**: Add `isFrozen Boolean @default(false)` field to Resource model
- **`isFrozen` on Service**: Add `isFrozen Boolean @default(false)` field to Service model
- **Staff (User) freezing**: Staff are User records in this codebase (no separate Staff model). Do NOT add `isFrozen` to User (would complicate auth/login). Instead, treat staff management as locked at the action level when tenant is EXPIRED — check tenant planStatus in staff server actions and return an error, and in the UI disable staff management buttons when `planStatus === 'EXPIRED'`
- **PlanStatus enums**: Keep existing ACTIVE, PENDING, EXPIRED, BANNED. Add `CANCELED` status to the PlanStatus enum (it's referenced in billing-content.tsx but missing from schema — currently only ACTIVE/PENDING/EXPIRED/BANNED exist)

### Module 2 — Automated Lifecycle Cron API

- **Route**: `POST /api/cron/subscriptions` — secured via `CRON_SECRET` header check (`Authorization: Bearer ${process.env.CRON_SECRET}`)
- **Trigger**: Called daily externally (e.g., Vercel Cron or any scheduler). Not an internal cron daemon.
- **Action 1 — 3-Day Warning**: Find tenants where `subscriptionExpiresAt` is between now+2 days and now+4 days (fuzzy window to handle daily trigger drift) AND `planStatus = ACTIVE` — create an in-app Notification (using existing Notification model from Phase 2) with a renewal reminder message. Only create if no warning notification exists for this tenant in the last 24h (dedup check).
- **Action 2 — Downgrade & Freeze**: Find tenants where `subscriptionExpiresAt < now()` AND `planStatus = ACTIVE` (or PENDING):
  1. Set tenant `plan = FREE`, `planStatus = EXPIRED`, `maxResources = 1`
  2. For Resources: keep the oldest 1 resource (`createdAt ASC, take 1`) active, set all others `isFrozen = true`
  3. For Services: keep the oldest 1 service active, set all others `isFrozen = true`
  4. Staff: no `isFrozen` field — no changes to User records
  5. Create audit log entry: `event_type = 'plan_downgrade'` with details `{ reason: 'subscription_expired', previousPlan: 'PRO' }`
- **Response**: Return JSON `{ processed: N, warned: M }` for logging

### Module 3 — Frozen State UI (Dashboard)

- **Resources table** (`components/resources-manager.tsx`): If `resource.isFrozen === true`, show a Neumorphic badge "Заморожен" (amber/orange color, `.neu-inset`). Disable Edit and Delete buttons for frozen items. Show tooltip on hover: "Разморозьте подписку PRO, чтобы управлять этим объектом" (Upgrade to PRO to unlock)
- **Services table** (`components/services-manager.tsx`): Same pattern — "Заморожен" badge, disabled Edit/Delete, same tooltip
- **Staff management** (`components/staff-manager.tsx`): When tenant `planStatus === 'EXPIRED'`, disable the "Invite staff" button and show a read-only notice. No frozen badge on individual staff rows (no `isFrozen` field on User)
- **Badge design**: Use `.neu-inset bg-[var(--neu-bg)] text-orange-500 text-xs font-medium rounded-full px-2.5 py-1` — consistent with existing status badges in billing-content.tsx

### Module 4 — Billing & Renewal UI

- **Show expiry date**: In `billing-content.tsx`, display `subscriptionExpiresAt` clearly when plan is PRO/ACTIVE — format: "Подписка активна до: 24 апреля 2026"
- **EXPIRED alert**: When `planStatus === EXPIRED`, show a prominent `.neu-inset` alert block (red/orange) above the renewal card — "Ваша подписка истекла. Ваши данные заморожены."
- **"Renew / Buy PRO" action** (new server action `renewSubscription` in `lib/actions/billing.ts`):
  1. Sets tenant `plan = PRO`, `planStatus = PENDING` (requires super-admin confirmation — same flow as existing `requestProActivation`)
  2. Sends Telegram notification to admin
  3. Does NOT automatically unfreeze — unfreezing happens when super-admin confirms payment and calls `activateSubscription`
- **Super-admin activation** (`lib/actions/admin.ts` — add `activateSubscription` action):
  1. Sets `plan = PRO`, `planStatus = ACTIVE`, `subscriptionExpiresAt = now() + 30 days`, `maxResources = 20`
  2. Unfreezes all resources and services: `updateMany({ where: { tenantId, isFrozen: true }, data: { isFrozen: false } })`
  3. Creates audit log entry: `plan_upgrade` with `{ activatedBy: 'superadmin', newExpiry: date }`
  4. Available from admin tenant detail page (`/admin/tenants/[tenantId]`)

### Neumorphism Design Adherence

- All new UI: `var(--neu-bg)`, `.neu-raised` for cards/panels, `.neu-inset` for alert blocks and badges
- Frozen badge: `.neu-inset` with orange/amber text (consistent with existing EXPIRED badge style in billing-content.tsx)
- No hard `border-border` on new components — depth via shadow only

### Claude's Discretion

- Exact dedup strategy for 3-day warning notifications (timestamp check vs. count check)
- Whether to show frozen item count in the billing page EXPIRED alert (e.g., "3 resources frozen")
- Exact wording of Telegram message for renewal requests
- Whether `CANCELED` status (already referenced in billing-content.tsx but missing from schema) gets the same freeze treatment as EXPIRED in the cron job

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing subscription/billing infrastructure
- `prisma/schema.prisma` — Full Tenant model with `plan`, `planStatus`, `subscriptionExpiresAt`, `maxResources`; Resource and Service models; PlanStatus and Plan enums
- `lib/actions/billing.ts` — Existing `requestProActivation()` server action (sets status to PENDING + Telegram notification)
- `lib/actions/admin.ts` — Existing `updateTenantPlan()` + `updateTenantMaxResources()` server actions (super-admin plan management)
- `app/dashboard/settings/billing/billing-content.tsx` — Current billing UI (plan display, renewal card, status badges)
- `app/dashboard/layout.tsx` — EXPIRED warning banner + BANNED → force-signout logic

### Neumorphism Design System
- `.planning/phases/01-refactor-the-ui-design-of-the-entire-project-to-a-neumorphism-soft-ui-style-with-light-and-dark-themes/01-CONTEXT.md` — Phase 1 design decisions (var(--neu-bg), .neu-raised, .neu-inset rules)
- `app/globals.css` — .neu-raised, .neu-inset utility class definitions

### Phase 2 infrastructure (used by this phase)
- `lib/actions/audit-log.ts` — `createAuditLog(tenantId, eventType, details)` — must call this on freeze/unfreeze
- `prisma/schema.prisma` (Notification model) — used for 3-day warning in-app notifications
- `.planning/phases/02-super-admin-god-mode-and-platform-management/02-CONTEXT.md` — Notification and AuditLog patterns

### Dashboard manager components (targets for frozen UI)
- `components/resources-manager.tsx` — Resource table (add isFrozen badge + disable actions)
- `components/services-manager.tsx` — Services table (add isFrozen badge + disable actions)
- `components/staff-manager.tsx` — Staff management (disable invite when EXPIRED)
- `app/admin/tenants/[tenantId]/page.tsx` — Tenant drill-down (add activateSubscription action here)

### i18n
- `lib/i18n/translations.ts` — All user-visible strings in RU/EN/KZ (frozen badges, tooltip text, alert messages)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `requestProActivation()` in `lib/actions/billing.ts`: Existing renewal request flow (PENDING + Telegram) — extend rather than replace
- `updateTenantPlan()` in `lib/actions/admin.ts`: Existing plan update action — `activateSubscription` can call this + add expiry + unfreeze logic
- `createAuditLog()` in `lib/actions/audit-log.ts`: Ready to use for freeze/unfreeze events
- Notification model (Phase 2): Already set up for in-app notifications — use for 3-day warning
- Existing billing status badges in `billing-content.tsx`: `.neu-raised bg-[var(--neu-bg)] text-orange-600` pattern — reuse for frozen badge

### Established Patterns
- Server actions in `lib/actions/` using `basePrisma` with `requireAuth()` guards
- Cron security: use `Authorization: Bearer CRON_SECRET` header check (no next-auth session for cron routes)
- `revalidatePath()` after mutations
- `PLAN_DEFAULT_MAX_RESOURCES` map in `admin.ts` — reuse when setting maxResources on downgrade/upgrade
- Staff model = User model with `role: 'STAFF'` — no separate Staff table

### Integration Points
- `prisma/schema.prisma`: Add `isFrozen` to Resource and Service; add `CANCELED` to PlanStatus enum; run `prisma db push` (no migration files — established pattern)
- `/api/cron/subscriptions`: New API route in `app/api/cron/subscriptions/route.ts`
- `components/resources-manager.tsx` and `components/services-manager.tsx`: Add `isFrozen` check to item rendering
- `app/dashboard/settings/billing/billing-content.tsx`: Add expiry date display and enhanced EXPIRED state
- `app/admin/tenants/[tenantId]/page.tsx`: Add "Activate Subscription" button for super-admin

</code_context>

<specifics>
## Specific Ideas

- Keep the oldest 1 Resource and 1 Service when downgrading (by `createdAt ASC`) — matches FREE tier limit of 1 resource
- Staff freeze is handled at the action/UI level (no `isFrozen` on User model) — check `tenant.planStatus` in staff actions
- `subscriptionExpiresAt` already exists on Tenant — reuse it, don't create a new `planExpiresAt` field
- Cron route returns `{ processed: N, warned: M }` JSON for external logging
- Admin activates subscription: sets `subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)` (30 days from now)
- `CANCELED` status in PlanStatus enum is referenced in billing-content.tsx but missing from schema — add it to the enum during schema migration

</specifics>

<deferred>
## Deferred Ideas

- None — discussion covered all modules within phase scope

</deferred>

---

*Phase: 03-subscription-lifecycle-and-automated-resource-freezing*
*Context gathered: 2026-03-24*
