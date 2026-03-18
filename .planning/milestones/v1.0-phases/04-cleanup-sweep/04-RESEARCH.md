# Phase 4: Cleanup Sweep - Research

**Researched:** 2026-03-18
**Domain:** Tailwind CSS v4 semantic token replacement — edge-case components, public booking flow dark mode regression, manual sweep
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLEAN-01 | `components/banned-actions.tsx` — audited and any hardcoded color utilities replaced with semantic tokens | Full audit complete — all violations catalogued below; 6 hardcoded neutral classes |
| CLEAN-02 | `components/booking-status-badge.tsx` — audited and any hardcoded color utilities replaced with semantic tokens | Full audit complete — CANCELLED entry uses raw zinc; all status color classes reviewed |
| CLEAN-03 | `app/dashboard/page.tsx` — decorative `bg-white/10` opacity overlays reviewed; replaced only if not intentional design | Full audit complete — `bg-white/10` is inside a `text-white` surface (indigo gradient), intentional. Stat icon classes use `dark:text-*-400` pairs — minor cleanup needed |

**CRITICAL FEEDBACK REQUIREMENT (--with-feedback):**
The user has reported a visual regression in the public booking flow in dark mode: black text on a dark background making service/specialist options unreadable. This is caused by `bg-{color}-50` light pastel backgrounds in `BOOKING_COLORS.serviceSelected` and `BOOKING_COLORS.resourceSelected` inside `booking-form.tsx` (lines 68–99) — these classes have no `dark:` override. Similarly, `COLORS.badge`, `COLORS.avatarBg`, and `COLORS.light` usages in `tenant-public-page.tsx` render light pastel backgrounds on dark mode surfaces without sufficient dark overrides. Phase 4 MUST remediate these regressions.
</phase_requirements>

---

## Summary

Phase 4 has two distinct workstreams: (1) the originally planned cleanup of three edge-case components (`banned-actions.tsx`, `booking-status-badge.tsx`, `app/dashboard/page.tsx`), and (2) a critical re-remediation of the public booking surface dark mode regression discovered after Phase 2 was marked complete.

**The visual regression root cause:** Phase 2 correctly replaced all `zinc-*`/`slate-*` neutral classes but preserved the `COLORS` and `BOOKING_COLORS` maps as "intentional brand accents." However, the `serviceSelected` and `resourceSelected` entries in `BOOKING_COLORS` (`bg-blue-50`, `bg-pink-50`, `bg-orange-50`, `bg-green-50`) are light pastel backgrounds applied to selection-state borders with no `dark:` variant. When a user selects a service or specialist in dark mode, the selected item renders a light pastel background with no contrasting foreground text override — causing the "black text on dark background" effect. The automated tests missed this because they scanned for `bg-zinc-*` neutrals but not for light pastel backgrounds without dark overrides.

The same pattern affects several usages of `COLORS.badge` (`bg-blue-100 text-blue-700` etc.) in `tenant-public-page.tsx` at lines 221, 422, 435, 639 — the header tenant niche badge, gallery "soon" badge, menu "soon" badge, and ResourceCard attribute badges all apply pastel backgrounds without dark mode overrides.

**Primary recommendation:** In `booking-form.tsx`, add `dark:bg-{color}-950/40 dark:text-{color}-300` overrides to `serviceSelected` and `resourceSelected` in each niche's `BOOKING_COLORS` entry. In `tenant-public-page.tsx`, add `dark:bg-{color}-950/40 dark:text-{color}-300` to `badge` and `avatarBg` entries in the `COLORS` map. For the CLEAN-01/02/03 components, apply direct semantic token replacements. The `bg-white/10` overlays in `app/dashboard/page.tsx` are intentional (white-on-indigo gradient surface) and must be preserved with a comment.

---

## Standard Stack

### Core Token Set (confirmed in `globals.css`, Phase 0 verified)

