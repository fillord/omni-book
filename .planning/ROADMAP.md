# Roadmap: omni-book

## Milestones

- ✅ **v1.0 Dark Mode** — Phases 0-4 (shipped 2026-03-19)
- 🚧 **v1.1 Critical Bug Fixes** — Phases 6-7 (in progress)

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

### 🚧 v1.1 Critical Bug Fixes (In Progress)

**Milestone Goal:** Eliminate three classes of user-visible defects — raw option ID leakage in data display, mobile card overflow in the dashboard, and mobile theme toggle occlusion on the public booking page.

- [x] **Phase 6: Data Display Correctness** - All opt_* IDs resolve to human-readable labels across all niches and field types (completed 2026-03-19)
- [ ] **Phase 7: Mobile UI Fixes** - Dashboard card text truncates correctly on mobile; theme toggle is visible and tappable on mobile

## Phase Details

### Phase 6: Data Display Correctness
**Goal**: Users never see raw opt_* IDs — every option value renders as a human-readable label everywhere in the UI
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. No raw `opt_*` string is visible in any dropdown, badge, form field, or display element across any niche
  2. A healthcare booking shows "In-Person" (not `opt_location_in_person`); a legal booking shows "Contract Review" (not `opt_type_contract_review`), etc.
  3. Label resolution works for all field types (Type, Location, Specialization, Coverage, and any other opt_* category)
  4. The fix covers all niches configured in the platform — not just one niche or one field
**Plans:** 1/1 plans complete
Plans:
- [ ] 06-01-PLAN.md — Fix opt_* ID leaks in booking-form.tsx + regression test

### Phase 7: Mobile UI Fixes
**Goal**: Mobile users can read all dashboard card content without overflow, and can switch themes on the public booking page without obstruction
**Depends on**: Phase 6
**Requirements**: MOBL-01, MOBL-02, THEM-01, THEM-02
**Success Criteria** (what must be TRUE):
  1. On a mobile viewport, service and resource card text (title, description, metadata) does not overflow its container — long text is truncated or wraps within card boundaries
  2. The card truncation fix does not break the desktop layout — desktop cards continue to render identically to pre-fix
  3. On a mobile viewport, the dark/light theme toggle on the public booking page is fully visible and not covered by the "Book" button or any other element
  4. The theme toggle is tappable on mobile — correct z-index and positioning, responds to tap
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Infrastructure Validation | v1.0 | 1/1 | Complete | 2026-03-17 |
| 1. Landing / Marketing Surface | v1.0 | 4/4 | Complete | 2026-03-17 |
| 2. Tenant Public Booking Surface | v1.0 | 3/3 | Complete | 2026-03-18 |
| 3. Dashboard + Auth Surface | v1.0 | 4/4 | Complete | 2026-03-18 |
| 4. Cleanup Sweep | v1.0 | 3/3 | Complete | 2026-03-18 |
| 6. Data Display Correctness | 1/1 | Complete   | 2026-03-19 | - |
| 7. Mobile UI Fixes | v1.1 | 0/? | Not started | - |
