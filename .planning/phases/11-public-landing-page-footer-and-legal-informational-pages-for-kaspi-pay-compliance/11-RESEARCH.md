# Phase 11: Public Landing Page Footer and Legal/Informational Pages for Kaspi Pay Compliance — Research

**Researched:** 2026-04-03
**Domain:** Next.js App Router page creation, multi-column footer, i18n, Neumorphism design system
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Replace the current single-row footer with a multi-column layout: **Product | Legal | Company**
- **D-02:** Product column: Features, Pricing, Demo, Docs links
- **D-03:** Legal column: Privacy Policy (`/privacy`), Public Offer (`/oferta`), Refund Policy (`/refund`)
- **D-04:** Company column: About (`/about`), Contacts (anchored to About or separate `/contacts`), Support
- **D-05:** Bottom bar: brand logo + copyright line (existing pattern preserved)
- **D-06:** Use existing Neumorphism system — `neu-raised`, `bg-[var(--neu-bg)]` consistent with current Footer.tsx
- **D-07:** Create 4 pages: `/oferta`, `/privacy`, `/refund`, `/about`
- **D-08:** All 4 pages live in `app/(marketing)/` route group (inherits AdminThemeProvider layout)
- **D-09:** Pages use the standard Neumorphism landing page visual style — consistent with existing landing sections
- **D-10:** Claude generates realistic template legal text (SaaS-appropriate oferta, GDPR/Kazakhstan-style privacy policy, cancellation policy, company info placeholder)
- **D-11:** All placeholder content should have clear `{REPLACE: ...}` markers for values the owner must fill in (company name, BIN/IIN, address, contact email, jurisdiction, effective date)
- **D-12:** Content is the authoritative Russian version — i18n translations for KZ and EN are provided as reasonable approximations
- **D-13:** All 4 pages use the existing `lib/i18n/translations.ts` i18n system — RU/KZ/EN
- **D-14:** Add a new `legal` namespace in translations.ts for shared legal UI strings (page titles, section headings, last-updated label, placeholder markers)
- **D-15:** Each page has its own namespace: `oferta`, `privacy`, `refund`, `about` — or a single `legal` namespace with sub-sections if content volume is manageable
- **D-16:** Footer i18n keys added to the existing `landing` namespace (column headings, link labels)

### Claude's Discretion

- Exact URL slugs — use Russian short slugs (`/oferta`, `/privacy`, `/refund`, `/about`)
- Typography hierarchy within legal pages (h1/h2/h3 structure for sections)
- Exact column widths and responsive breakpoints for the multi-column footer
- Whether About and Contacts are one page or two (one combined `/about` page is fine)
- Whether "Docs" and "Support" footer links point to `#` stubs or are wired (out of scope — stub is acceptable)

### Deferred Ideas (OUT OF SCOPE)

- Docs page (`/docs`) — functional documentation site is its own phase
- Support page (`/support`) — could be a contact form; out of scope here
- Cookie consent banner — related to privacy policy but a separate UI component phase
- Animated footer entrance (FadeIn) — out of scope, can be added later
</user_constraints>

---

## Summary

Phase 11 is a pure frontend phase with no backend or database changes. It has two distinct deliverables: (1) replacing `components/landing/Footer.tsx` with a multi-column layout and (2) creating four `app/(marketing)/[slug]/page.tsx` files for legal pages. The entire phase is additive — existing landing page structure is unchanged except the Footer component replacement.

The i18n system is the primary integration complexity. Every new string (footer column headers, link labels, page titles, section headings, all legal content) must be added to `lib/i18n/translations.ts` in all three locales simultaneously (ru/kz/en). The file is 2,073 lines with clearly defined `ru`, `kz`, and `en` top-level keys — the `landing` namespace sits under each, and new namespaces (`legal`, `oferta`, `privacy`, `refund`, `about`) are appended at the same level.

