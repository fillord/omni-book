# Phase 0: Infrastructure Validation - Research

**Researched:** 2026-03-17
**Domain:** Tailwind CSS 4 `@theme inline`, next-themes provider configuration, CSS custom property bridging
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | `app/globals.css` body rule applies `bg-background text-foreground` as the page canvas baseline | Verified present in source — `@layer base { body { @apply bg-background text-foreground; } }` at line 129-131 |
| FOUND-02 | `@theme inline` block correctly bridges CSS custom properties to Tailwind utility classes | Verified present in source — `--color-background: var(--background)` at line 115 of `@theme inline` block |
| FOUND-03 | Both `AdminThemeProvider` and `BookingThemeProvider` use `attribute="class"` to set `.dark` on `<html>` | Verified present in source — `attribute: 'class' as const` in `commonProps` spread used by both providers |
</phase_requirements>

---

## Summary

Phase 0 is a pure **inspection and verification** phase. All three foundation requirements are already satisfied in the current codebase. No code changes are needed — the planner must produce tasks that read the relevant files, confirm the exact conditions described in the success criteria, and document the findings.

The CSS token foundation is intact: the `@layer base` body rule applies semantic tokens, the `@theme inline` block bridges every CSS custom property to a Tailwind `--color-*` utility name, and both next-themes providers inject `.dark` via the `attribute="class"` strategy. The remaining phases (1-4) depend on this foundation being correct; this phase certifies it before any component work begins.

**Primary recommendation:** Plan three inspection tasks (one per requirement), each reading the relevant source file and asserting the specific line/pattern that satisfies the requirement. No writes, no installs, no code changes.

---

## Standard Stack

### Core (already installed — no installation needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.2.1 | Utility CSS framework with `@theme inline` token bridge | Project's CSS engine; v4 introduces `@theme inline` syntax |
| next-themes | 0.4.6 | Injects `.dark` class on `<html>` based on system/user preference | Standard dark mode driver for Next.js App Router |
| shadcn/ui | CSS variable system (no package version) | Semantic color tokens (`--background`, `--foreground`, etc.) | Provides the token contract that `@theme inline` bridges |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jest 29 + ts-jest | ^29 | Unit test runner | For any automated assertions on source file content |

### Alternatives Considered

None — this phase has no technology choices. The stack is fixed and already installed.

---

## Architecture Patterns

### How the Three-Layer Token System Works

```
CSS custom property layer (globals.css :root / .dark)
  --background: oklch(1 0 0)          ← light value
  --background: oklch(0.12 0.01 250)  ← dark value (inside .dark {})

            ↓ bridged by @theme inline

Tailwind utility namespace (globals.css @theme inline block)
  --color-background: var(--background)

            ↓ consumed by

Tailwind utility class
  bg-background → background-color: var(--color-background)
                                  = var(--background)
                                  = resolves at runtime to correct oklch value
```

**Why this matters for Phase 0:** If any layer in this chain is broken (missing body rule, missing `@theme inline` entry, wrong `attribute` prop on the provider), no amount of semantic token usage in components will produce correct dark mode rendering. This phase validates the chain is unbroken before component work begins.

### next-themes `attribute="class"` Pattern

```tsx
// Source: components/theme-providers.tsx
const commonProps = {
  attribute: 'class' as const,   // writes ".dark" to <html class="dark">
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,
}
```

The `attribute: "class"` prop makes next-themes add/remove the `.dark` class on the `<html>` element. The `@custom-variant dark (&:is(.dark *))` line in `globals.css` (line 5) then makes Tailwind's `dark:` prefix scope to that class. The `:root` / `.dark` custom property blocks also use this same class selector.

Alternative: `attribute: "data-theme"` would write `data-theme="dark"` instead of a class — this would break the `.dark { ... }` CSS block in `globals.css` entirely.

### Tailwind v4 `@theme inline` vs `@theme` (without inline)

In Tailwind CSS v4:
- `@theme { --color-background: oklch(...) }` — **defines** a new color token with a fixed value
- `@theme inline { --color-background: var(--background) }` — **bridges** an existing CSS custom property into the Tailwind token namespace without duplicating the value

The `inline` keyword is critical. Without it, Tailwind would bake in a static value at build time and the CSS variable indirection would be lost, breaking runtime dark mode switching.

### Anti-Patterns to Avoid

- **Skipping the `inline` keyword**: `@theme { --color-background: var(--background) }` without `inline` may not resolve the CSS variable at runtime in Tailwind v4 — always use `@theme inline` for bridging existing custom properties.
- **Using `attribute: "data-theme"`**: Breaks `.dark {}` block scoping in globals.css. Requires rewriting the entire CSS variable selector strategy.
- **Checking the wrong body block**: `globals.css` has TWO body rules — line 12 (raw, only sets `font-family`) and line 129 (inside `@layer base`, sets `bg-background text-foreground`). The `@layer base` version is the correct one and is what matters.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode class injection | Custom cookie/localStorage logic | next-themes | Handles SSR hydration mismatch, system preference, storage key isolation |
| CSS variable → utility bridging | Manual CSS utility definitions | `@theme inline` | Tailwind v4's native mechanism; hand-rolled utilities would not respect the `dark:` variant system |

---

## Common Pitfalls

### Pitfall 1: Two `body` Rules in globals.css
**What goes wrong:** Inspector reads the raw `body { font-family: ... }` block at line 12 and concludes the body token application is missing.
**Why it happens:** The file has two separate body rules — one outside any layer (line 12) and one inside `@layer base` (line 129). Only the `@layer base` version applies `bg-background text-foreground`.
**How to avoid:** When verifying FOUND-01, explicitly confirm the `@layer base { body { @apply bg-background text-foreground; } }` pattern, not merely the presence of any `body` rule.
**Warning signs:** Verification task reports "body rule found" without specifying the layer context.

