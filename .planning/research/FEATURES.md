# Feature Research

**Domain:** Custom service duration input + expanded niche resource/staff type directories — omni-book v1.2
**Researched:** 2026-03-19
**Confidence:** HIGH (codebase audit; no WebSearch available — domain knowledge applied from well-established booking UX patterns)

---

## Context: What Already Exists

Before defining what is new, the existing baseline matters for dependency tracking:

| Component | Current State |
|-----------|---------------|
| `lib/validations/service.ts` | `DURATION_OPTIONS = [5,10,15,20,30,40,45,60,90,120,180]`; Zod: `min(5).max(480)` |
| `components/service-form.tsx` | Duration rendered as a shadcn `<Select>` driven by `DURATION_OPTIONS` |
| `components/booking-form.tsx` | Displays duration as `{durationMin} {t('booking','minutes')}` (lines 497, 704) |
| `lib/niche/config.ts` | 4 niches: `medicine`, `beauty`, `horeca`, `sports`; each has `resourceTypes[]` and `attributeFields[]` |
| `lib/validations/resource.ts` | `RESOURCE_TYPES = ['staff','room','court','table','other']` — global enum used at DB-level |
| `lib/i18n/translations.ts` | All niche strings are `opt_XXXXXX` keys in the `niche` i18n section (RU/KZ/EN) |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features tenants expect when creating services. Missing these makes the form feel incomplete or rigid.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Free-entry duration (number input, 1–1440 min) | Tenants create services of arbitrary length — 25-min consultations, 75-min fitness classes, 8h paintball sessions don't fit preset options | LOW | Replaces `<Select>` with `<Input type="number">`; must update Zod `max(480)` → `max(1440)` and `min(5)` → `min(1)` |
| Inline validation with clear error message | Number inputs accept invalid values (0, decimals, empty); user must be told the rule at the point of error | LOW | Zod error messages already localized; add `FormMessage` display (already wired via `form.control`) |
| Human-readable duration display on public booking page | Customers see "90 min" or "1 h 30 min" — raw minutes are acceptable but "90 minutes" is clearer | LOW | Currently displays `{durationMin} minutes`; optional formatting helper (e.g. 90 → "1 ч 30 мин") is a polish step, not required |
| Existing duration values survive the migration | Services saved with old Select values (5, 10, 15… 180) must render correctly after form switch | LOW | Number input pre-populates from `service.durationMin` — no DB migration needed |
| Duration unit label adjacent to input | Without a unit label ("min"), a number input is ambiguous | LOW | Add static "мин" suffix next to the input (via InputAdornment pattern or wrapping div) |
| Resource type Select reads from niche config, not global enum | Tenants only see types relevant to their niche — showing "court" to a clinic is confusing | MEDIUM | Already done via `nicheConfig.resourceTypes[]` in `resource-form.tsx`; new types must be added to both `RESOURCE_TYPES` enum and `NICHE_CONFIG.resourceTypes` |
| New resource types visible in staff specialization dropdowns | Attribute fields (e.g. `specialization` select) only render for the correct `forTypes` — new types need `forTypes` entries | LOW | Config-driven via `attributeFields[].forTypes`; adding a new type means extending the array |
| opt_ translations for new types in all 3 locales | New `opt_*` keys must exist in RU, KZ, and EN locale maps or the UI renders raw `opt_XXXXXX` strings | MEDIUM | Three locale maps must be updated simultaneously; KZ is often the highest-effort locale |

### Differentiators (Competitive Advantage)

These improve the experience beyond table stakes. Not critical for v1.2 launch.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Duration display formatting (90 min → "1 ч 30 мин") | Appointment summaries feel more professional with natural language durations | LOW | Single formatting helper function; used in booking-form summary rows and public page service cards |
| Quick-select chips alongside number input | Common durations (15, 30, 60, 90) as clickable presets that populate the input; user can override with custom value | MEDIUM | Not in scope for v1.2 — adds UI complexity; number input alone is sufficient |
| Staff specialization free-text fallback | When a tenant's specialty doesn't match preset options, allow free-text entry | MEDIUM | Deferred — current `select` type covers standard cases; `text` type already exists as alternative |
| Niche-specific scheduling defaults per new resource type | `buildDefaultSchedule()` in `resource-form.tsx` uses a `switch(niche)` block; new sub-types don't need new cases | LOW | Schedule defaults are niche-level, not type-level — no change needed |