The Neumorphism design system is fully documented in `app/globals.css`. Legal pages use `neu-raised` elevated card sections for each content block, `bg-[var(--neu-bg)]` as page background, `max-w-6xl mx-auto px-4` for container width, and `text-foreground`/`text-muted-foreground` for type hierarchy — no hardcoded color classes per the LAND-01 through LAND-07 test suite that the new components must also pass.

**Primary recommendation:** Create Footer.tsx in-place, then add four minimal `"use client"` page components under `app/(marketing)/`, each loading its content from `translations.ts`. A dedicated `legal` namespace covers shared UI chrome; per-page namespaces (`oferta`, `privacy`, `refund`, `about`) carry full textual content. This avoids a single bloated namespace while keeping the existing `t('namespace', 'key')` call pattern unchanged.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | ~14 (project-pinned) | File-based routing for new pages under `(marketing)` group | Project's established framework |
| React | ~18 (project-pinned) | `"use client"` components with hooks | Required by `useI18n()` |
| `lib/i18n/translations.ts` | project-internal | Static RU/KZ/EN translation map | Established i18n system — no external dependency |
| `lib/i18n/context.tsx` (`useI18n`) | project-internal | Client-side locale hook | All landing components already use this |
| Tailwind CSS | project-pinned | Utility classes for layout/typography | Project standard |
| Next.js `<Link>` | built-in | Internal navigation in Footer | Already used in existing Footer.tsx |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lib/i18n/server.ts` (`getServerT`) | project-internal | Server-side translation | Only if legal pages become RSC — not needed here since `"use client"` is the established pattern for landing components |
| `components/shared/client-only` | project-internal | SSR hydration guard | Already used in Navbar — apply to Footer if locale-dependent content causes hydration mismatch |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `translations.ts` per-page namespaces | Markdown files / MDX for legal content | MDX adds build dependency + remark/rehype pipeline; translations.ts keeps i18n consistent and avoids new tooling |
| `"use client"` + `useI18n` | RSC + `getServerT` | RSC approach is valid but existing landing page pattern is all client components — consistency wins |
| Single combined `legal` namespace | Separate namespace per page | With ~30-50 keys per legal page, separate namespaces prevent collision and allow clear per-page ownership |

**Installation:** No new packages required. All dependencies are already in the project.

---

## Architecture Patterns

### Recommended Project Structure

```
app/(marketing)/
├── layout.tsx          # unchanged — AdminThemeProvider wrapping
├── page.tsx            # unchanged — landing page
├── oferta/
│   └── page.tsx        # NEW — Public Offer
├── privacy/
│   └── page.tsx        # NEW — Privacy Policy
├── refund/
│   └── page.tsx        # NEW — Refund Policy
└── about/
    └── page.tsx        # NEW — About & Contacts

components/landing/
└── Footer.tsx          # REPLACE — multi-column footer

lib/i18n/
└── translations.ts     # EXTEND — new namespaces: landing (footer keys), legal, oferta, privacy, refund, about
```

### Pattern 1: Multi-Column Footer Layout

**What:** Three-column grid footer replacing the current single-row flex layout. Columns: Product, Legal, Company. Bottom bar: logo + copyright. Grid collapses to single column on mobile.

**When to use:** Any footer with 3+ groups of links.

**Example (adapted from existing Footer.tsx patterns):**
```tsx
// components/landing/Footer.tsx
// Source: existing Footer.tsx patterns + D-01 through D-06 decisions
"use client"

