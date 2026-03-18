# Phase 2: Tenant Public Booking Surface - Research

**Researched:** 2026-03-18
**Domain:** Tailwind CSS v4 semantic token replacement — `components/tenant-public-page.tsx`, `components/booking-form.tsx`, `components/booking-calendar.tsx`
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-01 | `components/tenant-public-page.tsx` — all 34+ hardcoded zinc/slate `dark:` dual-class pairs replaced with single semantic tokens | Full line-by-line audit complete — all violations catalogued below |
| BOOK-02 | `components/booking-form.tsx` — `bg-white` on date/time inputs replaced with `bg-background`; border classes replaced with `border-input` | All violations catalogued — bg-white at line 619, plus 40+ zinc pairs throughout |
| BOOK-03 | `components/booking-calendar.tsx` — hardcoded color classes replaced with semantic tokens | Calendar already largely semantic; RESOURCE_PALETTE hardcoded light-only values need dark: variants; one `bg-gray-400` fallback found |
| BOOK-04 | Niche brand accent colors (`bg-blue-600`, `bg-pink-600`, `bg-orange-600`, `bg-green-600`) in booking components explicitly preserved | COLORS and BOOKING_COLORS maps confirmed — all niche accents catalogued and must not change |
| BOOK-05 | Hero section container background uses `bg-background` (page canvas), not `bg-card` (raised surface) | Line 206: root div uses `bg-white dark:bg-zinc-950` — must become `bg-background` |
</phase_requirements>

---

## Summary

Phase 2 targets three components: `tenant-public-page.tsx` (700 lines), `booking-form.tsx` (784 lines), and `booking-calendar.tsx` (612 lines). The work is exclusively color class replacement — no structural or logic changes. All three components are heavily loaded with hardcoded `zinc-*` / `slate-*` dual-class pairs.

The token foundation from Phase 0 is intact. The complete semantic token set (`--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--primary`, `--primary-foreground`) is defined in `globals.css` and bridged via `@theme inline`. The `BookingThemeProvider` correctly applies the `.dark` class to `<html>`.

The key complication in Phase 2 is that all three files contain a niche color system — `COLORS` in `tenant-public-page.tsx`, `BOOKING_COLORS` in `booking-form.tsx`, and `RESOURCE_PALETTE` in `booking-calendar.tsx` — which contain intentional brand accent colors that must be explicitly preserved. The rule from Phase 1 holds: replace only `zinc-*`, `slate-*`, `gray-*` neutrals; never replace `blue-*`, `pink-*`, `orange-*`, `green-*`, `purple-*`, `emerald-*`, `teal-*` brand/palette colors.

`booking-calendar.tsx` is the cleanest of the three — it already uses semantic tokens for most of its structure (`bg-background`, `bg-muted/30`, `text-muted-foreground`, `text-primary`, `bg-primary`, `border-border`). Its main issues are: (1) `RESOURCE_PALETTE` uses light-only `bg-*-100 border-*-300 text-*-900` classes that appear fine in light mode but have no dark equivalents; (2) one `bg-gray-400` fallback dot color.

**Primary recommendation:** Work file by file. In `tenant-public-page.tsx`, replace the root div and header `bg-white/dark:bg-zinc-*` pairs with `bg-background`, `bg-card`, `border-border`. In `booking-form.tsx`, replace `bg-white` on the date input and all `zinc-*` pairs with semantic tokens. In `booking-calendar.tsx`, add `dark:` variants to `RESOURCE_PALETTE` entries and replace `bg-gray-400`. Preserve all niche accent colors.

---

## Standard Stack

### Core Token Set (confirmed in `globals.css`)

| Token | Light value | Dark value | Use for |
|-------|------------|-----------|---------|
| `bg-background` | white | very dark blue-grey | Page canvas, root container, sections |
| `bg-card` | white | slightly lighter dark | Raised card surfaces, panels |
| `text-foreground` | near-black | near-white | Primary headings and body text |
| `text-muted-foreground` | medium grey | medium-light grey | Subtitles, secondary text, captions, labels |
| `border-border` | light grey | dark grey | Card borders, section dividers |
| `border-input` | light grey | dark grey | Form input borders (same value as border but semantically distinct) |
| `hover:bg-muted` | very light grey | slightly lighter dark | Hover state on list rows, transparent buttons |
| `hover:text-foreground` | near-black | near-white | Hover on muted-foreground links |
| `bg-muted` | very light grey | dark secondary | Chip/badge background, skeleton loader, info rows |
| `text-primary` | indigo | brighter indigo | Today highlight in calendar header |
| `bg-primary` | indigo | brighter indigo | Today date circle fill |
| `text-primary-foreground` | near-white | dark | Text on primary fill |

