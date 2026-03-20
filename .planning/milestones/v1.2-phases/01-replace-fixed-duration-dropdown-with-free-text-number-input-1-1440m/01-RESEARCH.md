# Phase 1: Replace fixed duration dropdown with free-text number input (1-1440m) - Research

**Researched:** 2026-03-19
**Domain:** React form component replacement — Select → number input with stepper + quick-select presets
**Confidence:** HIGH

## Summary

This phase is a focused UI replacement in a single form component. The existing `<Select>` for `durationMin` in `components/service-form.tsx` (lines 244–266) is replaced by a composite widget built from the project's existing `<Input>` and `<Button>` primitives — no new dependencies required.

The zod schema in `lib/validations/service.ts` needs two boundary updates (min 5→1, max 480→1440) and the `DURATION_OPTIONS` constant becomes dead code to be deleted. The `FormValues.durationMin` field is already typed as `string` and already parsed with `parseInt` on submit — no data-model changes needed.

The widget layout is `[−] [____N____min] [+]` with three preset buttons below. All interaction logic (clamping, stepper, preset selection) stays local to the `durationMin` FormField render prop; no new component file is needed unless the implementor chooses to extract it (discretion item).

**Primary recommendation:** Build the composite widget inline inside the existing FormField render prop, using `<Button size="icon-sm">` for steppers and `<Button variant="outline" size="sm">` for presets. Wire everything through `field.onChange` as a string to match existing `FormValues.durationMin: string` convention.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Replace the `<Select>` component with `<Input type="number">` for the `durationMin` field
- The input must have **plus (+) and minus (−) buttons on the sides** (left side: minus, right side: plus) — not relying on native browser spinners
- A **"min" suffix** must be visible inside or adjacent to the input field (not as a separate label)
- Below the input, render **three quick-select preset buttons**: `15`, `30`, and `60` minutes
- Clicking a preset button sets the input value to that number
- Presets styled as small secondary/outline buttons
- Min: **1** minute (update zod schema from current min(5) → min(1))
- Max: **1440** minutes (update zod schema from current max(480) → max(1440))
- Invalid values show form validation message in the existing `<FormMessage>` slot
- `durationMin` field type in FormValues remains `string` (or can be `number` — match existing pattern)
- Parsed to `parseInt` on submit (already done in current code)
- `DURATION_OPTIONS` constant in `lib/validations/service.ts` becomes unused — remove it

### Claude's Discretion
- Stepper button increment/decrement step size (suggest: 1)
- Exact styling of the composite input widget (wrapper div with flex layout)
- Whether to extract the composite widget into a reusable component or keep inline

### Deferred Ideas (OUT OF SCOPE)
- Custom step sizes (e.g. 5-minute increments) — out of scope, user wants free-text
- More preset options — user specified exactly 15, 30, 60
</user_constraints>

---

## Standard Stack

### Core (all already installed — no new installs required)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.2 | Form state + `field` object wiring | Already used throughout the form |
| zod | ^4.3.6 | Schema validation (min/max update) | Already the project validation library |
| `@base-ui/react/input` | ^1.2.0 | Underlying `<Input>` primitive | Project standard — `components/ui/input.tsx` wraps it |
| `@base-ui/react/button` | ^1.2.0 | Underlying `<Button>` primitive | Project standard — `components/ui/button.tsx` wraps it |
| lucide-react | ^0.577.0 | `Minus` and `Plus` icons for stepper buttons | Already imported in service-form.tsx (has `Loader2`) |

**Installation:** None required. All dependencies already present.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | ^0.7.1 | Button variant/size selection | Used inside `Button` — `variant="outline"` and `size="sm"` / `size="icon-sm"` are the relevant variants |

---

## Architecture Patterns

### Recommended Project Structure
No new files required. Changes are confined to:
```
components/
└── service-form.tsx       # Replace Select block, add stepper + preset logic
lib/
└── validations/
    └── service.ts         # Update min/max, delete DURATION_OPTIONS
```