import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="neu-raised bg-[var(--neu-bg)] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Three-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
          {/* Product column */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">
              {t('landing', 'footerColProduct')}
            </h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'features')}</a></li>
              <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'pricing')}</a></li>
              <li><a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'demo')}</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'docs')}</a></li>
            </ul>
          </div>
          {/* Legal column */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">
              {t('landing', 'footerColLegal')}
            </h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerPrivacy')}</Link></li>
              <li><Link href="/oferta" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerOferta')}</Link></li>
              <li><Link href="/refund" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerRefund')}</Link></li>
            </ul>
          </div>
          {/* Company column */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">
              {t('landing', 'footerColCompany')}
            </h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerAbout')}</Link></li>
              <li><Link href="/about#contacts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerContacts')}</Link></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing', 'footerSupport')}</a></li>
            </ul>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="border-t border-muted-foreground/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-bold text-lg text-foreground">
            omni<span className="text-neu-accent">book</span>
          </Link>
          <p className="text-xs text-muted-foreground">© 2026 omni-book. {t('landing', 'footerRights')}</p>
        </div>
      </div>
    </footer>
  )
}
```

### Pattern 2: Legal Page Structure

**What:** Each legal page is a `"use client"` component with a page header, last-updated date, and sectioned content blocks (each block uses `neu-raised` card styling).

**When to use:** All four legal pages: `/oferta`, `/privacy`, `/refund`, `/about`.

**Example:**
```tsx
// app/(marketing)/privacy/page.tsx
"use client"

import { useI18n } from "@/lib/i18n/context"

export default function PrivacyPage() {
  const { t } = useI18n()

  return (
    <main className="bg-[var(--neu-bg)] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('privacy', 'pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('legal', 'lastUpdated')}: {t('privacy', 'effectiveDate')}
          </p>
        </div>
        {/* Content sections */}
        <div className="space-y-6">
          <section className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t('privacy', 'section1Title')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('privacy', 'section1Body')}
            </p>
          </section>
          {/* ...more sections */}
        </div>
      </div>
    </main>
  )
}
```

### Pattern 3: i18n Namespace Extension

**What:** Add new namespaces to `translations.ts` by appending key blocks inside each of the three locale objects (`ru`, `kz`, `en`) simultaneously.

**Critical constraint:** The `t(section, key)` function returns `"section.key"` if the key is missing in the current locale but falls back to `DEFAULT_LOCALE` (ru) first. All three locales MUST have the same keys to avoid showing raw `section.key` strings in production.

**Example — translations.ts additions:**
```typescript
// Inside ru: { ... }
landing: {
  // EXISTING keys preserved...
  // NEW footer keys:
  footerColProduct:  'Продукт',
  footerColLegal:    'Правовая информация',
  footerColCompany:  'Компания',
  footerPrivacy:     'Политика конфиденциальности',
  footerOferta:      'Публичная оферта',
  footerRefund:      'Политика возврата',
  footerContacts:    'Контакты',
  footerSupport:     'Поддержка',
  footerRights:      'Все права защищены.',
},
legal: {
  lastUpdated:       'Последнее обновление',
  replaceMarker:     '{REPLACE: ...}',
},
oferta: {
  pageTitle:         'Публичная оферта',
  effectiveDate:     '{REPLACE: effective_date}',
  section1Title:     '1. Общие положения',
  section1Body:      '...',
  // ... (full legal text as i18n values)
},
// similarly: privacy, refund, about
```

### Anti-Patterns to Avoid

- **Hardcoded color classes:** Do not use `text-zinc-400`, `bg-slate-50`, `border-gray-200`, or bare `bg-white` in new components. The existing test suite (LAND-01 through LAND-07 in `__tests__/landing-surface.test.ts`) checks for these. Use `text-muted-foreground`, `text-foreground`, `bg-[var(--neu-bg)]` instead.
- **Missing locale sync:** Never add a key to `ru` without simultaneously adding it to `kz` and `en`. Missing keys display as `"namespace.key"` strings because the fallback chain shows the actual namespace+key string when not found in DEFAULT_LOCALE either. Wait — actually the fallback IS the RU locale first, but if RU also misses a key, it renders the raw string. Since RU is DEFAULT_LOCALE, adding to RU without adding to other locales will just show RU text for non-RU users (acceptable degradation) but STILL the executor must add all three to be complete.
- **Server Component for locale-dependent content:** Do not use RSC for pages that render locale-switched content — the existing landing pattern is all `"use client"` components using `useI18n()`. RSC would require `getServerT()` which reads cookies/headers per request but cannot react to client-side locale switches.
- **Using `<a>` instead of `<Link>` for internal routes:** Footer links to `/privacy`, `/oferta`, `/refund`, `/about` must use Next.js `<Link>` for client-side navigation. Hash anchors (e.g., `#features`) appropriately use `<a>`.
- **Not including the `"use client"` directive:** All new components must begin with `"use client"` to use the `useI18n()` hook, which calls `useContext` internally.
- **Forgetting the `// intentional` comment in Footer.tsx:** The existing `landing-surface.test.ts` at line 36-39 checks that `Footer.tsx` contains the word `'intentional'`. The new Footer must preserve or include an `// INTENTIONAL:` comment (any brand/design exception comment works).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Routing for `/oferta`, `/privacy`, etc. | Custom router or middleware redirect | Next.js App Router file-based routing (`app/(marketing)/oferta/page.tsx`) | Zero config, auto-routed by Next.js |
| i18n loading | Custom fetch/import per page | `useI18n()` hook from `lib/i18n/context.tsx` | Already established; consistent locale switching |
| Legal content CMS | External headless CMS, database table | `translations.ts` static strings with `{REPLACE: ...}` markers | Phase scope is template content, not dynamic CMS |
| Neumorphism shadow utilities | Inline style `box-shadow` properties | `.neu-raised` and `.neu-inset` CSS classes from `globals.css` | Design system classes already defined and tested |
| Responsive grid | Custom CSS grid | Tailwind `grid grid-cols-1 md:grid-cols-3` | Tailwind already configured in project |

