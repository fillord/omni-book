# Phase 7: Mobile UI Fixes - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two mobile-specific bugs in the dashboard and public booking page: (1) service/resource card text overflow on mobile viewports, (2) theme toggle hidden on mobile on the public booking page. No new features, no structural refactors beyond what's needed for each fix.

</domain>

<decisions>
## Implementation Decisions

### Card text overflow
- Fix: add `min-w-0` to the flex text container `<div>` inside each mobile card (the child of `flex items-start justify-between gap-2`) — this is what allows `truncate` to work in flex layouts
- Title: single-line truncate with ellipsis (`truncate`)
- Description: single-line truncate with ellipsis (`truncate`) — already the intent of the existing code
- Metadata row (duration · price for services; resource type for resources): always shown in full — no truncation needed, values are short
- Fix applies to both `services-manager.tsx` and `resources-manager.tsx` mobile card sections
- Desktop table layout must remain unchanged (desktop uses `hidden sm:table` — fix is scoped to `sm:hidden` mobile cards only)

### Theme toggle mobile placement
- Remove `hidden sm:` from `<PublicThemeToggle className="hidden sm:inline-flex" />` — make it visible on all viewports
- Toggle appears inline in the header right-to-left order: `[locale] [theme] [Book]`
- Toggle is already `iconOnly` (32×32px h-8 w-8) — no layout changes needed, fits alongside LocaleSwitcher and Book button
- No changes to z-index or positioning — the sticky header already has `z-50`, toggle is inline flow

### Claude's Discretion
- Whether to add `overflow-hidden` to the card container itself or rely on `min-w-0` + `truncate` on children
- Exact class ordering on the updated elements

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mobile card components
- `components/services-manager.tsx` — Mobile cards at line ~189 (`sm:hidden` section); flex container needing `min-w-0` fix at line ~196
- `components/resources-manager.tsx` — Mobile cards at line ~272 (`sm:hidden` section); same flex container pattern

### Theme toggle
- `components/tenant-public-page.tsx` — Line 246: `<PublicThemeToggle className="hidden sm:inline-flex" />` — the fix target
- `components/public-theme-toggle.tsx` — Thin wrapper around ThemeToggle; already uses `iconOnly`
- `components/theme-toggle.tsx` — ThemeToggle implementation; `iconOnly` mode renders `h-8 w-8` button

### Requirements
- `.planning/REQUIREMENTS.md` — MOBL-01 (card text no overflow), MOBL-02 (fix doesn't break desktop), THEM-01 (toggle visible on mobile), THEM-02 (toggle tappable, correct z-index/positioning)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ThemeToggle` with `iconOnly` prop: already renders as compact 32×32px button — no new component needed
- `PublicThemeToggle`: thin wrapper that passes `iconOnly` — just the className needs updating

### Established Patterns
- Mobile/desktop split via `sm:hidden` / `hidden sm:table` — both managers already use this pattern; fix is scoped to the `sm:hidden` section only
- `min-w-0` on flex children is the standard Tailwind pattern for truncation to work inside flex containers
- Static file assertion tests (`fs.readFileSync` + regex) — established in v1.0; can extend to verify truncate classes present in mobile card markup

### Integration Points
- `services-manager.tsx` mobile cards: flex row at ~line 196 `<div className="flex items-start justify-between gap-2">` — inner `<div>` needs `min-w-0`
- `resources-manager.tsx` mobile cards: same flex pattern at ~line 280
- `tenant-public-page.tsx` header: `<div className="flex items-center gap-2 shrink-0">` at line 210 — toggle's `hidden sm:` class is removed from PublicThemeToggle on line 246

</code_context>

<specifics>
## Specific Ideas

No specific references — these are minimal targeted CSS fixes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-mobile-ui-fixes*
*Context gathered: 2026-03-19*