| Token | Light value | Dark value | Use for |
|-------|------------|-----------|---------|
| `bg-background` | white | very dark blue-grey | Page canvas |
| `bg-card` | white | slightly lighter dark | Raised card surfaces |
| `text-foreground` | near-black | near-white | Primary text |
| `text-muted-foreground` | medium grey | medium-light grey | Secondary text, labels |
| `border-border` | light grey | dark grey | Card borders, dividers |
| `hover:bg-muted` | very light grey | slightly lighter dark | Hover states |
| `bg-muted` | very light grey | dark secondary | Chip/badge background |
| `text-primary-foreground` | near-white | dark | Text on primary/accent fill |

### Niche Brand Accent Rules (established in Phase 2)

All `blue-600`, `pink-600`, `orange-600`, `green-600` strong accent values are intentional niche identity colors — preserved.

The **new finding** for Phase 4: `bg-{color}-50` and `bg-{color}-100` light pastel values in `COLORS` and `BOOKING_COLORS` maps are NOT always intentional when used as selected-state backgrounds. They need `dark:` overrides when applied to interactive selection states.

**Dark override strategy for niche selection states:**

| Light class | Dark override | Rationale |
|-------------|--------------|-----------|
| `bg-blue-50` (selected state) | `dark:bg-blue-950/40` | Deep blue tint — readable on dark surface |
| `bg-pink-50` (selected state) | `dark:bg-pink-950/40` | Deep pink tint — readable on dark surface |
| `bg-orange-50` (selected state) | `dark:bg-orange-950/40` | Deep orange tint — readable on dark surface |
| `bg-green-50` (selected state) | `dark:bg-green-950/40` | Deep green tint — readable on dark surface |
| `bg-blue-100 text-blue-700` (badge) | add `dark:bg-blue-950/40 dark:text-blue-300` | Text contrast on dark |
| `bg-pink-100 text-pink-700` (badge) | add `dark:bg-pink-950/40 dark:text-pink-300` | Text contrast on dark |
| `bg-orange-100 text-orange-700` (badge) | add `dark:bg-orange-950/40 dark:text-orange-300` | Text contrast on dark |
| `bg-green-100 text-green-700` (badge) | add `dark:bg-green-950/40 dark:text-green-300` | Text contrast on dark |

---

## Architecture Patterns

### Replacement Pattern (same as all previous phases)

```tsx
// BEFORE — hardcoded neutral
<a className="bg-zinc-900 text-white hover:bg-zinc-700">

// AFTER — semantic tokens
<a className="bg-foreground text-background hover:bg-foreground/90">
// OR for a secondary inverted: bg-primary text-primary-foreground
```

### Niche Selection State Fix Pattern (NEW for Phase 4)

The BOOKING_COLORS map entries for `serviceSelected` and `resourceSelected` need dark override suffixes added:

```tsx
// BEFORE — booking-form.tsx lines 68-69
serviceSelected:  'border-blue-600 bg-blue-50',
resourceSelected: 'border-blue-600 bg-blue-50',

// AFTER — add dark variant
serviceSelected:  'border-blue-600 bg-blue-50 dark:bg-blue-950/40',
resourceSelected: 'border-blue-600 bg-blue-50 dark:bg-blue-950/40',
```

The label element that renders the selected state does NOT have an explicit text color — it inherits `text-foreground` from its parent. So only the background override is needed. The child `span.font-semibold.text-foreground` and description `p.text-muted-foreground` already use semantic tokens and will render correctly.

### Niche Badge/Avatar Fix Pattern (NEW for Phase 4)

The `COLORS` map `badge` and `avatarBg` entries in `tenant-public-page.tsx` need dark overrides added:

```tsx
// BEFORE — tenant-public-page.tsx line 37
badge:        'bg-blue-100 text-blue-700',
avatarBg:     'bg-blue-100 text-blue-700',

// AFTER
badge:        'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
avatarBg:     'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
```

### `bg-white/10` on Gradient Surface (CLEAN-03 specific)

