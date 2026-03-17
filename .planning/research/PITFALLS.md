# Pitfalls Research

**Domain:** Dark mode theming refactor — Tailwind CSS 4 + shadcn/ui CSS variable tokens + next-themes
**Researched:** 2026-03-17
**Confidence:** HIGH (all pitfalls grounded in direct codebase inspection of this repo)

---

## Critical Pitfalls

### Pitfall 1: Choosing `bg-card` vs `bg-background` — Wrong Token for Context

**What goes wrong:**
A developer replaces `bg-white` with `bg-background` everywhere. In dark mode, cards and panels look flat — they render at the same dark value as the page background (`oklch(0.12)`) instead of the slightly lighter card surface (`oklch(0.16)`). Alternatively, a developer uses `bg-card` for the page body, making the entire page a shade lighter than intended and washing out the card hierarchy.

**Why it happens:**
Both tokens resolve to white in light mode (`:root` has `--background: oklch(1 0 0)` and `--card: oklch(1 0 0)`), so the wrong choice is invisible in light mode and only surfaces when dark mode is tested. The semantic difference is only meaningful in dark mode where `--background: oklch(0.12)` and `--card: oklch(0.16)` are distinct surfaces.

**How to avoid:**
Use the token that matches the semantic role, not just the visual appearance:
- `bg-background` — page root, full-bleed layout wrappers, route-level `<main>` containers
- `bg-card` — discrete content surfaces: stat cards, data tables, modals, sidebars, form panels
- `bg-popover` — floating overlays: dropdowns, tooltips, combobox panels
- `bg-muted` / `bg-secondary` — depressed zones inside a card: code blocks, tag chips, input backgrounds

The test: "Is this a container for other cards, or is it itself a card?" If it is itself a content surface, use `bg-card`.

**Warning signs:**
- Dark mode makes all cards invisible (same shade as page)
- Dark mode pages look uniformly flat without surface depth
- A token choice that was only tested in light mode

**Phase to address:** Every component phase — establish the rule in Phase 1 and apply it consistently.

---

### Pitfall 2: `text-white` on Colored Backgrounds Losing Dark-Mode Contrast

**What goes wrong:**
Buttons and badges with colored backgrounds (indigo, orange, green) use `text-white` because white is always readable on a saturated color. In dark mode this is correct. But when the same pattern is applied to elements whose background lightens in dark mode (e.g., `bg-primary` shifts from `oklch(0.45)` in light to `oklch(0.65)` in dark), white text on a light-indigo background produces near-failing contrast. The correct replacement for text on a semantic background is `text-primary-foreground`, which the dark palette defines as `oklch(0.1 0.01 250)` — near black.

**Why it happens:**
`text-white` is correct on the light-mode primary (`oklch(0.45)` is dark enough). Developers do not notice the contrast failure because it only appears on the dark-mode lighter primary. Found in this codebase: `app/dashboard/page.tsx` hero card, `components/dashboard-sidebar.tsx` upgrade button, `components/booking-form.tsx` submit button, `app/dashboard/layout.tsx` alert button.

**How to avoid:**
Use `text-primary-foreground` for text on `bg-primary`. The token is designed to adapt — light mode returns `oklch(0.98)` (white), dark mode returns `oklch(0.1)` (near black) — so contrast is maintained at both ends of the palette.

Exception: `text-white` is legitimate and must be kept when the background is a **fixed** (non-semantic) dark color such as `bg-zinc-900` (footer, dark hero sections, sidebar brand area) or inside a gradient that is explicitly dark at both themes. In those cases the white text is intentional, not a bug.

**Warning signs:**
- `text-white` appearing alongside `bg-primary`, `bg-indigo-600`, or other named semantic backgrounds
- WCAG contrast failures visible only when dark mode is active
- Spotted in this codebase: `billing-content.tsx` uses `dark:!text-white` overrides as a band-aid for this exact issue

**Phase to address:** Dashboard phase and billing/settings phase specifically; audit all colored-button components.

---

### Pitfall 3: Recharts / Third-Party Components with Hardcoded Hex Colors

**What goes wrong:**
Recharts `<Bar>`, `<Area>`, `<Cell>`, and `<Pie>` accept color via `fill` and `stroke` props, not via CSS classes. These props expect a CSS color value (hex, rgb, oklch string) — they do not respond to Tailwind classes or CSS custom properties passed as `var(--color-primary)` in some configurations. As a result, chart bars remain the same hex color in both light and dark mode even after the rest of the page is fixed.

