---
phase: 11-public-landing-page-footer-and-legal-informational-pages-for-kaspi-pay-compliance
plan: "01"
subsystem: landing
tags: [footer, i18n, legal, test-scaffold, wave-0]
dependency_graph:
  requires: []
  provides: [legal-surface-test-scaffold, footer-grid-layout, footer-i18n-keys]
  affects: [components/landing/Footer.tsx, lib/i18n/translations.ts, __tests__/legal-surface.test.ts]
tech_stack:
  added: []
  patterns: [wave-0-red-tests, fs.readFileSync-static-assertions, grid-cols-responsive]
key_files:
  created:
    - __tests__/legal-surface.test.ts
  modified:
    - components/landing/Footer.tsx
    - lib/i18n/translations.ts
decisions:
  - "Footer.tsx uses JSX comment {/* intentional: ... */} instead of JS comment // INTENTIONAL: because toContain('intentional') is case-sensitive and the test matched lowercase"
  - "Wave 0 RED tests expected — legal-surface.test.ts page existence and i18n namespace tests will fail until Plan 02 creates those files/keys"
  - "safeRead helper used in STYLE tests to skip assertions on missing files without crashing, consistent with Phase 02 pattern from STATE.md"
metrics:
  duration: "12 minutes"
  completed_date: "2026-04-03"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 11 Plan 01: Footer Redesign and Legal Test Scaffold Summary

Wave 0 test scaffold (`legal-surface.test.ts`) and footer redesign (Product/Legal/Company 3-column grid) with 8 new footer i18n keys across all 3 locales (ru/kz/en).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create legal-surface.test.ts test scaffold | ae47d96 | `__tests__/legal-surface.test.ts` |
| 2 | Rewrite Footer.tsx + add footer i18n keys | 3d45449 | `components/landing/Footer.tsx`, `lib/i18n/translations.ts` |

## What Was Built

**legal-surface.test.ts** — Wave 0 test scaffold with 36 tests covering:
- PAGE-01..04: File existence for oferta/privacy/refund/about pages
- STYLE-01..02: No hardcoded colors + use client directive
- I18N-01..03: Translation namespace checks per locale (ru/kz/en)
- FOOT-01..02..04: Footer grid structure and legal page link checks

**Footer.tsx** — Rewritten from single-row flex to 3-column grid:
- Product column: links to #features, #pricing, #demo, docs
- Legal column: Next.js `<Link>` to /privacy, /oferta, /refund
- Company column: Next.js `<Link>` to /about, /about#contacts, support
- Bottom bar: brand logo + copyright + footerRights key

**translations.ts** — 8 new keys added to `landing` namespace in ru/kz/en:
- `footerColProduct`, `footerColLegal`, `footerColCompany`
- `footerPrivacy`, `footerOferta`, `footerRefund`, `footerContacts`, `footerRights`

## Test Results

- `landing-surface.test.ts`: 47/51 pass — 4 failures are **pre-existing** (NicheCards, DemoSection dark:bg-card, PricingCards bg-indigo-600, FeaturesGrid dark tint), unrelated to this plan
- `legal-surface.test.ts`: 17/36 pass — 19 failures are **expected Wave 0 RED** (legal pages and i18n namespaces will be created in Plan 02)
- All Footer-related tests (FOOT-01, FOOT-02, FOOT-04) pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lowercase 'intentional' in footer comment**
- **Found during:** Task 2 verification
- **Issue:** Plan specified `// INTENTIONAL:` (uppercase) in a JS comment, but `landing-surface.test.ts` line 36 uses `toContain("intentional")` which is case-sensitive — uppercase would fail the test
- **Fix:** Used JSX comment `{/* intentional: ... */}` which contains the lowercase string the test expects
- **Files modified:** `components/landing/Footer.tsx`
- **Commit:** 3d45449

## Self-Check: PASSED

Files exist:
- FOUND: __tests__/legal-surface.test.ts
- FOUND: components/landing/Footer.tsx (rewritten)
- FOUND: lib/i18n/translations.ts (updated)

Commits exist:
- FOUND: ae47d96 (test scaffold)
- FOUND: 3d45449 (footer + i18n)

footerColProduct count in translations.ts: 3 (one per locale) ✓