The `app/dashboard/page.tsx` decorative elements at lines 149–150 use `bg-white/10`:

```tsx
// Source: app/dashboard/page.tsx lines 149–150
<div aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
<div aria-hidden className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
```

These sit inside a `bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-700 dark:via-indigo-600 dark:to-violet-700 text-white` banner. `bg-white/10` is a semi-transparent white overlay on a colored gradient — correct and intentional in both modes. The gradient itself already has `dark:` variants. The overlays remain white/10 regardless of mode. Add a code comment to document intentionality. No class changes needed.

Also on line 163: `bg-white/15` (backdrop blur badge) and line 163: `bg-white/10` (outline badge). These are also on the gradient surface — intentional. Add comment.

---

## Per-Component Audit

### `banned-actions.tsx` — CLEAN-01

File: `components/banned-actions.tsx` (39 lines)

| Line | Element | Current classes | Violation | Fix |
|------|---------|----------------|-----------|-----|
| 21 | Contact support `<a>` | `bg-zinc-900 text-white hover:bg-zinc-700` | `bg-zinc-900` and `hover:bg-zinc-700` are hardcoded neutrals | `bg-foreground text-background hover:bg-foreground/90` |
| 28 | Sign-out `<button>` | `border border-zinc-200 text-zinc-700 hover:bg-zinc-50` | All three are hardcoded neutrals | `border border-border text-foreground hover:bg-muted` |
| 32 | Divider `<div>` | `border-t border-zinc-100` | `border-zinc-100` is a hardcoded neutral | `border-t border-border` |
| 33 | Return home `<Link>` | `text-zinc-400 hover:text-zinc-600` | Both are hardcoded neutrals | `text-muted-foreground hover:text-foreground` |

**Summary:** 4 lines, 7 hardcoded class references. All straightforward semantic replacements. No brand exceptions.

### `booking-status-badge.tsx` — CLEAN-02

File: `components/booking-status-badge.tsx` (64 lines)

Status color semantics in this component: amber = PENDING, blue = CONFIRMED, green = COMPLETED, red = NO_SHOW. These are **functional status colors** — same pattern as the amber warning block in resources-manager.tsx (Phase 3 decision: amber warning = intentional status color). The status colors must be preserved.

| Status | className | Violation? | Action |
|--------|-----------|-----------|--------|
| PENDING | `bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300` | None — already has dark: pairs | Preserve as-is |
| CONFIRMED | `bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300` | None — already has dark: pairs | Preserve as-is |
| COMPLETED | `bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300` | None — already has dark: pairs | Preserve as-is |
| CANCELLED | `bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400` | **`bg-zinc-100`, `text-zinc-600`, `border-zinc-300`** are raw zinc neutrals; dark: variants present but paired with raw light values | Replace with semantic tokens |
| NO_SHOW | `bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300` | None — already has dark: pairs | Preserve as-is |

**CANCELLED entry fix:** `bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400` → collapse the dual-pair into single semantic tokens: `bg-muted text-muted-foreground border-border`. CANCELLED is a neutral state — `bg-muted` is precisely the right semantic.

**dotColor `bg-amber-500`:** This is the PENDING animated ping dot — functional status color, preserve.

### `app/dashboard/page.tsx` — CLEAN-03

File: `app/dashboard/page.tsx` (217 lines)

**Welcome banner `bg-white/10` and `bg-white/15` overlays (lines 149–151, 159, 163):**
- Lines 149–150: `bg-white/10 blur-2xl` — decorative glow blobs on indigo gradient. Intentional.
- Line 151: `text-white/20` Sparkles icon — decorative. Intentional.
- Line 159: `bg-white/15` badge container on gradient. Intentional.
- Line 163: `bg-white/10` outline badge on gradient. Intentional.

Recommendation: Add a single comment block documenting all `bg-white/*` and `text-white/*` classes as intentional overlays on the indigo gradient surface. No class changes.

**Stat cards icon classes (line 137–140):**

