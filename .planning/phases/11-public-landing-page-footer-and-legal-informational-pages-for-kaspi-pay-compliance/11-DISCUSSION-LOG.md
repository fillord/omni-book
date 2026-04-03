# Phase 11: Public landing page footer and legal/informational pages for Kaspi Pay compliance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-03
**Phase:** 11-public-landing-page-footer-and-legal-informational-pages-for-kaspi-pay-compliance
**Mode:** discuss
**Areas analyzed:** Footer structure, Legal pages scope, Language coverage, Content approach

## Gray Areas Presented

| Area | Options Presented | User Selected |
|------|-------------------|---------------|
| Footer structure | Multi-column / Compact two-row / Two-section | Multi-column (Product \| Legal \| Company) |
| Legal pages scope | Oferta, Privacy, Refund, About/Contacts | All 4 |
| Language coverage | Russian only (static) / Full RU/KZ/EN i18n | Full RU/KZ/EN i18n |
| Content approach | Claude generates template / User provides content | Claude generates template with `{REPLACE: ...}` markers |
| Footer columns | Product \| Legal \| Company / Product \| Legal (simpler) | Product \| Legal \| Company |

## Codebase Findings Applied

- `components/landing/Footer.tsx` — existing minimal footer identified as base to expand
- Footer currently uses `neu-raised bg-[var(--neu-bg)]` + `useI18n` — patterns to preserve
- `app/(marketing)/` route group confirmed as correct location for new pages
- i18n system (`lib/i18n/translations.ts`) supports RU/KZ/EN — new `legal` namespace to add

## Corrections Made

No corrections — all selections were from the presented options.

## External Research

Not performed — codebase analysis was sufficient for this phase scope.