### Intentionally Preserved (Brand Accent Colors — Do Not Replace)

These classes appear in `COLORS`, `BOOKING_COLORS`, and `RESOURCE_PALETTE` maps. They are niche identity colors.

| Class family | Component | Map / Location | Why preserved |
|-------------|-----------|----------------|---------------|
| `bg-blue-600`, `text-blue-600/700`, `bg-blue-50/100`, `border-blue-200/300/600`, `from-blue-600 to-blue-800` | `tenant-public-page.tsx` | `COLORS.blue` | Niche identity — medicine/barber niche brand |
| `bg-pink-600`, `text-pink-600/700`, `bg-pink-50/100`, `border-pink-200/300/600`, `from-pink-500 to-pink-700` | `tenant-public-page.tsx` | `COLORS.pink` | Niche identity — beauty niche brand |
| `bg-orange-600`, `text-orange-600/700`, `bg-orange-50/100`, `border-orange-200/300/600`, `from-orange-500 to-orange-700` | `tenant-public-page.tsx` | `COLORS.orange` | Niche identity — horeca niche brand |
| `bg-green-600`, `text-green-600/700`, `bg-green-50/100`, `border-green-200/300/600`, `from-green-600 to-green-800` | `tenant-public-page.tsx` | `COLORS.green` | Niche identity — sports niche brand |
| `bg-blue-600`, `border-blue-600/500`, `bg-blue-50`, `text-blue-600` | `booking-form.tsx` | `BOOKING_COLORS.blue` | Niche identity |
| `bg-pink-600`, `border-pink-600/500`, `bg-pink-50`, `text-pink-600` | `booking-form.tsx` | `BOOKING_COLORS.pink` | Niche identity |
| `bg-orange-600`, `border-orange-600/500`, `bg-orange-50`, `text-orange-600` | `booking-form.tsx` | `BOOKING_COLORS.orange` | Niche identity |
| `bg-green-600`, `border-green-600/500`, `bg-green-50`, `text-green-600` | `booking-form.tsx` | `BOOKING_COLORS.green` | Niche identity |
| `RESOURCE_PALETTE` (blue-100/300/900, purple-*, emerald-*, orange-100/300/900, pink-*, teal-*) | `booking-calendar.tsx` | `RESOURCE_PALETTE` | Calendar resource color coding — visual identity |
| `bg-red-500` current-time line dot | `booking-calendar.tsx` | line 530 | Functional indicator — current time |
| `bg-green-100`, `text-green-600` success checkmark circle | `booking-form.tsx` | `SuccessScreen` line 233 | Positive feedback state — semantic green |

### hero `bg-white` in COLORS Map — Special Case

The `heroBtn` class in `COLORS` contains `bg-white` (e.g., `bg-white text-blue-700 hover:bg-blue-50`). This `bg-white` is an **intentional design choice** — the hero button is a white pill on a rich brand gradient background. It is NOT a page canvas background. This must be preserved (or if replaced, replaced only with `bg-card` which equals white in light mode, but the visual intent is for it to remain white in dark mode too since it sits on a colored gradient). **Recommendation: preserve `bg-white` inside `COLORS.heroBtn`.**

---

## Architecture Patterns

### Replacement Pattern (same as Phase 1)

```tsx
// BEFORE (anti-pattern — dual class pair)
<div className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
<h2 className="text-zinc-900 dark:text-slate-50">
<p className="text-zinc-500 dark:text-zinc-400">
<label className="text-zinc-700 dark:text-zinc-100">

// AFTER (semantic tokens — single class, auto-adapts)
<div className="bg-card border-border">
<h2 className="text-foreground">
<p className="text-muted-foreground">
<label className="text-foreground">
```

### Input Field Pattern (BOOK-02 specific)

