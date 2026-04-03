---
phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment
plan: "02"
subsystem: ui
tags: [whatsapp, booking, i18n, tenant-public-page, booking-form]

requires:
  - phase: 12-01
    provides: Kaspi source files and Prisma fields removed — booking route clean base

provides:
  - tenantPhone prop in BookingForm for WhatsApp deep-link
  - WhatsApp prepayment button in SuccessScreen post-booking confirmation
  - buildWhatsAppPrepaymentUrl() helper with pre-filled Russian message template
  - payment.whatsappPrepayment i18n key in RU/KZ/EN locales

affects:
  - components/booking-form.tsx
  - components/tenant-public-page.tsx
  - lib/i18n/translations.ts

tech-stack:
  added: []
  patterns:
    - "WhatsApp deep-link uses wa.me/{phone}?text={encoded} — phone stripped to digits only"
    - "tenantPhone passed via (tenant as unknown as { phone: string | null }).phone pattern for type safety"
    - "WhatsApp button only renders when tenantPhone is a non-empty string"

key-files:
  created: []
  modified:
    - components/booking-form.tsx
    - components/tenant-public-page.tsx
    - lib/i18n/translations.ts

key-decisions:
  - "WhatsApp button placed in SuccessScreen (not BookingForm main flow) — shown only after confirmed booking"
  - "Pre-filled message template in Russian only (primary language for KZ market)"
  - "Price formatted using Intl.NumberFormat ru-RU without currency style for cleaner display in WhatsApp"
  - "Service-form.tsx and route.ts were already clean (no deposit/Kaspi code) in this branch — no changes needed"

patterns-established:
  - "buildWhatsAppPrepaymentUrl: standalone helper before BookingForm export — pure function, easy to test"

requirements-completed: [PIV-03, PIV-04, PIV-05]

duration: 8min
completed: 2026-04-04
---

# Phase 12 Plan 02: Booking Route Cleanup + WhatsApp Prepayment Button Summary

**WhatsApp prepayment deep-link button added to post-booking SuccessScreen with pre-filled Russian confirmation template + payment i18n namespace across all 3 locales**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-04T00:00:00Z
- **Completed:** 2026-04-04T00:08:00Z
- **Tasks:** 5 (2 with code changes, 3 already clean)
- **Files modified:** 3

## Accomplishments

- Added `tenantPhone?: string | null` prop to `BookingForm` Props interface
- Added `buildWhatsAppPrepaymentUrl()` helper that generates wa.me deep-link with pre-filled Russian booking confirmation template
- Added WhatsApp button to `SuccessScreen` component (renders only when tenantPhone is provided)
- Passed `tenantPhone` from tenant record in `tenant-public-page.tsx`
- Added `payment.whatsappPrepayment` i18n key in RU, KZ, EN locales

## Task Commits

1. **Task 1: Clean up route.ts** - No-op (route already clean — no Kaspi/deposit code in this branch)
2. **Task 2: WhatsApp prepayment button + i18n** - `98c5ec7` (feat)
3. **Task 3: Pass tenantPhone in tenant-public-page** - `359f72b` (feat)
4. **Task 4: Remove deposit UI from service-form** - No-op (already clean in this branch)
5. **Task 5: Update payment-settings.ts** - No-op (file does not exist in this branch)

## Files Created/Modified

- `components/booking-form.tsx` - Added `tenantPhone` prop, `buildWhatsAppPrepaymentUrl()` helper, WhatsApp button in SuccessScreen
- `components/tenant-public-page.tsx` - Added `tenantPhone` prop pass-through to BookingForm
- `lib/i18n/translations.ts` - Added `payment` namespace with `whatsappPrepayment` key in all 3 locales

## Decisions Made

- WhatsApp button placed only in `SuccessScreen` (not in the booking form steps) — logically placed post-confirmation where prepayment action makes sense
- Pre-filled message template is in Russian only — appropriate for KZ market primary language
- Tasks 1, 4, 5 were no-ops because this worktree branch starts from an older state where Kaspi deposit code was never added

## Deviations from Plan

None - plan executed as written. Tasks 1, 4, and 5 found source files already in the expected clean state for this branch.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. WhatsApp deep-link requires no API key; it uses the standard wa.me redirect protocol.

## Next Phase Readiness

- BookingForm now surfaces WhatsApp prepayment CTA after booking confirmation
- Tenant must have `phone` field populated in their profile for the button to appear
- Ready for subsequent Paylink.kz integration phases

---
*Phase: 12-remove-kaspi-pay-integrate-paylink-kz-whatsapp-prepayment*
*Completed: 2026-04-04*