**Confirmed in this codebase:**
- `components/analytics-dashboard.tsx` line 242–243: `fill="#22c55e"` (green) and `fill="#ef4444"` (red)
- Line 31: `PIE_COLORS = ['#2563eb', '#db2777', ...]` — array of hardcoded hex values
- Line 369: `<Cell fill={PIE_COLORS[i % PIE_COLORS.length]} />` — driven by the same array
- Line 392: `style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}` — legend dot also hardcoded
- Line 288/290/341/369: `nicheColor` (a hex string from a JS map) used throughout

The cursor/tooltip background (`cursor={{ fill: '#f4f4f5' }}` line 241) is also hardcoded to a light gray that is invisible against the dark card background.

**How to avoid:**
For Recharts specifically:
1. Resolve CSS variables at runtime using `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')` inside a `useMemo` or `useEffect` that re-runs when the theme changes.
2. Use the `chart-1` through `chart-5` tokens already defined in `globals.css` — these are the designed palette for charts and are distinct enough at both themes.
3. Replace the `PIE_COLORS` array with values derived from the chart tokens.
4. Replace `cursor={{ fill: '#f4f4f5' }}` with `cursor={{ fill: 'var(--color-muted)' }}` — Recharts passes this string directly to SVG `fill`, which resolves CSS custom properties correctly.

Note: Custom tooltip components (`BookingTooltip`, `RevenueTooltip`) are already correctly implemented using `bg-card`, `text-foreground`, `border-border` — the tooltip shell is fine, only the chart element colors need fixing.

**Warning signs:**
- Any `fill="` or `stroke="` prop receiving a hex literal (`#`) instead of a CSS variable string
- Arrays of colors defined as JS constants at the top of a chart component
- `style={{ background: '#...' }}` on legend color dots

**Phase to address:** Analytics/dashboard phase — specifically the analytics-dashboard component.

---

### Pitfall 4: `dark:` Override Proliferation as a Band-Aid

**What goes wrong:**
When the semantic token approach is understood but not applied, developers revert to adding `dark:` utility overrides for every element. This works but creates a parallel maintenance burden: every color now exists in two places (the default class and the `dark:` override). The codebase already shows the failure mode: `billing-content.tsx` has 15+ instances of `dark:!bg-zinc-900`, `dark:!text-white`, `dark:!border-zinc-700` etc. — these were added to fix dark mode after the fact using the same hardcoded pattern, just shifted to dark-mode palette values.

**Why it happens:**
It is faster to add `dark:text-white` than to understand which semantic token is correct. The result looks fixed but is not systematically correct — if the design token values change in `globals.css`, the `dark:` overrides do not update.

**How to avoid:**
Use `dark:` only for intentional design divergence that the token system cannot express (e.g., a background that should be transparent in light mode but solid in dark mode). For color corrections, always replace both the light-mode hardcoded class AND remove any `dark:` band-aid overrides simultaneously.

Specifically: all `dark:!bg-*`, `dark:!text-*`, `dark:!border-*` classes in `billing-content.tsx` should be removed as their parent light-mode hardcoded classes are replaced with semantic tokens.

**Warning signs:**
- `dark:!` (important modifier) on color utilities — signals a specificity fight against hardcoded values
- More `dark:` prefixed classes per component than non-prefixed color classes
- `billing-content.tsx` is a direct example already in this repo

**Phase to address:** Billing/settings phase; flag this file for full semantic replacement rather than incremental `dark:` additions.

---

### Pitfall 5: Flash of Unstyled Content (FOUC) in SSR with next-themes

**What goes wrong:**
On first page load, the HTML is server-rendered without knowledge of the user's stored theme preference (stored in `localStorage`). The page renders momentarily in light mode even when the user's preference is dark. This appears as a visible flash — the page goes light then immediately dark.

**Current status in this codebase:**
The infrastructure is correctly set up to prevent FOUC:
- `app/layout.tsx` has `suppressHydrationWarning` on the `<html>` element (required — next-themes modifies the `class` attribute client-side, which would trigger a React hydration warning otherwise)
- `ThemeProvider` uses `attribute: 'class'` and `enableSystem: true`
- `disableTransitionOnChange: false` is set, which means theme transitions animate — this makes FOUC less jarring but does not eliminate it

The remaining risk is if `ThemeProvider` is added to a sub-layout after components that render with explicit light-mode colors, because those components flash before the provider resolves the theme.