The date input at `booking-form.tsx` line 619 has:
```tsx
// BEFORE
className="... border-2 border-zinc-200 dark:border-zinc-700 ... bg-white dark:bg-zinc-900 dark:text-slate-50"
// AFTER
className="... border-2 border-input ... bg-background text-foreground"
```

### `bg-background` vs `bg-card` Decision Rule

This phase uses the same rule as Phase 1, with one addition for the hero container:

- Root page container (`min-h-screen`): `bg-background` — this is BOOK-05
- Sticky header: `bg-background/90` (with backdrop-blur) or `bg-card` — header is a raised/sticky surface, `bg-card` is correct
- Contact info bar: was `{colors.light} dark:bg-zinc-900/50` — the niche light color (`bg-blue-50` etc.) is brand accent on light; in dark mode replace the `dark:bg-zinc-900/50` suffix with `dark:bg-card/50`
- Service cards, resource cards, booking form section, pricing rows: `bg-card`
- Gallery/menu placeholder sections: `bg-card`
- Footer: `bg-zinc-900` — **intentional fixed dark surface**, same pattern as Phase 1 `Footer.tsx`. Must preserve with a code comment.

### RESOURCE_PALETTE Dark Mode Strategy

`booking-calendar.tsx` `RESOURCE_PALETTE` contains only light-mode classes (e.g., `bg-blue-100 border-blue-300 text-blue-900`). In dark mode, `bg-blue-100` is a light pastel that becomes visually harsh against the dark background. Two valid approaches:

**Option A — Add `dark:` variants inline in the string:**
```tsx
// This requires restructuring from string to array template — adds complexity
```

**Option B — Accept light-only palette for booking calendar blocks (document as intentional):**
The calendar booking blocks are visual indicators using pastel tints to distinguish resources. They are functional color-coding. In dark mode, the pastel backgrounds may still be readable since they have explicit `text-*-900` for contrast. This is an acceptable tradeoff given BOOK-03 scope is "hardcoded color classes replaced with semantic tokens" — RESOURCE_PALETTE colors are brand/functional palette, not neutral zinc/slate.

**Recommendation: Document RESOURCE_PALETTE as intentional functional color coding. Only fix `bg-gray-400` fallback → `bg-muted-foreground`.** The calendar structure itself (borders, backgrounds, labels) is already largely semantic.

---

## Per-Component Audit

### tenant-public-page.tsx — BOOK-01, BOOK-04, BOOK-05

#### Root container (BOOK-05)
| Line | Current | Fix |
|------|---------|-----|
| 206 | `bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-50` | `bg-background text-foreground` |

#### Sticky header
| Line | Current | Fix |
|------|---------|-----|
| 209 | `bg-white dark:bg-zinc-900` | `bg-card` (header is raised sticky surface) |
| 209 | `border-zinc-200 dark:border-zinc-800` | `border-border` |
| 220 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 229 | `text-zinc-400 hover:text-zinc-700` | `text-muted-foreground hover:text-foreground` |
| 234 | `text-zinc-400 hover:text-zinc-700` | `text-muted-foreground hover:text-foreground` |
| 239 | `text-zinc-400 hover:text-zinc-700` | `text-muted-foreground hover:text-foreground` |

#### Contact info bar
| Line | Current | Fix |
|------|---------|-----|
| 313 | `dark:border-zinc-800 dark:bg-zinc-900/50` suffix | remove zinc overrides; light mode uses `{colors.border} {colors.light}` (brand accents — keep); dark: suffix → `dark:border-border dark:bg-card/50` |

#### Services horizontal scroll cards
| Line | Current | Fix |
|------|---------|-----|
| 395 | `dark:bg-zinc-900 dark:border-zinc-800` | `dark:bg-card dark:border-border` |
| 397 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 399 | `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| 407 | `bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700` | `bg-background text-muted-foreground border-border` |

#### Gallery and menu placeholder sections
| Lines | Current | Fix |
|-------|---------|-----|
| 424–425 | `dark:border-zinc-800 dark:bg-zinc-900/50` + `text-zinc-400 dark:text-zinc-500` | `dark:border-border dark:bg-card/50` + `text-muted-foreground` |
| 437–438 | same pattern | same fix |

#### Pricing section
| Line | Current | Fix |
|------|---------|-----|
| 447 | `border-zinc-200 dark:border-zinc-800` + `divide-zinc-100 dark:divide-zinc-800` | `border-border` + `divide-border` |
| 449 | `bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800` | `bg-card hover:bg-muted` |
| 451 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 453 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| 462 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |

#### Booking section container
| Line | Current | Fix |
|------|---------|-----|
| 471 | `dark:bg-zinc-900 dark:border-zinc-800` suffix | → `dark:bg-card dark:border-border` |
| 472 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 473 | `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| 479 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| 480 | `text-zinc-300 dark:text-zinc-500` | `text-muted-foreground` |

