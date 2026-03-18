# Phase 3: Dashboard + Auth Surface - Research

**Researched:** 2026-03-18
**Domain:** Tailwind CSS semantic token remediation — dashboard sidebar, billing, analytics, manager components, auth pages
**Confidence:** HIGH

---

## Summary

Phase 3 remediates the authenticated dashboard surface and all auth pages. Unlike the public-facing surfaces worked in Phases 1–2, the dashboard has one unique concern: a dedicated sidebar token family (`bg-sidebar`, `text-sidebar-foreground`, etc.) defined in `globals.css` that must be used instead of the general `bg-background`/`bg-card` family to achieve a visually distinct sidebar in dark mode.

The most complex file is `billing-content.tsx`, which contains 16 `dark:!` force-override classes. These were clearly written as a workaround for a CSS specificity conflict — the `dark:!` prefix forces `!important` on individual properties so that shadcn/ui component defaults don't win. The fix is to strip the base hardcoded classes and the force overrides simultaneously, replacing each pair with a single semantic token. Since there is no base token specificity fight when only one class is present, `!important` becomes unnecessary.

The analytics dashboard has both Tailwind class violations (`text-zinc-400` in `EmptyState`, summary card `iconBg` props) and inline prop violations (`stroke="#f4f4f5"`, `fill: '#f4f4f5'`, `tick: { fill: '#a1a1aa' }`) passed to Recharts. The CSS variable approach (`getComputedStyle` / `var(--color-muted)`) is out of scope per REQUIREMENTS.md v2 — the in-scope fix is CSS variable references in inline props where Recharts accepts a string, and replacing Tailwind class violations. All three auth pages (login, register, verify-otp) are largely semantic already; the violations are isolated and minor.

**Primary recommendation:** Execute as four plans: (1) test scaffold for all 8 requirements, (2) sidebar + billing remediation (DASH-01, DASH-02, DASH-05), (3) analytics + managers (DASH-03, DASH-04), (4) auth pages (AUTH-01, AUTH-02, AUTH-03).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | `components/dashboard-sidebar.tsx` — all background/text classes use sidebar token family, not `bg-background`/`bg-card` | Sidebar root `<div>` uses `bg-background border-r border-border`; must become `bg-sidebar border-r border-sidebar-border`. Admin link uses `bg-zinc-900 text-white`; must become `bg-sidebar-accent text-sidebar-accent-foreground` or equivalent. |
| DASH-02 | `app/dashboard/settings/billing/billing-content.tsx` — all 16 `dark:!` force-override classes removed; base hardcoded classes replaced with single semantic tokens | Root cause: base class is hardcoded zinc (e.g., `bg-zinc-50`) which fights dark mode; fix is to replace base+override pair with single semantic token, removing the specificity conflict entirely. |
| DASH-03 | `components/analytics-dashboard.tsx` — `text-zinc-400` replaced; Recharts `cursor` fill, `CartesianGrid` stroke, axis tick `fill` replaced with CSS variable refs | Three CartesianGrid occurrences use `stroke="#f4f4f5"` (light gray, invisible in dark). Tooltip `cursor={{ fill: '#f4f4f5' }}` on two charts. All YAxis/XAxis `tick={{ fill: '#a1a1aa' }}`. Recharts accepts CSS variable strings in prop values. |
| DASH-04 | `components/staff-manager.tsx`, `services-manager.tsx`, `resources-manager.tsx` — audited | Grep confirms: zero `bg-white`, `bg-zinc-*`, `bg-slate-*`, `text-zinc-*`, `text-slate-*`, `dark:!` violations. These files are already clean — no class changes required. Audit finding must be documented and tested. |
| DASH-05 | `text-white` on semantic backgrounds that lighten in dark mode replaced with `text-primary-foreground` | Sidebar line 164: `text-white bg-zinc-900 hover:bg-zinc-800` — this is the admin panel link. `bg-zinc-900` is a dark non-semantic background; becomes `bg-sidebar-accent` with `text-sidebar-accent-foreground`. |
| AUTH-01 | `app/(auth)/login/page.tsx` — hardcoded color utilities replaced; Google SVG preserved | Login page is largely semantic. One non-semantic: `bg-orange-600 hover:bg-orange-700 text-white` on the force-login button — this is a semantic warning color choice (not theme-neutral), acceptable to preserve as intentional warning style. No neutral violations found. |
| AUTH-02 | `app/(auth)/register/page.tsx` — audited; hardcoded classes replaced | Register page uses `bg-muted/40`, `bg-background`, `bg-transparent`, `text-muted-foreground`, `text-foreground` — all semantic. No neutral violations found. File is clean. |
| AUTH-03 | `app/(auth)/verify-otp/page.tsx` — audited; hardcoded classes replaced | OTP page uses `bg-muted/30`, `text-muted-foreground`, `border-destructive/40`, `bg-destructive/5`, `text-destructive`, `border-green-500/40`, `bg-green-500/5`, `text-green-600`. The green success message uses a functional color pair — acceptable as intentional status color. File is largely clean. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 (in use) | Utility class system | Project baseline |
| shadcn/ui tokens | Full set in globals.css | Semantic CSS variable tokens | Project decision: use tokens, not `dark:` pairs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts | In use | Chart primitives | Analytics charts; CSS vars can be passed as string prop values |
| Jest + ts-jest | In use | Static file content assertions | All phase validation tests match existing test patterns |

