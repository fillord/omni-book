# Roadmap: omni-book

## Milestones

- ✅ **v1.0 Dark Mode** — Phases 0-4 (shipped 2026-03-19)
- ✅ **v1.1 Critical Bug Fixes** — Phases 6-7 (shipped 2026-03-19)
- ✅ **v1.2 Advanced Customization & Niche Expansion** — Phases 1-2 (shipped 2026-03-20)

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

<details>
<summary>✅ v1.2 Advanced Customization & Niche Expansion (Phases 1-2) — SHIPPED 2026-03-20</summary>

Custom service duration input (1-1440 min) replacing fixed dropdown, 19 new niche resource types with trilingual translations across 4 verticals. See `.planning/milestones/v1.2-ROADMAP.md` for full details.

- [x] Phase 1: Replace fixed duration dropdown with free-text number input (1/1 plans) — completed 2026-03-19
- [x] Phase 2: Expand resource types and specialties for Clinic, Restaurant, Sports, and Beauty (1/1 plans) — completed 2026-03-20

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Infrastructure Validation | v1.0 | 1/1 | Complete | 2026-03-17 |
| 1. Replace Duration Dropdown | v1.2 | 1/1 | Complete | 2026-03-19 |
| 2. Expand Resource Types | v1.2 | 1/1 | Complete | 2026-03-20 |
| 3. Dashboard + Auth Surface | v1.0 | 4/4 | Complete | 2026-03-18 |
| 4. Cleanup Sweep | v1.0 | 3/3 | Complete | 2026-03-18 |
| 6. Data Display Correctness | v1.1 | 1/1 | Complete | 2026-03-19 |
| 7. Mobile UI Fixes | v1.1 | 1/1 | Complete | 2026-03-19 |

### Phase 1: Refactor the UI design of the entire project to a Neumorphism Soft UI style with Light and Dark themes

**Goal:** Apply a complete Neumorphism (Soft UI) visual system to the entire omni-book application — CSS variable injection with token remapping, .neu-raised/.neu-inset utility classes on all shadcn/ui components, landing page adaptation, and smooth 300ms theme transitions — achieving 100% visual consistency across marketing, auth, dashboard, and booking surfaces in both light and dark themes.
**Requirements:** [NEU-01, NEU-02, NEU-03, NEU-04, NEU-05, NEU-06, NEU-07, NEU-08, NEU-09, NEU-10, NEU-11, NEU-12, NEU-13, NEU-14]
**Depends on:** None (standalone visual refactor)
**Plans:** 4 plans

Plans:
- [ ] 01-01-PLAN.md — Test scaffold + CSS foundation (variables, token remapping, utility classes, global transition)
- [ ] 01-02-PLAN.md — Core UI components (Button, Input, Card)
- [ ] 01-03-PLAN.md — Popup/overlay components (Dialog, Select, DropdownMenu, Sheet, Badge)
- [ ] 01-04-PLAN.md — Landing page adaptation (HeroSection, Navbar, ThemeToggle) + full regression
