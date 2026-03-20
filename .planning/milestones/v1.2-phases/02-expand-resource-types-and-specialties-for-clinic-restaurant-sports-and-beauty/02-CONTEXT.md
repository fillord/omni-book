# Phase 2: Expand resource types and specialties for Clinic, Restaurant, Sports, and Beauty - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the `NICHE_CONFIG` object in `lib/niche/config.ts` with new resource types for all four niches, convert beauty specialization from a hardcoded select to free-text, and ensure every new label has proper RU/EN/KZ translation keys (no opt_xxx for new additions). No UI component changes — the `resource-form.tsx` rendering pipeline is already generic and will pick up config changes automatically.

</domain>

<decisions>
## Implementation Decisions

### Resource types — Clinic (medicine)

Replace existing 3 types with 6:

| value | label key | RU |
|---|---|---|
| `doctor` | `resource_type_doctor` | Врач |
| `nurse` | `resource_type_nurse` | Медсестра |
| `operating_room` | `resource_type_operating_room` | Операционная |
| `laboratory` | `resource_type_laboratory` | Лаборатория |
| `office` | `resource_type_office` | Кабинет (УЗИ/МРТ) |
| `treatment_room` | `resource_type_treatment_room` | Процедурный кабинет |

### Resource types — Restaurant (horeca)

Replace existing 3 types with 5:

| value | label key | RU |
|---|---|---|
| `table` | `resource_type_table` | Стол |
| `vip_lounge` | `resource_type_vip_lounge` | VIP-зал |
| `terrace` | `resource_type_terrace` | Терраса |
| `bar_counter` | `resource_type_bar_counter` | Барная стойка |
| `karaoke_room` | `resource_type_karaoke_room` | Зал с karaoke |

### Resource types — Sports

Replace existing 4 types with 5:

| value | label key | RU |
|---|---|---|
| `court` | `resource_type_court` | Корт |
| `field` | `resource_type_field` | Поле |
| `pool` | `resource_type_pool` | Бассейн |
| `sauna` | `resource_type_sauna` | Сауна |
| `equipment` | `resource_type_equipment` | Снаряжение |

### Resource types — Beauty

Replace existing 2 types with 3:

| value | label key | RU |
|---|---|---|
| `manicure_table` | `resource_type_manicure_table` | Маникюрный стол |
| `sink` | `resource_type_sink` | Мойка |
| `couch` | `resource_type_couch` | Кушетка |

### Specialization fields — all niches

- **All niches**: Specialization is a free-text `type: 'text'` field. No hardcoded select lists.
- **Beauty**: Remove the `type: 'select'` with its `options` array from the `specialization` attribute field — change to `type: 'text'`. Remove the 6 opt_xxx option values entirely.
- **Medicine**: Already `type: 'text'` — no change needed.
- **Horeca and Sports staff**: Add a `specialization` attribute field (`type: 'text'`, `forTypes: ['staff']`, `showInTable: true`) so staff resources can record their role/profile.

### i18n — translation coverage

- Every new resource type label key must have entries in all 3 locales: RU, EN, KZ.
- New keys follow the pattern `resource_type_<value>` (no `opt_` prefix).
- They go in the `niche` section of `translations.ts` (same section existing niche labels use after they're resolved).
- Existing opt_xxx keys for resource types that are being replaced should be preserved in translations (do not delete them — other tenants' stored data may reference them).
- The `specialization` label key used in horeca/sports attributeFields should reuse the existing `opt_ec228c` key (already means "Specialization" in medicine) or add a readable key `attr_specialization` — prefer readable key for consistency with the no-opt_ rule.

### Claude's Discretion

- Exact KZ and EN translations for new resource type names (follow reasonable transliteration/translation conventions).
- Whether to add a `forTypes` constraint on the new horeca/sports specialization field (recommend: `forTypes: ['staff']` only).
- Whether to update `resourceLabel` / `resourceLabelPlural` defaults for niches whose primary resource type value changed (e.g. horeca's `resourceLabel` was `opt_337b69` = "Стол" — should update to a readable key since the primary type is still `table`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core config file
- `lib/niche/config.ts` — Full NICHE_CONFIG definition: NicheConfig interface, AttributeField interface, all four niches. This is the only file that needs structural changes.

### i18n system
- `lib/i18n/translations.ts` — All locale strings. The `niche` section is where resource type labels and attribute field labels live. New keys go here.
- `lib/i18n/context.ts` — `useI18n` hook and `t(section, key)` function signature (to verify how keys are resolved).

### Consumer component (read-only reference)
- `components/resource-form.tsx` — Uses `getNicheConfig(niche)` and renders `resourceTypes` as a Select, `attributeFields` as dynamic inputs. Read to verify new config entries will render correctly with no code changes needed.

### No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AttributeField` interface (in config.ts): supports `text | number | select | multitext | checkbox` — free-text specialization uses `type: 'text'`, already used by medicine.
- `optLabel()` helper in resource-form.tsx: passes non-opt_ values through unchanged — new readable label keys will resolve correctly via `t('niche', key)`.
- `getNicheConfig()` fallback: falls back to `medicine` for unknown niche — no risk from config changes.

### Established Patterns
- Resource type values are stored in the DB as-is (e.g. `'court'`, `'staff'`). Changing type values is a **breaking change** for existing tenant data. New types should use new value strings; old values can be removed from the config dropdown but existing records won't break the app (they just won't match a config type).
- All opt_xxx keys in existing config must be preserved in translations even after new readable keys are added.
- `forTypes` on an AttributeField filters it to only show when the resource's type matches — use this when adding specialization to horeca/sports staff only.

### Integration Points
- `resource-form.tsx` `watchedType` → filters `visibleAttrFields` by `forTypes` — new attribute fields with correct `forTypes` will appear/disappear automatically.
- `resources-manager.tsx` renders a table using `showInTable: true` fields — any new field with `showInTable: true` will appear in the table automatically.

</code_context>

<specifics>
## Specific Ideas

- Exact resource types as specified by user:
  - Clinic: Doctor, Nurse, Operating Room, Laboratory, Office (Ultrasound/MRI), Treatment Room
  - Restaurant: Table, VIP Lounge, Terrace, Bar Counter, Karaoke Room
  - Sports: Court, Field, Swimming Pool, Sauna, Equipment
  - Beauty: Manicure Table, Sink, Couch
- Specialization: free-text entry everywhere — "give the user the opportunity to enter the name of the specialization manually"
- i18n: "Make sure that ru/en/kz keys are added for all new resource types so that there is no opt_... in the interface"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-expand-resource-types-and-specialties-for-clinic-restaurant-sports-and-beauty*
*Context gathered: 2026-03-20*
