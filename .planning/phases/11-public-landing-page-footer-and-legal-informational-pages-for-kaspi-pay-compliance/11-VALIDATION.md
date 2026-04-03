---
phase: 11
slug: public-landing-page-footer-and-legal-informational-pages-for-kaspi-pay-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest --testPathPattern="legal-surface" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="legal-surface|landing-surface" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | legal-surface | unit | `npx jest --testPathPattern="legal-surface" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | footer-multi-col | unit | `npx jest --testPathPattern="landing-surface" --no-coverage` | ✅ | ⬜ pending |
| 11-02-02 | 02 | 1 | footer-i18n | unit | `npx jest --testPathPattern="landing-surface" --no-coverage` | ✅ | ⬜ pending |
| 11-03-01 | 03 | 2 | oferta-page | unit | `npx jest --testPathPattern="legal-surface" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | privacy-page | unit | `npx jest --testPathPattern="legal-surface" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-03-03 | 03 | 2 | refund-page | unit | `npx jest --testPathPattern="legal-surface" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-03-04 | 03 | 2 | about-page | unit | `npx jest --testPathPattern="legal-surface" --no-coverage` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 2 | translations-legal | unit | `npx jest --testPathPattern="legal-surface" --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/legal-surface.test.ts` — page file existence, translations namespace presence across ru/kz/en, `"use client"` directive checks, no hardcoded neutral classes (LAND-01 parity)

*Note: `__tests__/landing-surface.test.ts` already exists and covers the existing Footer — new footer changes are tested there. Wave 0 only needs to create the new `legal-surface` test file.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual multi-column footer layout | D-01 to D-06 | Visual rendering check | Open landing page, verify 3 columns render correctly at desktop and mobile breakpoints |
| `{REPLACE: ...}` markers visible in legal pages | D-11 | Content rendering | Browse /oferta, /privacy, /refund, /about — confirm placeholder markers are visible |
| Kaspi Pay compliance checklist | D-07 | Business requirement | Verify all 4 pages exist at correct slugs and are publicly accessible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
