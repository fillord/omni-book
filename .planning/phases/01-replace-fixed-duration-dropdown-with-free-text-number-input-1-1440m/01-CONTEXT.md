# Phase 1: Replace fixed duration dropdown with free-text number input (1-1440m) - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** User design brief

<domain>
## Phase Boundary

Replace the fixed-option `<Select>` dropdown for `durationMin` in `service-form.tsx` with a number input widget that allows free-text entry from 1 to 1440 minutes, with stepper buttons and quick-select presets.

</domain>

<decisions>
## Implementation Decisions

### Input Control
- Replace the `<Select>` component with `<Input type="number">` for the `durationMin` field
- The input must have **plus (+) and minus (−) buttons on the sides** (left side: minus, right side: plus) — not relying on native browser spinners
- A **"min" suffix** must be visible inside or adjacent to the input field (not as a separate label)

### Quick Buttons
- Below the input, render **three quick-select preset buttons**: `15`, `30`, and `60` minutes
- Clicking a preset button sets the input value to that number
- Presets styled as small secondary/outline buttons

### Validation
- Min: **1** minute (update zod schema from current min(5) → min(1))
- Max: **1440** minutes (update zod schema from current max(480) → max(1440))
- Invalid values show form validation message in the existing `<FormMessage>` slot

### Data Model
- `durationMin` field type in FormValues remains `string` (or can be `number` — match existing pattern)
- Parsed to `parseInt` on submit (already done in current code)
- `DURATION_OPTIONS` constant in `lib/validations/service.ts` becomes unused — remove it

### Claude's Discretion
- Stepper button increment/decrement step size (suggest: 1)
- Exact styling of the composite input widget (wrapper div with flex layout)
- Whether to extract the composite widget into a reusable component or keep inline

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to modify
- `components/service-form.tsx` — Contains the `<Select>` to replace (lines ~244-266)
- `lib/validations/service.ts` — Contains `DURATION_OPTIONS`, `createServiceSchema` (durationMin validation: change min(5)→min(1), max(480)→max(1440))

### Reference patterns
- `components/ui/input.tsx` — Existing Input component (use as base)
- `components/ui/button.tsx` — Existing Button component (use for stepper + presets)
- `components/service-form.tsx` (price field, lines ~269-287) — Pattern for how number inputs are used in this form

</canonical_refs>

<specifics>
## Specific Ideas

- Stepper layout: `[−] [____30____min] [+]` — minus on left, plus on right, "min" suffix inside the input row
- Quick buttons row below: `[15 min] [30 min] [60 min]`
- Stepper should clamp value to 1–1440 range (pressing − at 1 does nothing, pressing + at 1440 does nothing)

</specifics>

<deferred>
## Deferred Ideas

- Custom step sizes (e.g. 5-minute increments) — out of scope, user wants free-text
- More preset options — user specified exactly 15, 30, 60

</deferred>

---

*Phase: 01-replace-fixed-duration-dropdown-with-free-text-number-input-1-1440m*
*Context gathered: 2026-03-19 from user design brief*