### Pitfall 2: `@theme inline` Entry vs. `@theme` Entry
**What goes wrong:** Verifier confirms `--color-background: var(--background)` exists in the file but misses whether it is inside `@theme inline` or plain `@theme`.
**Why it happens:** The distinction looks minor syntactically.
**How to avoid:** The verification for FOUND-02 must confirm the enclosing block is specifically `@theme inline {`, not `@theme {`.
**Warning signs:** `bg-background` stops responding to theme changes despite CSS variable existing.

### Pitfall 3: `attribute` Prop Not Forwarded
**What goes wrong:** Assuming the `attribute: 'class'` value is set because it appears in `commonProps` without confirming both providers use `{...commonProps}`.
**Why it happens:** If a provider was rewritten to pass props manually, the spread might be missing.
**How to avoid:** Verify both `AdminThemeProvider` and `BookingThemeProvider` explicitly spread `commonProps` or pass `attribute="class"` directly.
**Warning signs:** Dark mode toggle has no visual effect on one provider's subtree.

---

## Code Examples

### FOUND-01: Expected Pattern in globals.css
```css
/* Source: app/globals.css — lines 125-135 */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;   /* ← FOUND-01 target */
  }
  html {
    @apply font-sans;
  }
}
```
**Current state:** PRESENT and correct. Verification confirms this.

### FOUND-02: Expected Pattern in globals.css
```css
/* Source: app/globals.css — lines 83-123 */
@theme inline {
  /* ... other tokens ... */
  --color-foreground: var(--foreground);
  --color-background: var(--background);  /* ← FOUND-02 target */
  /* ... */
}
```
**Current state:** PRESENT at line 115. `bg-background` resolves to `var(--color-background)` → `var(--background)` → runtime oklch value.

### FOUND-03: Expected Pattern in theme-providers.tsx
```tsx
/* Source: components/theme-providers.tsx — lines 4-26 */
const commonProps = {
  attribute: 'class' as const,   /* ← FOUND-03 target */
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,
}

export function BookingThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="booking-theme" {...commonProps}>
      {children}
    </ThemeProvider>
  )
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="admin-theme" {...commonProps}>
      {children}
    </ThemeProvider>
  )
}
```
**Current state:** PRESENT. Both providers share `commonProps` which sets `attribute: 'class'`. Separate `storageKey` values (`booking-theme` vs `admin-theme`) allow independent theme persistence per surface.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@theme { --color-x: oklch(...) }` with static values | `@theme inline { --color-x: var(--x) }` bridging CSS custom properties | Tailwind CSS v4 | Enables runtime dark mode without CSS variable duplication |
| `data-theme` attribute strategy | `class` attribute strategy | next-themes v0.3+ | Works with standard CSS `.dark {}` selector blocks |

---

## Open Questions

1. **Is the `@custom-variant dark` line in sync with next-themes output?**
   - What we know: Line 5 of `globals.css` defines `@custom-variant dark (&:is(.dark *))`. next-themes with `attribute: 'class'` adds `.dark` directly on `<html>`.
   - What's unclear: `&:is(.dark *)` matches elements that are descendants of `.dark`. Since `.dark` is on `<html>`, all page elements qualify. This should work, but the selector specificity is different from `html.dark &` — could matter for edge cases at the `<html>` element itself.
   - Recommendation: Out of scope for Phase 0; flag for Phase 4 cleanup if any dark-mode failures appear on the `<html>` element level.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- --testPathPattern="__tests__/infrastructure"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | `@layer base body` rule applies `bg-background text-foreground` in globals.css | unit (file content assertion) | `npm test -- --testPathPattern="infrastructure-validation"` | ❌ Wave 0 |
| FOUND-02 | `@theme inline` block contains `--color-background: var(--background)` | unit (file content assertion) | `npm test -- --testPathPattern="infrastructure-validation"` | ❌ Wave 0 |
| FOUND-03 | Both theme providers use `attribute: 'class'` | unit (file content assertion) | `npm test -- --testPathPattern="infrastructure-validation"` | ❌ Wave 0 |

**Note on test type:** These are static file-content assertions — read the source file as a string and assert the presence of specific patterns. No React rendering or DOM required. Pure Node/Jest with `fs.readFileSync`. Fits the existing `testEnvironment: 'node'` configuration.

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="infrastructure-validation"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/infrastructure-validation.test.ts` — covers FOUND-01, FOUND-02, FOUND-03 (file content assertions using `fs.readFileSync`)

---

## Sources

### Primary (HIGH confidence)
- Direct file read: `app/globals.css` — confirmed `@layer base body`, `@theme inline`, `.dark {}` blocks
- Direct file read: `components/theme-providers.tsx` — confirmed `attribute: 'class'` in both providers
- Direct file read: `package.json` — confirmed next-themes 0.4.6, tailwindcss 4.2.1, jest 29
- Direct file read: `jest.config.ts` — confirmed `testEnvironment: 'node'`, `testMatch` pattern

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 `@theme inline` semantics — based on training knowledge of Tailwind v4 design; the `inline` keyword behavior is consistent with official v4 docs patterns
- next-themes `attribute: "class"` behavior — well-established pattern; behavior consistent with next-themes v0.4.x README

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions read directly from package.json
- Architecture: HIGH — all three patterns verified directly in source files
- Pitfalls: HIGH — identified by reading the actual file structure (two body rules, `inline` keyword)

**Research date:** 2026-03-17
**Valid until:** 2026-06-17 (stable stack — next-themes and Tailwind v4 patterns are unlikely to change in 90 days)
