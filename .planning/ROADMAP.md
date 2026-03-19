# Roadmap: omni-book

## Milestones

- ✅ **v1.0 Dark Mode** — Phases 0-4 (shipped 2026-03-19)
- ✅ **v1.1 Critical Bug Fixes** — Phases 6-7 (shipped 2026-03-19)

## Phases

<details>
<summary>✅ v1.0 Dark Mode (Phases 0-4) — SHIPPED 2026-03-19</summary>

Full-stack dark mode fix — 66 files updated, 26 requirements delivered, hardcoded Tailwind color classes replaced with semantic shadcn/ui CSS variable tokens across all surfaces. See `.planning/milestones/v1.0-ROADMAP.md` for full details.

- [x] Phase 0: Infrastructure Validation (1/1 plans) — completed 2026-03-17
- [x] Phase 1: Landing / Marketing Surface (4/4 plans) — completed 2026-03-17
- [x] Phase 2: Tenant Public Booking Surface (3/3 plans) — completed 2026-03-18
- [x] Phase 3: Dashboard + Auth Surface (4/4 plans) — completed 2026-03-18
- [x] Phase 4: Cleanup Sweep (3/3 plans) — completed 2026-03-18

</details>

<details>
<summary>✅ v1.1 Critical Bug Fixes (Phases 6-7) — SHIPPED 2026-03-19</summary>

Three classes of user-visible defects eliminated — opt_* ID leakage in data display, mobile card overflow in the dashboard, and mobile theme toggle occlusion on the public booking page. See `.planning/milestones/v1.1-ROADMAP.md` for full details.

- [x] Phase 6: Data Display Correctness (1/1 plans) — completed 2026-03-19
- [x] Phase 7: Mobile UI Fixes (1/1 plans) — completed 2026-03-19

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Infrastructure Validation | v1.0 | 1/1 | Complete | 2026-03-17 |
| 1. Landing / Marketing Surface | 1/1 | Complete   | 2026-03-19 | 2026-03-17 |
| 2. Tenant Public Booking Surface | v1.0 | 3/3 | Complete | 2026-03-18 |
| 3. Dashboard + Auth Surface | v1.0 | 4/4 | Complete | 2026-03-18 |
| 4. Cleanup Sweep | v1.0 | 3/3 | Complete | 2026-03-18 |
| 6. Data Display Correctness | v1.1 | 1/1 | Complete | 2026-03-19 |
| 7. Mobile UI Fixes | v1.1 | 1/1 | Complete | 2026-03-19 |

### Phase 1: Replace fixed duration dropdown with free-text number input (1-1440m)

**Goal:** Replace the fixed-option Select dropdown for durationMin with a number input widget featuring custom stepper buttons, "min" suffix, and quick-select presets (15/30/60), accepting any value from 1 to 1440 minutes.
**Requirements**: [DUR-01, DUR-02, DUR-03, DUR-04, DUR-05, DUR-06]
**Depends on:** None
**Plans:** 1/1 plans complete

Plans:
- [ ] 01-01-PLAN.md — Replace duration Select with number input stepper + presets, update zod schema