**Key insight:** This phase has no custom logic — it is pure UI composition using established patterns. Every technical decision is already made by the project's prior phases.

---

## Common Pitfalls

### Pitfall 1: Footer.tsx "intentional" test failure

**What goes wrong:** The replaced `Footer.tsx` causes `landing-surface.test.ts` line 36 to fail because it checks `expect(footer).toContain("intentional")`.

**Why it happens:** The test was written to document a design exception in the original footer. Rewriting the file without preserving or adding a comment with the word "intentional" breaks the test.

**How to avoid:** Add `// INTENTIONAL: neu-raised footer uses fixed bg-[var(--neu-bg)] — brand anchor, not semantic token` or any comment containing the word "intentional" near the Neumorphism class.

**Warning signs:** `jest` run fails at `LAND-01` with "Expected: StringContaining 'intentional'".

### Pitfall 2: Locale key mismatch — raw `namespace.key` strings appear

**What goes wrong:** Adding keys to `ru` block in `translations.ts` but forgetting to add them to `kz` or `en` blocks. Users switching to Kazakh or English see raw strings like `"privacy.section1Title"`.

**Why it happens:** The `t()` function fallback chain is: `locale → DEFAULT_LOCALE (ru) → raw string`. If a key exists in `ru` but not `kz`, Kazakh users get the Russian text (acceptable). But if the EXECUTOR adds to `ru` in one wave and `kz`/`en` in a later wave, there's a window where incomplete translations are live.

**How to avoid:** In each wave that touches translations, update all three locale blocks atomically in a single file write. The planner should organize translation additions as one sub-task per locale block (or one task updating all three).

**Warning signs:** Visible strings with dot-notation format in the UI (e.g., `"about.contactEmail"`).

### Pitfall 3: Legal pages missing from the marketing route group layout

**What goes wrong:** Creating pages at wrong path (e.g., `app/oferta/page.tsx` instead of `app/(marketing)/oferta/page.tsx`). Pages would then NOT inherit `AdminThemeProvider` and Neumorphism theme would not apply.

