---
phase: quick-260406-w0a
plan: 01
subsystem: auth, i18n, payments, env-config
tags: [bugfix, cleanup, kaspi-removal, paylink, ghost-code, neumorphic]
dependency_graph:
  requires: []
  provides: [clean-build, zero-kaspi-refs, complete-env-example, no-payment-lifecycle]
  affects: [lib/auth/config.ts, lib/i18n/translations.ts, .env.example, components/service-form.tsx]
tech_stack:
  added: []
  patterns: [return-null-instead-of-throw-in-authorize]
key_files:
  created: [FULL_PROJECT_REPORT.md]
  modified:
    - lib/auth/config.ts
    - lib/i18n/translations.ts
    - .env.example
    - lib/actions/bookings.ts
    - lib/actions/payment-settings.ts
    - lib/actions/services.ts
    - lib/validations/service.ts
    - app/dashboard/layout.tsx
    - app/(marketing)/docs/page.tsx
    - components/service-form.tsx
    - components/services-manager.tsx
    - components/tenant-public-page.tsx
    - components/booking-form.tsx
    - FULL_PROJECT_REPORT.md
  deleted:
    - lib/payment-lifecycle.ts
decisions:
  - "return null instead of throw Error in authorize callback — throwing in NextAuth authorize causes HTTP 500; null triggers CredentialsSignin error redirect"
  - "Removed all stale requireDeposit/depositAmount field references from validation, actions, and components — fields removed from schema in Phase 12 but not from application code"
  - "Duplicate payment namespace keys fixed — whatsappPrepayment was added as a standalone payment block then the full payment block was added, causing TypeScript duplicate key error"
metrics:
  duration: ~35 minutes
  completed: 2026-04-06T18:29:50Z
  tasks_completed: 5
  files_modified: 14
  files_deleted: 1
---

# Phase quick-260406-w0a Plan 01: High Priority Cleanup — Fix Login 500 Error Summary

**One-liner:** Fixed login 500 by replacing throw with return null in NextAuth authorize callback, removed all Kaspi ghost code and stale deposit fields causing build failure, added 6 missing env vars to .env.example, and updated audit report.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Diagnose and fix login 500 error | b848170 | lib/auth/config.ts, lib/actions/services.ts, lib/validations/service.ts, components/service-form.tsx, components/services-manager.tsx, components/tenant-public-page.tsx, lib/i18n/translations.ts |
| 2 | Replace all Kaspi references with Paylink.kz in i18n translations | 62e3c96 | lib/i18n/translations.ts |
| 3 | Add missing environment variables to .env.example | 1abdac8 | .env.example |
| 4 | Remove 6 Kaspi ghost code locations | d67ce87 | lib/actions/bookings.ts, lib/actions/payment-settings.ts, lib/payment-lifecycle.ts, app/dashboard/layout.tsx, app/(marketing)/docs/page.tsx |
| 5 | Verify neumorphic UI on public pages and update audit report | db9a7c0 | components/booking-form.tsx, FULL_PROJECT_REPORT.md |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Build was failing due to stale deposit fields in services action/validation/components**
- **Found during:** Task 1 (first build attempt)
- **Issue:** `lib/actions/services.ts` referenced `requireDeposit` and `depositAmount` fields that were removed from the Prisma schema in Phase 12. This caused TypeScript type error: `Object literal may only specify known properties, and 'requireDeposit' does not exist in type`. Also found in `lib/validations/service.ts`, `components/service-form.tsx`, `components/services-manager.tsx`, `components/tenant-public-page.tsx`.
- **Fix:** Removed all `requireDeposit`/`depositAmount` references from validation schema, server actions, and UI components. Removed the deposit toggle UI section from service-form.tsx.
- **Files modified:** lib/validations/service.ts, lib/actions/services.ts, components/service-form.tsx, components/services-manager.tsx, components/tenant-public-page.tsx
- **Commit:** b848170

**2. [Rule 1 - Bug] Duplicate `payment` namespace key in translations caused TypeScript compile error**
- **Found during:** Task 1 (second build attempt after fixing deposit fields)
- **Issue:** Phase 12 Plan 4 added `whatsappPrepayment` as a standalone `payment: { whatsappPrepayment: '...' }` block, but a full `payment: { ... }` block already existed. TypeScript `An object literal cannot have multiple properties with the same name` error in all 3 locales (ru, kz, en).
- **Fix:** Removed the duplicate shorter `payment` blocks (lines 606-608, 1391-1393, 2176-2178). The comprehensive `payment` blocks already contained `whatsappPrepayment`.
- **Files modified:** lib/i18n/translations.ts
- **Commit:** b848170

### Root Cause Analysis: Login 500

The `authorize` callback in `lib/auth/config.ts` contained a `throw new Error('Упс, ваш IP изменился...')` at the IP mismatch check. In NextAuth v4 (with Next.js 15), throwing inside `authorize` causes HTTP 500 instead of redirecting to the error page. The fix: return `null` (which triggers the standard NextAuth error redirect with `?error=CredentialsSignin`). The IP check is already handled by the `checkLoginIp` server action pre-flight in the login form, so this path is a safety net only hit in edge cases.

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| Build passes | `npx next build` | PASS |
| Zero Kaspi in source | `grep -rni "kaspi" lib/ app/ components/` | 0 results |
| CRON_SECRET in .env.example | `grep -c "CRON_SECRET" .env.example` | 1 |
| payment-lifecycle.ts deleted | `ls lib/payment-lifecycle.ts` | NOT FOUND |
| Tests | `npx jest` | 494 pass, 10 pre-existing failures (unrelated to this task) |

## Known Stubs

- `updatePaymentSettings()` in `lib/actions/payment-settings.ts` — intentional no-op stub, Paylink.kz settings UI not yet built. No stub affects this plan's goal.

## Self-Check: PASSED

All 5 task commits verified:
- b848170 — fix login 500 + remove stale deposit fields
- 62e3c96 — Kaspi → Paylink.kz in i18n
- 1abdac8 — .env.example with missing vars
- d67ce87 — 6 ghost code locations cleaned
- db9a7c0 — neumorphic verified + audit report updated
