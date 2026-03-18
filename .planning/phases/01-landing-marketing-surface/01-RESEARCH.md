# Phase 1: Landing / Marketing Surface - Research

**Researched:** 2026-03-18
**Domain:** Tailwind CSS v4 semantic token replacement — `components/landing/` directory
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAND-01 | All `bg-white`, `bg-zinc-*`, `bg-slate-*` background classes in `components/landing/` replaced with `bg-background` or `bg-card` | Audit complete — exact violations catalogued per file |
| LAND-02 | All `text-gray-900`, `text-zinc-900`, `text-slate-900` classes in `components/landing/` replaced with `text-foreground` | Audit complete — exact violations catalogued per file |
| LAND-03 | All `text-gray-500`, `text-zinc-400`, `text-slate-500` classes in `components/landing/` replaced with `text-muted-foreground` | Audit complete — exact violations catalogued per file |
| LAND-04 | All `border-gray-*`, `border-zinc-*` classes in `components/landing/` replaced with `border-border` | Audit complete — exact violations catalogued per file |
| LAND-05 | Hover/focus/ring state variants in `components/landing/` use semantic tokens (`hover:bg-muted`, `focus:border-input`, `ring-border`) | Hover violations identified; some already correct |
| LAND-06 | `PricingCards.tsx` fully semantic — no hardcoded color utilities except intentional brand accents | Detailed per-element audit complete |
| LAND-07 | Gradient sections in landing have correct dark mode behavior (either `dark:from-*/to-*` adaptive or intentionally fixed brand colors) | Hero gradient already has dark variants; FeaturesGrid icon bg lacks dark variant |
</phase_requirements>

---

## Summary

Phase 1 targets the ten components in `components/landing/`: `HeroSection.tsx`, `PricingCards.tsx`, `Navbar.tsx`, `FeaturesGrid.tsx`, `Footer.tsx`, `NicheCards.tsx`, `StatsCounter.tsx`, `Testimonials.tsx`, `DemoSection.tsx`, and `FadeIn.tsx`. The work is exclusively color class replacement — no structural or logic changes.

The token foundation is confirmed solid from Phase 0: `globals.css` defines a full set of semantic tokens (`--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--primary`, `--primary-foreground`) all bridged through `@theme inline` so every `bg-*` and `text-*` Tailwind utility works correctly in both modes. The `.dark` class is applied to `<html>` by the theme providers.

The primary problems are: (1) heading and body text throughout the landing uses raw `text-zinc-900 dark:text-*` dual-class pairs instead of single `text-foreground` / `text-muted-foreground` tokens; (2) `Footer.tsx` uses an entirely hardcoded `bg-zinc-900` dark surface that never adapts; (3) the `Testimonials.tsx` card uses `bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800` raw pairs; (4) brand accent colors (`indigo-600`, `blue-*`, `pink-*`, `orange-*`, `green-*`) are intentionally fixed and must NOT be replaced.

**Primary recommendation:** Replace raw `zinc-*/slate-*/gray-*` classes with semantic tokens one component at a time. Preserve all `indigo-*`, `blue-*`, `pink-*`, `orange-*`, `green-*` brand accent colors. Treat `Footer.tsx` as requiring a surface-level decision about whether to use `bg-background` or a dedicated dark footer pattern.

---

## Standard Stack

### Core Token Set (confirmed in `globals.css`)

| Token | Light value | Dark value | Use for |
|-------|------------|-----------|---------|
| `bg-background` | white | very dark blue-grey | Page canvas, section backgrounds |
| `bg-card` | white | slightly lighter dark | Raised surface cards |
| `text-foreground` | near-black | near-white | Primary headings and body text |
| `text-muted-foreground` | medium grey | medium light grey | Subtitles, secondary text, captions |
| `border-border` | light grey | dark grey | Card borders, dividers |
| `hover:bg-muted` | very light grey | slightly lighter dark | Hover state on transparent buttons |
| `hover:text-foreground` | near-black | near-white | Hover on muted-foreground nav links |
| `bg-primary` | indigo | brighter indigo | Brand primary button fill |
| `text-primary-foreground` | near-white | dark | Text on primary buttons |

