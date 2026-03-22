---
phase: 01-neumorphism-refactor
plan: 02
subsystem: ui
tags: [neumorphism, tailwind, cva, shadcn, button, input, card]

# Dependency graph
requires:
  - phase: 01-neumorphism-refactor plan 01
    provides: Neumorphism CSS foundation (.neu-raised, .neu-inset, .neu-btn classes and CSS custom properties in globals.css)
provides:
  - Button component with neu-btn (raised-to-inset press effect)
  - Input component with neu-inset (recessed field appearance)
  - Card component with neu-raised (depth shadow, no ring border)
  - CardFooter using bg-background for surface consistency
affects: [01-neumorphism-refactor plan 03, 01-neumorphism-refactor plan 04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Neumorphism variant pattern: use neu-btn/neu-raised/neu-inset CSS classes in cva variants, not in base class"
    - "Dark-mode removal: drop dark: Tailwind overrides from component variants — CSS custom property remapping handles both themes"
    - "neu-btn for pressed interactive surfaces; neu-raised for elevated containers; neu-inset for recessed form fields"

key-files:
  created: []
  modified:
    - components/ui/button.tsx
    - components/ui/input.tsx
    - components/ui/card.tsx

key-decisions:
  - "neu-btn placed on default/outline/secondary variants only, not base class — ghost and link variants remain flat"
  - "Input focus uses ring only (focus-visible:ring-ring/50), removed focus-visible:border-ring since Neumorphism inputs use shadow depth not border for visual feedback"
  - "CardFooter bg-muted/50 replaced with bg-background (= var(--neu-bg)) for surface-level consistency per Neumorphism pitfall 5"
  - "CardFooter border-transparent added explicitly alongside border-t to prevent border line showing (--border is transparent but explicit is clearer)"

patterns-established:
  - "Component variant dark: removal: Any shadcn/base-ui component variant with dark: override should have those removed when its surface uses Neumorphism tokens"
  - "cva variant neumorphism: Apply Neumorphism class per variant, not in cva base string, to allow non-neumorphism variants (ghost, link) to remain flat"

requirements-completed: [NEU-04, NEU-05, NEU-06]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 1 Plan 02: Neumorphism Core Components Summary

**Button (.neu-btn raised/inset), Input (.neu-inset recessed field), and Card (.neu-raised no ring) updated with Neumorphism styling; dark: overrides removed from all three**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-22T20:43:19Z
- **Completed:** 2026-03-22T20:44:41Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Button default variant uses `.neu-btn` (raised shadow, bg-[var(--neu-bg)], accent hover, inset on :active); outline and secondary use `.neu-raised`
- Input uses `.neu-inset` with `border-transparent` and `bg-[var(--neu-bg)]`; all `dark:` overrides removed
- Card uses `.neu-raised` replacing `ring-1 ring-foreground/10`; CardFooter uses `bg-background` for surface consistency
- NEU-04, NEU-05, NEU-06 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply Neumorphism to Button component** - `d8b95ca` (feat)
2. **Task 2: Apply Neumorphism to Input component** - `e3a42b2` (feat)
3. **Task 3: Apply Neumorphism to Card component** - `b6426d8` (feat)

## Files Created/Modified
- `components/ui/button.tsx` - default/outline/secondary variants converted to neu-btn/neu-raised; dark: overrides removed
- `components/ui/input.tsx` - neu-inset, border-transparent, bg-[var(--neu-bg)]; dark: overrides removed
- `components/ui/card.tsx` - Card: ring-1 ring-foreground/10 replaced with neu-raised; CardFooter: bg-muted/50 replaced with bg-background + border-transparent

## Decisions Made
- `neu-btn` is applied per-variant (default, outline, secondary) not in the cva base class, so ghost and link variants stay flat (no shadow)
- Input focus feedback is ring-only (removed `focus-visible:border-ring`): Neumorphism inset inputs use shadow depth for visual context, border-based focus is redundant and conflicts
- CardFooter `border-transparent` added explicitly even though `--border: transparent` is already set globally — explicit intent over implicit cascade

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Button, Input, and Card are Neumorphism-ready; these are the most-used components on every surface
- Remaining components (Dialog, Select, DropdownMenu, HeroSection) are covered in plans 03-04
- NEU-07 through NEU-14 tests still pending — expected, those target subsequent plans

---
*Phase: 01-neumorphism-refactor*
*Completed: 2026-03-23*
