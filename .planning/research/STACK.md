# Stack Research

**Domain:** Custom service duration input + expanded niche resource/staff type directories (v1.2)
**Researched:** 2026-03-19
**Confidence:** HIGH (all findings grounded in actual codebase source; no external libraries required)

---

## Executive Summary

Both features require **zero new dependencies**. Everything needed is already installed and in use in the codebase. The work is pure code changes to existing files:

- **Custom duration input**: Replace one `<Select>` with `<Input type="number">` in `service-form.tsx`, widen the Zod range in `lib/validations/service.ts` from `min(5).max(480)` to `min(1).max(1440)`.
- **Expanded niche resource types**: Add new `{ value, label }` entries to `resourceTypes` arrays in `lib/niche/config.ts`, add matching `opt_*` translation keys to the three locale blocks in `lib/i18n/translations.ts`.

---

## Recommended Stack

### Core Technologies (Unchanged — Already Installed)

| Technology | Version | Purpose | Why Relevant |
|------------|---------|---------|--------------|
| zod | ^4.3.6 | Schema validation for the duration field | `z.number().int().min(1).max(1440)` — same API already used in `lib/validations/service.ts` line 9; only range values change |
| react-hook-form | ^7.71.2 | Form state and submission | Already manages `durationMin` field as `FormValues.durationMin: string`; no changes to RHF wiring |
| @hookform/resolvers | ^5.2.2 | Bridges Zod schema into RHF | `zodResolver(createServiceSchema)` already wired in `service-form.tsx`; no changes |
| shadcn/ui Input | (part of shadcn 4.0.2) | Renders the number input | `<Input type="number" min={1} max={1440}>` — same component already used for `price` field (line 276–285 of `service-form.tsx`) |
| TypeScript | ^5 | Static types | No new types needed; `durationMin: string` form field type and `number` schema type are unchanged |

### Supporting Libraries (Unchanged — Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Select | (part of shadcn 4.0.2) | Still needed for `currency` field | Do NOT remove Select imports; currency still uses Select. Remove only the duration `<Select>` usage. |
| lucide-react | ^0.577.0 | Icons | No new icons needed; existing `Loader2` spinner unchanged |

### Development Tools (Unchanged)

| Tool | Purpose | Notes |
|------|---------|-------|
| jest + ts-jest | Unit testing | Existing static-assertion test pattern (`fs.readFileSync` + regex) can be extended to verify `DURATION_OPTIONS` is removed from form usage and `durationMin` schema range |
| TypeScript compiler | Type checking | No new tsconfig changes needed |

---

## Installation

No new packages to install. Both features use only code changes.

```bash
# No npm install required.
# All needed packages are already in package.json dependencies.
```

---

## Change Surface: Duration Input

### Files That Change

| File | What Changes | Type |
|------|-------------|------|
| `lib/validations/service.ts` | Remove `DURATION_OPTIONS` export; change `.min(5).max(480)` to `.min(1).max(1440)` | Logic |
| `components/service-form.tsx` | Remove Select import usage for duration; replace with `<Input type="number" min={1} max={1440}>` | UI |

### What Does NOT Change

- `CURRENCIES` export and currency `<Select>` — untouched
- `FormValues.durationMin: string` type — stays string (parsed via `parseInt` in `handleSubmit`, already line 116)
- `zodResolver` wiring — untouched
- Database schema — `durationMin` column already stores integer; no migration needed
- Any downstream consumer of `durationMin` (booking engine, calendar, etc.) — already receives integer via server actions

### Integration Point: price field is the exact model

`service-form.tsx` lines 269–287 show the established pattern for numeric inputs in this codebase:

```tsx
<Input
  {...field}
  type="number"
  min={0}
  placeholder="0"
  disabled={isDisabled}
/>
```

Duration input follows the same pattern with `min={1}`, `max={1440}`, and an appropriate placeholder (e.g., `"30"`).

### Zod Schema Change

Current (line 9 of `lib/validations/service.ts`):
```ts
durationMin: z.number().int().min(5, 'Минимум 5 мин').max(480, 'Максимум 480 мин'),
```

Target:
```ts
durationMin: z.number().int().min(1, 'Минимум 1 мин').max(1440, 'Максимум 1440 мин'),
```

`updateServiceSchema` is `createServiceSchema.partial()` — inherits the change automatically.

---

## Change Surface: Expanded Niche Resource/Staff Types

### Files That Change

| File | What Changes | Type |
|------|-------------|------|
| `lib/niche/config.ts` | Add new `{ value: string, label: 'opt_*' }` entries to `resourceTypes` arrays for target niches | Data |
| `lib/i18n/translations.ts` | Add new `opt_*` key entries to the `niche` section in all three locale blocks (`ru`, `kz`, `en`) | Data |

### What Does NOT Change

