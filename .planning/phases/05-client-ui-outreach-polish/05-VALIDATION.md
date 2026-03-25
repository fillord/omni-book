---
phase: 5
slug: client-ui-outreach-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) |
| **Config file** | vitest.config.ts (or jest.config.ts if present) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | CRM-06 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-01-02 | 01 | 1 | CRM-12 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-02-01 | 02 | 1 | CRM-07 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-02-02 | 02 | 1 | CRM-08 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-02-03 | 02 | 1 | CRM-11 | manual | visual inspection | N/A | ⬜ pending |
| 5-03-01 | 03 | 2 | CRM-09 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-03-02 | 03 | 2 | CRM-10 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — TypeScript compiler provides type-safety verification for all server actions and component props. No new test framework installation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Neumorphic styles render correctly (neu-raised, neu-inset) | CRM-11 | CSS visual — no automated visual regression | Open `/dashboard/clients` in browser, confirm card has box-shadow matching neu-raised, table container has neu-inset shadow |
| Search bar filters live as user types | CRM-08 | Browser interaction | Type partial name/phone in search box, confirm table rows filter immediately |
| Telegram button absent for clients without Telegram | CRM-10 | Data-dependent UI state | Find a client with `hasTelegram=false`, confirm detail page has no send button |
| Telegram message dialog opens and sends | CRM-10 | Real Telegram integration | Find client with `hasTelegram=true`, click send, enter message, confirm delivery |
| All strings appear in RU/EN/KZ | CRM-12 | Locale switching | Switch locale via app language selector, confirm Clients page labels change |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
