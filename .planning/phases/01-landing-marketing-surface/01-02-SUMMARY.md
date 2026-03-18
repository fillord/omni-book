---
phase: 01-landing-marketing-surface
plan: 02
subsystem: ui
tags: [tailwind, semantic-tokens, dark-mode, landing-page, color-remediation]

# Dependency graph
requires:
  - phase: 01-landing-marketing-surface-01
    provides: Test suite (landing-surface.test.ts) and first four components remediated (HeroSection, PricingCards, FeaturesGrid, Navbar)
provides:
  - Testimonials.tsx fully semantic — bg-card, border-border, text-foreground, text-muted-foreground, bg-muted-foreground/40 dot nav, bg-muted fallback avatar
  - NicheCards.tsx fully semantic — text-foreground headings, text-muted-foreground body/subtitle; COLOR_MAP brand accents preserved
  - DemoSection.tsx fully semantic — text-foreground headings, text-muted-foreground body/slug/subtitle, text-muted-foreground group-hover:text-foreground arrow icon; DEMOS brand accents preserved
  - StatsCounter.tsx fully semantic — text-muted-foreground stat label; text-indigo-600 stat value preserved
  - All LAND-01 through LAND-07 test assertions pass (47/47 green)
  - Full Jest suite passes (88/88 green, zero regressions)
affects: [02-dashboard, 03-admin-billing, semantic-token-enforcement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic token pair replacement: remove both base class AND dark: override, replace with single semantic token"
    - "Dot navigation: bg-muted-foreground/40 hover:bg-muted-foreground/60 (opacity approach for visibility in both modes)"
    - "Arrow icon hover: text-muted-foreground group-hover:text-foreground (replaces 4-class dark: pair)"
    - "Fallback avatar: bg-muted text-muted-foreground"

key-files:
  created: []
  modified:
    - components/landing/Testimonials.tsx
    - components/landing/NicheCards.tsx
    - components/landing/DemoSection.tsx
    - components/landing/StatsCounter.tsx

key-decisions:
  - "Arrow icon hover reduced from 4 classes (text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-white) to 2 semantic classes (text-muted-foreground group-hover:text-foreground)"
  - "Dot navigation inactive state uses opacity-based approach (bg-muted-foreground/40) not border token — more visible on both light and dark backgrounds"

patterns-established:
  - "Single semantic token always replaces both the base light class and its dark: counterpart — never leave one half of a dual pair"
  - "Brand accent colors (indigo/blue/pink/orange/green) in COLOR_MAP, NICHE_COLORS, and DEMOS arrays are preserved exactly as written"

requirements-completed: [LAND-01, LAND-02, LAND-03, LAND-04, LAND-05]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 1 Plan 02: Remaining Landing Components Remediation Summary

**Four remaining landing components (Testimonials, NicheCards, DemoSection, StatsCounter) remediated to shadcn/ui semantic tokens, completing all LAND-01 through LAND-05 violations; full test suite 88/88 green**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T07:32:38Z
- **Completed:** 2026-03-18T07:34:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Testimonials.tsx: 8 replacements — card uses bg-card border-border, all text uses semantic tokens, dot nav uses muted-foreground/opacity, fallback avatar uses bg-muted text-muted-foreground; all NICHE_COLORS brand accents preserved
- NicheCards.tsx: 4 replacements — headings and body text use text-foreground and text-muted-foreground; COLOR_MAP blue/pink/orange/green brand accents with dark: variants preserved
- DemoSection.tsx: 6 replacements — headings and body text semantic, arrow icon reduced from 4 classes to 2 (text-muted-foreground group-hover:text-foreground), DEMOS niche brand colors preserved
- StatsCounter.tsx: 1 replacement — stat label text-muted-foreground; text-indigo-600 stat value preserved
- All 47 landing-surface.test.ts assertions pass; full Jest suite 88/88 with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Remediate Testimonials.tsx and NicheCards.tsx** - `335b529` (feat)
2. **Task 2: Remediate DemoSection.tsx and StatsCounter.tsx, run full test suite** - `94cb130` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/landing/Testimonials.tsx` - 8 class replacements: card surface semantic, all text semantic, dot nav uses muted-foreground/opacity, fallback avatar semantic
- `components/landing/NicheCards.tsx` - 4 class replacements: all heading and body text uses semantic tokens
- `components/landing/DemoSection.tsx` - 6 class replacements: all heading/body/slug text semantic, arrow icon hover semantic
- `components/landing/StatsCounter.tsx` - 1 class replacement: stat label uses text-muted-foreground

## Decisions Made
- Arrow icon in DemoSection reduced from 4-class pair (`text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-white`) to 2 semantic classes (`text-muted-foreground group-hover:text-foreground`) — cleaner and semantically correct
- Dot navigation inactive state kept as `bg-muted-foreground/40 hover:bg-muted-foreground/60` per plan spec and research (avoids near-invisible `border-border` in light mode)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all replacements were straightforward and tests passed on first run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All landing components in `components/landing/` are now fully semantic (Footer intentionally exempt as fixed dark surface documented in Plan 01)
- All 47 LAND-01 through LAND-07 test assertions pass green
- Phase 1 (landing-marketing-surface) fully complete — ready to advance to Phase 2 (dashboard) or Phase 3 (admin-billing)
- No blockers

---
*Phase: 01-landing-marketing-surface*
*Completed: 2026-03-18*

## Self-Check: PASSED

- components/landing/Testimonials.tsx: FOUND
- components/landing/NicheCards.tsx: FOUND
- components/landing/DemoSection.tsx: FOUND
- components/landing/StatsCounter.tsx: FOUND
- .planning/phases/01-landing-marketing-surface/01-02-SUMMARY.md: FOUND
- commit 335b529: FOUND
- commit 94cb130: FOUND
