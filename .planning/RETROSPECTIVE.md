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

## Cross-Milestone Trends

| Milestone | Duration | Phases | Plans | Rework | Standout Pattern |
|-----------|----------|--------|-------|--------|-----------------|
| v1.0 Dark Mode | 2 days | 5 | 15 | Low | Infrastructure-first test validation |
