# Retrospective: omni-book

## Milestone: v1.0 — Dark Mode

**Shipped:** 2026-03-19
**Phases:** 5 | **Plans:** 15 | **Timeline:** 2 days

### What Was Built

- Automated infrastructure test suite (12 assertions) certifying CSS token chain before any component work
- Landing surface (7+ components) fully dark-mode-correct — HeroSection, PricingCards, FeaturesGrid, Footer, Testimonials, NicheCards, DemoSection, StatsCounter
- Tenant public + booking flow — `tenant-public-page.tsx`, `booking-form.tsx`, `booking-calendar.tsx` — 26+ dual `dark:` pairs collapsed to single semantic tokens
- Dashboard + auth surfaces — sidebar, billing (removed 15 `dark:!` force-overrides), analytics (CSS var hex replacements), auth pages (confirmed clean on day 1)
- Edge case sweep — `banned-actions.tsx`, `booking-status-badge.tsx`, dashboard page decorative overlays resolved

### What Worked

- **Infrastructure-first approach:** Starting with automated tests before touching any component caught assumptions early and gave a reliable GREEN/RED baseline throughout.
- **Semantic token discipline:** Replacing dual `dark:bg-X / bg-Y` pairs with single `bg-card` / `bg-background` tokens reduced code by ~2 classes per element and is future-proof.
- **Exception documentation pattern:** Documenting fixed-brand surfaces with `// INTENTIONAL:` code comments (Footer, RESOURCE_PALETTE) cleanly separated violations from decisions.
- **Phase ordering by public exposure:** public surfaces → auth → dashboard → cleanup meant highest-value changes shipped first.

### What Was Inefficient

- ROADMAP.md plan checkboxes fell out of sync during execution — had to reconcile counts at milestone close.
- Phase 3 research flagged billing `dark:!` overrides as "understand root cause first" — could have been triaged faster with a direct grep for specificity conflicts.
- Auth pages (AUTH-01/02/03) and manager components (DASH-04) were confirmed clean from day 1, wasting planning time — a pre-phase `grep -r "bg-white\|bg-zinc"` scan would have caught this before planning.

### Patterns Established

- **Static file assertion tests** (`fs.readFileSync` + regex) for Tailwind class audits — no DOM, no build, deterministic, fast.
- **Exception comment standard:** `// INTENTIONAL: [reason]` above any class that intentionally breaks the semantic token rule.
- **Sidebar uses its own token family** (`bg-sidebar`, `text-sidebar-foreground`) — never `bg-background` or `bg-card`.
- **`dark:!` = past failed fix:** presence of `!important` dark variants signals an unresolved specificity conflict, not a working solution.

### Key Lessons

1. Run a grep scan before planning a surface — saves planning overhead for already-clean files.
2. `dark:` utility overrides can silently lose to base classes in Tailwind v4 cascade; prefer single CSS-variable-based classes over `base + dark:override` pairs.
3. Intentional exceptions need code comments at time of decision — retrofitting comments is harder than writing them during execution.
4. Phase-level verification tests caught regressions between phases that manual review alone might miss.

### Cost Observations

- Model mix: balanced profile (Sonnet primary)
- Sessions: ~8 sessions across 2 days
- Notable: Auth + manager phases took near-zero execution time (already clean) — pre-phase grep would have surfaced this for free

---

## Milestone: v1.1 — Critical Bug Fixes

**Shipped:** 2026-03-19
**Phases:** 2 | **Plans:** 2 | **Timeline:** 1 day

### What Was Built

- `booking-form.tsx` opt_* guard at all three display points (resource.specialization badge, attribute loop fallback, SummaryRow) — users see human-readable labels everywhere
- Static regression test suite `data-display.test.ts` (8 assertions, DATA-01/02) preventing future opt_* leaks
- Mobile card text truncation in services/resources managers using `min-w-0` + `truncate` pattern
- PublicThemeToggle made visible on all viewports by removing `hidden sm:` class
- Mobile UI test suite `mobile-ui.test.ts` (12 assertions, MOBL-01/02, THEM-01/02)

### What Worked

- **TDD RED/GREEN on Phase 7:** Writing the static assertion tests first (failing) then implementing fixes gave fast feedback with zero guessing — 2 min execution time.
- **Static assertion test pattern from v1.0:** Reused `fs.readFileSync` + regex approach for both opt_* audits and mobile class audits — no DOM, no build, deterministic.
- **Minimal diff discipline:** Inline opt_ guard at each display point (no helper extracted) kept changes localized and easy to review. Same for `min-w-0` — one-line change per component.
- **Pre-phase audit carried over:** The v1.1-MILESTONE-AUDIT.md caught scope clearly before planning, so no surprises during execution.

### What Was Inefficient

- Phase 6 spent time auditing `services-manager.tsx` and `lib/email/reminders.ts` — both confirmed clean. A pre-phase grep for `opt_` display paths would have bounded scope faster.
- Pre-existing `cleanup-surface.test.ts` failures (6 tests) were independently rediscovered in both phases via `git stash` — could have been noted in STATE.md from Phase 6 to skip the Phase 7 re-investigation.

### Patterns Established

- **`min-w-0` pattern:** Add `min-w-0` to the flex child `<div>` containing text, then use `truncate` on text elements — never `overflow-hidden` on the card container.
- **Static assertions scoped by `sm:hidden` boundary:** Split source on `sm:hidden` / `hidden sm:` markers to target mobile-only sections in static file assertions.
- **opt_ guard inline:** `strVal.startsWith('opt_') ? t('niche', strVal) : strVal` at each render point — consistent with `optLabel` helper in resource-form.tsx.

### Key Lessons

1. Pre-existing test failures should be logged in STATE.md on first discovery — prevents re-investigation in subsequent phases.
2. Grep scan before planning a bug-fix phase bounds scope precisely — saves time auditing already-clean files.
3. TDD static assertions for UI class audits are very fast to write and pay off immediately in Phase 7's 2-minute execution.

### Cost Observations

- Model mix: Sonnet primary throughout
- Sessions: 2 sessions (one per phase)
- Notable: Phase 7 completed in 2 min — fastest plan in the project; TDD RED/GREEN with static assertions is the optimal pattern for targeted Tailwind fixes

---

## Cross-Milestone Trends

| Milestone | Duration | Phases | Plans | Rework | Standout Pattern |
|-----------|----------|--------|-------|--------|-----------------|
| v1.0 Dark Mode | 2 days | 5 | 15 | Low | Infrastructure-first test validation |
| v1.1 Critical Bug Fixes | 1 day | 2 | 2 | None | TDD static assertions + minimal diff discipline |
