---
phase: quick-260407-uec
plan: 01
subsystem: i18n, landing, docs, email
tags: [translations, legal, i18n, docs, email, timezone, enterprise]
dependency_graph:
  requires: []
  provides: [legal-translations-complete, dashboard-support-key, enterprise-link-fixed, docs-sub-pages, timezone-type-safety]
  affects: [lib/i18n/translations.ts, components/landing/PricingCards.tsx, app/(marketing)/docs, lib/email/resend.ts]
tech_stack:
  patterns: [neumorphic-styling, next-link-component, required-interface-fields]
key_files:
  modified:
    - lib/i18n/translations.ts
    - components/landing/PricingCards.tsx
    - app/(marketing)/docs/page.tsx
    - lib/email/resend.ts
    - app/api/bookings/route.ts
    - lib/actions/bookings.ts
  created:
    - app/(marketing)/docs/getting-started/page.tsx
    - app/(marketing)/docs/branch-setup/page.tsx
    - app/(marketing)/docs/billing/page.tsx
    - app/(marketing)/docs/whatsapp-flow/page.tsx
decisions:
  - "Used tenant.timezone from DB (with Asia/Almaty fallback) rather than hardcoded UTC default"
  - "Made timezone required (not optional) to force callers to pass it explicitly"
  - "fmtDateTime default changed from UTC to Asia/Almaty as safety net for all Kazakhstan tenants"
  - "Enterprise card unified with other cards to use Next.js Link component"
metrics:
  duration: ~20 minutes
  completed: "2026-04-07"
  tasks_completed: 3
  files_modified: 6
  files_created: 4
---

# Quick Task 260407-UEC: Fix Legal Translations, Enterprise Button, Docs, Timezone Summary

**One-liner:** Replace all {REPLACE} placeholders with real Omni-Book company data across 3 locales, fix Enterprise card to link /support via Next.js Link, create 4 real docs sub-pages with instructional content, and make email timezone type-safe with required field.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace legal placeholders, add dashboard.support, fix Enterprise button | 1ffeb34 | translations.ts, PricingCards.tsx |
| 2 | Create documentation sub-pages with real content | b559c61 | docs/page.tsx, 4 new sub-pages |
| 3 | Audit and fix email timezone handling | 265dc1d | resend.ts, route.ts, bookings.ts |

## What Was Done

### Task 1: Legal translations and Enterprise button

Replaced ALL `{REPLACE: ...}` placeholders across RU, KZ, and EN locales in `oferta`, `privacy`, `refund`, and `about` namespaces:

- `{REPLACE: company_name}` → `Omni-Book`
- `{REPLACE: bin_number}` → `030506501136`
- `{REPLACE: contact_email}` → `qz.nursultan@mail.ru`
- `{REPLACE: contact_phone}` → `87073436423`
- `{REPLACE: effective_date}` → locale-specific dates (7 апреля 2026 г. / 2026 жылғы 7 сәуір / April 7, 2026)

Removed all Legal Address references:
- Deleted `contactAddress` key from `about` namespace in all 3 locales
- Removed `Адрес: ...` / `Мекенжай: ...` / `Address: ...` lines from `oferta.section9Body`, `privacy.section12Body`, `refund.section6Body` in all 3 locales
- Removed `replaceNote` keys from `legal` namespace in all 3 locales

Added `dashboard.support` key:
- RU: `'Поддержка'`
- KZ: `'Қолдау'`
- EN: `'Support'`

Fixed Enterprise pricing card:
- Changed `href` from `"mailto:qz.nursultan@gmail.com"` to `"/support"`
- Unified all 3 cards to use Next.js `<Link>` component (removed ternary with `<a>` for Enterprise)

### Task 2: Documentation sub-pages

Created 4 documentation sub-pages with real instructional content, all using consistent neumorphic styling (neu-raised, neu-inset, bg-[var(--neu-bg)], rounded-2xl):

- **getting-started/page.tsx**: 6-step guide from registration to sharing the booking link
- **branch-setup/page.tsx**: Working hours, resources, services, Telegram notifications setup
- **billing/page.tsx**: Plan comparison table (Free/Pro/Enterprise) + 6-step Paylink.kz upgrade guide
- **whatsapp-flow/page.tsx**: Step-by-step WhatsApp prepayment flow for managers

Updated main docs page to add WhatsApp Flow section card with `MessageCircle` icon, and updated billing section to reference Paylink.kz (not Kaspi).

### Task 3: Email timezone type safety

- Made `BookingEmailData.timezone` required (`string` not `string?`)
- Made `RescheduleEmailData.timezone` required (`string` not `string?`)
- Changed `fmtDateTime` default from `'UTC'` to `'Asia/Almaty'` as safety net
- Fixed `app/api/bookings/route.ts`: passes `tenant.timezone` (with fallback) to `sendBookingConfirmation`
- Fixed `lib/actions/bookings.ts`: added `timezone: true` to tenant select, passes it to `sendBookingConfirmation`

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed timezone callers that didn't pass timezone field**
- **Found during:** Task 3
- **Issue:** Making `timezone` required caused TS errors in 2 callers that weren't passing timezone at all
- **Fix:** Added `timezone: true` to tenant DB select in `bookings.ts`; used `tenant.timezone` with fallback in both callers
- **Files modified:** lib/actions/bookings.ts, app/api/bookings/route.ts
- **Commits:** 265dc1d

## Known Stubs

None — all data fields contain real values.

## Pre-existing Issues (Not Fixed)

12 pre-existing TypeScript errors exist before this task and were not introduced by these changes:
- `__tests__/neumorphism-surface.test.ts`: 6 errors (regex flag targeting ts config issue)
- `lib/actions/services.ts`: 3 errors
- `lib/i18n/translations.ts`: 3 errors (duplicate `payment:` namespace keys from earlier phases)

## Self-Check: PASSED
