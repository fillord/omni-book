---
phase: 4
slug: client-data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --testPathPattern=client` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=client`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | CRM-01 | unit | `npx jest --testPathPattern=client` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | CRM-01 | unit | `npx jest --testPathPattern=client` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | CRM-02 | unit | `npx jest --testPathPattern=sync-clients` | ❌ W0 | ⬜ pending |
| 4-01-04 | 01 | 1 | CRM-03 | unit | `npx jest --testPathPattern=sync-clients` | ❌ W0 | ⬜ pending |
| 4-01-05 | 01 | 1 | CRM-04 | unit | `npx jest --testPathPattern=sync-clients` | ❌ W0 | ⬜ pending |
| 4-01-06 | 01 | 1 | CRM-05 | unit | `npx jest --testPathPattern=sync-clients` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/sync-clients.test.ts` — stubs for CRM-01 through CRM-05 (upsert deduplication, metric derivation)
- [ ] `__tests__/client-schema.test.ts` — schema assertions: Client model fields, unique constraint

*Existing jest infrastructure covers test framework — no new installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| syncClients action returns success in browser | CRM-01 | Server Action invocation requires Next.js runtime | Navigate to admin panel, trigger sync, verify toast/response |
| Duplicate prevention on re-run | CRM-01 | Requires real DB state across two action calls | Run syncClients twice, verify client count unchanged |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