### Intentionally Preserved (Brand Accent Colors — Do Not Replace)

| Class | Component(s) | Reason |
|-------|-------------|--------|
| `bg-indigo-600`, `hover:bg-indigo-700`, `text-indigo-600/400` | All landing CTA buttons, Navbar logo, StatsCounter numbers | Brand primary — identity color |
| `bg-blue-*/text-blue-*` | NicheCards, DemoSection, Testimonials medicine niche | Per-niche identity accent |
| `bg-pink-*/text-pink-*` | NicheCards, DemoSection, Testimonials beauty niche | Per-niche identity accent |
| `bg-orange-*/text-orange-*` | NicheCards, DemoSection, Testimonials horeca niche | Per-niche identity accent |
| `bg-green-*/text-green-*` | NicheCards, DemoSection, Testimonials sports niche | Per-niche identity accent |
| `from-indigo-*/to-violet-*` gradient in HeroSection | HeroSection heading gradient text | Brand accent gradient |

### Token Already Used Correctly (No Changes Needed)

| Component | Correct usage already present |
|-----------|-------------------------------|
| `Navbar.tsx` | Entirely semantic — `bg-background/90`, `border-border`, `text-foreground`, `text-muted-foreground`, `hover:bg-muted`, `hover:text-foreground` |
| `PricingCards.tsx` section | `bg-background` on section; non-highlighted cards use `bg-card text-card-foreground border-border` |
| `FeaturesGrid.tsx` cards | `bg-card text-card-foreground border-border` on cards |
| `DemoSection.tsx` niche colors | All niche brand colors have `dark:` variants already |
| `NicheCards.tsx` niche colors | All niche brand colors have `dark:` variants already |
| `Testimonials.tsx` niche avatar colors | All niche brand colors have `dark:` variants already |

---

## Architecture Patterns

### Replacement Pattern: Raw Dual-Class Pair → Single Semantic Token

The anti-pattern found throughout landing components is writing the light and dark values as separate classes:

```tsx
// BEFORE (anti-pattern — raw zinc classes with dark: override)
<h2 className="text-zinc-900 dark:text-slate-50 ...">
<p className="text-zinc-500 dark:text-zinc-400 ...">
<div className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ...">

// AFTER (semantic tokens — single class, auto-adapts)
<h2 className="text-foreground ...">
<p className="text-muted-foreground ...">
<div className="bg-card border-border ...">
```

### Replacement Decision Tree

```
Is the color a brand identity accent (indigo, blue, pink, orange, green)?
  YES → Preserve as-is, ensure dark: variant present if light-only
  NO  → Is it a page canvas background (section/page)?
    YES → Use bg-background
    NO  → Is it a raised card surface?
      YES → Use bg-card
      NO  → Is it the darkest body text?
        YES → Use text-foreground
        NO  → Is it secondary/caption text?
          YES → Use text-muted-foreground
          NO  → Is it a border?
            YES → Use border-border
            NO  → Is it a hover background on a transparent button?
              YES → Use hover:bg-muted
```

### Gradient Section Pattern (LAND-07)

Two valid patterns for gradient sections:

**Pattern A — Adaptive gradient with dark variants (preferred when brand allows):**
```tsx
// HeroSection already uses this correctly:
className="bg-gradient-to-br from-indigo-50 via-white to-violet-50
           dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800"
```

**Pattern B — Intentional fixed brand gradient (acceptable when documented):**
```tsx
// Text gradient on hero heading — intentional brand color, keep as-is:
className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600
           dark:from-indigo-400 dark:to-violet-400"
```

The `FeaturesGrid.tsx` icon container `bg-indigo-50` (light only) needs a `dark:bg-indigo-900/20` or `dark:bg-indigo-950/40` companion for LAND-07 compliance, OR must be documented as intentional fixed brand color. Given it is a decorative icon background (not a text surface), documenting as fixed brand color is acceptable.

---

## Per-Component Audit