**How to avoid:**
1. Keep `suppressHydrationWarning` on `<html>` — do not remove it.
2. Do not add CSS transitions on `background-color` or `color` in `globals.css` (they will animate the flash rather than hide it).
3. If FOUC is observed: set `defaultTheme: 'dark'` temporarily to test whether the flash is a theme-resolution issue or a hardcoded-color issue — if the flash disappears, the source is `localStorage` resolution delay, not hardcoded classes.
4. FOUC for server-rendered content is accepted behavior with next-themes; the fix is ensuring semantic tokens are used so the flash is minimal in duration.

**Warning signs:**
- Visible light→dark flicker on page load in a browser with dark theme preference set
- `ThemeProvider` placed inside a component that renders below hardcoded-color elements
- CSS transitions on `background-color` at the root level (the `hover-lift` and `hover-glow` utilities in `globals.css` have `box-shadow` transitions — these are fine; `background-color` transitions would be the problem)

**Phase to address:** Infrastructure verification in Phase 1 (already largely correct); re-verify after each phase that `suppressHydrationWarning` is not accidentally removed.

---

### Pitfall 6: Tailwind CSS 4 Syntax — `@custom-variant dark` Selector Scope

**What goes wrong:**
Tailwind CSS 4 replaced the `darkMode: 'class'` config option with the `@custom-variant dark` directive in `globals.css`. This codebase defines:

```css
@custom-variant dark (&:is(.dark *));
```

This means `dark:` utilities apply when the element is **a descendant of** `.dark`. This is the correct selector for next-themes which sets the class on `<html>`. However, there is a subtle scoping difference: elements that are **not** inside the `.dark` tree (e.g., portals rendered outside `<body>`, or elements appended to `document.body` by third-party libraries) will not receive the `dark:` variant.

Tailwind CSS 3 had `darkMode: ['class', '[data-theme="dark"]']` syntax — documentation from v3 does not apply to v4 and can mislead.

**How to avoid:**
1. Do not modify the `@custom-variant dark` selector — the current `(&:is(.dark *))` definition is correct for this app's setup.
2. If a third-party component renders a portal outside `<html class="dark">`, apply colors via CSS custom properties (`var(--color-background)`) in its style prop rather than via Tailwind classes.
3. Do not copy `@apply` patterns from Tailwind CSS 3 documentation — in v4, `@apply` inside `:root` or `.dark` blocks works but the `@layer base` approach is preferred (already in use in this codebase).

**Warning signs:**
- Dark mode works everywhere except inside a specific modal or popover that uses a portal
- Styles that use `dark:` classes but do not respond to theme toggling
- Copying tailwind.config.js `darkMode` patterns into v4 — the config file doesn't exist in v4

**Phase to address:** Infrastructure phase (Phase 1) — understand the selector scope before beginning component work.

---

### Pitfall 7: Inline `style={{}}` and `rgba()` in CSS Utilities That Bypass Tailwind

**What goes wrong:**
Two categories of hardcoded colors exist that are invisible to a `grep` for Tailwind class names:
1. `style={{ color: '#...', background: '#...' }}` JSX inline styles
2. Raw CSS in `globals.css` using `rgba()` or hex values outside `@theme inline`

The `hover-glow` utility in `globals.css` uses `box-shadow: 0 0 20px rgba(99, 102, 241, 0.15)` — a hardcoded indigo value that does not adapt. The `hover-lift` utility uses `box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1)` — a fixed black shadow that looks fine in dark mode but could be adjusted.

In the analytics component, tooltip legend dots use `style={{ background: PIE_COLORS[i] }}` (line 392) — inline style with a hardcoded hex.

**How to avoid:**
- For `globals.css` utilities that use hardcoded colors: replace `rgba(99, 102, 241, 0.15)` with `color-mix(in oklch, var(--color-primary) 15%, transparent)` — this references the semantic token and adapts to theme.
- For inline styles driven by a hex color array: move to CSS variable resolution as described in Pitfall 3.
- Audit with: search for `style={{` in TSX files and for `rgba(\|rgb(\|#[0-9a-f]` in `.css` files outside the `:root`/`.dark` blocks.

**Warning signs:**
- `style={{` in JSX containing color values
- `rgba()` in `globals.css` outside of `:root`/`.dark` variable definitions
- Glow or shadow effects that look wrong in dark mode (too bright/visible against dark surfaces)