Optional extraction (Claude's discretion):
```
components/ui/
└── duration-input.tsx     # Extracted composite widget (only if reuse anticipated)
```

### Pattern 1: Composite input widget (inline)

**What:** A `<div>` with `flex items-center` wrapping two icon buttons and a modified `<Input>`, plus a presets row below.

**When to use:** Single-use widget; keep inline to avoid a one-time-use abstraction.

**Anatomy:**
```
<FormItem>
  <FormLabel>Duration *</FormLabel>
  <FormControl>
    {/* Stepper row */}
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => { /* decrement, clamp to 1 */ }}
        disabled={isDisabled || numVal <= 1}
      >
        <Minus />
      </Button>

      {/* Input + "min" suffix in a relative wrapper */}
      <div className="relative flex-1">
        <Input
          {...field}
          type="number"
          min={1}
          max={1440}
          className="pr-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          disabled={isDisabled}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          min
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => { /* increment, clamp to 1440 */ }}
        disabled={isDisabled || numVal >= 1440}
      >
        <Plus />
      </Button>
    </div>

    {/* Preset buttons row */}
    <div className="mt-1.5 flex gap-1.5">
      {[15, 30, 60].map((preset) => (
        <Button
          key={preset}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => field.onChange(String(preset))}
          disabled={isDisabled}
        >
          {preset} min
        </Button>
      ))}
    </div>
  </FormControl>
  <FormMessage />
</FormItem>
```

**Important:** All `<Button>` elements inside the form MUST have `type="button"` to prevent accidental form submission.

### Pattern 2: Value clamping helper

**What:** Derive a numeric value from the string field, clamp before calling `field.onChange`.

```typescript
const numVal = Math.max(1, Math.min(1440, parseInt(field.value) || 1))

// decrement
field.onChange(String(Math.max(1, numVal - 1)))

// increment
field.onChange(String(Math.min(1440, numVal + 1)))
```

**Why:** `field.value` is a string (`durationMin: string` in `FormValues`); `parseInt` may return `NaN` when input is blank — the `|| 1` fallback prevents NaN propagation.

### Pattern 3: Zod schema update
```typescript
// lib/validations/service.ts — before
export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 40, 45, 60, 90, 120, 180] as const
// ...
durationMin: z.number().int().min(5, 'Минимум 5 мин').max(480, 'Максимум 480 мин'),

// after
// (remove DURATION_OPTIONS entirely)
durationMin: z.number().int().min(1, 'Минимум 1 мин').max(1440, 'Максимум 1440 мин'),
```

`updateServiceSchema` is derived as `createServiceSchema.partial()` — it automatically inherits the updated validation.

### Pattern 4: Import cleanup in service-form.tsx

Remove from imports:
```typescript
// Remove these — no longer needed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DURATION_OPTIONS,   // ← remove this named import
  ...
} from '@/lib/validations/service'
```

Add to imports:
```typescript
import { Minus, Plus, Loader2 } from 'lucide-react'  // Loader2 already present
```

### Anti-Patterns to Avoid

- **Using native browser spinners:** `<Input type="number">` shows browser-native up/down arrows unless suppressed. Use `className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"` to hide them — the custom +/− buttons replace them.
- **Omitting `type="button"` on stepper/preset buttons:** Any `<button>` inside a `<form>` defaults to `type="submit"`. Every stepper and preset button must have `type="button"` explicitly.
- **Calling `field.onChange(number)` instead of `field.onChange(string)`:** The `FormValues.durationMin` is typed as `string`. Always pass `String(value)` to avoid react-hook-form type mismatches.
- **Forgetting the `<FormControl>` wrapping requirement:** Shadcn/base-ui `FormControl` injects `aria-invalid` and `id` via context. The outer-most interactive element inside `<FormControl>` must receive these props. With a composite widget, either spread them on the wrapper div or on the Input specifically.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon buttons | Custom SVG elements | `<Button size="icon-sm">` with `<Minus />` / `<Plus />` from lucide-react | Consistent hover/focus/disabled states already in buttonVariants |
| "min" suffix overlay | Separate positioned element with manual z-index | `absolute right-2.5` span inside a `relative` wrapper | Already used in the project for phone-input; simple and reliable |
| Validation message | Custom error div | Existing `<FormMessage />` slot in the FormItem | Already wired to react-hook-form field state |

**Key insight:** The project already has all required primitives. The task is assembly, not invention.

---

## Common Pitfalls

### Pitfall 1: NaN propagation from empty input
**What goes wrong:** User clears the input → `parseInt('')` returns `NaN` → clamping math produces `NaN` → stepper buttons set value to `NaN` → zod validation fails with confusing message.
**Why it happens:** `parseInt` on empty string returns `NaN`.
**How to avoid:** Always use `parseInt(field.value) || 1` (or a more explicit `isNaN` guard) in the stepper click handlers.
**Warning signs:** Input shows `NaN` or blank after clicking stepper.

### Pitfall 2: Form submits when clicking stepper buttons
**What goes wrong:** Clicking `+` or `−` submits the form instead of incrementing.
**Why it happens:** `<button>` inside `<form>` defaults to `type="submit"`.
**How to avoid:** All interactive buttons in the widget must have `type="button"`.
**Warning signs:** Form submit fires on stepper click; browser shows validation popups on stepper click.

### Pitfall 3: Native spinner arrows visible alongside custom buttons
**What goes wrong:** `<Input type="number">` shows browser spinners AND custom +/− buttons — double controls, broken layout.
**Why it happens:** Browsers add native spinners to `type="number"` inputs by default.
**How to avoid:** Suppress via Tailwind: `[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`.
**Warning signs:** Extra arrows appear inside the input on Chrome/Safari.

### Pitfall 4: FormControl aria attributes not reaching the Input
**What goes wrong:** `aria-invalid` and `id` injected by `<FormControl>` don't reach the actual `<input>` element because they land on a wrapper div instead.
**Why it happens:** `<FormControl>` uses React context + `asChild` / slot patterns from base-ui. The `<Input>` component wraps `@base-ui/react/input` and forwards all props — but if a `<div>` is the direct child of `<FormControl>`, the slot props may not propagate.
**How to avoid:** Keep `<Input>` as the direct child of `<FormControl>`, or explicitly pass the `FormControl` slot props down. Alternatively, wrap the entire stepper row in the `<FormControl>` but pass aria props explicitly to the `<Input>`.
**Warning signs:** `<FormMessage>` doesn't appear on validation error; input lacks `aria-invalid="true"` in DevTools when field is invalid.

### Pitfall 5: `DURATION_OPTIONS` still imported after removal
**What goes wrong:** TypeScript error — `DURATION_OPTIONS` is imported in `service-form.tsx` but no longer exported from `service.ts`.
**Why it happens:** The named import must be removed from both the export and the import site simultaneously.
**How to avoid:** Remove the export from `service.ts` and the import from `service-form.tsx` in the same task.

---

## Code Examples

Verified patterns from project source code:

### Existing price field pattern (reference for number input style)
```typescript
// Source: components/service-form.tsx lines 269-287
<FormField
  control={form.control}
  name="price"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form', 'price')}</FormLabel>
      <FormControl>
        <Input
          {...field}
          type="number"
          min={0}
          placeholder="0"
          disabled={isDisabled}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```
The `durationMin` widget follows the same FormField/FormItem/FormControl/FormMessage shell.

### Button size reference (from button.tsx)
```typescript
// Source: components/ui/button.tsx
// For stepper icon buttons:
size="icon-sm"   // size-7 rounded-[min(var(--radius-md),12px)]
// For preset text buttons:
size="sm"        // h-7 gap-1 px-2.5 text-[0.8rem]
variant="outline" // border-border bg-background hover:bg-muted
```

### PhoneInput composite pattern (existing precedent for wrapping Input)
```typescript
// Source: components/ui/phone-input.tsx
// Precedent: a wrapper component that manages a derived display value
// and calls onChange with the processed value.
// The durationMin stepper follows the same principle but stays inline in the FormField.
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `<Select>` with `DURATION_OPTIONS` fixed list | `<Input type="number">` with custom stepper + presets | Free-text entry, 1-1440 range, no constraint to preset values |

**Deprecated after this phase:**
- `DURATION_OPTIONS` export from `lib/validations/service.ts` — delete entirely
- `Select` / `SelectContent` / `SelectItem` / `SelectTrigger` / `SelectValue` imports in `service-form.tsx` — remove (still used by currency field, so check carefully — the currency `<Select>` MUST remain)

**Critical:** The currency field at lines 289–310 also uses `<Select>`. The Select import must NOT be removed — only the duration-field usage of Select is replaced.

---

## Open Questions

1. **FormControl slot prop propagation with composite widget**
   - What we know: `<FormControl>` from `components/ui/form.tsx` is a shadcn pattern that uses React context to pass `id`, `aria-describedby`, `aria-invalid` to its child
   - What's unclear: Whether wrapping `<Input>` inside additional `<div>` elements causes the slot props to miss the underlying `<input>` element when using `@base-ui/react/input`
   - Recommendation: Read `components/ui/form.tsx` before implementing. If FormControl uses `asChild`, the wrapper div will absorb the props. Solution: pass `aria-invalid` explicitly to `<Input>`, or restructure so `<Input>` is the direct child of `<FormControl>` with the stepper buttons outside it.

2. **Grid layout impact**
   - What we know: The duration field is inside a `grid grid-cols-2 gap-3 sm:grid-cols-3` div shared with price and currency fields
   - What's unclear: Whether the expanded height of the duration field (stepper row + preset row) visually breaks the grid alignment with price/currency
   - Recommendation: The duration `<FormItem>` may need `col-span-full` or the grid may need restructuring to put duration on its own row above price+currency. Implementor should verify at mobile and desktop breakpoints.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 with ts-jest |
| Config file | `jest.config.ts` at project root |
| Quick run command | `jest --testPathPattern="__tests__/infrastructure-validation"` |
| Full suite command | `jest` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|--------------|
| DUR-01 | `DURATION_OPTIONS` removed from service.ts | static-file assertion | `jest --testPathPattern="service-form"` | ❌ Wave 0 |
| DUR-02 | service.ts zod schema has min(1) and max(1440) | static-file assertion | `jest --testPathPattern="service-form"` | ❌ Wave 0 |
| DUR-03 | service-form.tsx no longer imports Select for duration | static-file assertion | `jest --testPathPattern="service-form"` | ❌ Wave 0 |
| DUR-04 | service-form.tsx contains stepper buttons with type="button" | static-file assertion | `jest --testPathPattern="service-form"` | ❌ Wave 0 |
| DUR-05 | service-form.tsx contains three preset values (15, 30, 60) | static-file assertion | `jest --testPathPattern="service-form"` | ❌ Wave 0 |
| DUR-06 | service-form.tsx contains "min" suffix in the duration widget | static-file assertion | `jest --testPathPattern="service-form"` | ❌ Wave 0 |

**Note:** Project test pattern is `fs.readFileSync` + regex assertions (static file analysis), not DOM rendering tests. All six requirements are verifiable with this pattern. No jsdom or React testing library required.

### Sampling Rate
- **Per task commit:** `jest --testPathPattern="__tests__/.*service-form"` (once file created)
- **Per wave merge:** `jest` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/service-form.test.ts` — covers DUR-01 through DUR-06 using static file assertion pattern

---

## Sources

### Primary (HIGH confidence)
- Direct file reads: `components/service-form.tsx`, `lib/validations/service.ts`, `components/ui/input.tsx`, `components/ui/button.tsx`, `components/ui/phone-input.tsx` — all source read at full fidelity
- Direct file reads: `jest.config.ts`, `__tests__/infrastructure-validation.test.ts`, `__tests__/data-display.test.ts` — test patterns confirmed
- Direct file read: `package.json` — all dependency versions confirmed

### Secondary (MEDIUM confidence)
- N/A — all findings grounded in direct source reads; no external lookups needed for this phase

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed in package.json, components read directly
- Architecture: HIGH — patterns derived from existing codebase (price field, phone-input, button variants)
- Pitfalls: HIGH — identified from direct code inspection (Select import shared with currency, FormControl slot mechanics)
- Test approach: HIGH — test pattern confirmed from existing test files

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable codebase, no external dependencies to drift)