```tsx
{ iconCls: 'text-blue-600 dark:text-blue-400' },    // resources
{ iconCls: 'text-purple-600 dark:text-purple-400' }, // services
{ iconCls: 'text-green-600 dark:text-green-400' },   // bookings
{ iconCls: 'text-orange-600 dark:text-orange-400' }, // users
```

These are functional identity colors distinguishing stat types — same rationale as Phase 3's amber warning preservation. They are NOT neutral zinc/slate. Preserve as-is. These are not CLEAN-03's concern (CLEAN-03 is only about `bg-white/10`).

**CLEAN-03 conclusion:** `bg-white/10` is intentional. Document with comment. No class changes needed for the overlays. The stat icon dual-pairs are functional colors, out of scope.

### Phase 2 Regression — `booking-form.tsx` (NEW work)

File: `components/booking-form.tsx`

The critical visual regression identified in user feedback:

**`BOOKING_COLORS` map — lines 60–101**

| Map entry | Current | Issue | Fix |
|-----------|---------|-------|-----|
| `blue.serviceSelected` | `'border-blue-600 bg-blue-50'` | `bg-blue-50` = light pastel, no dark override | `'border-blue-600 bg-blue-50 dark:bg-blue-950/40'` |
| `blue.resourceSelected` | `'border-blue-600 bg-blue-50'` | same | `'border-blue-600 bg-blue-50 dark:bg-blue-950/40'` |
| `pink.serviceSelected` | `'border-pink-600 bg-pink-50'` | `bg-pink-50` = light pastel, no dark override | `'border-pink-600 bg-pink-50 dark:bg-pink-950/40'` |
| `pink.resourceSelected` | `'border-pink-600 bg-pink-50'` | same | `'border-pink-600 bg-pink-50 dark:bg-pink-950/40'` |
| `orange.serviceSelected` | `'border-orange-600 bg-orange-50'` | `bg-orange-50` = light pastel, no dark override | `'border-orange-600 bg-orange-50 dark:bg-orange-950/40'` |
| `orange.resourceSelected` | `'border-orange-600 bg-orange-50'` | same | `'border-orange-600 bg-orange-50 dark:bg-orange-950/40'` |
| `green.serviceSelected` | `'border-green-600 bg-green-50'` | `bg-green-50` = light pastel, no dark override | `'border-green-600 bg-green-50 dark:bg-green-950/40'` |
| `green.resourceSelected` | `'border-green-600 bg-green-50'` | same | `'border-green-600 bg-green-50 dark:bg-green-950/40'` |

**Error block — line 741**

```tsx
// BEFORE
<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

// AFTER — add dark: overrides
<div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 px-4 py-3 text-sm text-red-700">
```

The error block (`bg-red-50 text-red-700`) is a functional feedback state. It has no dark mode override, so in dark mode it shows a light pastel red background with dark red text — the same category of problem as the BOOKING_COLORS selection states.

### Phase 2 Regression — `tenant-public-page.tsx` (NEW work)

File: `components/tenant-public-page.tsx`

**`COLORS` map badge/avatarBg entries — lines 36–37, 48–49, 60–61, 72–73**

These are `bg-{color}-100 text-{color}-700` — light pastel backgrounds with dark-colored text. No dark: overrides. Used in:
- Line 221: Header niche badge
- Line 422: Gallery section "soon" badge
- Line 435: Menu section "soon" badge
- Line 613: Table emoji container (uses `colors.light` = `bg-{color}-50`)
- Line 617: ResourceCard avatar circle (uses `colors.avatarBg` = `bg-{color}-100 text-{color}-700`)
- Line 639: ResourceCard attribute badges