**Why it happens:** Route group parenthesis syntax is easy to forget when creating new directories.

**How to avoid:** Create ALL new pages under `app/(marketing)/[slug]/page.tsx`. The route group `(marketing)` is a non-URL-affecting directory — pages inside are still accessible at `/oferta`, `/privacy`, etc.

**Warning signs:** Legal pages render with no Neumorphism styling (plain white background, no theme).

### Pitfall 4: Hydration mismatch on locale-dependent Footer content

**What goes wrong:** SSR renders with DEFAULT_LOCALE (ru) and client renders with a different locale from `localStorage`, causing React hydration warning.

**Why it happens:** `useI18n()` reads `localStorage` on mount, which differs from the SSR-rendered locale.

**How to avoid:** Wrap locale-dependent Footer link labels in `ClientOnly` (already used in Navbar.tsx) if hydration errors appear in testing. The existing Footer already uses `useI18n` without `ClientOnly` and appears to work, so this may not be an issue in practice — but it is the established mitigation pattern.

**Warning signs:** React hydration error in console: "Text content did not match."

### Pitfall 5: Tailwind purge missing new page routes

**What goes wrong:** Tailwind classes used only in new `app/(marketing)/oferta/page.tsx` etc. are not included in the production CSS bundle.

**Why it happens:** Tailwind v4 uses content scanning — new directories must be within the scan glob.

**How to avoid:** Verify the project's Tailwind content glob includes `app/**/*.tsx`. In most Next.js + Tailwind setups this is already configured. No action needed if the glob is `./app/**/*.{ts,tsx}`.

**Warning signs:** Legal pages look unstyled in production build but fine in development.

---

## Code Examples

### Verified: `useI18n` hook call pattern

```tsx
// Source: lib/i18n/context.tsx — signature confirmed
const { t } = useI18n()
// Returns: translations[locale]?.[section]?.[key] ?? translations['ru']?.[section]?.[key] ?? `${section}.${key}`

t('landing', 'heroTitle')   // existing call — returns Russian/KZ/EN title
t('oferta', 'pageTitle')    // new call — returns from new namespace
t('legal', 'lastUpdated')   // shared legal UI string
```

### Verified: Route auto-registration

```
app/(marketing)/oferta/page.tsx  →  accessible at  /oferta
app/(marketing)/privacy/page.tsx →  accessible at  /privacy
app/(marketing)/refund/page.tsx  →  accessible at  /refund
app/(marketing)/about/page.tsx   →  accessible at  /about
```

No `next.config.js` changes required. No redirects needed. The `(marketing)` group name is non-URL-affecting by Next.js App Router convention.

### Verified: Neumorphism utility classes

```css
/* Source: app/globals.css — @layer utilities */
.neu-raised {
  background-color: var(--neu-bg);
  box-shadow: 10px 10px 20px var(--neu-shadow-dark), -10px -10px 20px var(--neu-shadow-light);
}
.neu-inset {
  background-color: var(--neu-bg);
  box-shadow: inset 5px 5px 10px var(--neu-shadow-dark), inset -5px -5px 10px var(--neu-shadow-light);
}
```

Dark mode is handled automatically via `.dark { --neu-bg: #1e1e24; --neu-shadow-light: #2c2c35; --neu-shadow-dark: #101013; }`.

### Verified: Landing page container pattern

```tsx
// Standard container used by all landing sections
<div className="max-w-6xl mx-auto px-4">
  {/* content */}
</div>
// Legal pages use max-w-4xl for narrower reading column
```

### Verified: Translation namespace structure in translations.ts

```typescript
// lib/i18n/translations.ts structure (verified line counts)
// ru: starts line ~11, kz: starts line 701, en: starts line 1388
// Each locale has the same namespace keys

export const translations: Record<Locale, Record<string, Record<string, string>>> = {
  ru: {
    common: { ... },
    landing: { ... },  // line ~38 — add new footer keys here
    // ... other namespaces
    // ADD: legal: { ... }, oferta: { ... }, privacy: { ... }, refund: { ... }, about: { ... }
  },
  kz: {
    // same structure, kz translations
    // ADD: same new namespaces
  },
  en: {
    // same structure, en translations  
    // ADD: same new namespaces
  }
}
```

