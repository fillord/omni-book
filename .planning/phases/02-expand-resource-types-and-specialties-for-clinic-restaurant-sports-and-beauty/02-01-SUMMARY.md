---
phase: 02-expand-resource-types-and-specialties-for-clinic-restaurant-sports-and-beauty
plan: 01
subsystem: ui
tags: [niche-config, i18n, resource-types, translations]

# Dependency graph
requires: []
provides:
  - Expanded resource types for all 4 niches (19 total) with readable label keys
  - Beauty specialization converted from select to free-text
  - Horeca and Sports attr_specialization field for staff backward compatibility
  - RU/EN/KZ translations for all 19 new resource type labels and attr_specialization
affects: [resource-form, resources-manager, public pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "New resource type labels use resource_type_<value> pattern (no opt_xxx)"
    - "Attribute label keys use attr_<key> pattern for new readable additions"

key-files:
  created: []
  modified:
    - lib/niche/config.ts
    - lib/i18n/translations.ts

key-decisions:
  - "Beauty resourceTypes replaced with physical workspace types (manicure_table, sink, couch) — existing staff attribute fields retained with forTypes: ['staff'] for backward compatibility"
  - "Horeca and Sports gain attr_specialization field scoped to forTypes: ['staff'] — staff not in new dropdown but backward-compatible with existing records"
  - "Medicine keeps existing opt_ec228c label on specialization field (already text type, no change needed)"
  - "All opt_xxx keys preserved in config and translations — not deleted"

patterns-established:
  - "resource_type_<value>: new resource type label key pattern for config + translations"
  - "attr_<field>: new attribute field label key pattern for config + translations"

requirements-completed: [RES-01, RES-02, RES-03, RES-04, SPEC-01, I18N-01]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 2 Plan 01: Expand Resource Types and Specialties Summary

**19 new resource types across 4 niches with RU/EN/KZ translations, beauty specialization converted from select to free-text, horeca/sports staff specialization field added**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-20T08:54:52Z
- **Completed:** 2026-03-20T08:57:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Medicine niche: 3 opaque opt_xxx types replaced with 6 readable types (doctor, nurse, operating_room, laboratory, office, treatment_room)
- Restaurant (horeca) niche: 3 types replaced with 5 (table, vip_lounge, terrace, bar_counter, karaoke_room); forTypes updated on capacity/location/features; specialization field added for staff
- Sports niche: 4 types replaced with 5 (court, field, pool, sauna, equipment); forTypes updated on indoor/capacity/equipment_included; specialization field added for staff
- Beauty niche: 2 types replaced with 3 physical types (manicure_table, sink, couch); specialization attribute changed from select with 6 opt_xxx options to free-text type:'text'
- 60 new translation entries added (20 keys x 3 locales) with no opt_xxx in new keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Update NICHE_CONFIG resource types and attribute fields** - `f514a98` (feat)
2. **Task 2: Add translation keys for all new resource type labels and attr_specialization** - `774683b` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `lib/niche/config.ts` - Updated resourceTypes for all 4 niches; converted beauty specialization to text; added attr_specialization to horeca/sports; updated forTypes on existing fields
- `lib/i18n/translations.ts` - Added 20 new keys (resource_type_* x19 + attr_specialization) to each of RU, KZ, EN locales

## Decisions Made
- Beauty attributeFields with `forTypes: ['staff']` retained as-is — the staff type is removed from the dropdown but existing tenant records with type:'staff' will still match the filter when rendering stored data
- Medicine specialization label kept as `opt_ec228c` (existing opt key that already resolves to "Specialization") rather than changing to `attr_specialization` — plan specified no changes to medicine attributeFields
- `attr_specialization` key added as the readable label for horeca/sports/beauty specialization fields (matching the no-opt_ rule for new additions)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 niches have expanded resource type lists with proper translations
- resource-form.tsx requires zero changes — generic rendering pipeline picks up config automatically
- resources-manager.tsx table auto-shows new specialization fields where showInTable: true
- Ready for any follow-on feature phases

---
*Phase: 02-expand-resource-types-and-specialties-for-clinic-restaurant-sports-and-beauty*
*Completed: 2026-03-20*