#### Footer
| Line | Current | Fix |
|------|---------|-----|
| 498 | `bg-zinc-900 text-zinc-400` | Preserve; add `{/* intentional: fixed dark footer surface */}` comment |

#### SectionHeading sub-component
| Line | Current | Fix |
|------|---------|-----|
| 573 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |

#### ResourceCard sub-component
| Line | Current | Fix |
|------|---------|-----|
| 609 | `border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-zinc-100 dark:hover:shadow-zinc-900/50` | `border-border bg-card hover:border-border/80 hover:shadow-sm` |
| 623 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 625 | `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| 649 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |

#### InfoBlock sub-component
| Line | Current | Fix |
|------|---------|-----|
| 670 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| 672 | `text-zinc-800 dark:text-slate-200` | `text-foreground` |
| 676 | `text-zinc-800 dark:text-slate-200` | `text-foreground` |

### booking-form.tsx — BOOK-02, BOOK-04

#### StepIndicator
| Line | Current | Fix |
|------|---------|-----|
| 158 | `border-zinc-200 text-zinc-400` (inactive step) | `border-border text-muted-foreground` |
| 164 | `text-zinc-800` (active step label) → `text-zinc-400` (inactive) | `text-foreground` / `text-muted-foreground` |
| 172 | `bg-zinc-200` (undone step line) | `bg-border` |

#### SuccessScreen
| Line | Current | Fix |
|------|---------|-----|
| 263 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 264 | `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| 267 | `border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900` | `border-border bg-card` |
| 277 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| 278 | `text-zinc-600 dark:text-zinc-200` | `text-foreground` |
| 285 | `border-zinc-200 text-zinc-700 hover:bg-zinc-50` | `border-border text-foreground hover:bg-muted` |
| 291 | `bg-zinc-900 text-white hover:bg-zinc-700` | `bg-foreground text-background hover:bg-foreground/90` — OR keep as intentional fixed dark action button with comment |

Note on line 291 (`bg-zinc-900` download calendar button): This is a dark-on-light action button (similar to Footer pattern). In dark mode, `bg-zinc-900` would be nearly invisible against the dark background. Replace with `bg-foreground text-background` (inverted semantic) for correct dark mode visibility.