### Anti-Features (Commonly Requested, Often Problematic)

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Duration in hours:minutes picker (HH:MM input) | "More intuitive" | Two-field compound inputs require parsing on submit, break react-hook-form's single-field model, and are harder to validate; most booking tools use minutes internally | Keep single number input in minutes; add formatted display on the customer-facing side only |
| Replacing `RESOURCE_TYPES` enum with a pure string field | "More flexible, no enum constraint" | The global `RESOURCE_TYPES` enum may be referenced in DB queries, type guards, or Prisma schema — removing it without a migration plan breaks existing resources | Extend the enum with new values rather than replacing it; treat it as an append-only list |
| Generating opt_ keys from niche type labels at runtime | "Saves writing translation keys" | Breaks the static translation lookup pattern; the `opt_XXXXXX` hash system is intentionally opaque to avoid key collisions and allow refactoring of display labels independently | Continue generating new `opt_*` keys for each new string and adding all three locale strings |
| Per-service min/max duration constraints | "Block services under 15 min" | Additional validation complexity that should be a tenant preference, not a system constraint; the 1-min floor already prevents abuse | Keep Zod validation to system-wide floor/ceiling (1–1440); tenants self-govern sensible values |
| Allowing decimal minutes (0.5, 1.5) | "Some treatments are 7.5 min" | Fractional minutes complicate slot-grid calculations throughout the booking engine; existing schema stores integer | Integer minutes only; 1-minute granularity is sufficient for any real-world service |

---

## Feature Dependencies

```
[Custom Duration Input]
    └──requires──> Zod schema update (min/max bounds in createServiceSchema)
    └──requires──> DURATION_OPTIONS removal or deprecation from service-form.tsx
    └──requires──> Duration display stays correct on booking-form.tsx (no change needed — already uses raw durationMin)

[New Niche Resource Types]
    └──requires──> RESOURCE_TYPES enum extension in lib/validations/resource.ts
    └──requires──> NicheConfig.resourceTypes[] entries in lib/niche/config.ts
    └──requires──> New opt_ keys in lib/i18n/translations.ts (all 3 locales)
    └──optionally──> New attributeFields[] entries if the type has specific metadata

[New Staff Specializations]
    └──requires──> New opt_ keys in lib/i18n/translations.ts (all 3 locales)
    └──requires──> attributeFields[].options[] extension in lib/niche/config.ts
    └──no DB change needed (stored as JSON in resource.attributes)

[RESOURCE_TYPES enum extension]
    └──may require──> Prisma schema check (if type is an enum column, not a string column)
```

### Dependency Notes

- **Duration input does not touch booking-form.tsx:** The customer-facing booking flow already renders `{durationMin}` directly from the service record; no consumer needs updating when the creation form switches to free entry.
- **Resource type enum is the critical gate:** Before adding new resource types to `NICHE_CONFIG.resourceTypes`, verify whether the `resource.type` DB column is a Prisma enum (requiring a migration) or a plain string (no migration needed). The current `RESOURCE_TYPES` in `validations/resource.ts` is a TypeScript/Zod enum only — if the DB column is `String`, adding new values is safe without migration.
- **All three locales must be updated together:** Missing a KZ or EN translation for a new `opt_*` key will fall back silently to the raw `opt_XXXXXX` string on KZ/EN pages. The existing `optLabel` helper and inline guard pattern (`strVal.startsWith('opt_') ? t('niche', strVal) : strVal`) have no fallback beyond the raw key.

---

## MVP Definition (v1.2 Scope)

### Launch With (v1.2)

- [ ] Number input for duration (min=1, max=1440, integer) replacing the Select component — why essential: unlocks all non-preset durations that exist in real businesses
- [ ] Zod schema bounds updated to `min(1).max(1440)` — why essential: form would reject valid custom values without this
- [ ] "мин" unit label visible next to input — why essential: unlocks accessibility and eliminates ambiguity
- [ ] Medicine (Clinic) niche: expanded resource types and specializations — why essential: most common niche, has broadest real-world type requirements
- [ ] Cafe/Horeca niche: expanded resource types — why essential: existing `table`/`room`/`staff` coverage is thin
- [ ] Sports niche: expanded resource types and staff specializations — why essential: courts and trainers are the core product for this niche
- [ ] Beauty Salon niche: expanded staff specializations — why essential: existing 6 specializations miss common services like nail tech and eyebrow specialist
- [ ] All new opt_ keys populated in RU, KZ, EN locales — why essential: any missing key renders as raw hash in production

### Add After Validation (v1.x)

- [ ] Duration formatted as "X ч Y мин" in booking summaries — trigger: customer feedback that raw minutes feel unprofessional
- [ ] Quick-select duration chips alongside number input — trigger: tenant feedback that freeform entry is slower than preset buttons

### Future Consideration (v2+)

- [ ] Duration in HH:MM compound input — defer: unnecessary complexity given integer-minute storage
- [ ] Per-niche duration validation presets — defer: no evidence this is needed

---

## Feature Prioritization Matrix

| Feature | Tenant Value | Implementation Cost | Priority |
|---------|-------------|---------------------|----------|
| Number input replacing Select | HIGH — removes constraint for all tenants | LOW — form component swap + schema change | P1 |
| Zod min/max update (1–1440) | HIGH — required for custom input to work | LOW — two constants | P1 |
| Unit label "мин" next to input | MEDIUM — UX clarity | LOW — static text wrapper | P1 |
| Medicine expanded types/specializations | HIGH — most used niche | LOW — config + translations | P1 |
| Beauty expanded specializations | HIGH — second most common niche | LOW — config + translations | P1 |
| Horeca expanded resource types | MEDIUM — tables/rooms already exist | LOW — config + translations | P2 |
| Sports expanded types/specializations | MEDIUM — existing court/trainer coverage | LOW — config + translations | P2 |
| Duration display formatting helper | LOW — cosmetic | LOW — single function | P3 |