### HeroSection.tsx — Status: MOSTLY CLEAN, minor fixes

| Line | Current class | Issue | Fix |
|------|-------------|-------|-----|
| 42 | `text-zinc-900 dark:text-white` | Dual-class pair | → `text-foreground` |
| 49 | `text-zinc-500 dark:text-zinc-400` | Dual-class pair | → `text-muted-foreground` |
| 62 | `border-zinc-300 dark:border-zinc-600` | Dual-class pair on secondary button | → `border-border` |
| 62 | `text-zinc-700 dark:text-zinc-300` | Dual-class pair on secondary button | → `text-foreground` |
| 62 | `hover:bg-zinc-50 dark:hover:bg-zinc-800` | Dual hover pair | → `hover:bg-muted` |
| 68 | `text-zinc-400` | Light-only (no dark: pair) | → `text-muted-foreground` |

Gradient section (`from-indigo-50 via-white to-violet-50 dark:from-zinc-900...`): already has dark variants — **LAND-07 compliant, no change needed**.

Decorative icon text colors (`text-indigo-400`, `text-violet-400`, `text-indigo-300`, `text-violet-300`): intentional brand accents — **preserve**.

### PricingCards.tsx — Status: PARTIALLY SEMANTIC, fixes needed

The section-level and non-highlighted card are already semantic (`bg-background`, `bg-card`, `border-border`). Issues are within text:

| Location | Current class | Fix |
|---------|-------------|-----|
| Section heading h2 | `text-zinc-900 dark:text-slate-50` | → `text-foreground` |
| Section subtitle p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Non-highlight plan name span | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Non-highlight price span | `text-zinc-900 dark:text-slate-50` | → `text-foreground` |
| Non-highlight period span | `text-zinc-400 dark:text-zinc-500` | → `text-muted-foreground` |
| Non-highlight description p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Non-highlight feature list span | `text-zinc-600 dark:text-zinc-300` | → `text-foreground` (body text weight) |
| Enterprise CTA anchor | `border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50` | → `border-border text-foreground hover:border-border hover:bg-muted` |

Highlighted Pro card (`bg-indigo-600`, `text-white`, `text-indigo-100/200`, `bg-white/20`): these are intentional brand treatment on a solid indigo surface — **preserve all**.

### Navbar.tsx — Status: FULLY SEMANTIC, no changes needed

All classes already use `bg-background/90`, `border-border`, `text-foreground`, `text-muted-foreground`, `hover:bg-muted`, `hover:text-foreground`. The `bg-indigo-600 text-white hover:bg-indigo-700` on the register button is an intentional brand CTA — **preserve**.

### FeaturesGrid.tsx — Status: MINOR FIXES needed

| Location | Current class | Fix |
|---------|-------------|-----|
| Section heading h2 | `text-zinc-900 dark:text-slate-50` | → `text-foreground` |
| Section subtitle p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Feature card h3 | `text-zinc-900 dark:text-slate-50` | → `text-foreground` |
| Feature card p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Icon container div | `bg-indigo-50 text-indigo-600` (no dark:) | Document as intentional brand accent OR add `dark:bg-indigo-950/40` |

Feature cards already use `bg-card text-card-foreground border-border` — correct.

### Footer.tsx — Status: HARDCODED SURFACE, needs decision

The entire footer uses `bg-zinc-900 text-zinc-400` with `text-white` for logo and `text-zinc-500` for small text. These are raw hardcoded values that create a deliberate dark footer surface — this is intentional visual design (dark footer on a light-mode page).

**Decision required:** The footer is intentionally dark in both modes. Options:
- Replace with `bg-foreground text-background` (inverted semantic: works but semantic tokens may not produce the same aesthetic)
- Document as intentional fixed dark footer (exempt from LAND-01/LAND-02/LAND-03)
- Replace with `bg-zinc-900 dark:bg-zinc-900` explicit (same result, no semantic benefit)

**Recommendation:** Document `Footer.tsx` as an intentional fixed-dark footer. The `bg-zinc-900` is a design choice for visual weight — it does not produce a broken dark mode experience (it is dark in both modes, which is intentional). Add a code comment marking it intentional.