### Token Reference: Sidebar Family
The full sidebar token family is defined in `globals.css` and bridged via `@theme inline`:

| Token | Light | Dark |
|-------|-------|------|
| `bg-sidebar` | oklch(0.98 0.005 250) ≈ near-white blue-tinted | oklch(0.12 0.01 250) ≈ very dark blue |
| `text-sidebar-foreground` | oklch(0.15 0.01 250) ≈ near-black | oklch(0.98 0 0) ≈ near-white |
| `border-sidebar-border` | oklch(0.9 0.01 250) ≈ light gray | oklch(0.25 0.02 250) ≈ dark gray |
| `bg-sidebar-accent` | oklch(0.94 0.01 250) ≈ soft blue-tinted | oklch(0.2 0.02 250) ≈ dark accent |
| `text-sidebar-accent-foreground` | oklch(0.15 0.01 250) | oklch(0.98 0 0) |
| `text-sidebar-primary` | oklch(0.45 0.18 260) ≈ indigo | oklch(0.65 0.18 260) ≈ lighter indigo |

These are distinct from `bg-background`/`bg-card` — they produce a perceptibly different surface in dark mode (sidebar is darker/more blue-tinted than the main content area).

---

## Architecture Patterns

### Pattern 1: Billing `dark:!` Specificity Conflict — Root Cause

**What:** `billing-content.tsx` uses `dark:!bg-zinc-900` instead of `dark:bg-zinc-900`. The `!` prefix generates `!important`. This was added because shadcn/ui Card's default `bg-card` was overriding the user's explicit dark-mode class.

**Why it happens:** When a Tailwind class exists on a `<div>` and a parent component (Card) also applies `bg-card`, the cascade sometimes favors the component default at higher specificity. The developer added `!important` as a workaround rather than fixing the root cause.

**Fix pattern:** Remove BOTH the base hardcoded class AND the `dark:!` override. Replace with a single semantic token. No specificity fight can occur when only one class sets the property.

```
Before:  className="bg-zinc-50 dark:!bg-zinc-900 ..."
After:   className="bg-muted/50 ..."        // or bg-card, bg-background as appropriate
```

**Complete `dark:!` inventory in billing-content.tsx (16 occurrences):**