**Priority key:**
- P1: Must land in v1.2 for the milestone goal to be achieved
- P2: Should land in v1.2 if P1 is complete
- P3: Nice to have, can slip to v1.3

---

## Niche Resource Type and Specialization Reference

This section documents what the expanded config should contain, based on established domain knowledge of each niche.

### Medicine (Clinic)

**Current resource types:** `staff` (Врач), `room` (Кабинет), `equipment` (Оборудование)

**Gaps:** Missing types for nurse, lab technician, procedure room distinctions.

**Recommended additions:**
- Resource type: `nurse` — Медсестра / Мейіргер / Nurse
- Resource type: `lab` — Лаборатория / Зертхана / Laboratory
- Resource type: `procedure_room` — Процедурный кабинет / Процедуралық кабинет / Procedure Room

**Current specializations (staff `specialization` text field):** free text

**Recommended specialization select options (new opt_ values needed):**
- Терапевт / Therapist
- Педиатр / Pediatrician
- Кардиолог / Cardiologist
- Дерматолог / Dermatologist
- Стоматолог / Dentist
- Невролог / Neurologist
- Офтальмолог / Ophthalmologist
- Гинеколог / Gynecologist
- Хирург / Surgeon
- УЗИ-специалист / Sonographer

### Beauty Salon

**Current resource types:** `staff` (Мастер), `room` (Кабинет)

**Current specializations:** `opt_e5a075` Парикмахер, `opt_9a187d` Стилист, `opt_a4e207` Косметолог, `opt_e36b15` Мастер маникюра, `opt_bc063e` Визажист, `opt_bada78` Массажист

**Gaps:** Missing nail extension technician, eyebrow/lash specialist, tattoo/PMU artist, and spa therapist.

**Recommended specialization additions:**
- Мастер педикюра / Pedicure Technician
- Мастер наращивания ногтей / Nail Extension Technician
- Мастер бровей / Eyebrow Specialist
- Мастер ресниц / Lash Technician
- Мастер татуажа / PMU / Permanent Makeup Artist
- СПА-терапевт / Spa Therapist
- Барбер / Barber

### Horeca (Cafe / Restaurant)

**Current resource types:** `table` (Столик), `room` (Зал / VIP), `staff` (Официант / Шеф)

**Gaps:** Private event rooms and outdoor/terrace zones are commonly bookable separately; delivery/catering staff roles exist in some venues.

**Recommended additions:**
- Resource type: `bar_seat` — Место у бара / Бар орны / Bar Seat
- Resource type: `outdoor` — Терраса / летняя площадка / Outdoor / Terrace
- Resource type: `event_room` — Банкетный зал / Банкет залы / Banquet Hall

**Staff role additions:**
- Бармен / Bartender
- Сомелье / Sommelier
- Организатор мероприятий / Event Coordinator

### Sports (Sports Club / Fitness)

**Current resource types:** `court` (Корт / Поле), `room` (Зал), `staff` (Тренер), `equipment` (Инвентарь)

**Gaps:** Pool lanes, climbing walls, locker rooms, and group class rooms are distinct bookable resources in modern sports facilities.

**Recommended additions:**
- Resource type: `pool_lane` — Дорожка в бассейне / Жүзу жолағы / Pool Lane
- Resource type: `studio` — Студия / Студия / Studio (для групповых занятий)
- Resource type: `locker_room` — Раздевалка / Киім ауыстыру / Locker Room (for time-block bookings)

**Staff specialization additions (trainer subtypes):**
- Персональный тренер / Personal Trainer
- Тренер по йоге / Yoga Instructor
- Тренер по пилатесу / Pilates Instructor
- Тренер по боксу / Boxing Trainer
- Тренер по плаванию / Swimming Coach
- Тренер по единоборствам / Martial Arts Instructor
- Тренер по групповым программам / Group Fitness Instructor

---

## Sources

- Direct codebase audit: `lib/niche/config.ts`, `lib/validations/service.ts`, `lib/validations/resource.ts`, `lib/i18n/translations.ts`, `components/service-form.tsx`, `components/resource-form.tsx`, `components/booking-form.tsx`
- Project context: `.planning/PROJECT.md` (v1.2 target features, existing patterns)
- Domain knowledge: Standard booking system resource taxonomies for clinic, beauty, hospitality, and sports verticals (HIGH confidence for table stakes; MEDIUM confidence for specific specialization lists — these should be validated with real tenants)

---

*Feature research for: v1.2 Custom Duration Input + Niche Expansion — omni-book multi-tenant SaaS*
*Researched: 2026-03-19*