### NicheCards.tsx — Status: MINOR TEXT FIXES needed

| Location | Current class | Fix |
|---------|-------------|-----|
| Section heading h2 | `text-zinc-900 dark:text-white` | → `text-foreground` |
| Section subtitle p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Card heading h3 | `text-zinc-900 dark:text-white` | → `text-foreground` |
| Card body p | `text-zinc-600 dark:text-zinc-400` | → `text-muted-foreground` |

The niche-color `COLOR_MAP` (blue/pink/orange/green bg, icon, border values) already includes `dark:` variants — **LAND-07 compliant, preserve**.

### StatsCounter.tsx — Status: MINOR FIXES needed

| Location | Current class | Fix |
|---------|-------------|-----|
| Stat label p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |

The stat value `text-indigo-600` is an intentional brand accent — **preserve**.

### Testimonials.tsx — Status: MOST WORK needed

| Location | Current class | Fix |
|---------|-------------|-----|
| Section heading h2 | `text-zinc-900 dark:text-slate-50` | → `text-foreground` |
| Section subtitle p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Card container div | `bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800` | → `bg-card border-border` |
| Quote text p | `text-zinc-700 dark:text-zinc-200` | → `text-foreground` |
| Author name p | `text-zinc-900 dark:text-slate-50` | → `text-foreground` |
| Author role p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Inactive dot button | `bg-zinc-300 hover:bg-zinc-400` | → `bg-muted-foreground/40 hover:bg-muted-foreground/60` (or `bg-border hover:bg-muted-foreground`) |
| Fallback avatar | `bg-zinc-100 text-zinc-600` | → `bg-muted text-muted-foreground` |

The `NICHE_COLORS` map already has dark variants — **preserve**.

### DemoSection.tsx — Status: MINOR TEXT FIXES needed

| Location | Current class | Fix |
|---------|-------------|-----|
| Section heading h2 | `text-zinc-900 dark:text-white` | → `text-foreground` |
| Section subtitle p | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Card heading h3 | `text-zinc-900 dark:text-white` | → `text-foreground` |
| Card body p | `text-zinc-600 dark:text-zinc-400` | → `text-muted-foreground` |
| Card slug span | `text-zinc-500 dark:text-zinc-400` | → `text-muted-foreground` |
| Arrow icon | `text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-white` | → `text-muted-foreground group-hover:text-foreground` |

The niche `color` strings in the `DEMOS` array all include `dark:` variants — **preserve**.

### FadeIn.tsx — Not yet read (animation wrapper only)

Expected to be a layout/animation wrapper with no color classes. To be confirmed at plan time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode toggle | Custom JS/localStorage | Existing `next-themes` + `PublicThemeToggle` | Already wired; touching it breaks Phase 0 foundation |
| Semantic token lookup | Custom CSS variable map | `globals.css` token set | Full set already defined — adding new variables is out of scope |
| Color contrast validation | Runtime JS | Static file assertions with `fs.readFileSync` (pattern from Phase 0) | Consistent with established test pattern |

**Key insight:** The entire token system already exists. This phase is purely a find-and-replace audit — no new infrastructure, no new tokens, no new components.

---

## Common Pitfalls

### Pitfall 1: Replacing Intentional Brand Accents

**What goes wrong:** Developer replaces `bg-indigo-600` on a CTA button with `bg-primary`, which works visually but changes the contract for future theme changes.
**Why it happens:** Mechanical pattern-matching without reading intent.
**How to avoid:** The rule is — replace only `zinc-*`, `slate-*`, `gray-*` hardcoded neutrals. Never replace `indigo-*`, `blue-*`, `pink-*`, `orange-*`, `green-*` brand accents.
**Warning signs:** Any replacement touching a CTA button or niche-color element.

### Pitfall 2: Replacing Dual-Pair with Only the Light Token

