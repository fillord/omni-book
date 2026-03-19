# Requirements: omni-book v1.1

**Defined:** 2026-03-19
**Core Value:** A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.

## v1.1 Requirements

### Data Display

- [x] **DATA-01**: User never sees raw `opt_*` IDs in any select dropdown, form field, badge, or display element — all option IDs are resolved to their human-readable labels before rendering
- [x] **DATA-02**: The label resolution works globally across all niches (healthcare, legal, fitness, etc.) and all field types (Type, Location, Specialization, Coverage, etc.)

### Mobile Layout

- [x] **MOBL-01**: On mobile viewports, service/resource card text in the dashboard does not overflow its container — long text is truncated or wrapped within card boundaries
- [x] **MOBL-02**: The fix applies to all text content in cards (title, description, metadata) without breaking the desktop layout

### Mobile Theme

- [x] **THEM-01**: On mobile viewports, the dark/light mode theme switcher on the public booking page is fully visible and not occluded by other elements (e.g., the "Book" button)
- [x] **THEM-02**: The theme toggle is accessible and functional on mobile (tappable, correct z-index, correct positioning)

## Future Requirements

*(None captured yet — this milestone is focused on the 3 critical bugs only)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | v1.1 is a bug-fix-only milestone |
| Recharts third-party fills | Not accessible via class replacement; deferred from v1.0 |
| `hover-glow` CSS var refactor | Deferred from v1.0 |
| Automated visual regression | Deferred from v1.0 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 6 | Complete |
| DATA-02 | Phase 6 | Complete |
| MOBL-01 | Phase 7 | Complete |
| MOBL-02 | Phase 7 | Complete |
| THEM-01 | Phase 7 | Complete |
| THEM-02 | Phase 7 | Complete |

**Coverage:**
- v1.1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 — traceability finalized after roadmap creation*