| Map entry | Current | Fix |
|-----------|---------|-----|
| `blue.badge` | `'bg-blue-100 text-blue-700'` | `'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'` |
| `blue.avatarBg` | `'bg-blue-100 text-blue-700'` | `'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'` |
| `pink.badge` | `'bg-pink-100 text-pink-700'` | `'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'` |
| `pink.avatarBg` | `'bg-pink-100 text-pink-700'` | `'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'` |
| `orange.badge` | `'bg-orange-100 text-orange-700'` | `'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'` |
| `orange.avatarBg` | `'bg-orange-100 text-orange-700'` | `'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'` |
| `green.badge` | `'bg-green-100 text-green-700'` | `'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'` |
| `green.avatarBg` | `'bg-green-100 text-green-700'` | `'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'` |

**`colors.light` at line 613 (table emoji container) — no dark override:**

```tsx
// Line 613 — table emoji icon div
<div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.light}`}>
```

`colors.light` resolves to `bg-blue-50` etc. No dark: suffix here. Fix: add `dark:bg-muted` to the class string, or add a `dark:` override in the COLORS map's `light` entry.

Option: Add `dark:bg-muted` inline at the usage site since `light` is already used with `dark:bg-card/50` or `dark:bg-card` in other locations (lines 313, 395, 424, 437, 471 all have dark: overrides). Line 613 is the outlier.

Fix: Add `dark:bg-muted` to the `className` at line 613 only (do not change the COLORS map `light` entry — it's already correctly handled via dark: suffixes in all other usages).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark status colors | Custom CSS variables per-status | `dark:` prefix variants on existing color palette | Tailwind's dark: prefix is sufficient for status badge colors |
| Dark selection state | New component prop or context | `dark:bg-{color}-950/40` in the BOOKING_COLORS string | Simplest minimal change — same pattern works for all 4 niches |
| Global dark: override for badges | CSS override in globals.css | `dark:` prefix in class string | Inline dark: is consistent with the project's existing approach |
| New semantic tokens | Adding `--badge-*` to globals.css | `dark:bg-blue-950/40 dark:text-blue-300` pattern | Token additions are out of scope; existing dark: prefix is sufficient |

**Key insight:** The `dark:` prefix approach on individual map entries is the minimal correct fix. The test suite missed this because it only scanned for `bg-zinc-*`/`bg-slate-*` neutral violations — not for light chromatic backgrounds (`bg-{color}-50`, `bg-{color}-100`) that lack dark: overrides.

---

## Common Pitfalls

### Pitfall 1: Assuming Verified = Visually Correct
**What goes wrong:** Phase 2 tests passed because they only checked for absence of zinc/slate classes. The pastel backgrounds (`bg-blue-50`) are not zinc/slate so they were not flagged.
**Why it happens:** The automated tests modeled the wrong failure mode — they checked for neutrals but didn't check for light chromatic pastel backgrounds without dark overrides.
**How to avoid:** When writing tests for Phase 4, add assertions that selected-state classes in BOOKING_COLORS contain `dark:` overrides. Also check badge and avatar classes for dark: variants.

### Pitfall 2: Over-correcting the BOOKING_COLORS Map
**What goes wrong:** Developer removes all `bg-{color}-50` entries from BOOKING_COLORS and replaces with `bg-transparent` or `bg-muted` — losing the niche identity on the selection highlight.
**How to avoid:** The selected state SHOULD show the niche brand color. Keep `bg-{color}-50` for light mode. Only add the `dark:` override suffix.

### Pitfall 3: Changing `bg-white/10` in Dashboard Banner
**What goes wrong:** Developer sees `bg-white` in a scan and removes `bg-white/10` from the decorative blobs.
**Why it happens:** `bg-white/10` is a semi-transparent overlay on an indigo gradient — visually correct in both light AND dark mode because the gradient itself has `dark:` variants.
**How to avoid:** `bg-white/10` inside a `text-white` gradient banner is not a violation. Only `bg-white` (solid white) on page-canvas-level elements is a violation.

### Pitfall 4: Touching Status Colors in `booking-status-badge.tsx`
**What goes wrong:** Developer replaces `bg-amber-100 text-amber-800` with `bg-muted text-muted-foreground` — destroying status differentiation.
**Why it happens:** Over-application of "replace all hardcoded colors" rule.
**How to avoid:** Amber, blue, green, red status colors are functionally required. Only the CANCELLED entry uses zinc neutrals and needs replacement. Preserve all other status colors.

### Pitfall 5: Missing the Error Block in `booking-form.tsx`
**What goes wrong:** Regression fix focuses only on BOOKING_COLORS map, misses the `bg-red-50 border-red-200 text-red-700` error block at line 741.
**Why it happens:** Error state is outside the niche color maps; easy to overlook.
**How to avoid:** After fixing BOOKING_COLORS, search for all remaining `bg-*-50` and `bg-*-100` light chromatic backgrounds to ensure none are unprotected.

### Pitfall 6: Breaking Existing Passing Tests
**What goes wrong:** Phase 4 edits to `booking-form.tsx` or `tenant-public-page.tsx` accidentally introduce a class that triggers a Phase 2 test failure.
**How to avoid:** Run `npx jest __tests__/booking-surface.test.ts --no-coverage` after every edit. The Phase 2 tests are now guard tests — they must remain green throughout Phase 4.

---

## Code Examples

### banned-actions.tsx Full Remediation

```tsx
// Source: components/banned-actions.tsx — after CLEAN-01 fix