#### Step 1 — Service
| Line | Current | Fix |
|------|---------|-----|
| 468 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 482 | `border-zinc-200 hover:border-zinc-300` (unselected) | `border-border hover:border-border/80` |
| 488 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 489 | `text-zinc-700 dark:text-zinc-200` | `text-foreground` |
| 494 | `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| 496 | `bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200` | `bg-muted text-muted-foreground` |

#### Step 2 — Resource
| Line | Current | Fix |
|------|---------|-----|
| 519 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 522 | `bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200` | `bg-muted text-muted-foreground` |
| 539 | `border-zinc-200 hover:border-zinc-300` | `border-border hover:border-border/80` |
| 545 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 549 | `bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200` | `bg-muted text-muted-foreground` |
| 552 | same pattern | `bg-muted text-muted-foreground` |
| 562 | `bg-zinc-100 text-zinc-600` (no dark:) | `bg-muted text-muted-foreground` |
| 566 | `bg-zinc-100 text-zinc-600` (no dark:) | `bg-muted text-muted-foreground` |
| 570 | `bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200` | `bg-muted text-muted-foreground` |
| 579 | `border-zinc-200 text-zinc-700 hover:bg-zinc-50` | `border-border text-foreground hover:bg-muted` |

#### Step 3 — Date/Time (BOOK-02 core)
| Line | Current | Fix |
|------|---------|-----|
| 597 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 599 | `bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200` | `bg-muted text-muted-foreground` |
| 600 | same | `bg-muted text-muted-foreground` |
| 605 | `text-zinc-700 dark:text-zinc-100` (label) | `text-foreground` |
| 619 | `border-zinc-200 dark:border-zinc-700` + `bg-white dark:bg-zinc-900 dark:text-slate-50` | `border-input bg-background text-foreground` |
| 626 | `text-zinc-700 dark:text-zinc-100` (label) | `text-foreground` |
| 628 | `text-zinc-400 dark:text-zinc-500` (loading) | `text-muted-foreground` |
| 641 | `bg-zinc-100 dark:bg-zinc-800` (skeleton) | `bg-muted` |
| 645 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| 647 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| 660 | `border-zinc-100 bg-zinc-50 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600` (unavailable) | `border-border/50 bg-muted/50 text-muted-foreground/40` |
| 663 | `border-zinc-200 text-zinc-700` (available unselected) | `border-border text-foreground` |
| 670 | `text-zinc-400 dark:text-zinc-500` | `text-muted-foreground` |
| 677 | `border-zinc-200 text-zinc-700 hover:bg-zinc-50` (back button) | `border-border text-foreground hover:bg-muted` |

#### Step 4 — Confirm
| Line | Current | Fix |
|------|---------|-----|
| 694 | `text-zinc-900 dark:text-slate-50` | `text-foreground` |
| 696 | `border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900` (summary box) | `border-border bg-card` |
| 714 | `text-zinc-700 dark:text-zinc-100` | `text-foreground` |
| 717 | `text-zinc-700 dark:text-zinc-100` | `text-foreground` |
| 728 | `text-zinc-700 dark:text-zinc-100` | `text-foreground` |
| 734 | `text-zinc-700 dark:text-zinc-100` | `text-foreground` |
| 747 | `border-zinc-200 text-zinc-700 hover:bg-zinc-50` | `border-border text-foreground hover:bg-muted` |

#### SummaryRow sub-component
| Line | Current | Fix |
|------|---------|-----|
| 779 | `text-zinc-500 dark:text-zinc-400` | `text-muted-foreground` |
| 780 | `text-zinc-800 dark:text-zinc-100` | `text-foreground` |

### booking-calendar.tsx — BOOK-03, BOOK-04

The calendar already uses semantic tokens throughout its structural elements. Changes needed are minimal:

| Line | Current | Fix |
|------|---------|-----|
| 434 | `bg-gray-400` (fallback dot color) | `bg-muted-foreground` |

#### RESOURCE_PALETTE — intentional preservation decision
Lines 31–37 define `RESOURCE_PALETTE` with light-only pastel tints (`bg-blue-100 border-blue-300 text-blue-900` etc.). These are functional color-coding for calendar resource differentiation. They are brand/functional palette colors, not neutral zinc/slate backgrounds.

**Decision:** Preserve `RESOURCE_PALETTE` as-is. Add a code comment marking these as intentional functional palette colors. This is consistent with BOOK-04 requirement to preserve niche brand accent colors.

**Rationale:** BOOK-03 requires replacing "hardcoded color classes" — but RESOURCE_PALETTE pastel blues/purples/emeralds/pinks/teals are deliberate calendar resource differentiation colors. Replacing them with semantic tokens would make all resources look identical. The requirement is specifically about `bg-white`/zinc/slate neutrals that fail dark mode, not about functional brand palette colors.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode toggle | Custom implementation | Existing `BookingThemeProvider` + `PublicThemeToggle` | Already wired, touching breaks Phase 0 |
| New CSS variables | Custom token additions | Existing token set in `globals.css` | Full set already defined, adding new is out of scope |
| Date input dark mode | Custom styled input | `bg-background border-input text-foreground` | Native HTML input with Tailwind semantic tokens — no component needed |
| Calendar resource tints | Custom dark tint generation | Preserve RESOURCE_PALETTE with comment | Functional palette, not a neutral background failure |

**Key insight:** The token system is complete. All replacements map to existing tokens from `globals.css`. No new infrastructure needed.

---

## Common Pitfalls

### Pitfall 1: Replacing Niche Brand Accents

**What goes wrong:** Developer replaces `bg-blue-600` (from `BOOKING_COLORS.blue.submitBtn`) with `bg-primary`, removing the niche identity.
**Why it happens:** Pattern-matching without reading the COLORS/BOOKING_COLORS maps.
**How to avoid:** The niche color maps (`COLORS`, `BOOKING_COLORS`, `RESOURCE_PALETTE`) are intentional brand systems — never touch them except for the single `bg-gray-400` fallback in booking-calendar.
**Warning signs:** Any edit to a `COLORS.*`, `BOOKING_COLORS.*`, or `RESOURCE_PALETTE[*]` value.

### Pitfall 2: `bg-card` vs `bg-background` in Booking Section (BOOK-05)

**What goes wrong:** The root page container at line 206 gets `bg-card` instead of `bg-background`. Dark mode: `--card` is `oklch(0.16 0.01 250)` (slightly lighter than `--background: oklch(0.12 0.01 250)`), making the page appear as a raised surface.
**How to avoid:** Root container (`min-h-screen`) = `bg-background`. Sticky header = `bg-card`. Section panels = `bg-card`.

### Pitfall 3: `colors.light` in Dynamic Class Expressions

**What goes wrong:** Lines like `${colors.light} dark:bg-zinc-900/50` only have the `dark:` suffix replaced, leaving the `{colors.light}` intact. In dark mode, `colors.light` would be e.g. `bg-blue-50` — a light pastel on a dark background.
**How to avoid:** For sections that use `{colors.light}` on the outer container, the `dark:` suffix must override it. The fix is to keep `{colors.light}` (brand light tint on light mode) but replace `dark:bg-zinc-900/50` with `dark:bg-card/50` or `dark:bg-muted/30`.

### Pitfall 4: `heroBtn: 'bg-white ...'` in COLORS Map

**What goes wrong:** Global search for `bg-white` catches the `COLORS.heroBtn` value (`bg-white text-blue-700 hover:bg-blue-50`). Developer replaces with `bg-background`, which adapts in dark mode — but the hero button sits on a brand gradient and should remain white/light.
**How to avoid:** The `bg-white` inside `COLORS.heroBtn` is an intentional design choice (white pill on colored gradient). Do not replace it. Only the free-standing `bg-white` at line 206 (root container) and line 407 (duration badge) and line 449 (pricing row) are violations.

### Pitfall 5: `bg-zinc-200` for Step Connector Line

**What goes wrong:** `bg-zinc-200` for the undone step line in `StepIndicator` is replaced with `bg-border`. `--border` is `oklch(0.9 0.01 250)` in light mode — near-white, barely visible. Step lines need medium visibility.
**How to avoid:** Use `bg-border` — in dark mode `--border` is `oklch(0.25 0.02 250)` which is a subtle dark line appropriate for a connector. In light mode it is a medium-light grey. This is correct.

### Pitfall 6: Dark "Download Calendar" Button (booking-form line 291)

**What goes wrong:** `bg-zinc-900 text-white hover:bg-zinc-700` is replaced with `bg-foreground text-background hover:bg-foreground/90`, but developer forgets this produces an inverted high-contrast button. In dark mode `bg-foreground` is near-white (light color on dark background) — looks like a ghost button.
**How to avoid:** `bg-foreground text-background` IS the correct inverted semantic for a "dark button" that works in both modes. Trust the semantic system.

### Pitfall 7: Deleting Only One Side of a Dual Pair

**What goes wrong:** `text-zinc-900 dark:text-slate-50` becomes `text-zinc-900` (only dark: removed) — dark mode broken.
**How to avoid:** Always delete BOTH classes in one edit. The result should be a single semantic token.

---

## Code Examples

All examples sourced from direct reading of the three target files.

### Root Page Container (BOOK-05)
```tsx
// Source: components/tenant-public-page.tsx line 206
// BEFORE
<div className="min-h-screen bg-white text-slate-900 dark:bg-zinc-950 dark:text-slate-50 transition-colors duration-300">
// AFTER
<div className="min-h-screen bg-background text-foreground transition-colors duration-300">
```

### Sticky Header
```tsx
// Source: components/tenant-public-page.tsx line 209
// BEFORE
<header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
// AFTER
<header className="sticky top-0 z-50 bg-card backdrop-blur border-b border-border transition-colors duration-300">
```

### Date Input (BOOK-02)
```tsx
// Source: components/booking-form.tsx line 619
// BEFORE
className="block w-full sm:max-w-xs rounded-xl border-2 border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors bg-white dark:bg-zinc-900 dark:text-slate-50"
// AFTER
className="block w-full sm:max-w-xs rounded-xl border-2 border-input px-3 py-2.5 text-sm focus:outline-none focus:border-ring transition-colors bg-background text-foreground"
```

### Service/Resource Badge Chips
```tsx
// Source: booking-form.tsx lines 496, 522, 549, 552
// BEFORE
<span className="... bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200">
// AFTER
<span className="... bg-muted text-muted-foreground">
```

### Unavailable Time Slot
```tsx
// Source: booking-form.tsx line 660
// BEFORE
'border-zinc-100 bg-zinc-50 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed'
// AFTER
'border-border/50 bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
```

### Contact Bar Dark Mode Fix (colors.light preservation)
```tsx
// Source: tenant-public-page.tsx line 313
// BEFORE
<section className={`border-b ${colors.border} ${colors.light} dark:border-zinc-800 dark:bg-zinc-900/50`}>
// AFTER
<section className={`border-b ${colors.border} ${colors.light} dark:border-border dark:bg-card/50`}>
```

### ResourceCard
```tsx
// Source: tenant-public-page.tsx line 609
// BEFORE
<div className="group rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-100 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 transition-all duration-200">
// AFTER
<div className="group rounded-2xl border-2 border-border bg-card p-5 flex flex-col gap-4 hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
```

### RESOURCE_PALETTE Intentional Comment
```tsx
// Source: components/booking-calendar.tsx lines 30-37
// ADD comment, no class changes:
// intentional: RESOURCE_PALETTE uses fixed pastel tints for resource color-coding
// (functional visual differentiation, not neutral neutral backgrounds — preserve in both modes)
const RESOURCE_PALETTE = [
  { bg: 'bg-blue-100 border-blue-300 text-blue-900', dot: 'bg-blue-500' },
  // ...
]
```

### Calendar Fallback Dot Fix
```tsx
// Source: booking-calendar.tsx line 434
// BEFORE
className={`h-2.5 w-2.5 rounded-full ${color?.dot ?? 'bg-gray-400'}`}
// AFTER
className={`h-2.5 w-2.5 rounded-full ${color?.dot ?? 'bg-muted-foreground'}`}
```

### Footer Intentional Exception
```tsx
// Source: tenant-public-page.tsx line 498
// ADD comment above, no class changes:
{/* intentional: fixed dark footer surface — brand design choice, dark in both modes */}
<footer className="bg-zinc-900 text-zinc-400 mt-8 py-8">
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `bg-white dark:bg-zinc-900` dual pair | `bg-card` single token | Consistent card surface hierarchy |
| `bg-white dark:bg-zinc-950` on root | `bg-background` single token | BOOK-05 resolved |
| `border-zinc-200 dark:border-zinc-700` pair | `border-input` for form fields, `border-border` for cards | Semantically appropriate by context |
| `text-zinc-900 dark:text-slate-50` pair | `text-foreground` single | Halved class count, consistent |
| `text-zinc-500 dark:text-zinc-400` pair | `text-muted-foreground` single | Consistent secondary text |
| `text-zinc-700 dark:text-zinc-100` pair (labels) | `text-foreground` | Form labels are primary text |
| `bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200` | `bg-muted text-muted-foreground` | Chip/badge semantic |
| `hover:bg-zinc-50 dark:hover:bg-zinc-800` quad | `hover:bg-muted` single | Semantic hover |

