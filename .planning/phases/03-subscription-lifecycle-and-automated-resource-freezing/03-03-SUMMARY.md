---
phase: 03-subscription-lifecycle-and-automated-resource-freezing
plan: 03
subsystem: billing, admin, i18n
tags: [subscription, billing, prisma, server-actions, react, i18n, neumorphism]

requires:
  - phase: 03-01
    provides: isFrozen fields on Resource/Service, CANCELED PlanStatus enum, subscriptionExpiresAt field on Tenant
  - phase: 03-02
    provides: frozen badges and disabled actions in resource/service managers

provides:
  - Billing page expiry date display for PRO/ACTIVE tenants
  - EXPIRED alert with neu-inset styling on billing page
  - renewSubscription server action (PRO+PENDING + Telegram notification)
  - activateSubscription admin server action (atomic PRO+ACTIVE+unfreeze, 30-day expiry)
  - ActivateSubscriptionForm client component with two-click confirmation
  - Admin tenant detail page subscription management block with expiry display
  - i18n subscription translation keys in ru/kz/en locales

affects: [billing, admin-panel, subscription-lifecycle, i18n]

tech-stack:
  added: []
  patterns:
    - Two-click confirmation pattern for destructive admin actions (first click shows confirm, second executes)
    - Atomic transaction for tenant activation + bulk unfreeze of resources and services
    - renewSubscription routes through PENDING state requiring super-admin confirmation
    - activateSubscription uses basePrisma.$transaction for atomic multi-model updates

key-files:
  created:
    - app/admin/tenants/[tenantId]/activate-subscription-form.tsx
  modified:
    - app/dashboard/settings/billing/billing-content.tsx
    - lib/actions/billing.ts
    - lib/actions/admin.ts
    - app/admin/tenants/[tenantId]/page.tsx
    - lib/i18n/translations.ts

key-decisions:
  - "renewSubscription sets PRO+PENDING (not ACTIVE) — requires super-admin confirmation, same flow as requestProActivation"
  - "activateSubscription uses $transaction for atomicity: tenant update + resource.updateMany + service.updateMany"
  - "Two-click confirmation on ActivateSubscriptionForm prevents accidental activation by super-admin"
  - "i18n subscription keys added for future localization; current UI uses hardcoded Russian strings per spec"

patterns-established:
  - "Two-click confirmation: first click sets confirmed=true, second click executes action via useTransition"
  - "Admin activation revalidates 3 paths: tenant detail, tenant list, AND billing page for immediate tenant feedback"

requirements-completed: [SUB-04, SUB-05, SUB-06]

duration: ~4min (execution only)
completed: 2026-03-24
---

# Phase 03 Plan 03: Billing Expiry Display, EXPIRED Alert, and Admin Activation Summary

**Billing page shows expiry date and EXPIRED alert; renewSubscription + activateSubscription complete the subscription lifecycle with atomic unfreeze and Telegram notifications**

## Performance

- **Duration:** ~4 min (execution only; Tasks 1-2 were pre-built, committed separately)
- **Started:** 2026-03-24T10:44:12Z
- **Completed:** 2026-03-24T15:18:00Z
- **Tasks:** 3 completed
- **Files modified:** 5 modified, 1 created

## Accomplishments
- Billing page shows "Подписка активна до" for PRO/ACTIVE tenants and "Ваша подписка истекла" EXPIRED alert
- renewSubscription action sets PRO+PENDING and sends Telegram notification to super-admin
- activateSubscription atomically sets PRO/ACTIVE, 30-day expiry, unfreezes all resources/services
- Admin tenant detail page has full subscription management block with two-click activation button

## Task Commits

Each task was committed atomically:

1. **Task 1: Billing page expiry display, EXPIRED alert, and renewSubscription action** - `efde0c4` (feat)
2. **Task 2: Super-admin activateSubscription action with bulk unfreeze** - `ee05c77` (feat)
3. **Task 3: Admin tenant detail page — activation UI + i18n** - `32848b1` (feat)

## Files Created/Modified
- `app/dashboard/settings/billing/billing-content.tsx` - Added expiry date display, EXPIRED alert block, renewSubscription routing in handlePaymentConfirm
- `lib/actions/billing.ts` - Added renewSubscription function with PRO+PENDING state and Telegram notification
- `lib/actions/admin.ts` - Added activateSubscription with atomic $transaction (tenant + resource + service unfreeze)
- `app/admin/tenants/[tenantId]/activate-subscription-form.tsx` - New client component with two-click confirmation
- `app/admin/tenants/[tenantId]/page.tsx` - Added ActivateSubscriptionForm import, subscriptionExpiresAt to select, subscription management block
- `lib/i18n/translations.ts` - Added subscription keys (frozen, expired, activeUntil, staffLocked, renewRequest, activated) for ru/kz/en

## Decisions Made
- renewSubscription sets PRO+PENDING (not ACTIVE directly) — follows the same confirmation flow as requestProActivation, requiring super-admin to confirm via activateSubscription
- activateSubscription uses basePrisma.$transaction([...]) to ensure tenant update + bulk unfreeze are atomic
- Two-click confirmation pattern on ActivateSubscriptionForm prevents accidental activation by super-admin (first click shows confirm button, second executes)
- i18n entries added for future localization; current hardcoded Russian strings in UI are per CONTEXT.md specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Tasks 1 and 2 were already pre-built and committed before this execution session (billing-content.tsx, billing.ts, and admin.ts changes were in git history as efde0c4 and ee05c77). Execution verified correctness and proceeded to Task 3.
- Pre-existing TypeScript errors in test files (neumorphism-surface.test.ts uses es2018 regex flags) and staff-manager.tsx — not caused by this plan's changes.
- Pre-existing test failures in booking-surface.test.ts, cleanup-surface.test.ts, landing-surface.test.ts — not related to subscription lifecycle work.

## Next Phase Readiness
- Complete subscription lifecycle is now operational: expiry detection (03-01 cron), freeze logic (03-01 cron + 03-02 badges), tenant renewal request (03-03 billing page), super-admin activation (03-03 admin panel)
- Phase 03 is complete (all 3 plans shipped)
- Ready for next milestone

---
*Phase: 03-subscription-lifecycle-and-automated-resource-freezing*
*Completed: 2026-03-24*