**What goes wrong:** `text-zinc-900 dark:text-slate-50` becomes just `text-foreground` but the `dark:text-slate-50` is also deleted — this is correct, but if only `dark:text-slate-50` is deleted and `text-zinc-900` kept, dark mode regresses.
**How to avoid:** When replacing, remove BOTH the base class and the `dark:` override in one edit.

### Pitfall 3: Footer Misidentified as a Bug

**What goes wrong:** `bg-zinc-900` in `Footer.tsx` is treated as a dark mode bug and replaced with `bg-background`. In dark mode, the footer would then blend into the page background — losing the deliberate visual separation.
**How to avoid:** Document the footer as an intentional fixed-dark surface. The research decision (above) is to preserve with a code comment.

### Pitfall 4: `bg-card` vs `bg-background` Confusion

**What goes wrong:** Section backgrounds (page canvas areas like `<section className="py-20">`) replaced with `bg-card` instead of `bg-background`. In dark mode, `--card` is slightly lighter than `--background`, so sections would appear raised.
**How to avoid:** Page-level section backgrounds use `bg-background`. Only elevated card/panel surfaces use `bg-card`.

### Pitfall 5: PricingCards Highlighted Card Over-Correction

**What goes wrong:** The Pro card (`bg-indigo-600 text-white`) is "fixed" by replacing with `bg-primary text-primary-foreground`. While semantically equivalent, `--primary` is `oklch(0.45 0.18 260)` in light mode and `oklch(0.65 0.18 260)` in dark mode — the Pro card would change color between modes, which may be undesirable for a brand-highlighted tier.
**How to avoid:** Treat the highlighted Pro card as an intentional brand expression. Leave `bg-indigo-600` and all its `text-white/text-indigo-*` descendants untouched.

### Pitfall 6: Dot Navigation in Testimonials

**What goes wrong:** `bg-zinc-300 hover:bg-zinc-400` on inactive dots replaced with `bg-border hover:bg-border` — but `--border` is `oklch(0.9 0.01 250)` in light mode (very light, dots nearly invisible on white background) and `oklch(0.25 0.02 250)` in dark mode.
**How to avoid:** Use `bg-muted-foreground/40 hover:bg-muted-foreground/60` — this produces visible dots in both modes with appropriate opacity.

---

## Code Examples

### Standard Heading Replacement
```tsx
// Source: globals.css token definitions
// BEFORE
<h2 className="text-3xl font-bold text-zinc-900 dark:text-slate-50 mb-4">
// AFTER
<h2 className="text-3xl font-bold text-foreground mb-4">
```

### Standard Body Text Replacement
```tsx
// BEFORE
<p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
// AFTER
<p className="text-muted-foreground max-w-xl mx-auto">
```

### Standard Border Replacement
```tsx
// BEFORE
<a className="border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50">
// AFTER
<a className="border-border text-foreground hover:border-border hover:bg-muted">
```

### Testimonial Card Replacement
```tsx
// BEFORE
<div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 ...">
// AFTER
<div className="bg-card rounded-2xl border border-border ...">
```

### Dot Navigation Pattern
```tsx
// BEFORE (inactive dot)
className="bg-zinc-300 hover:bg-zinc-400"
// AFTER
className="bg-muted-foreground/40 hover:bg-muted-foreground/60"
```

