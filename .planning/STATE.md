---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Critical Bug Fixes
status: milestone_complete
stopped_at: Milestone archived
last_updated: "2026-03-19T13:29:52.266Z"
last_activity: 2026-03-19 — v1.1 milestone complete and archived
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19 after v1.1 milestone)

**Core value:** A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.
**Current focus:** Planning next milestone (`/gsd:new-milestone`)

## Current Position

Milestone v1.1 Critical Bug Fixes — **COMPLETE**
All 6 requirements delivered. Git tag v1.1 applied. Archives in `.planning/milestones/`.

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Key patterns carrying forward to next milestone:
- Static file assertion tests (`fs.readFileSync` + regex) — extended in v1.1 for opt_* and mobile class audits
- `min-w-0` on flex children enables `truncate` — never `overflow-hidden` on container
- Inline opt_ guard: `strVal.startsWith('opt_') ? t('niche', strVal) : strVal`
- `// INTENTIONAL:` comments for brand/functional color exceptions
- Sidebar uses `bg-sidebar` token family, not `bg-background`/`bg-card`

### Pending Todos

- Fix pre-existing `cleanup-surface.test.ts` failures (6 tests) — dark:bg-{niche}-950/40 and dark:bg-muted regressions from commit f7da11b (v1.0). Not introduced by v1.1. Recommend as candidate for next milestone planning.

### Blockers/Concerns

None.