- `lib/validations/resource.ts` — `RESOURCE_TYPES` enum (`['staff', 'room', 'court', 'table', 'other']`) is the Prisma-backed type. Niche `resourceTypes` in config are **display-layer string values** used in attribute field `forTypes` filtering and Select options. They do NOT need to match `RESOURCE_TYPES`. Existing niches already use values like `'equipment'`, `'staff'`, `'court'` that are not all in the Zod enum — the config types are decorative/display, not validated against the Prisma schema.
- `components/resource-form.tsx` — already reads `getNicheConfig(niche).resourceTypes` dynamically; new entries appear automatically without any component code change
- Database schema — no migration needed; resource `type` field stores the string value from the config

### How opt_* Keys Work

New resource type labels follow the same `opt_[6-char-hex]` convention used throughout `lib/niche/config.ts`. Any unique hex fragment not already in `translations.ts` is valid. The key must be added to all three locale blocks (`ru`, `kz`, `en`) under the `niche` section.

### Niche Config Structure (for reference)

```ts
// lib/niche/config.ts — existing shape
resourceTypes: [
  { value: 'staff', label: 'opt_fc9da4' },  // value = stored string; label = opt_* key
  { value: 'room',  label: 'opt_da78ed' },
]
```

New entries follow exactly this shape. The `value` string becomes what gets stored in `resource.type` and what `forTypes` filters match against.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `<Input type="number">` (shadcn) | `<Input type="text">` with pattern validation | Number input gives browser-native up/down controls and blocks non-numeric entry; text input requires extra regex validation |
| `<Input type="number">` (shadcn) | A masked/formatted input library (e.g., react-number-format) | Overkill for an integer 1–1440 range; introduces a new dependency for no DX benefit; price field already uses plain number input |
| Inline opt_* keys in config + translations file | Separate JSON config per niche | The translations.ts pattern is established and working; extracting to JSON adds indirection with no benefit at this codebase size |
| Widen existing Zod schema range | Create a separate free-form schema | Single schema is simpler; `updateServiceSchema.partial()` inherits correctly; no divergence to maintain |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-number-format` or `imask` | Masked inputs are overkill for 1–1440 integer range; adds bundle weight and new dependency surface | `<Input type="number" min={1} max={1440}>` with Zod validation |
| `@radix-ui/react-number-field` or similar | Not in the shadcn component set used here; introduces a different component system | shadcn `Input` with `type="number"` — identical to how `price` field works today |
| New niche files or JSON config | The codebase uses a single `NICHE_CONFIG` object and a single `translations.ts`; fragmentation would require changes to `getNicheConfig` and i18n context | Add entries to existing files |
| New niche type (`'legal'`, `'fitness'`, etc.) | Adding a new `Niche` type requires updating the `Niche` union, `NICHE_CONFIG`, `getNicheConfig`, translations, and seed data — out of scope for this milestone | Expand resource types within existing niches |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| zod ^4.3.6 | `z.number().int().min().max()` API | Verified: this exact API is used in the live `service.ts` file |
| react-hook-form ^7.71.2 | `<Input type="number">` via `{...field}` spread | RHF spreads `onChange`/`onBlur`/`value`/`ref`; works identically for text and number inputs |
| shadcn/ui Input | `type="number"` attribute | Input is a thin wrapper over native `<input>`; `type="number"` passes through |
| @hookform/resolvers ^5.2.2 | zod ^4.x | Verified: `^5.2.2` in package.json supports zod v4 |

---

## Stack Patterns by Variant

**If displaying duration to end users (booking form, service cards):**
- Read `service.durationMin` integer directly
- Format as `${durationMin} мин` using the existing `t('booking', 'minutes')` key
- No change needed — downstream consumers already handle integer values

**If validating on the server (API routes, server actions):**
- `createServiceSchema.parse()` / `.safeParse()` already used in server actions
- Widened range is inherited automatically — no server action changes needed

**If testing the change:**
- Follow established static assertion pattern: `fs.readFileSync` + regex to verify `DURATION_OPTIONS` is not referenced in `service-form.tsx` after removal
- Verify new Zod range with a unit test asserting `createServiceSchema.parse({ durationMin: 1440 })` succeeds and `durationMin: 1441` fails

---

## Sources

- `components/service-form.tsx` — verified current Select usage (lines 244–267), price Input pattern (lines 269–287), form shape
- `lib/validations/service.ts` — verified current `DURATION_OPTIONS` and Zod range (`min(5).max(480)`)
- `lib/niche/config.ts` — verified `resourceTypes` structure, `opt_*` label convention
- `lib/i18n/translations.ts` — verified `niche` section location (line 469, 1001, 1533 per locale), `opt_*` key format
- `lib/validations/resource.ts` — verified `RESOURCE_TYPES` enum is independent from niche config resource types
- `components/resource-form.tsx` — verified `getNicheConfig(niche).resourceTypes` dynamic read (line 34)
- `package.json` — verified installed versions: zod 4.3.6, react-hook-form 7.71.2, @hookform/resolvers 5.2.2
- HIGH confidence: all findings from direct codebase inspection; no external sources required for implementation decisions

---

*Stack research for: v1.2 custom duration input + niche resource type expansion*
*Researched: 2026-03-19*
