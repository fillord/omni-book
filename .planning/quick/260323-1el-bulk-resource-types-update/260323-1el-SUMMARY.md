---
phase: quick-260323-1el
plan: "01"
subsystem: resource-validation
tags: [resource-types, zod, niche, validation]
dependency_graph:
  requires: []
  provides: [all-niche-resource-types-in-zod-enum]
  affects: [lib/validations/resource.ts, resource-create-form, resource-edit-form]
tech_stack:
  added: []
  patterns: [extend-const-tuple-and-record-map]
key_files:
  modified:
    - lib/validations/resource.ts
decisions:
  - "Used exact keys from lib/niche/config.ts (office, treatment_room, sink) per plan notes — not the alternative names mentioned in task description header"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-23"
  tasks_completed: 2
  files_modified: 1
---

# Quick Task 260323-1el: Bulk Resource Types Update Summary

**One-liner:** Extended RESOURCE_TYPES Zod enum from 6 to 24 entries covering all horeca, sports, medicine, and beauty niche configs, with matching Russian labels in RESOURCE_TYPE_LABELS.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add niche resource types to RESOURCE_TYPES and RESOURCE_TYPE_LABELS | af3e28c | lib/validations/resource.ts |
| 2 | Restart service | (no commit - runtime only) | — |

## Changes Made

### lib/validations/resource.ts

RESOURCE_TYPES expanded from `['staff', 'room', 'court', 'table', 'other', 'couch']` (6 entries) to 24 entries:

- Original (6): staff, room, court, table, other, couch
- Horeca (4): vip_lounge, terrace, bar_counter, karaoke_room
- Sports (5): trainer, field, pool, sauna, equipment
- Medicine (6): doctor, nurse, operating_room, laboratory, office, treatment_room
- Beauty (3): master, manicure_table, sink

RESOURCE_TYPE_LABELS updated with corresponding Russian translations for all 18 new entries.

## Verification

- `npm run build` — passed, 0 type errors
- `pm2 show omni-book` — both instances (id 12, id 13) status: online

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- lib/validations/resource.ts exists and has 24 entries in RESOURCE_TYPES
- Commit af3e28c verified in git log
- Build passed clean
- pm2 omni-book online (both instances)