**Phase to address:** Landing and tenant pages phase (where `hover-glow` is used on marketing elements); analytics phase for chart legend dots.

---

### Pitfall 8: SVG `fill` and `stroke` Hardcoded to Brand Colors

**What goes wrong:**
Inline SVG elements with explicit `fill="#4285F4"` (Google brand colors, icon paths) or `fill="currentColor"` (acceptable) appear in the codebase. Brand-color SVGs (e.g., the Google sign-in icon in `app/(auth)/login/page.tsx`) are intentionally hardcoded and should not be changed — they are brand assets. But other SVG icons within the application (loading spinners, decorative icons) may have hardcoded fills that should adapt.

The loading spinner in `login/page.tsx` uses `fill="currentColor"` and `stroke="currentColor"` — this is correct and inherits the text color from the parent, which will adapt to dark mode.

**How to avoid:**
Treat SVGs in two categories:
1. **Brand assets** (Google, social login icons): leave `fill="#..."` hardcoded — these colors are required by brand guidelines and must not change in dark mode.
2. **Application SVGs** (spinners, decorative shapes, custom icons): use `fill="currentColor"` and set the color via the parent element's text color class (`text-foreground`, `text-muted-foreground`, etc.).

Do not replace Google-icon `fill` values — this is a bug that will get rejected in review. Explicitly mark them in comments: `{/* Brand color — intentionally hardcoded */}`.

**Warning signs:**
- SVG `fill="#..."` that is NOT a recognized brand color (Google blue, Twitter blue, etc.)
- SVG icons that appear the wrong brightness in dark mode
- Icons that are invisible because they use a color close to the dark background

**Phase to address:** Auth pages phase — `login/page.tsx` and `register/page.tsx` have both categories; distinguish them during audit.

---

### Pitfall 9: Gradient Backgrounds That Don't Adapt

**What goes wrong:**
Gradients using fixed palette colors (`from-indigo-600 to-violet-600`) look appropriate in light mode but can be too bright, too dark, or clashing in dark mode. The codebase shows two approaches — one correct and one problematic:

**Correct (already done):** `app/dashboard/page.tsx` hero card:
`bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-700 dark:via-indigo-600 dark:to-violet-700`
This explicitly provides dark-mode gradient stops.

**Problematic:** `components/tenant-public-page.tsx` niche themes:
`heroGradient: 'bg-gradient-to-br from-blue-600 to-blue-800'` — no `dark:` variant, gradient renders identically in both modes. The hero section is intentionally dark (over-photo or solid color), so this may be acceptable by design, but it should be a conscious decision.

`components/landing/HeroSection.tsx`:
`bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800`
This is correctly implemented with explicit dark variants.

**How to avoid:**
For every gradient background, decide: Is this an **intentionally dark** element (footer, hero over photo) where the gradient should be the same in both modes? Or is it a **surface** that should adapt? For adapting surfaces, always provide both the light gradient stops and `dark:` gradient stops. Use the `700`/`800` range for dark-mode gradient stops of colored gradients — they read as "glowing" rather than "harsh."

**Warning signs:**
- `from-*` and `to-*` without a `dark:from-*` / `dark:to-*` counterpart on a surface-level element
- Gradients using very light colors (`from-indigo-50`) without dark overrides — these become invisible in dark mode
- Gradients using pure `from-white` that turn into a white band in dark mode

**Phase to address:** Landing components phase; tenant public page phase.

---

### Pitfall 10: `bg-card` vs `bg-background` Semantic Confusion on the Sidebar

**What goes wrong:**
The sidebar uses a dedicated `sidebar` token family (`--sidebar`, `--sidebar-foreground`, etc.) defined in `globals.css`. In dark mode `--sidebar: oklch(0.12)` which matches `--background`. A developer replacing `bg-zinc-900` (found in `dashboard-sidebar.tsx`) with `bg-background` would be semantically wrong — the correct replacement is `bg-sidebar`. If `bg-background` is used, the sidebar loses its identity as a distinct surface and future token adjustments to `--sidebar` will have no effect.

**How to avoid:**
Use sidebar-family tokens for the sidebar component:
- `bg-sidebar` (not `bg-background`) for the sidebar shell
- `text-sidebar-foreground` for sidebar text
- `bg-sidebar-accent` for active/hovered nav items
- `border-sidebar-border` for sidebar dividers
- `text-sidebar-primary` for icon colors