| Line | Base class | `dark:!` override | Semantic replacement |
|------|------------|-------------------|---------------------|
| 118 | `bg-zinc-50` | `dark:!bg-zinc-900` | `bg-muted` |
| 118 | `border-zinc-200` | `dark:!border-zinc-700` | `border-border` |
| 120 | `text-zinc-900` | `dark:!text-white` | `text-foreground` |
| 121 | `text-zinc-500` | `dark:!text-zinc-400` | `text-muted-foreground` |
| 133 | `text-zinc-700` | `dark:!text-zinc-300` | `text-foreground` |
| 134 | `text-indigo-600` | `dark:!text-indigo-400` | preserve (intentional brand) |
| 158 | `bg-zinc-50` | `dark:!bg-zinc-900` | `bg-muted` |
| 158 | `border-zinc-200` | `dark:!border-zinc-800` | `border-border` |
| 159 | `text-zinc-500` | `dark:!text-zinc-400` | `text-muted-foreground` |
| 160 | `text-zinc-900` | `dark:!text-white` | `text-foreground` |
| 165 | `bg-red-100` | `dark:!bg-red-900/40` | keep as `bg-red-100 dark:bg-red-900/40` (status color, no `!`) |
| 166 | `text-red-600` | `dark:!text-red-400` | keep as `text-red-600 dark:text-red-400` (status color, no `!`) |
| 169 | `text-zinc-900` | `dark:!text-white` | `text-foreground` |
| 172 | `text-zinc-600` | `dark:!text-zinc-300` | `text-foreground` |
| 178 | `text-zinc-500` | `dark:!text-zinc-400` | `text-muted-foreground` |
| 186 | `bg-indigo-50` | `dark:!bg-indigo-950/80` | `bg-indigo-50 dark:bg-indigo-950/80` (intentional brand, no `!`) |
| 187 | `text-indigo-800` | `dark:!text-indigo-200` | `text-indigo-800 dark:text-indigo-200` (intentional brand, no `!`) |

Note: The remaining `dark:` (non-force) violations on lines 60, 64, 66, 70, 76, 82, 88, 101, 107, 148, 150, 151, 197 use BOTH a base zinc/amber/emerald/indigo class AND a `dark:` complement. These dual-pairs must also be collapsed to single semantic tokens.

### Pattern 2: Recharts CSS Variable Props

**What:** Recharts accepts string values for inline style props. CSS variables can be passed directly as strings where Recharts renders the value via SVG `fill`/`stroke` attributes.

**Scope:** Only properties that use a string value (not object shorthand). Tailwind's `var(--color-*)` convention works in Recharts `stroke` and `fill` string props.

```typescript
// Before (hardcoded, broken in dark mode):
<CartesianGrid stroke="#f4f4f5" />
<Tooltip cursor={{ fill: '#f4f4f5' }} />

// After (CSS variable string — adapts to dark mode):
<CartesianGrid stroke="var(--color-border)" />
<Tooltip cursor={{ fill: 'var(--color-muted)' }} />
```

**Axis tick fill:** `tick={{ fontSize: 11, fill: '#a1a1aa' }}` → `tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}`

**Important:** The `PIE_COLORS` array and `NICHE_COLOR` hex values are intentional brand/data-visualization accent colors. REQUIREMENTS.md explicitly defers refactoring Recharts bar/pie fill colors to v2 (ADV-01). Do not change these.

### Pattern 3: Sidebar Token Migration

**What:** `dashboard-sidebar.tsx` SidebarContent root div uses `bg-background border-r border-border`. Must use sidebar family tokens to render as a visually distinct surface from main content area.

**Violations inventory:**
- Line 86: `bg-background border-r border-border` → `bg-sidebar border-r border-sidebar-border`
- Line 141: `bg-background border-t border-border` (footer section) → `bg-sidebar border-t border-sidebar-border`
- Line 164: `text-white bg-zinc-900 hover:bg-zinc-800` (admin link) → `text-sidebar-accent-foreground bg-sidebar-accent hover:bg-sidebar-accent/80`
- Niche brand color maps (`ACTIVE_LINK`, `BADGE_CLS`) use niche accent colors with `dark:bg-*/dark:text-*` pairs — these are intentional niche identity colors, preserved (same pattern as booking surface Phase 2 decision)

### Pattern 4: Auth Pages — Already Largely Semantic

All three auth pages use semantic tokens at their root:
- `bg-muted/30` page canvas ✓
- `text-muted-foreground`, `text-foreground` ✓
- `border-destructive/40`, `bg-destructive/5`, `text-destructive` for error states ✓
- `bg-card` in Separator overlay ✓

