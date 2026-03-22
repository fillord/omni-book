---
phase: 01-neumorphism-refactor
plan: 03
subsystem: ui
tags: [neumorphism, shadcn, dialog, sheet, select, dropdown-menu, badge, tailwind, css]

# Dependency graph
requires:
  - phase: 01-neumorphism-refactor/plan-01
    provides: neu-raised, neu-inset, neu-btn CSS utility classes in globals.css
provides:
  - Neumorphism dialog surfaces (dialog.tsx uses neu-raised, no ring)
  - Neumorphism sheet surfaces (sheet.tsx uses neu-raised, side borders removed)
  - Neumorphism select trigger (inset) and content (raised) (select.tsx)
  - Neumorphism dropdown menu surfaces (dropdown-menu.tsx uses neu-raised)
  - Neumorphism badge surfaces (badge.tsx uses neu-raised base, neu-inset outline)
affects: [01-neumorphism-refactor/plan-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Remove dark: Tailwind overrides from components that use Neumorphism CSS custom properties
    - Replace ring-1/shadow-md/shadow-lg with neu-raised on overlay/popup surfaces
    - Replace border/bg pattern on trigger with neu-inset and border-transparent
    - Side borders on Sheet removed — neu-raised box-shadow provides visual separation

key-files:
  created: []
  modified:
    - components/ui/dialog.tsx
    - components/ui/sheet.tsx
    - components/ui/select.tsx
    - components/ui/dropdown-menu.tsx
    - components/ui/badge.tsx

key-decisions:
  - "Sheet side borders (data-[side=*]:border-*) removed — neu-raised box-shadow provides visual depth without hard borders"
  - "SelectTrigger uses neu-inset with bg-[var(--neu-bg)] instead of border border-input bg-transparent"
  - "Badge outline variant uses neu-inset instead of border-border — inset depth replaces border outline pattern"
  - "DropdownMenuSubContent neu-raised replaces shadow-lg + ring combo"

patterns-established:
  - "Overlay surfaces (Dialog, Sheet, Select popover, Dropdown) all use neu-raised for consistent floating depth"
  - "Trigger/input surfaces (SelectTrigger) use neu-inset for pressed-in affordance"
  - "dark: overrides removed whenever Neumorphism CSS custom properties handle theme switching"

requirements-completed: [NEU-07, NEU-08, NEU-09, NEU-11]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 01 Plan 03: Popup/Overlay Neumorphism Components Summary

**Neumorphism applied to Dialog, Sheet, Select, DropdownMenu, and Badge — all floating surfaces now use neu-raised box-shadow, dark: overrides removed, RESOURCE_PALETTE verified unchanged**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-22T20:46:29Z
- **Completed:** 2026-03-22T20:48:42Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Dialog and Sheet: replaced ring/shadow with neu-raised, removed side borders from Sheet, DialogFooter surface consistency fix
- Select and DropdownMenu: SelectTrigger uses neu-inset, SelectContent and all dropdown surfaces use neu-raised
- Badge: base class gains neu-raised, outline variant converted to neu-inset, dark: overrides removed
- Confirmed RESOURCE_PALETTE untouched in booking-calendar.tsx (NEU-11 passes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply Neumorphism to Dialog and Sheet components** - `6596c54` (feat)
2. **Task 2: Apply Neumorphism to Select and DropdownMenu components** - `5a92b03` (feat)
3. **Task 3: Apply Neumorphism to Badge and verify RESOURCE_PALETTE** - `da0c5f4` (feat)

## Files Created/Modified

- `components/ui/dialog.tsx` - DialogContent: ring-1 removed, neu-raised added; DialogFooter: bg-muted/50 replaced with bg-background
- `components/ui/sheet.tsx` - SheetContent: shadow-lg replaced with neu-raised, all 4 data-[side=*]:border-* classes removed
- `components/ui/select.tsx` - SelectTrigger: border/bg pattern replaced with neu-inset; SelectContent: shadow-md ring removed, neu-raised added; dark: overrides removed
- `components/ui/dropdown-menu.tsx` - DropdownMenuContent: shadow-md ring replaced with neu-raised; DropdownMenuSubContent: shadow-lg ring replaced with neu-raised
- `components/ui/badge.tsx` - Base: added neu-raised, removed dark:aria-invalid override; Outline variant: neu-inset; Destructive/ghost: dark: overrides removed

## Decisions Made

- Sheet side borders removed instead of replaced — hard borders conflict with Neumorphism borderless philosophy; neu-raised provides visual panel separation naturally
- SelectTrigger gets `bg-[var(--neu-bg)]` explicit background since `bg-transparent` would not show the inset shadow correctly
- Badge outline variant uses `neu-inset` replacing the `border-border` pattern — depth via inset shadow replaces border outline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures (2) for HeroSection.tsx in `neumorphism-surface.test.ts` — these are out of scope for plan 01-03 and will be addressed in a later plan. NEU-07, NEU-08, NEU-09, and NEU-11 all pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All popup/overlay components styled with Neumorphism
- Plans 01-01, 01-02, 01-03 complete — shadcn/ui component layer fully styled
- Ready for plan 01-04 (remaining components and page-level integration)

## Self-Check: PASSED

- FOUND: components/ui/dialog.tsx
- FOUND: components/ui/sheet.tsx
- FOUND: components/ui/select.tsx
- FOUND: components/ui/dropdown-menu.tsx
- FOUND: components/ui/badge.tsx
- FOUND: .planning/phases/01-.../01-03-SUMMARY.md
- FOUND commit: 6596c54 (Dialog and Sheet)
- FOUND commit: 5a92b03 (Select and DropdownMenu)
- FOUND commit: da0c5f4 (Badge and RESOURCE_PALETTE)

---
*Phase: 01-neumorphism-refactor*
*Completed: 2026-03-23*