// Line 21 — Contact support button (BEFORE)
className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
// AFTER
className="w-full px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"

// Line 28 — Sign out button (BEFORE)
className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors text-center disabled:opacity-60 disabled:cursor-not-allowed"
// AFTER
className="w-full px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors text-center disabled:opacity-60 disabled:cursor-not-allowed"

// Line 32 — Divider (BEFORE)
className="mt-2 pt-2 border-t border-zinc-100"
// AFTER
className="mt-2 pt-2 border-t border-border"

// Line 33 — Return home link (BEFORE)
className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
// AFTER
className="text-xs text-muted-foreground hover:text-foreground transition-colors"
```

### booking-status-badge.tsx CANCELLED Fix

```tsx
// Source: components/booking-status-badge.tsx — CLEAN-02

// BEFORE
CANCELLED: {
  className: 'bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400',
  icon: XCircle,
},

// AFTER — collapse dual-pair into semantic tokens
CANCELLED: {
  className: 'bg-muted text-muted-foreground border-border',
  icon: XCircle,
},
```

### app/dashboard/page.tsx Intentional Comment

```tsx
// Source: app/dashboard/page.tsx lines 147–166 — CLEAN-03
// ADD comment, no class changes:

{/* Welcome Banner — bg-white/10, bg-white/15, text-white/* values below are intentional:
    these are semi-transparent white overlays on the indigo gradient surface.
    The gradient has its own dark: variants (dark:from-indigo-700 etc.) — the overlays
    remain white/10 in both modes, which is correct on a colored gradient. */}
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-700 dark:via-indigo-600 dark:to-violet-700 p-6 text-white animate-gradient">
```

### BOOKING_COLORS Selection State Dark Override

```tsx
// Source: components/booking-form.tsx — Phase 2 regression fix

// BEFORE (line 68–69)
serviceSelected:  'border-blue-600 bg-blue-50',
resourceSelected: 'border-blue-600 bg-blue-50',

// AFTER
serviceSelected:  'border-blue-600 bg-blue-50 dark:bg-blue-950/40',
resourceSelected: 'border-blue-600 bg-blue-50 dark:bg-blue-950/40',
```

Apply the same pattern for pink, orange, and green entries.

### Error Block Dark Override

```tsx
// Source: components/booking-form.tsx line 741

// BEFORE
<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

// AFTER
<div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 px-4 py-3 text-sm text-red-700">
```

### COLORS Badge/Avatar Dark Override

```tsx
// Source: components/tenant-public-page.tsx — Phase 2 regression fix

// BEFORE (line 37)
badge:    'bg-blue-100 text-blue-700',
avatarBg: 'bg-blue-100 text-blue-700',