---

## Runtime State Inventory

Step 2.5: SKIPPED — This phase involves no rename, rebrand, refactor, or migration. It is additive-only: new files and i18n key additions.

---

## Environment Availability

Step 2.6: SKIPPED — This phase is purely code and content changes (new `.tsx` files and additions to `translations.ts`). No external tools, services, databases, CLIs, or runtimes are required beyond what is already established by the running project.

---

## Validation Architecture

nyquist_validation is `true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest 29 |
| Config file | `jest.config.js` (project root) |
| Quick run command | `npx jest __tests__/landing-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOOT-01 | Footer.tsx has multi-column structure (3 columns) | static analysis | `npx jest __tests__/landing-surface.test.ts -t "Footer"` | Wave 0 — extend existing |
| FOOT-02 | Footer.tsx contains `footerColProduct`, `footerColLegal`, `footerColCompany` i18n keys | static analysis | `npx jest __tests__/landing-surface.test.ts -t "Footer"` | Wave 0 — extend existing |
| FOOT-03 | Footer.tsx contains `// intentional` comment (LAND-01 requirement) | static analysis | `npx jest __tests__/landing-surface.test.ts -t "intentional"` | Existing test at line 36 |
| FOOT-04 | Footer links to `/privacy`, `/oferta`, `/refund`, `/about` exist in Footer.tsx | static analysis | `npx jest __tests__/landing-surface.test.ts -t "Footer links"` | Wave 0 — extend existing |
| PAGE-01 | `app/(marketing)/oferta/page.tsx` exists | file existence | `npx jest __tests__/legal-surface.test.ts` | Wave 0 — create |
| PAGE-02 | `app/(marketing)/privacy/page.tsx` exists | file existence | `npx jest __tests__/legal-surface.test.ts` | Wave 0 — create |
| PAGE-03 | `app/(marketing)/refund/page.tsx` exists | file existence | `npx jest __tests__/legal-surface.test.ts` | Wave 0 — create |
| PAGE-04 | `app/(marketing)/about/page.tsx` exists | file existence | `npx jest __tests__/legal-surface.test.ts` | Wave 0 — create |
| I18N-01 | translations.ts `ru` has `oferta`, `privacy`, `refund`, `about`, `legal` namespaces | static analysis | `npx jest __tests__/legal-surface.test.ts -t "translations"` | Wave 0 — create |
| I18N-02 | translations.ts `kz` has same namespaces as `ru` | static analysis | `npx jest __tests__/legal-surface.test.ts -t "translations"` | Wave 0 — create |
| I18N-03 | translations.ts `en` has same namespaces as `ru` | static analysis | `npx jest __tests__/legal-surface.test.ts -t "translations"` | Wave 0 — create |
| STYLE-01 | New legal page components do not use hardcoded neutral classes (LAND-01 parity) | static analysis | `npx jest __tests__/legal-surface.test.ts -t "no hardcoded"` | Wave 0 — create |
| STYLE-02 | New legal page components start with `"use client"` | static analysis | `npx jest __tests__/legal-surface.test.ts -t "use client"` | Wave 0 — create |

### Sampling Rate

- **Per task commit:** `npx jest __tests__/landing-surface.test.ts __tests__/legal-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/legal-surface.test.ts` — new test file covering PAGE-01 through PAGE-04, I18N-01 through I18N-03, STYLE-01 through STYLE-02
- [ ] Extend `__tests__/landing-surface.test.ts` with Footer-specific assertions (FOOT-01 through FOOT-04) — add to existing LAND-01 describe block's Footer section

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-row flex footer | Multi-column grid footer | Phase 11 | Satisfies Kaspi merchant compliance checklist for public legal pages |
| Footer links pointing to `#` stubs | Real internal Next.js routes | Phase 11 | `/privacy`, `/oferta`, `/refund`, `/about` become real pages |
| No legal pages | 4 legal pages with i18n | Phase 11 | Kaspi Pay merchant onboarding requirement satisfied |

