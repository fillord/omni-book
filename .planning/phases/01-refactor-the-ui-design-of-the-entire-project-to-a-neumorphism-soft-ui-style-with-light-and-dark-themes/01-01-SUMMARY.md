---
phase: 01-neumorphism-refactor
plan: 01
subsystem: ui
tags: [neumorphism, css-variables, tailwindcss, shadcn, dark-theme, light-theme, jest, testing]

# Dependency graph
requires: []
provides:
  - "__tests__/neumorphism-surface.test.ts: static file assertions for NEU-01 through NEU-11 and NEU-14"
  - "app/globals.css: Neumorphism CSS variables (--neu-*) for both light and dark themes"
  - "app/globals.css: shadcn token remapping (--background, --card, --popover, --border, --input → neu values)"
  - "app/globals.css: .neu-raised, .neu-inset, .neu-btn utility classes"
  - "app/globals.css: global 300ms transition on background-color, color, box-shadow"
  - "app/globals.css: --radius increased to 0.875rem"
affects:
  - 01-02 (button/input/card/dialog/select/dropdown component edits)
  - 01-03 (HeroSection and further UI edits)
  - all future neumorphism plans that depend on --neu-* CSS variables

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Neumorphism CSS variables defined in :root and .dark blocks, referenced via var(--neu-*)"
    - "shadcn design tokens remapped to var(--neu-bg)/transparent rather than replaced"
    - "CSS utility classes (.neu-raised, .neu-inset, .neu-btn) in @layer base"
    - "Global transition on explicit properties only (background-color, color, box-shadow) — never transition: all"

key-files:
  created:
    - "__tests__/neumorphism-surface.test.ts"
  modified:
    - "app/globals.css"

key-decisions:
  - "Use var(--neu-bg) for token remapping so shadcn tokens remain as canonical API while resolving to neumorphism values"
  - "--border: transparent removes hard borders; box-shadow via .neu-raised/.neu-inset provides visual depth instead"
  - "Global transition on * uses explicit properties list (not transition: all) to avoid conflicting with existing animation keyframes"
  - "--radius increased to 0.875rem for softer neumorphic aesthetic"
  - "Comment text in CSS must not contain the literal string 'transition: all' to avoid triggering test assertions"

patterns-established:
  - "NEU test scaffold: fs.readFileSync + regex assertions for CSS string matching — same pattern as landing-surface.test.ts"
  - "Neumorphism CSS layering: palette vars → token remap → utility classes → global transition, all in globals.css"

requirements-completed: [NEU-01, NEU-02, NEU-03, NEU-10]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 01 Plan 01: Neumorphism CSS Foundation Summary

**Neumorphism CSS variables with light/dark palette, shadcn token remapping, .neu-raised/.neu-inset/.neu-btn utility classes, and static test scaffold covering NEU-01 through NEU-14**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T12:58:42Z
- **Completed:** 2026-03-23T13:00:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `__tests__/neumorphism-surface.test.ts` with 38 static file assertions covering NEU-01 through NEU-11 and NEU-14 in RED state (no implementation yet for component edits)
- Injected `--neu-bg`, `--neu-text`, `--neu-shadow-light`, `--neu-shadow-dark`, `--neu-accent` into `:root` (light) and `.dark` blocks
- Remapped shadcn tokens (`--background`, `--card`, `--popover`, `--muted`, `--primary`, `--border`, `--input`, `--ring`, `--sidebar`, `--sidebar-border`) to Neumorphism values
- Added `.neu-raised`, `.neu-inset`, `.neu-btn` utility classes with box-shadow values in `@layer base`
- Added global theme transition (300ms, explicit properties) and increased `--radius` to 0.875rem
- NEU-01, NEU-02, NEU-03, NEU-10 tests all pass (23/38 tests green); NEU-04 through NEU-09 and NEU-14 remain RED (planned — component edits are future plans)
- Existing 51 landing-surface tests still pass (backward-compatible changes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create neumorphism-surface test scaffold** - `a488269` (test)
2. **Task 2: Inject Neumorphism CSS foundation into globals.css** - `a38ec5f` (feat)

## Files Created/Modified
- `__tests__/neumorphism-surface.test.ts` - Static file assertions for all NEU requirements (RED state — foundation only)
- `app/globals.css` - Neumorphism CSS variables, token remapping, utility classes, global transition

## Decisions Made
- Use `var(--neu-bg)` for token remapping so shadcn tokens remain as the canonical API while resolving to Neumorphism values — no breaking changes to component className strings
- `--border: transparent` removes hard borders; visual depth is provided by `.neu-raised`/`.neu-inset` box-shadow classes instead
- Global transition on `*` uses explicit property list (`background-color`, `color`, `box-shadow`) — never `transition: all` — to avoid conflicting with existing animation keyframes (Pitfall 10)
- Comment text in CSS must not literally contain the substring `transition: all` since the NEU-10 test asserts its absence; rewrote the comment accordingly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CSS comment text triggering NEU-10 anti-pattern assertion**
- **Found during:** Task 2 (verification run)
- **Issue:** The comment `/* Global theme transition — explicit properties only (NOT transition: all — see Pitfall 10) */` contained the literal string `transition: all`, causing the test `/transition:\s*all\b/` to match and fail
- **Fix:** Rewrote comment to `/* Global theme transition — explicit properties only, never shorthand-all (see Pitfall 10) */`
- **Files modified:** `app/globals.css`
- **Verification:** NEU-10 "does NOT contain transition: all" test passes
- **Committed in:** `a38ec5f` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary fix for correctness of CSS comment text. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS foundation is complete; all `--neu-*` variables are defined and available for component edits
- `.neu-raised`, `.neu-inset`, `.neu-btn` classes are ready to be applied to button, input, card, dialog, select, and dropdown-menu components in plan 01-02
- Test scaffold is in place; adding `neu-btn` to button.tsx will immediately turn NEU-04 green, etc.
- No blockers

---
*Phase: 01-neumorphism-refactor*
*Completed: 2026-03-23*
