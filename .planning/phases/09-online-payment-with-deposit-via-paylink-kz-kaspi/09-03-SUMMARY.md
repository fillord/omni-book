---
phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi
plan: 03
subsystem: payments
tags: [kaspi, deposit, billing, i18n, server-action, neumorphism]

# Dependency graph
requires:
  - phase: 09-01
    provides: Prisma schema with requireDeposit, depositAmount, kaspiMerchantId, kaspiApiKey fields on Tenant model
provides:
  - updatePaymentSettings Server Action with PRO+ gate and tenge-to-tiyn conversion
  - Deposit configuration section in billing settings page (PRO+ gated, Neumorphism styled)
  - 48 i18n keys for payment/deposit UI across RU/EN/KZ locales
affects: [09-04, booking-form, tenant-public-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PRO+ gate in Server Action: query plan before update, return error for FREE tenants
    - Tenge-to-tiyn conversion: multiply by 100 on save (Math.round), divide by 100 for display
    - Deposit config state initialized from tenant props in client component
    - payment section added to translations.ts following existing booking/manage section pattern

key-files:
  created:
    - lib/actions/payment-settings.ts
  modified:
    - app/dashboard/settings/billing/billing-content.tsx
    - lib/i18n/translations.ts

key-decisions:
  - "Used requireAuth + requireRole(['OWNER']) pattern matching lib/actions/billing.ts (not raw auth())"
  - "Added payment section as new top-level section in translations (not nested under booking) for clarity"
  - "Billing page.tsx passes full tenant object - no select restriction needed, all new fields available automatically"
  - "Deposit save button only rendered inside requireDeposit === true conditional block to avoid partial saves"

patterns-established:
  - "Payment Server Action pattern: requireAuth + requireRole + PRO gate + Math.round(tenge * 100) + revalidatePath"
  - "Deposit UI state: initialize from tenant.depositAmount / 100, send raw tenge to Server Action"

requirements-completed: [PAY-01, PAY-08]

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 09 Plan 03: Deposit Configuration UI Summary

**Tenant deposit settings wired end-to-end: PRO+ gated Server Action with tenge-to-tiyn conversion, billing page deposit section with Neumorphism UI, and 48 payment i18n keys across RU/EN/KZ**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-31T08:20:00Z
- **Completed:** 2026-03-31T08:35:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `updatePaymentSettings` Server Action created with PRO+ gate, tenge-to-tiyn conversion, and revalidatePath
- Deposit / Payment card section added to billing settings (toggles requireDeposit, sets amount, Kaspi credentials) — visible only for PRO+ tenants
- 16 payment i18n keys added per locale (48 total across RU, KZ, EN) covering deposit settings UI and future booking flow screens

## Task Commits

Each task was committed atomically:

1. **Task 1: Create updatePaymentSettings Server Action** - `96c94f9` (feat)
2. **Task 2: Add deposit section to billing page + i18n keys** - `4003dd8` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `lib/actions/payment-settings.ts` - Server Action: PRO+ gate, tenge-to-tiyn, saves requireDeposit/depositAmount/kaspiMerchantId/kaspiApiKey
- `app/dashboard/settings/billing/billing-content.tsx` - Extended TenantInfo type, deposit state hooks, handleSaveDeposit, deposit Card section with Neumorphism classes
- `lib/i18n/translations.ts` - 48 new payment keys (16 per locale) in `payment` section for RU/KZ/EN

## Decisions Made
- Used `requireAuth + requireRole(['OWNER'])` pattern matching `lib/actions/billing.ts` instead of raw `auth()` — consistent with existing pattern
- Added `payment` as new top-level section in translations (not nested under `booking`) — clearer namespace for payment-specific keys
- Billing page.tsx already fetches full tenant — no `select` restriction — so all new deposit fields available without page changes
- Deposit amount input and API key fields only render when `requireDeposit` is checked — avoids saving partial/invalid credentials when deposit is disabled

## Deviations from Plan

None - plan executed exactly as written. Auth import pattern matched existing actions. Billing page already passed full tenant object.

## Issues Encountered
- Pre-existing TypeScript errors throughout codebase (manageToken, isFrozen, telegramChatId schema/code mismatches from other plans) — out of scope for this plan. No new errors introduced by this plan's files.

## User Setup Required
None - no external service configuration required. Tenant enters their own Kaspi credentials through the UI.

## Next Phase Readiness
- Server Action ready: `updatePaymentSettings` exported from `lib/actions/payment-settings.ts`
- Deposit fields readable from tenant in all server components
- i18n keys ready for use in booking form deposit flow (Plan 09-04)
- Blocker: kaspiMerchantId and kaspiApiKey must be configured by tenant before deposit flow works

---
*Phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi*
*Completed: 2026-03-31*