**No deprecated patterns to migrate in this phase.**

---

## Open Questions

1. **`{REPLACE: ...}` marker visibility in translated text**
   - What we know: Decision D-11 requires `{REPLACE: company_name}` format markers
   - What's unclear: Should these markers appear in all 3 locales (ru/kz/en) with the same English marker text, or should they be translated?
   - Recommendation: Keep `{REPLACE: ...}` markers identical in all locales (English label) — they are technical placeholders for the owner, not user-facing strings. This is standard practice.

2. **Footer column widths at `md` breakpoint**
   - What we know: `grid-cols-3` at md gives equal 1/3 columns
   - What's unclear: Whether equal column distribution is ideal (Legal column has fewer links than Product)
   - Recommendation: Use `md:grid-cols-3` with equal distribution for simplicity; executor can adjust to `md:grid-cols-[1fr_1fr_1fr]` if visual balance needs tuning.

3. **About page: single vs. multiple sections**
   - What we know: Decision allows combining About + Contacts into `/about`
   - What's unclear: Exact sectioning (Company story, Team, Contact info, Legal address)
   - Recommendation: Two sections minimum: "О компании" (company overview with placeholder) and "Контакты" (email, address, BIN — all `{REPLACE: ...}` marked). Use `id="contacts"` on the Contacts section so `href="/about#contacts"` anchor works from Footer.

---

## Sources

### Primary (HIGH confidence)

- `components/landing/Footer.tsx` — confirmed existing footer structure, class names, i18n usage pattern
- `components/landing/Navbar.tsx` — confirmed `"use client"`, `useI18n`, `ClientOnly` pattern
- `app/(marketing)/page.tsx` — confirmed Footer import and landing structure
- `app/(marketing)/layout.tsx` — confirmed `AdminThemeProvider` wrapping (1 line)
- `lib/i18n/translations.ts` — confirmed full structure: 2,073 lines, `ru` at line 11, `kz` at 701, `en` at 1388; `t(section, key)` signature; fallback chain
- `lib/i18n/context.tsx` — confirmed `useI18n()` hook interface: `{ locale, setLocale, t }`
- `lib/i18n/server.ts` — confirmed `getServerT()` for RSC (not used in this phase)
- `app/globals.css` — confirmed `.neu-raised`, `.neu-inset`, `.neu-btn` class definitions; CSS variable names; dark mode variables
- `__tests__/landing-surface.test.ts` — confirmed LAND-01 through LAND-07 test assertions; Footer "intentional" requirement at line 36

### Secondary (MEDIUM confidence)

- `11-CONTEXT.md` decisions D-01 through D-16 — project owner decisions (authoritative for this phase)
- Next.js App Router documentation pattern (route groups with parenthesis) — consistent with project's observed `(marketing)` directory structure

### Tertiary (LOW confidence)

- None — all claims are verified against actual project files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against actual project files; no external libraries needed
- Architecture: HIGH — Next.js App Router patterns are well-established in this codebase (same pattern as existing `(marketing)/page.tsx`)
- i18n patterns: HIGH — `translations.ts` structure fully inspected; `useI18n` hook interface confirmed
- Neumorphism classes: HIGH — class definitions read directly from `globals.css`
- Test requirements: HIGH — existing test suite inspected; LAND-01 Footer test confirmed
- Pitfalls: HIGH — most pitfalls derived from reading existing code and test constraints, not speculation

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable Next.js + project-internal patterns, no fast-moving dependencies)