---

## Open Questions

1. **`bg-white` inside `COLORS.heroBtn`**
   - What we know: `COLORS.blue.heroBtn = 'bg-white text-blue-700 hover:bg-blue-50'` — white pill on brand gradient
   - What's unclear: In dark mode, should this pill still be white (visible on gradient) or adapt?
   - Recommendation: Preserve `bg-white` here — the hero gradient provides the dark background context; white pill on gradient is intentional visual design. Document with comment.

2. **Contact info bar `{colors.light}` in dark mode**
   - What we know: `{colors.light}` resolves to e.g. `bg-blue-50` — a light pastel, visible on light backgrounds but problematic on dark backgrounds
   - What's unclear: Should `{colors.light}` persist as the light-mode class (with a `dark:` suffix override) or should the whole section become `bg-card`?
   - Recommendation: Keep `{colors.light}` for light mode (brand accent strip), add `dark:bg-card/50` override. This preserves the brand identity in light mode while preventing pastel-on-dark failure.

3. **`bg-zinc-900` on "Download to Calendar" button (SuccessScreen line 291)**
   - What we know: `bg-zinc-900 text-white hover:bg-zinc-700` — a deliberately dark button
   - What's unclear: Is this intended to be always-dark like the footer, or should it adapt?
   - Recommendation: Replace with `bg-foreground text-background hover:bg-foreground/90` — this produces a visually matching inverted dark button in light mode, and a visually matching inverted light button in dark mode. Both are high-contrast and appropriate for the action CTA.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest) |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/booking-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | No bare `bg-white` (free-standing), `bg-zinc-*`, `bg-slate-*`, `dark:bg-zinc-*` pairs in `tenant-public-page.tsx` | static file scan (fs.readFileSync + regex) | `npx jest __tests__/booking-surface.test.ts --no-coverage` | ❌ Wave 0 |