// AFTER
badge:    'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
avatarBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
```

Apply the same pattern for pink (`text-pink-300`, `bg-pink-950/40`), orange, and green entries.

### Table Emoji Container (no COLORS map change needed)

```tsx
// Source: components/tenant-public-page.tsx line 613

// BEFORE
<div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.light}`}>

// AFTER — add dark: override inline (does not change COLORS.light — all other usages already have dark: suffixes)
<div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.light} dark:bg-muted`}>
```

---

## Test Strategy for Phase 4

### Existing Tests — Guard Tests

The Phase 2 test suite (`__tests__/booking-surface.test.ts`) must remain fully green. It is now a guard for the remediated state of `tenant-public-page.tsx` and `booking-form.tsx`. Run it after every edit to those files.

### New Tests — CLEAN-01, CLEAN-02, CLEAN-03, Regression

A new test file `__tests__/cleanup-surface.test.ts` must be created covering:

| Req | Test | What it asserts |
|-----|------|-----------------|
| CLEAN-01 | `banned-actions.tsx` no zinc classes | `not.toMatch(/\bbg-zinc-\d+\b/)`, `not.toMatch(/\bborder-zinc-\d+\b/)`, `not.toMatch(/\btext-zinc-\d+\b/)` |
| CLEAN-02 | CANCELLED entry uses `bg-muted` | `toContain('bg-muted text-muted-foreground border-border')` in `booking-status-badge.tsx` |
| CLEAN-02 | Other status colors preserved | Presence assertions for `bg-amber-100`, `bg-blue-100`, `bg-green-100`, `bg-red-100` |
| CLEAN-03 | `bg-white/10` documented with comment | `toContain('intentional')` within 5 lines of `bg-white/10` in `dashboard/page.tsx` |
| Regression | `booking-form.tsx` serviceSelected has dark: override | Each of 4 niches: `toContain('dark:bg-{color}-950/40')` in `serviceSelected` |
| Regression | `booking-form.tsx` resourceSelected has dark: override | Same pattern |
| Regression | Error block has dark: override | `toContain('dark:bg-red-950/40')` in `booking-form.tsx` |
| Regression | `tenant-public-page.tsx` badge has dark: override | Each of 4 niches: `toContain('dark:bg-{color}-950/40')` in `badge` entry |
| Regression | `tenant-public-page.tsx` avatarBg has dark: override | Same pattern |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Phase 2 assumed niche palette maps were immune from dark mode issues | Phase 4 recognizes that light chromatic pastels (`bg-*-50`, `bg-*-100`) in interactive states also need dark: overrides | Closes a class of dark mode failures the Phase 2 tests didn't catch |
| Automated scan: "no zinc/slate = clean" | Expanded scan: "no zinc/slate AND no unguarded light chromatic backgrounds on interactive states" | More accurate dark mode correctness model |
| CANCELLED badge using neutral zinc pair | CANCELLED badge using `bg-muted text-muted-foreground border-border` | Correct: CANCELLED is a neutral state, should use neutral semantic tokens |

---

## Open Questions

1. **`SuccessScreen.bg-green-100` at booking-form.tsx line 232**
   - What we know: `bg-green-100` success icon circle + `text-green-600` checkmark — a positive feedback indicator
   - What's unclear: Does this need a dark: override? `bg-green-100` on dark background is the same pastel problem.
   - Recommendation: Add `dark:bg-green-950/40 dark:text-green-400` to match the pattern. The success screen is a post-booking confirmation — readability matters. Treat as part of the regression fix.

2. **Manual sweep scope (CLEAN-03 requirement 3)**
   - What we know: Requirement 3 asks for "a full manual dark mode toggle sweep across all major pages"
   - What's unclear: How to plan this — it cannot be automated
   - Recommendation: Create a plan task that is explicitly manual-only: a checklist of pages to visit (landing `/`, tenant public `/[slug]`, dashboard, billing, analytics, auth). Document as manual verification task in PLAN.md with explicit pass/fail checkboxes. This is the phase gate.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest) |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/cleanup-surface.test.ts --no-coverage 2>&1 \| tail -20` |