**Remaining issues:**
- `login/page.tsx` line 246: `border-orange-500/40 bg-orange-500/5 text-orange-600` and `bg-orange-600 hover:bg-orange-700 text-white` on force-login warning — intentional status color; preserve as-is (no semantic "warning" token in this system)
- `verify-otp/page.tsx` lines 106–108: `border-green-500/40 bg-green-500/5 text-green-600` for success state — intentional status color; preserve

AUTH-01, AUTH-02, AUTH-03 are audit-and-confirm tasks. No changes expected for register or verify-otp. The login page force-login warning is an intentional exception.

### Anti-Patterns to Avoid
- **Stripping only the `dark:!` override without stripping the base class:** Leaves hardcoded zinc base class which is light-mode only — same breakage in dark.
- **Using `bg-background` for the sidebar root:** This is the documented DASH-01 violation — sidebar must use `bg-sidebar` to be distinct from main area.
- **Changing Recharts `PIE_COLORS` or `NICHE_COLOR` hex values:** These are intentional data-visualization/brand accents — out of scope per REQUIREMENTS.md Out of Scope section.
- **Changing Google OAuth SVG path fill attributes:** Brand-required per REQUIREMENTS.md.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS variable refs in Recharts | Custom wrapper component | String `"var(--color-border)"` passed directly to `stroke`/`fill` props | Recharts SVG attributes accept raw strings; no wrapper needed |
| Detecting `dark:!` violations | Custom AST parser | Simple regex `dark:![a-z]` | fs.readFileSync + regex is the established test pattern in this project |
| Sidebar token availability check | Runtime theme detection | Trust `globals.css` — tokens are always present | Phase 0 validated the `@theme inline` bridge |

---

## Common Pitfalls

### Pitfall 1: Leaving Non-Force `dark:` Pairs in billing-content.tsx
**What goes wrong:** Stripping only the 16 `dark:!` instances leaves another 7+ `dark:` (non-force) dual-pairs that are equally non-semantic.
**Why it happens:** Searching for `dark:!` misses `dark:bg-zinc-950`, `dark:border-zinc-800`, `dark:text-white`, `dark:text-zinc-400` etc.
**How to avoid:** Audit ALL `dark:` occurrences in billing-content.tsx, not just force ones. Total dark: count is ~23.
**Warning signs:** If the fixed file still contains `dark:text-zinc-*` or `dark:bg-zinc-*`, the fix is incomplete.

### Pitfall 2: Replacing Niche Brand Colors in Sidebar
**What goes wrong:** `ACTIVE_LINK` and `BADGE_CLS` maps use `bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300` etc. These look like dual-pairs but are intentional niche identity markers.
**Why it happens:** Pattern-matching without reading context.
**How to avoid:** These are the same class of "intentional niche accent" colors preserved across Phase 2 (booking surface). Preserve ACTIVE_LINK and BADGE_CLS untouched.

### Pitfall 3: summary card `iconBg` in analytics-dashboard.tsx
**What goes wrong:** `iconBg="bg-blue-50 text-blue-600"` etc. on SummaryCards. These are intentional metric-category color coding (blue=bookings, green=revenue, purple=completion, red=cancellation). They are NOT neutral background violations.
**Why it happens:** Blanket grep for `bg-blue-50` flags intentional design choices.
**How to avoid:** Leave SummaryCard iconBg props untouched — these are functional/semantic status colors, not neutral gray/zinc violations. DASH-03 requirement specifically calls out `text-zinc-400` (EmptyState) and Recharts cursor/CartesianGrid props.

### Pitfall 4: Recharts `contentStyle` inline objects
**What goes wrong:** `contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 13 }}` on two Tooltip components. The `#e4e4e7` hex is zinc-200 (invisible border in dark mode).
**Why it happens:** Not mentioned explicitly in DASH-03 requirement text but is part of chart readability.
**How to avoid:** Replace `'1px solid #e4e4e7'` with `'1px solid var(--color-border)'`. Note: the custom `<BookingTooltip>` and `<RevenueTooltip>` components already use semantic tokens (`bg-card`, `border-border`), so only the two raw Tooltip/PieChart default contentStyle objects need fixing.