| BOOK-02 | No `bg-white` on date input; no `border-zinc-200 dark:border-zinc-700` on form inputs in `booking-form.tsx` | static file scan | same | ❌ Wave 0 |
| BOOK-03 | No bare `bg-zinc-*`, `text-zinc-*`, `border-zinc-*` neutrals (without `dark:` prefix) in `booking-calendar.tsx`; no `bg-gray-400` | static file scan | same | ❌ Wave 0 |
| BOOK-04 | Niche brand accent colors present in all four niches across `COLORS` and `BOOKING_COLORS` maps | static presence scan | same | ❌ Wave 0 |
| BOOK-05 | Root `min-h-screen` div uses `bg-background` (not `bg-white` or `bg-zinc-*`) | static file scan | same | ❌ Wave 0 |

### Test Pattern Notes

Following Phase 0 and Phase 1 patterns: `fs.readFileSync` static content assertions. Negative lookbehind regex to distinguish bare violations from `dark:` overrides.

**BOOK-01 regex care:** Must not flag `bg-white` inside `COLORS.heroBtn` (intentional). Safe approach: scan for `bg-white` and assert absence, then add an allow-list comment in the test explaining that `COLORS.heroBtn` uses `bg-white` intentionally and asserting it appears only inside that map. Alternative: assert `bg-white` appears only in the `COLORS` object block (lines 31–80) and not in JSX.