### Footer Intentional Exception Comment
```tsx
// BEFORE
<footer className="bg-zinc-900 text-zinc-400 py-12">
// AFTER (document intent, not change)
{/* intentional: fixed dark footer surface — brand design choice, dark in both modes */}
<footer className="bg-zinc-900 text-zinc-400 py-12">
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `text-zinc-900 dark:text-white` dual pair | `text-foreground` single token | Half the class count, no maintenance split |
| `bg-zinc-50 dark:bg-zinc-900` dual pair | `bg-card` single token | Consistent surface hierarchy |
| `border-zinc-200 dark:border-zinc-800` pair | `border-border` single token | Border weight consistent across themes |
| `hover:bg-zinc-50 dark:hover:bg-zinc-800` quad | `hover:bg-muted` single | Semantic hover that scales |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest) |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/landing-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAND-01 | No `bg-white`, `bg-zinc-*`, `bg-slate-*` in `components/landing/` | static file scan (fs.readFileSync + regex) | `npx jest __tests__/landing-surface.test.ts --no-coverage` | ❌ Wave 0 |
| LAND-02 | No `text-zinc-900`, `text-slate-900`, `text-gray-900` in `components/landing/` | static file scan | same | ❌ Wave 0 |
| LAND-03 | No `text-zinc-400`, `text-zinc-500`, `text-slate-500`, `text-gray-500` (bare, without dark: prefix) in `components/landing/` | static file scan | same | ❌ Wave 0 |
| LAND-04 | No `border-gray-*`, `border-zinc-*` (bare) in `components/landing/` | static file scan | same | ❌ Wave 0 |
| LAND-05 | No `hover:bg-zinc-*`, `hover:bg-gray-*`, `hover:bg-slate-*` in `components/landing/` | static file scan | same | ❌ Wave 0 |
| LAND-06 | `PricingCards.tsx` contains no bare zinc/slate/gray classes outside highlighted Pro card | static file scan scoped to PricingCards | same | ❌ Wave 0 |
| LAND-07 | `HeroSection.tsx` section element contains `dark:from-*` (confirms adaptive gradient) | static file scan | same | ❌ Wave 0 |

**Pattern note:** The Phase 0 test (`__tests__/infrastructure-validation.test.ts`) uses `fs.readFileSync` static assertions. Phase 1 tests follow the same pattern — read the source files as strings, use regex to assert absence or presence of class patterns.

**LAND-03 regex care:** The pattern must match bare `text-zinc-400` but NOT `dark:text-zinc-400` (which is the correct dark: override on an already-replaced element). Use negative lookbehind: `(?<!dark:)text-zinc-400`.

**Intentional exceptions:** Tests must allow-list `bg-zinc-900` in `Footer.tsx` (intentional fixed dark footer) and all `bg-indigo-*`, `bg-blue-*`, `bg-pink-*`, `bg-orange-*`, `bg-green-*` niche brand accents.

### Sampling Rate
- **Per task commit:** `npx jest __tests__/landing-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/landing-surface.test.ts` — covers LAND-01 through LAND-07 (static file assertions)

---

## Open Questions

1. **Footer intentional exception scope**
   - What we know: `Footer.tsx` uses `bg-zinc-900` as a fixed dark surface — intentional brand design
   - What's unclear: Does the planner want a task to document this, or simply skip Footer from remediation?
   - Recommendation: Create a task that adds a code comment to `Footer.tsx` marking the dark background as intentional, then verifies Footer is excluded from the LAND-01 test assertions

2. **FeaturesGrid icon container (`bg-indigo-50`) — LAND-07 scope**
   - What we know: `bg-indigo-50` has no `dark:` variant; in dark mode the icon container becomes white-ish
   - What's unclear: Whether this is treated as LAND-07 violation or permitted as brand accent
   - Recommendation: Add `dark:bg-indigo-950/40` to give the icon container a subtler dark-mode tint; this stays within the brand palette

3. **`FadeIn.tsx` — not yet read**
   - What we know: It is an animation wrapper component
   - What's unclear: Whether it contains any color classes
   - Recommendation: Read at plan time; expected to be clean (animation-only utility)

---

## Sources

### Primary (HIGH confidence)
- `app/globals.css` — full token set verified, all semantic tokens confirmed present
- `components/landing/*.tsx` — all 9 readable components audited directly
- `__tests__/infrastructure-validation.test.ts` — test pattern established in Phase 0
- `jest.config.ts` — test framework and configuration confirmed

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirements specification with exact class categories to replace
- `.planning/STATE.md` — project decisions including "use semantic tokens not custom dark: variants"

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — token set read directly from globals.css, all values confirmed
- Architecture: HIGH — all 9 components audited line by line, violations catalogued
- Pitfalls: HIGH — pitfalls derived from direct code observation, not speculation
- Validation: HIGH — follows identical pattern to Phase 0 tests, framework confirmed

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable — no new dependencies, no external APIs)
