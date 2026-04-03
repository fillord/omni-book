---
phase: 11-public-landing-page-footer-and-legal-informational-pages-for-kaspi-pay-compliance
plan: "02"
subsystem: legal-pages
tags: [legal, i18n, marketing, kaspi-pay, neumorphism]
dependency_graph:
  requires: [11-01]
  provides: [legal pages at /oferta, /privacy, /refund, /about, i18n namespaces legal/oferta/privacy/refund/about]
  affects: [lib/i18n/translations.ts, app/(marketing)/]
tech_stack:
  added: []
  patterns: [use-client pages with useI18n(), neu-raised neumorphism cards, max-w-4xl legal container]
key_files:
  created:
    - app/(marketing)/oferta/page.tsx
    - app/(marketing)/privacy/page.tsx
    - app/(marketing)/refund/page.tsx
    - app/(marketing)/about/page.tsx
  modified:
    - lib/i18n/translations.ts
decisions:
  - "Separate namespace per legal page (oferta/privacy/refund/about + shared legal) — per D-15, each page has 6-12 sections making one monolithic namespace unwieldy"
  - "Sections built as array in page component (not individual JSX elements) — cleaner loop pattern, easy to add/remove sections"
  - "About page uses id='contacts' on the Contacts section to support /about#contacts footer anchor link"
metrics:
  duration: "~7 minutes"
  completed_date: "2026-04-03"
  tasks_completed: 3
  files_changed: 5
---

# Phase 11 Plan 02: Legal Pages (Oferta, Privacy, Refund, About) Summary

4 legal/informational pages (oferta, privacy, refund, about) created under app/(marketing)/ with 5 new i18n namespaces (legal, oferta, privacy, refund, about) in all 3 locales — completing Kaspi Pay merchant compliance requirements.

## What Was Built

### Task 1: i18n Namespaces (lib/i18n/translations.ts)
Added 5 namespaces × 3 locales = 15 namespace blocks, with 258 new lines:

- **`legal`** — 5 shared UI keys: lastUpdated, replaceNote, backToHome, tableOfContents, effectiveDateLabel
- **`oferta`** — 9-section public offer agreement with realistic SaaS legal content
- **`privacy`** — 12-section privacy policy (Kazakhstan Law on Personal Data compliant structure)
- **`refund`** — 6-section cancellation/refund policy (Kaspi Pay deposit refund rules)
- **`about`** — 10 keys for company info, mission, and contacts

All placeholder values use `{REPLACE: ...}` format: 51 placeholder markers across the file for company_name, bin_number, contact_email, legal_address, contact_phone, effective_date.

### Task 2: Oferta and Privacy Pages
- **`app/(marketing)/oferta/page.tsx`** — 9-section public offer rendered as neu-raised cards
- **`app/(marketing)/privacy/page.tsx`** — 12-section privacy policy rendered as neu-raised cards

### Task 3: Refund and About Pages
- **`app/(marketing)/refund/page.tsx`** — 6-section refund policy rendered as neu-raised cards
- **`app/(marketing)/about/page.tsx`** — Company, Mission, Contacts sections with `id="contacts"` for footer anchor

All 4 pages: `"use client"` directive, `useI18n()` hook, `neu-raised bg-[var(--neu-bg)]` Neumorphism design, `max-w-4xl mx-auto px-4` container, back-to-home link, no hardcoded color classes.

## Verification

- `npx jest __tests__/legal-surface.test.ts --no-coverage` — 36/36 tests pass
- `npx jest __tests__/landing-surface.test.ts --no-coverage` — pre-existing failures only (4 tests, NicheCards/DemoSection/PricingCards/FeaturesGrid — all present before this plan)
- Full suite: 3 failing suites (landing-surface, cleanup-surface, subscription-lifecycle-surface) — all pre-existing, unchanged from before this plan

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 | fc127ce | feat(11-02): add legal i18n namespaces (legal, oferta, privacy, refund, about) to all 3 locales |
| 2 | a2d4322 | feat(11-02): create oferta and privacy page components |
| 3 | d6a9d33 | feat(11-02): create refund and about page components |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

The following values are intentional placeholder stubs requiring owner replacement before production:

| File | Placeholder | Reason |
|------|-------------|--------|
| lib/i18n/translations.ts (×51) | `{REPLACE: company_name}`, `{REPLACE: bin_number}`, `{REPLACE: contact_email}`, `{REPLACE: legal_address}`, `{REPLACE: contact_phone}`, `{REPLACE: effective_date}` | Legal data specific to business owner — must be filled before publishing |

These stubs are intentional (per D-11 in CONTEXT.md) and are clearly marked for the owner. The legal page content is a functional template — pages render correctly with the `{REPLACE: ...}` markers visible, which is the correct pre-publication state.

## Self-Check: PASSED

All created files verified to exist on disk. All 3 commits verified in git log.

| Check | Status |
|-------|--------|
| app/(marketing)/oferta/page.tsx | FOUND |
| app/(marketing)/privacy/page.tsx | FOUND |
| app/(marketing)/refund/page.tsx | FOUND |
| app/(marketing)/about/page.tsx | FOUND |
| 11-02-SUMMARY.md | FOUND |
| Commit fc127ce | FOUND |
| Commit a2d4322 | FOUND |
| Commit d6a9d33 | FOUND |