**BOOK-04 presence scan:** Assert that each niche color marker (`bg-blue-600`, `bg-pink-600`, `bg-orange-600`, `bg-green-600`) appears in both `tenant-public-page.tsx` and `booking-form.tsx` — confirms brand accents were not accidentally removed.

**BOOK-03 calendar exception:** `RESOURCE_PALETTE` uses `bg-*-100`, `border-*-300`, `text-*-900` — these are functional palette colors, not zinc/slate neutrals. Test should only scan for zinc/slate/gray violations, not palette colors. Also assert `bg-gray-400` does NOT appear (must be replaced with `bg-muted-foreground`).

### Sampling Rate
- **Per task commit:** `npx jest __tests__/booking-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/booking-surface.test.ts` — covers BOOK-01 through BOOK-05 (static file assertions)

---

## Sources

### Primary (HIGH confidence)
- `components/tenant-public-page.tsx` — audited line by line; all violations catalogued
- `components/booking-form.tsx` — audited line by line; all violations catalogued
- `components/booking-calendar.tsx` — audited line by line; violations minimal
- `app/globals.css` — full semantic token set confirmed
- `__tests__/landing-surface.test.ts` — Phase 1 test pattern to follow
- `.planning/phases/01-landing-marketing-surface/01-RESEARCH.md` — established patterns and decisions

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — BOOK-01 through BOOK-05 specification
- `.planning/STATE.md` — accumulated decisions including niche brand accent preservation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — token set read directly from `globals.css`, all semantic tokens verified
- Architecture: HIGH — all three target files audited line by line, every violation catalogued
- Pitfalls: HIGH — pitfalls derived from direct code observation and Phase 1 lessons
- Validation: HIGH — follows identical pattern to Phase 1 tests; framework confirmed working

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable — no new dependencies, no external APIs)