### Pitfall 5: Manager Components — Expecting Violations
**What goes wrong:** Planning tasks to remediate staff-manager, services-manager, resources-manager when grep confirms they are clean.
**Why it happens:** REQUIREMENTS.md says "audited and any hardcoded..." — audit was deferred to this phase.
**How to avoid:** The audit result IS the work. Plan an audit task that runs grep and documents the clean result. Tests assert zero violations. No code changes needed.

---

## Code Examples

### Sidebar Root Fix
```typescript
// Source: globals.css sidebar token definitions + DASH-01 requirement
// Before
<div className="flex flex-col h-full bg-background border-r border-border">

// After
<div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
```

### Billing dual-pair collapse
```typescript
// Source: billing-content.tsx pattern — base+override → single semantic
// Before (creates !important specificity hack)
<div className="bg-zinc-50 dark:!bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:!border-zinc-700">
  <span className="text-zinc-900 dark:!text-white">...</span>
  <span className="text-zinc-500 dark:!text-zinc-400">...</span>

// After (single semantic token per property)
<div className="bg-muted rounded-xl p-6 border border-border">
  <span className="text-foreground">...</span>
  <span className="text-muted-foreground">...</span>
```

### Recharts CSS Variable Prop Fix
```typescript
// Source: analytics-dashboard.tsx — Recharts SVG props accept CSS variable strings
// Before (hardcoded light gray — invisible in dark mode)
<CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
<Tooltip cursor={{ fill: '#f4f4f5' }} />
<XAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />

// After (CSS variable — adapts with theme)
<CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
<Tooltip cursor={{ fill: 'var(--color-muted)' }} />
<XAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
```

### Admin Link in Sidebar (DASH-01 + DASH-05)
```typescript
// Before: hardcoded zinc dark surface with text-white
<Link className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors mb-2">

// After: sidebar accent surface with semantic foreground
<Link className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-sidebar-accent-foreground bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors mb-2">
```

