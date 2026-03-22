---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Advanced Customization & Niche Expansion
status: milestone_complete
last_updated: "2026-03-20T00:00:00.000Z"
last_activity: "2026-03-20 — v1.2 milestone archived"
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20 after v1.2 milestone)

**Core value:** A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.
**Current focus:** Planning next milestone (v1.3)

## Current Position

Phase: —
Plan: —
Status: Milestone v1.2 complete — ready for next milestone
Last activity: 2026-03-20 — v1.2 milestone archived (2 phases, 2 plans, 12 requirements delivered)

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Key patterns carrying forward to next milestone:
- Static file assertion tests (`fs.readFileSync` + regex) — extended in v1.1 for opt_* and mobile class audits
- `min-w-0` on flex children enables `truncate` — never `overflow-hidden` on container
- Inline opt_ guard: `strVal.startsWith('opt_') ? t('niche', strVal) : strVal`
- `// INTENTIONAL:` comments for brand/functional color exceptions
- Sidebar uses `bg-sidebar` token family, not `bg-background`/`bg-card`
- [Phase 01]: col-span-full on duration FormItem so wider widget occupies its own grid row
- [Phase 01]: FormControl wraps relative div wrapper (not Input) for Radix Slot prop forwarding compatibility
- [Phase 02-01]: Beauty specialization changed from select to free-text; horeca/sports gain attr_specialization for staff backward compatibility
- [Phase 02-01]: New resource type keys follow resource_type_<value> pattern; attribute label keys use attr_<field> pattern — no opt_xxx for new additions

### Pending Todos

None.

### Blockers/Concerns

None.

### Roadmap Evolution

- v1.2 complete: Phase 1 (duration input), Phase 2 (resource types expansion) both shipped
- See ROADMAP.md for full milestone history

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260319-vxw | Fix 6 failing cleanup-surface.test.ts tests | 2026-03-19 | 03a7ab4 | [260319-vxw-fix-6-failing-cleanup-surface-test-ts-te](./quick/260319-vxw-fix-6-failing-cleanup-surface-test-ts-te/) |
| 260323-106 | Add couch resource type to Zod validation | 2026-03-23 | a0801f6 | [260323-106-add-couch-resource-type](./quick/260323-106-add-couch-resource-type/) |