| Full suite command | `npx jest --no-coverage 2>&1 \| tail -30` |
| Estimated runtime | ~15 seconds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLEAN-01 | `banned-actions.tsx` no zinc/neutral hardcoded classes | static file scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "CLEAN-01"` | ❌ Wave 0 |
| CLEAN-02 | `booking-status-badge.tsx` CANCELLED uses semantic tokens; other status colors preserved | static file scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "CLEAN-02"` | ❌ Wave 0 |
| CLEAN-03 | `app/dashboard/page.tsx` `bg-white/10` documented with intentional comment | static file scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "CLEAN-03"` | ❌ Wave 0 |
| Regression | `booking-form.tsx` selection states have `dark:` overrides | static file scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "regression"` | ❌ Wave 0 |
| Regression | `tenant-public-page.tsx` badge/avatarBg have `dark:` overrides | static file scan | `npx jest __tests__/cleanup-surface.test.ts --no-coverage -t "regression"` | ❌ Wave 0 |
| CLEAN-03 req 3 | Manual dark mode sweep across all major pages | manual | N/A — manual checklist | manual-only |

### Sampling Rate

- **After every task commit:** `npx jest __tests__/cleanup-surface.test.ts __tests__/booking-surface.test.ts --no-coverage 2>&1 | tail -20`
- **After every plan wave:** `npx jest --no-coverage 2>&1 | tail -30`
- **Phase gate:** Full suite green + manual sweep checklist signed off

### Wave 0 Gaps

- [ ] `__tests__/cleanup-surface.test.ts` — covers CLEAN-01, CLEAN-02, CLEAN-03, and regression assertions (created by Plan 04-01)

---

## Sources

### Primary (HIGH confidence)

- `components/banned-actions.tsx` — audited line by line; all violations catalogued
- `components/booking-status-badge.tsx` — audited line by line; CANCELLED entry identified
- `app/dashboard/page.tsx` — audited line by line; `bg-white/10` contextually confirmed intentional
- `components/booking-form.tsx` — re-audited; BOOKING_COLORS selection state regression identified
- `components/tenant-public-page.tsx` — re-audited; COLORS badge/avatarBg regression identified
- `app/globals.css` — token set unchanged since Phase 0 verification
- `.planning/STATE.md` — accumulated decisions, Phase 2/3 rationale

### Secondary (MEDIUM confidence)

- `.planning/phases/02-tenant-public-booking-surface/02-VERIFICATION.md` — confirms what Phase 2 verified; does NOT cover light pastel dark mode failures
- `.planning/phases/02-tenant-public-booking-surface/02-RESEARCH.md` — identifies BOOKING_COLORS as "preserved intentional"; Phase 4 refines this: preserved for accent values, not unguarded for selection state backgrounds
- `.planning/phases/03-dashboard-auth-surface/03-RESEARCH.md` — amber/functional status color preservation precedent
- `__tests__/booking-surface.test.ts` — confirms Phase 2 test scope; gap identified: no assertions for `dark:` presence on pastel backgrounds

---

## Metadata

**Confidence breakdown:**
- CLEAN-01 (banned-actions): HIGH — direct line-by-line audit, 4 lines with 7 violations, all straightforward replacements
- CLEAN-02 (booking-status-badge): HIGH — only 64 lines; CANCELLED entry clearly uses zinc; all other entries already have dark: pairs
- CLEAN-03 (dashboard/page.tsx): HIGH — `bg-white/10` contextually verified as intentional; gradient surface confirmed
- Regression (booking-form.tsx selection states): HIGH — root cause confirmed; fix pattern consistent with existing dark: overrides in codebase
- Regression (tenant-public-page.tsx badge/avatarBg): HIGH — same root cause; usage sites identified

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable — no new dependencies, no external APIs)
