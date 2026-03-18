---
phase: 03-dashboard-auth-surface
plan: "02"
subsystem: ui
tags: [tailwind, dark-mode, sidebar, billing, semantic-tokens]

# Dependency graph
requires:
  - phase: 03-dashboard-auth-surface-01
    provides: Test infrastructure for DASH-01 through DASH-05, phase 3 research
provides:
  - Dashboard sidebar with full sidebar token family (bg-sidebar, border-sidebar-border, bg-sidebar-accent)
  - billing-content.tsx with zero dark:! force overrides and zero zinc neutral classes
affects:
  - 03-03 (remaining dashboard components — analytics, referencing these as remediated examples)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "bg-sidebar / border-sidebar-border / bg-sidebar-accent / text-sidebar-accent-foreground for sidebar surface tokens"
    - "bg-muted / border-border for generic neutral surfaces inside content areas"
    - "text-foreground for primary text, text-muted-foreground for secondary/subdued text"
    - "Intentional brand dual-pairs (dark:color without !) are valid; dark:! force overrides are violations"

key-files:
  created: []
  modified:
    - components/dashboard-sidebar.tsx
    - app/dashboard/settings/billing/billing-content.tsx

key-decisions:
  - "Sidebar footer div uses bg-sidebar (not bg-background) to maintain visual continuity with sidebar surface in dark mode"
  - "Admin link uses bg-sidebar-accent text-sidebar-accent-foreground — sidebar accent family rather than hardcoded dark zinc"
  - "bg-muted / border-border replaces zinc-50/zinc-900 pairs inside card content blocks (price display, dialog price block)"
  - "DialogContent dark overrides removed entirely — shadcn DialogContent uses bg-background by default, overrides were redundant"
  - "Cancel button dark: variants collapsed to single semantic tokens (text-muted-foreground hover:bg-muted)"
  - "Brand indigo/red force overrides (dark:!) removed but dual-pair kept — correct approach is dark:color not dark:!color"

patterns-established:
  - "Pattern: Sidebar surfaces must use the bg-sidebar family, not bg-background"
  - "Pattern: dark:! overrides indicate a specificity conflict — fix the root CSS rather than force-override"
  - "Pattern: Status color dual-pairs (amber, emerald, orange, red) without ! are intentional and must be preserved"

requirements-completed: [DASH-01, DASH-02, DASH-05]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 03 Plan 02: Dashboard Sidebar + Billing Dark Mode Remediation Summary

**Sidebar migrated from bg-background to full sidebar token family; billing-content stripped of all 16 dark:! force overrides and zinc neutral classes replaced with semantic tokens**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T12:59:06Z
- **Completed:** 2026-03-18T13:03:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Dashboard sidebar root div and footer div now use `bg-sidebar border-sidebar-border` — visually distinct sidebar surface in dark mode
- Admin panel link uses `bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80` — no more hardcoded zinc-900
- billing-content.tsx: zero `dark:!` force overrides remaining, zero bare zinc neutral classes — all replaced with semantic tokens
- DASH-01, DASH-02, DASH-05 tests all GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Remediate dashboard-sidebar.tsx (DASH-01 + DASH-05)** - `5b4ba6b` (feat)
2. **Task 2: Remediate billing-content.tsx (DASH-02)** - `de34f9f` (feat)

## Files Created/Modified

- `components/dashboard-sidebar.tsx` - Root div, footer div, admin link migrated to sidebar token family
- `app/dashboard/settings/billing/billing-content.tsx` - All dark:! overrides stripped; zinc neutral classes replaced with semantic tokens; DialogContent overrides removed; cancel button dark: variants collapsed

## Decisions Made

- Sidebar footer div uses `bg-sidebar` to maintain visual continuity with the sidebar surface in dark mode (not `bg-background`)
- Admin link uses `bg-sidebar-accent text-sidebar-accent-foreground` — sidebar accent family rather than hardcoded dark zinc
- `bg-muted / border-border` replaces zinc-50/zinc-900 pairs inside card content blocks (price display, dialog price block)
- DialogContent `dark:bg-zinc-950 dark:border-zinc-800` overrides removed entirely — shadcn DialogContent uses `bg-background` by default, the overrides were the cause of the specificity conflict
- Cancel button `dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white` collapsed to `text-muted-foreground hover:bg-muted` — single token works in both modes
- Brand indigo/red dual-pairs preserved as `dark:color` (without `!`) — valid intentional dual-pairs maintained

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. DASH-03 test failures (analytics-dashboard.tsx) are pre-existing violations scoped to a future plan, not introduced or modified in this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DASH-01, DASH-02, DASH-05 complete — sidebar and billing surfaces render correctly in dark mode
- Remaining work in phase: DASH-03 (analytics-dashboard.tsx Recharts hardcoded hex values) — addressed in plan 03
- Pre-existing DASH-03 test failures are known and expected at this point

---
*Phase: 03-dashboard-auth-surface*
*Completed: 2026-03-18*
