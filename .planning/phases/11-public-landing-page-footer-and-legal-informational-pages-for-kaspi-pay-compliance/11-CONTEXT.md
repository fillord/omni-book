# Phase 11: Public landing page footer and legal/informational pages for Kaspi Pay compliance - Context

**Gathered:** 2026-04-03 (discuss mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the landing page footer from a minimal single-row component to a full multi-column footer, and create 4 public legal/informational pages required for Kaspi Pay merchant compliance: Public Offer (Оферта), Privacy Policy, Refund Policy, and About/Contacts.

All new pages live under the `(marketing)` route group. Footer links are wired to real pages. Legal pages are full RU/KZ/EN i18n using the existing `lib/i18n/translations.ts` system.

</domain>

<decisions>
## Implementation Decisions

### Footer Layout
- **D-01:** Replace the current single-row footer with a multi-column layout: **Product | Legal | Company**
- **D-02:** Product column: Features, Pricing, Demo, Docs links
- **D-03:** Legal column: Privacy Policy (`/privacy`), Public Offer (`/oferta`), Refund Policy (`/refund`)
- **D-04:** Company column: About (`/about`), Contacts (anchored to About or separate `/contacts`), Support
- **D-05:** Bottom bar: brand logo + copyright line (existing pattern preserved)
- **D-06:** Use existing Neumorphism system — `neu-raised`, `bg-[var(--neu-bg)]` consistent with current Footer.tsx

### Legal Pages — Scope
- **D-07:** Create 4 pages: `/oferta`, `/privacy`, `/refund`, `/about`
- **D-08:** All 4 pages live in `app/(marketing)/` route group (inherits AdminThemeProvider layout)
- **D-09:** Pages use the standard Neumorphism landing page visual style — consistent with existing landing sections

### Legal Content
- **D-10:** Claude generates realistic template legal text (SaaS-appropriate oferta, GDPR/Kazakhstan-style privacy policy, cancellation policy, company info placeholder)
- **D-11:** All placeholder content should have clear `{REPLACE: ...}` markers for values the owner must fill in (company name, BIN/IIN, address, contact email, jurisdiction, effective date)
- **D-12:** Content is the authoritative Russian version — i18n translations for KZ and EN are provided as reasonable approximations

### Language / i18n
- **D-13:** All 4 pages use the existing `lib/i18n/translations.ts` i18n system — RU/KZ/EN
- **D-14:** Add a new `legal` namespace in translations.ts for shared legal UI strings (page titles, section headings, last-updated label, placeholder markers)
- **D-15:** Each page has its own namespace: `oferta`, `privacy`, `refund`, `about` — or a single `legal` namespace with sub-sections if content volume is manageable
- **D-16:** Footer i18n keys added to the existing `landing` namespace (column headings, link labels)

### Claude's Discretion
- Exact URL slugs (e.g., `/oferta` vs `/public-offer`) — use Russian short slugs (`/oferta`, `/privacy`, `/refund`, `/about`)
- Typography hierarchy within legal pages (h1/h2/h3 structure for sections)
- Exact column widths and responsive breakpoints for the multi-column footer
- Whether About and Contacts are one page or two (one combined `/about` page is fine)
- Whether "Docs" and "Support" footer links point to `#` stubs or are wired (out of scope — stub is acceptable)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing footer and landing components
- `components/landing/Footer.tsx` — current footer to be replaced/expanded
- `components/landing/Navbar.tsx` — link patterns, i18n usage, Neumorphism class patterns
- `app/(marketing)/page.tsx` — landing page structure, route group context
- `app/(marketing)/layout.tsx` — AdminThemeProvider wrapping — new pages inherit this

### i18n system
- `lib/i18n/translations.ts` — translation structure: `Record<Locale, Record<namespace, Record<key, string>>>`. Landing namespace example at line 38. Full RU/KZ/EN required.
- `lib/i18n/context.tsx` — `useI18n()` hook for client components
- `lib/i18n/server.ts` — server-side i18n for RSC

### Neumorphism design system
- `app/globals.css` — `--neu-bg`, `.neu-raised`, `.neu-inset`, `--neu-accent` CSS vars and utility classes

### Kaspi Pay compliance context
- `app/dashboard/settings/billing/billing-content.tsx` — Kaspi merchant config UI (context for what Kaspi integration means in this project)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/landing/Footer.tsx` — base to extend; already has `neu-raised bg-[var(--neu-bg)]`, `useI18n`, `Link` imports
- `components/landing/Navbar.tsx` — pattern for `useI18n`, `ClientOnly`, Neumorphism classes in landing context
- `app/(marketing)/layout.tsx` — route group layout, just wraps `AdminThemeProvider` — new pages auto-inherit

### Established Patterns
- All landing components use `"use client"` with `useI18n()` hook
- Neumorphism: `neu-raised` for elevated surfaces, `bg-[var(--neu-bg)]` as background base
- i18n: `t('namespace', 'key')` — namespaces per feature area (landing, common, billing, etc.)
- New keys go into `translations.ts` under `ru`, `kz`, `en` objects simultaneously
- `max-w-6xl mx-auto px-4` is the standard landing page container width

### Integration Points
- Footer.tsx is imported directly in `app/(marketing)/page.tsx` — replacing it updates the landing page immediately
- New pages at `app/(marketing)/oferta/page.tsx`, `app/(marketing)/privacy/page.tsx`, etc. are auto-routed by Next.js App Router
- Footer legal links use Next.js `<Link href="/oferta">` etc. — standard internal navigation

</code_context>

<specifics>
## Specific Ideas

- Footer columns: **Product** (Features, Pricing, Demo, Docs), **Legal** (Privacy Policy, Public Offer, Refund Policy), **Company** (About, Contacts, Support)
- Legal page placeholder marker format: `{REPLACE: company_name}`, `{REPLACE: bin_number}`, `{REPLACE: contact_email}` — clearly visible for the owner
- Kaspi Pay compliance: the 4 pages collectively satisfy Kaspi's merchant onboarding checklist for public-facing legal documentation
- URL slugs: `/oferta`, `/privacy`, `/refund`, `/about` — Russian short slugs, commonly used for Kazakhstani SaaS

</specifics>

<deferred>
## Deferred Ideas

- Docs page (`/docs`) — functional documentation site is its own phase
- Support page (`/support`) — could be a contact form; out of scope here
- Cookie consent banner — related to privacy policy but a separate UI component phase
- Animated footer entrance (FadeIn) — out of scope, can be added later

</deferred>

---

*Phase: 11-public-landing-page-footer-and-legal-informational-pages-for-kaspi-pay-compliance*
*Context gathered: 2026-04-03*
