---
phase: 09-online-payment-with-deposit-via-paylink-kz-kaspi
plan: "04"
subsystem: payments
tags: [kaspi, booking-form, neumorphism, waiting-screen, countdown, deposit-notice]

# Dependency graph
requires:
  - 09-01 (CreateBookingParams with status/paymentInvoiceId, schema payment fields)
  - 09-02 (POST /api/bookings returns invoiceCreated: true + booking.id for deposit flow)
  - 09-03 (requireDeposit/depositAmount on Tenant, i18n payment keys)
provides:
  - WaitingForPaymentScreen with 10-minute countdown timer and expired state
  - Deposit notice near submit button showing amount in KZT
  - requireDeposit/depositAmount props plumbed from tenant-public-page to BookingForm
  - Explicit Kaspi B2B invoice instructions (open Kaspi app → Payments section)
affects:
  - Public booking flow — clients see deposit requirement and waiting screen after submission

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pendingPaymentId state in BookingForm: deposit path sets this, successId path unchanged"
    - "WaitingForPaymentScreen: useEffect setInterval countdown, expired state on reach zero"
    - "depositAmount stored in tiyn, displayed as tenge via `/ 100` with Intl.NumberFormat"
    - "i18n uses t('payment', ...) not t('booking', ...) — matched Plan 03 actual namespace"
    - "No window.location.href redirect — Kaspi direct invoice model (PAY-04)"

key-files:
  modified:
    - components/booking-form.tsx
    - components/tenant-public-page.tsx
    - components/dashboard-sidebar.tsx
    - lib/i18n/translations.ts
---

## What was built

Extended the booking form with a complete deposit payment UX:

**`components/booking-form.tsx`**
- New `requireDeposit?: boolean` and `depositAmount?: number` props (tiyn)
- `pendingPaymentId` state — set when `invoiceCreated: true` in booking response
- `WaitingForPaymentScreen` component with 10-minute countdown (`setInterval`)
- Expired state shows re-book button, calls `handleReset`
- Deposit notice above submit button: amount formatted as KZT, Neumorphism styled
- No external redirect — client pays in Kaspi mobile app

**`components/tenant-public-page.tsx`**
- Passes `requireDeposit` and `depositAmount` props from tenant data to `<BookingForm>`

**`components/dashboard-sidebar.tsx`** (post-checkpoint fix)
- Permanent "Оплата и Тарифы" billing nav link for OWNER/SUPERADMIN roles
- Previously only accessible via FREE-plan upgrade banner

**`lib/i18n/translations.ts`** (post-checkpoint fix)
- `waitingInstructions` updated to explicit Kaspi B2B instructions (RU/KZ/EN)
- `billing` key added to dashboard section for sidebar nav label
- Removed duplicate payment sections inserted by worktree backport

## Self-Check: PASSED

- ✓ WaitingForPaymentScreen rendered with countdown
- ✓ Deposit notice with amount near submit button
- ✓ requireDeposit/depositAmount props plumbed from tenant-public-page
- ✓ No checkoutUrl or window.location.href redirect
- ✓ Neumorphism: neu-raised, neu-inset, bg-[var(--neu-bg)]
- ✓ Billing page accessible from sidebar (post-checkpoint fix)
- ✓ Explicit Kaspi app instructions in waiting screen