### Test scaffold pattern (matching existing style)
```typescript
// Consistent with __tests__/booking-surface.test.ts and landing-surface.test.ts
import fs from "fs";
import path from "path";

const readFile = (relPath: string) =>
  fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf-8");

describe("DASH-01: sidebar uses sidebar token family", () => {
  it("dashboard-sidebar.tsx root div uses bg-sidebar not bg-background", () => {
    const source = readFile("components/dashboard-sidebar.tsx");
    expect(source).not.toMatch(/flex flex-col h-full bg-background/);
    expect(source).toContain("bg-sidebar");
  });
});

describe("DASH-02: no dark:! force-overrides in billing-content.tsx", () => {
  it("billing-content.tsx contains no dark:! classes", () => {
    const source = readFile("app/dashboard/settings/billing/billing-content.tsx");
    expect(source).not.toMatch(/dark:![a-z]/);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `dark:!bg-zinc-900` force overrides | Single semantic token (no `!important`) | Phase 3 (this work) | Removes specificity hacks; tokens auto-adapt |
| `bg-background` for sidebar | `bg-sidebar` (dedicated sidebar tokens) | Phase 3 (this work) | Sidebar renders visually distinct from content area in dark mode |
| Hardcoded hex in Recharts props | `var(--color-border)` CSS variable string | Phase 3 (this work) | Chart grid lines and cursors visible in dark mode |

---

## Open Questions

1. **billing-content.tsx: Red CreditCard icon block (line 165–166)**
   - What we know: `bg-red-100 dark:!bg-red-900/40` and `text-red-600 dark:!text-red-400` — status/warning colors
   - What's unclear: Is there a semantic `destructive` equivalent? `bg-destructive` is typically used for error containers.
   - Recommendation: Convert to `bg-red-100 dark:bg-red-900/40` and `text-red-600 dark:text-red-400` (remove `!important` but keep dual-pair; these are intentional status colors with no semantic token equivalent, same pattern as amber/emerald status badges on the same page)

2. **billing-content.tsx: Indigo brand elements (lines 186–187, 134)**
   - What we know: `text-indigo-600 dark:!text-indigo-400`, `bg-indigo-50 dark:!bg-indigo-950/80`
   - Recommendation: Remove `!important` prefix only, keep the dual-pair (intentional brand color, same pattern)

3. **analytics-dashboard.tsx: EmptyState `text-zinc-400`**
   - This is the `text-zinc-400` explicitly called out in DASH-03. Replace with `text-muted-foreground`.
   - Confidence: HIGH — direct match to REQUIREMENTS.md language.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/dashboard-auth-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Sidebar root uses `bg-sidebar`, not `bg-background` | unit (static) | `npx jest __tests__/dashboard-auth-surface.test.ts --no-coverage` | Wave 0 |
| DASH-01 | Sidebar footer section uses `bg-sidebar` not `bg-background` | unit (static) | same | Wave 0 |
| DASH-01 | Admin link uses sidebar-accent tokens, not `bg-zinc-900 text-white` | unit (static) | same | Wave 0 |
| DASH-02 | No `dark:!` force overrides remain in billing-content.tsx | unit (static) | same | Wave 0 |
| DASH-02 | No bare `text-zinc-*` base classes in billing-content.tsx | unit (static) | same | Wave 0 |
| DASH-03 | `text-zinc-400` absent from analytics-dashboard.tsx (EmptyState) | unit (static) | same | Wave 0 |
| DASH-03 | CartesianGrid `stroke` uses CSS variable not hex | unit (static) | same | Wave 0 |
| DASH-03 | Tooltip cursor `fill` uses CSS variable not `#f4f4f5` | unit (static) | same | Wave 0 |
| DASH-04 | staff-manager.tsx has no neutral hardcoded classes | unit (static) | same | Wave 0 |
| DASH-04 | services-manager.tsx has no neutral hardcoded classes | unit (static) | same | Wave 0 |
| DASH-04 | resources-manager.tsx has no neutral hardcoded classes | unit (static) | same | Wave 0 |
| DASH-05 | `text-white bg-zinc-900` absent from dashboard-sidebar.tsx | unit (static) | same | Wave 0 |
| AUTH-01 | login/page.tsx has no neutral zinc/slate/gray background violations | unit (static) | same | Wave 0 |
| AUTH-02 | register/page.tsx has no neutral zinc/slate/gray background violations | unit (static) | same | Wave 0 |
| AUTH-03 | verify-otp/page.tsx has no neutral zinc/slate/gray background violations | unit (static) | same | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/dashboard-auth-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/dashboard-auth-surface.test.ts` — covers DASH-01 through AUTH-03 (all 15 assertions above)

---

## Sources

### Primary (HIGH confidence)
- Direct file read: `components/dashboard-sidebar.tsx` — line-by-line violation inventory
- Direct file read: `app/dashboard/settings/billing/billing-content.tsx` — complete `dark:!` and `dark:` catalog
- Direct file read: `components/analytics-dashboard.tsx` — all Recharts prop violations and Tailwind class violations
- Direct file read: `components/staff-manager.tsx`, `services-manager.tsx`, `resources-manager.tsx` — confirmed clean via grep
- Direct file read: `app/(auth)/login/page.tsx`, `register/page.tsx`, `verify-otp/page.tsx` — confirmed largely semantic
- Direct file read: `app/globals.css` — sidebar token definitions (lines 43–92)
- Direct file read: `.planning/REQUIREMENTS.md` — v1 requirements, Out of Scope table
- Direct file read: `.planning/STATE.md` — Phase 3 blockers/concerns

### Secondary (MEDIUM confidence)
- Existing test files (`__tests__/landing-surface.test.ts`, `booking-surface.test.ts`) — establishes test pattern: `fs.readFileSync` + regex assertions

---

## Metadata

**Confidence breakdown:**
- Violation inventory (DASH-01, DASH-02, DASH-03, DASH-05): HIGH — direct source inspection
- Manager audit (DASH-04): HIGH — grep confirmed zero violations
- Auth page audit (AUTH-01/02/03): HIGH — direct source inspection, all largely semantic
- Recharts CSS variable approach: HIGH — pattern is established in project; Recharts accepts string SVG attributes
- Sidebar token names: HIGH — read directly from `globals.css` and `@theme inline` bridge

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable — no dependency on fast-moving external ecosystem)