This codebase has the full `sidebar-*` token set defined — use it.

**Warning signs:**
- Sidebar using `bg-background` or `bg-card` instead of `bg-sidebar`
- Sidebar active states using `bg-accent` instead of `bg-sidebar-accent`
- Breaking sidebar appearance when `--background` value is adjusted

**Phase to address:** Dashboard layout phase (highest priority per PROJECT.md).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Adding `dark:text-white` alongside existing hardcoded class | Fixes the dark mode symptom immediately | Doubles the color declarations; light-mode hardcoded class remains; `globals.css` token changes don't propagate | Never — always do a full semantic replacement |
| Keeping `dark:!` important overrides instead of tracing root cause | Avoids hunting for specificity source | Fragile — CSS specificity wars compound; future shadcn/ui upgrades may break | Never for systematic refactor; acceptable only for a hotfix that is immediately tracked for proper fix |
| Using `text-zinc-900 dark:text-white` instead of `text-foreground` | Works visually for current palette | Breaks if theme palette is updated; not portable to other tenant themes | MVP stage only if timeline-critical, never in final state |
| Leaving Recharts hex colors unchanged and noting them as "out of scope" | Saves time | Charts look broken in dark mode — high visibility failure | Acceptable if charts are explicitly deferred to a separate phase, documented as known issue |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Recharts `<Bar fill>` / `<Cell fill>` | Passing Tailwind class string as fill value (e.g., `fill="text-primary"`) | Pass CSS variable string: `fill="var(--color-chart-1)"` — SVG `fill` resolves CSS custom properties |
| Recharts `cursor` prop | Hardcoding `cursor={{ fill: '#f4f4f5' }}` (light gray) | Use `cursor={{ fill: 'var(--color-muted)' }}` |
| next-themes `ThemeProvider` | Placing it inside `<body>` children that render before it hydrates | Wrap at root — already correct in this codebase via `theme-providers.tsx` pattern |
| shadcn/ui `<Dialog>` / `<Popover>` | Portal renders outside `.dark` class scope if portalled to a separate root | Portals in Next.js App Router append to `<body>` which is inside `<html class="dark">` — not an issue here |
| Google Sign-In SVG icon | Replacing hardcoded `fill="#4285F4"` with semantic token | Do not replace — Google brand guidelines require exact colors |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `getComputedStyle` called on every render to resolve chart colors | Chart re-renders on every state change; potential layout thrash | Memoize resolved CSS variable values; re-compute only when theme changes (subscribe to `useTheme()` from next-themes) | At component mount frequency; especially bad if charts animate |
| CSS transitions on `background-color` at body level | Theme switch triggers full-page color animation rather than instant swap | Keep `disableTransitionOnChange: false` in ThemeProvider only for element-level transitions; avoid `transition-colors` on `body` | Every theme toggle |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Chart colors identical across light/dark (confirmed issue) | Charts are the primary data display in the dashboard — broken chart colors are the most noticeable dark mode failure | Use `chart-1` through `chart-5` tokens; ensure sufficient contrast against both `--background` and `--card` values |
| Gradient text (`bg-clip-text text-transparent from-indigo-600 to-violet-600`) without dark variant | Text becomes invisible against dark backgrounds if gradient colors are too dark | Always pair with `dark:from-indigo-400 dark:to-violet-400` (lighter variants) — already done in `HeroSection.tsx` |
| Hover states that disappear in dark mode | Interactive elements feel broken; users can't tell what is clickable | Replace `hover:bg-gray-100` with `hover:bg-muted`; never leave hover states without dark-mode coverage |
| `box-shadow` using `rgba(0,0,0,...)` on dark surfaces | Shadows invisible against dark backgrounds | Use `rgba(0,0,0,0.4+)` for dark mode or use `box-shadow: 0 ... oklch(0 0 0 / 40%)` |

---

## "Looks Done But Isn't" Checklist

