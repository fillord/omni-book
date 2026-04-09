---
phase: 14-code-i18n-cleanup
plan: 03
subsystem: i18n, auth, stub-routes
tags: [i18n, translations, auth, session, stub-routes, cleanup]
dependency_graph:
  requires: [14-01]
  provides: [CLN-04, CLN-07, CLN-08]
  affects: [lib/i18n/translations.ts, lib/auth/config.ts, app/api/tenants/route.ts, app/api/resources/route.ts, app/api/webhooks/route.ts, app/book/page.tsx]
tech_stack:
  added: []
  patterns: [generic-payment-wording, session-expiry-hardening, intent-comment-stubs]
key_files:
  modified:
    - lib/i18n/translations.ts
    - lib/auth/config.ts
    - app/api/tenants/route.ts
    - app/api/resources/route.ts
    - app/api/webhooks/route.ts
    - app/book/page.tsx
decisions:
  - "Generic payment waiting instructions without brand name — removes Paylink.kz from deposit UI text in all 3 locales (RU/KZ/EN)"
  - "Session maxAge set to 7 days (604800s) — replaces implicit NextAuth 30-day default with explicit hardened value"
  - "STUB comment pattern over TODO — makes route intent explicit and searchable in codebase"
metrics:
  duration: ~5min
  completed: 2026-04-09
  tasks_completed: 2
  files_modified: 6
---

# Phase 14 Plan 03: i18n Cleanup, Session Hardening, Stub Comments Summary

Generic payment wording without Paylink.kz brand in all 3 locales, 7-day session maxAge in auth config, and STUB intent comments in all 4 stub routes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove Paylink.kz branding from waitingInstructions, set session maxAge | 64f2efc | lib/i18n/translations.ts, lib/auth/config.ts |
| 2 | Add STUB comments to all 4 stub routes | f8a9ca5 | app/api/tenants/route.ts, app/api/resources/route.ts, app/api/webhooks/route.ts, app/book/page.tsx |

## Verification

All 7 targeted tests pass:
- CLN-04: `translations.ts has no Kaspi references` — PASS
- CLN-04: `waitingInstructions does not contain Paylink.kz` — PASS
- CLN-07: `lib/auth/config.ts contains maxAge: 7 * 24 * 60 * 60 or 604800` — PASS
- CLN-08: `app/api/tenants/route.ts contains '// STUB: not implemented'` — PASS
- CLN-08: `app/api/resources/route.ts contains '// STUB: not implemented'` — PASS
- CLN-08: `app/api/webhooks/route.ts contains '// STUB: not implemented'` — PASS
- CLN-08: `app/book/page.tsx contains '// STUB: not implemented'` — PASS

Pre-existing failures in the full test suite (CLN-01, CLN-02, CLN-03, CLN-05, CLN-06) are handled by other plans and are not in scope for this plan.

## Decisions Made

1. **Generic payment wording:** Removed `Paylink.kz` brand name from `waitingInstructions` in all 3 locales. Legal references in `billing`, `oferta`, `privacy`, `refund` namespaces were not touched as they are legally required.

2. **7-day session maxAge:** Changed `session: { strategy: 'jwt' }` to include `maxAge: 7 * 24 * 60 * 60` — reduces token lifetime from NextAuth's implicit 30-day default to a hardened 7 days. Only new sessions are affected.

3. **STUB over TODO:** Replaced `// TODO:` with `// STUB: not implemented —` in all 4 stub files. The `STUB:` prefix is more explicit about intent (this is a placeholder, not a missing task) and is searchable.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

The 4 routes now have explicit STUB comments — these stubs are intentional placeholders documented in the plan. No future plan is currently assigned to implement them in v1.5 scope.

## Self-Check: PASSED

Files verified:
- lib/i18n/translations.ts: waitingInstructions lines contain no `Paylink.kz`
- lib/auth/config.ts: contains `maxAge: 7 * 24 * 60 * 60`
- app/api/tenants/route.ts: contains `// STUB: not implemented`
- app/api/resources/route.ts: contains `// STUB: not implemented`
- app/api/webhooks/route.ts: contains `// STUB: not implemented`
- app/book/page.tsx: contains `// STUB: not implemented`

Commits verified:
- 64f2efc: feat(14-03): remove Paylink.kz branding from waitingInstructions and set 7-day session maxAge
- f8a9ca5: feat(14-03): replace TODO comments with STUB comments in all 4 stub routes (CLN-08)
