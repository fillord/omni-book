# Requirements: Dark Mode Audit & Fix — omni-book

**Defined:** 2026-03-17
**Core Value:** Every page and component renders correctly in both light and dark mode — no white backgrounds trapped in dark mode, no invisible text, no hardcoded color escapes.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: `app/globals.css` body rule applies `bg-background text-foreground` as the page canvas baseline
- [ ] **FOUND-02**: `@theme inline` block correctly bridges CSS custom properties to Tailwind utility classes
- [ ] **FOUND-03**: Both `AdminThemeProvider` and `BookingThemeProvider` use `attribute="class"` to set `.dark` on `<html>`

### Landing / Marketing Surface

- [ ] **LAND-01**: All `bg-white`, `bg-zinc-*`, `bg-slate-*` background classes in `components/landing/` replaced with `bg-background` or `bg-card` as appropriate
- [ ] **LAND-02**: All `text-gray-900`, `text-zinc-900`, `text-slate-900` classes in `components/landing/` replaced with `text-foreground`
- [ ] **LAND-03**: All `text-gray-500`, `text-zinc-400`, `text-slate-500` classes in `components/landing/` replaced with `text-muted-foreground`
- [ ] **LAND-04**: All `border-gray-*`, `border-zinc-*` classes in `components/landing/` replaced with `border-border`
- [ ] **LAND-05**: Hover/focus/ring state variants in `components/landing/` use semantic tokens (`hover:bg-muted`, `focus:border-input`, `ring-border`)
- [ ] **LAND-06**: `PricingCards.tsx` fully semantic — no hardcoded color utilities except intentional brand accents
- [ ] **LAND-07**: Gradient sections in landing have correct dark mode behavior (either theme-adaptive with `dark:from-*/to-*` or intentionally fixed brand colors, clearly distinguished)

### Tenant Public Booking Surface

- [ ] **BOOK-01**: `components/tenant-public-page.tsx` — all 34+ hardcoded zinc/slate `dark:` dual-class pairs replaced with single semantic tokens
- [ ] **BOOK-02**: `components/booking-form.tsx` — `bg-white` on date/time inputs replaced with `bg-background`; border classes replaced with `border-input`
- [ ] **BOOK-03**: `components/booking-calendar.tsx` — hardcoded color classes replaced with semantic tokens
- [ ] **BOOK-04**: Niche brand accent colors (`bg-blue-600`, `bg-pink-600`, `bg-orange-600`, `bg-green-600`) in booking components explicitly preserved — these are intentional identity colors, not theme-adaptive
- [ ] **BOOK-05**: Hero section container background uses `bg-background` (page canvas), not `bg-card` (raised surface)

### Dashboard Surface

- [ ] **DASH-01**: `components/dashboard-sidebar.tsx` — all background and text classes use the sidebar token family (`bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, etc.) not the general `bg-background`/`bg-card` tokens
- [ ] **DASH-02**: `app/dashboard/settings/billing/billing-content.tsx` — all 15+ `dark:!` force-override classes removed; base hardcoded classes replaced with single semantic tokens
- [ ] **DASH-03**: `components/analytics-dashboard.tsx` — `text-zinc-400` replaced with `text-muted-foreground`; Recharts cursor prop `fill: '#f4f4f5'` replaced with `fill: 'var(--color-muted)'`; CartesianGrid stroke replaced with CSS variable reference
- [ ] **DASH-04**: `components/staff-manager.tsx`, `services-manager.tsx`, `resources-manager.tsx` audited and any hardcoded color utilities replaced with semantic tokens
- [ ] **DASH-05**: `text-white` on semantic backgrounds that lighten in dark mode replaced with `text-primary-foreground` or appropriate foreground token

### Auth Surface

- [ ] **AUTH-01**: `app/(auth)/login/page.tsx` — any hardcoded color utilities replaced with semantic tokens (brand SVG colors preserved)
- [ ] **AUTH-02**: `app/(auth)/register/page.tsx` — audited and any hardcoded color utilities replaced with semantic tokens
- [ ] **AUTH-03**: `app/(auth)/verify-otp/page.tsx` — audited and any hardcoded color utilities replaced with semantic tokens

### Cleanup / Edge Cases

- [ ] **CLEAN-01**: `components/banned-actions.tsx` — audited and any hardcoded color utilities replaced with semantic tokens
- [ ] **CLEAN-02**: `components/booking-status-badge.tsx` — audited and any hardcoded color utilities replaced with semantic tokens
- [ ] **CLEAN-03**: `app/dashboard/page.tsx` — decorative `bg-white/10` opacity overlays reviewed; replaced only if not intentional design

## v2 Requirements

### Advanced Theming

- **ADV-01**: Recharts bar/pie fill colors (`PIE_COLORS` array, `fill="#22c55e"`) refactored to use CSS variables via `getComputedStyle` with theme-change re-evaluation
- **ADV-02**: `hover-glow` utility in `globals.css` uses `color-mix(in oklch, var(--color-primary) 15%, transparent)` instead of hardcoded `rgba(99, 102, 241, 0.15)`
- **ADV-03**: Automated visual regression tests capturing light/dark screenshots of each page surface

## Out of Scope

| Feature | Reason |
|---------|--------|
| Business logic changes | Strict constraint — color classes only |
| Component structure refactoring | Strict constraint — no structural changes |
| New CSS variable tokens in globals.css | Not needed — full token set already defined |
| Third-party component internals (Recharts fills) | Cannot fix via Tailwind class replacement; deferred to v2 |
| Niche brand accent colors (blue-600, pink-600, etc.) | Intentionally hardcoded per-niche identity colors |
| Google OAuth SVG icon colors | Brand-required, must not be altered |
| Admin platform pages (app/admin/) | Research confirms already clean — no action needed |

## Traceability

Phase mappings confirmed during roadmap creation (2026-03-17).

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 0 | Pending |
| FOUND-02 | Phase 0 | Pending |
| FOUND-03 | Phase 0 | Pending |
| LAND-01 | Phase 1 | Pending |
| LAND-02 | Phase 1 | Pending |
| LAND-03 | Phase 1 | Pending |
| LAND-04 | Phase 1 | Pending |
| LAND-05 | Phase 1 | Pending |
| LAND-06 | Phase 1 | Pending |
| LAND-07 | Phase 1 | Pending |
| BOOK-01 | Phase 2 | Pending |
| BOOK-02 | Phase 2 | Pending |
| BOOK-03 | Phase 2 | Pending |
| BOOK-04 | Phase 2 | Pending |
| BOOK-05 | Phase 2 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| DASH-05 | Phase 3 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| CLEAN-01 | Phase 4 | Pending |
| CLEAN-02 | Phase 4 | Pending |
| CLEAN-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after roadmap creation*