- [ ] **Recharts charts:** Bars and pie slices may still use hardcoded hex — verify `fill` props in `analytics-dashboard.tsx`, not just the tooltip wrapper
- [ ] **Sidebar:** May use `bg-background` (which matches `bg-sidebar` value today but will break if tokens diverge) — verify `bg-sidebar` token is used explicitly
- [ ] **billing-content.tsx:** `dark:!` overrides visually fix dark mode but the light-mode hardcoded classes remain — component is not truly semantic until all `dark:!` overrides are removed along with the hardcoded base classes
- [ ] **Footer in landing and tenant pages:** `bg-zinc-900` is intentional (dark section) — verify these are consciously kept, not accidentally left
- [ ] **Hover/focus/ring states:** Fixing background colors without fixing corresponding hover states leaves invisible interaction affordances — verify each replaced `bg-*` has its `hover:bg-*` sibling checked too
- [ ] **Text on gradient hero cards:** `text-white` is correct on dark gradients but must be verified against the actual gradient lightness in dark mode (lighter gradient stops can fail contrast)
- [ ] **`hover-glow` utility:** Uses hardcoded indigo rgba in `globals.css` — only appears on elements with that class; easy to overlook since it is not a Tailwind utility

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong token choice (`bg-background` where `bg-card` needed) | LOW | Single class swap; visual verification |
| `dark:!` band-aid overrides proliferated across a file | MEDIUM | Full file audit; replace both base class and `dark:!` override simultaneously with single semantic token |
| Recharts hex colors left hardcoded | MEDIUM | Introduce `useChartColors` hook that resolves CSS variables; replace all `fill` prop values; test chart rendering in both themes |
| `suppressHydrationWarning` accidentally removed | LOW | Add it back to `<html>` — React will emit hydration warnings but app remains functional |
| Semantic token not defined in `globals.css` | LOW | Do not introduce new tokens — use the existing set; if a color need cannot be expressed, use the closest token and note the limitation |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `bg-card` vs `bg-background` token selection | Phase 1 (establish rule before starting) | Spot-check 3 card components in dark mode — surfaces must be visibly distinct from page background |
| `text-white` on semantic backgrounds | Dashboard phase (highest frequency of colored buttons) | Toggle dark mode on every CTA button; check contrast ratio visually |
| Recharts hardcoded hex colors | Analytics / dashboard phase | Open analytics page in dark mode; chart bars and pie slices must not be identical in both themes |
| `dark:` override proliferation | Billing/settings phase (worst offender: `billing-content.tsx`) | Count `dark:!` occurrences before and after — target zero |
| next-themes FOUC | Phase 1 infrastructure check | Hard-refresh the page with OS in dark mode; observe if there is a white flash |
| Tailwind v4 `@custom-variant` scope | Phase 1 infrastructure check | Open a dropdown/popover in dark mode; it must inherit dark styles |
| Inline `style={{}}` and `rgba()` bypass | Landing + tenant phase | Search `style={{` in all modified files; verify `globals.css` rgba values |
| SVG fill/stroke hardcoded | Auth pages phase | Check login page in dark mode; spinner and decorative icons must be visible |
| Gradients without dark variants | Landing + tenant phase | Inspect gradient sections in dark mode; no white/light bands |
| Sidebar token family | Dashboard layout phase (first) | Sidebar must remain visually distinct from main content area in dark mode |

---

## Sources

- Direct inspection of `/home/yola/projects/sites/omni-book/app/globals.css` — OKLch token values, Tailwind v4 `@custom-variant dark` definition, `@theme inline` mapping
- Direct inspection of `/home/yola/projects/sites/omni-book/components/analytics-dashboard.tsx` — confirmed hardcoded `PIE_COLORS`, `fill="#22c55e"`, `fill="#ef4444"`, inline style legend dots
- Direct inspection of `/home/yola/projects/sites/omni-book/app/dashboard/settings/billing/billing-content.tsx` — confirmed `dark:!` override proliferation pattern
- Direct inspection of `/home/yola/projects/sites/omni-book/app/layout.tsx` — confirmed `suppressHydrationWarning` on `<html>`
- Direct inspection of `/home/yola/projects/sites/omni-book/components/theme-providers.tsx` — confirmed `attribute: 'class'`, `enableSystem: true`, `disableTransitionOnChange: false`
- Direct inspection of `/home/yola/projects/sites/omni-book/components/tenant-public-page.tsx` — confirmed gradient patterns and `text-white` on colored hero backgrounds
- Direct inspection of `/home/yola/projects/sites/omni-book/app/(auth)/login/page.tsx` — confirmed Google brand SVG colors (intentionally hardcoded) vs spinner using `currentColor` (correct)
- PROJECT.md — semantic replacement map, priority area ordering, constraint boundaries

---
*Pitfalls research for: Dark mode theming refactor — Tailwind CSS 4 + shadcn/ui + next-themes in Next.js 15 SaaS*
*Researched: 2026-03-17*
