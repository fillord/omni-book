---
phase: 7
slug: bookings-dashboard-crm-overhaul-and-manual-booking-creation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (ts-jest) |
| **Config file** | `jest.config.ts` (project root — already configured) |
| **Quick run command** | `jest __tests__/bookings-crm-surface.test.ts --no-coverage` |
| **Full suite command** | `jest --no-coverage` |
| **Estimated runtime** | ~15 seconds (quick), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `jest __tests__/bookings-crm-surface.test.ts --no-coverage`
- **After every plan wave:** Run `jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| CRM-B01 | BookingsDashboard default state excludes CANCELLED from API params | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B01" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B02 | "Отменено" toggle chip present in BookingsDashboard | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B02" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B03 | BookingsDashboard renders day-group headers with sticky positioning | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B03" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B04 | Time column uses bold/large font class in booking rows | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B04" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B05 | ManualBookingSheet component exists and imported by BookingsDashboard | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B05" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B06 | createManualBooking Server Action exists in lib/actions/bookings.ts | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B06" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B07 | createManualBooking sets manageToken: null (not randomUUID) | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B07" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B08 | ManualBookingSheet uses Sheet component from @/components/ui/sheet | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B08" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B09 | Neumorphism: neu-raised/neu-inset classes in booking rows and sheet | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B09" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B10 | i18n: newBooking + tomorrow keys in all 3 locales (ru/en/kz) | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B10" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B11 | createManualBooking uses requireAuth + requireRole guard | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B11" --no-coverage` | ❌ Wave 0 | ⬜ pending |
| CRM-B12 | Slot picker calls /api/bookings/slots with correct params | Static assertion | `jest __tests__/bookings-crm-surface.test.ts -t "CRM-B12" --no-coverage` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/bookings-crm-surface.test.ts` — stubs for CRM-B01 through CRM-B12

*No framework config changes needed — Jest is fully configured via `jest.config.ts`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Day-group headers display "Сегодня" / "Завтра" correctly | CRM-B03 | Requires real date comparison at render time | Open /dashboard/bookings, verify today shows "Сегодня, [date]" |
| Manual booking saves and appears in grouped view | CRM-B05/B06 | Requires live DB | Create booking via "➕ Новая запись", verify it appears in correct day group |
| Slot picker shows correct available slots | CRM-B12 | Requires live API | Select resource + service + date in manual form, verify slots load |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
