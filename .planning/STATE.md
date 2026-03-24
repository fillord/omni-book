---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
last_updated: "2026-03-24T09:06:00Z"
last_activity: 2026-03-24 — Completed 02-01-PLAN.md (god-mode-surface.test.ts scaffold + Announcement/Notification/AuditLog Prisma models)
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 9
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20 after v1.2 milestone)

**Core value:** A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.
**Current focus:** Planning next milestone (v1.3)

## Current Position

Phase: 02-super-admin-god-mode-and-platform-management
Plan: 01 of 5 — IN PROGRESS (01 complete)
Status: In Progress — Phase 02 started; Wave 0 complete; 17/42 god-mode tests pass; schema migrated
Last activity: 2026-03-24 — Completed 02-01-PLAN.md (god-mode-surface.test.ts scaffold + Announcement/Notification/AuditLog Prisma models)

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Key patterns carrying forward to next milestone:
- [Phase 02-01]: safeRead helper (fs.existsSync check before readFileSync) prevents test crashes on missing files — tests fail with assertion errors, not throws
- [Phase 02-01]: Announcement model is global (no tenantId) — platform-wide banners shown to all tenants
- [Phase 02-01]: AuditLog/Notification use Cascade delete — tenant deletion cleans up all associated records
- [Phase 02-01]: prisma db push (not migrate dev) for schema sync — no migration files, just schema state sync
- Static file assertion tests (`fs.readFileSync` + regex) — extended in v1.1 for opt_* and mobile class audits
- `min-w-0` on flex children enables `truncate` — never `overflow-hidden` on container
- Inline opt_ guard: `strVal.startsWith('opt_') ? t('niche', strVal) : strVal`
- `// INTENTIONAL:` comments for brand/functional color exceptions
- Sidebar uses `bg-sidebar` token family, not `bg-background`/`bg-card`
- [Phase 01]: col-span-full on duration FormItem so wider widget occupies its own grid row
- [Phase 01]: FormControl wraps relative div wrapper (not Input) for Radix Slot prop forwarding compatibility
- [Phase 02-01]: Beauty specialization changed from select to free-text; horeca/sports gain attr_specialization for staff backward compatibility
- [Phase 02-01]: New resource type keys follow resource_type_<value> pattern; attribute label keys use attr_<field> pattern — no opt_xxx for new additions
- [Phase 01-neumorphism-refactor]: Use var(--neu-bg) for shadcn token remapping so existing component className strings remain valid
- [Phase 01-neumorphism-refactor]: --border: transparent removes hard borders; visual depth via .neu-raised/.neu-inset box-shadow
- [Phase 01-neumorphism-refactor]: Global CSS transition uses explicit properties list (not transition: all) to avoid conflicting with animation keyframes
- [Phase 01-neumorphism-refactor plan 02]: neu-btn/neu-raised/neu-inset applied per cva variant (not base class) so ghost/link variants stay flat
- [Phase 01-neumorphism-refactor plan 02]: Remove dark: Tailwind overrides from component variants when surface uses Neumorphism CSS custom properties
- [Phase 01-neumorphism-refactor plan 02]: Input focus uses ring-only (not border) — inset shadow provides depth context, border-based focus conflicts
- [Phase 01-neumorphism-refactor plan 03]: Sheet side borders removed — neu-raised box-shadow provides visual panel separation, hard borders conflict with Neumorphism borderless design
- [Phase 01-neumorphism-refactor plan 03]: SelectTrigger uses neu-inset with bg-[var(--neu-bg)] — bg-transparent does not show inset shadow correctly
- [Phase 01-neumorphism-refactor plan 03]: Badge outline variant uses neu-inset replacing border-border — depth via inset shadow replaces border outline pattern
- [Phase 01-neumorphism-refactor]: [Phase 01-neumorphism-refactor plan 04]: ThemeToggle hover:bg-muted removed (Pitfall 9 — invisible after token remap); replaced with neu-raised + hover:text-neu-accent
- [Phase 01-neumorphism-refactor]: [Phase 01-neumorphism-refactor plan 04]: HeroSection replaces gradient with bg-background; decorative blobs use bg-neu-accent opacity variants
- [Phase 01-neumorphism-refactor]: .neu-* classes moved from @layer base to @layer utilities — Tailwind specificity requires utility layer for shadow classes
- [Phase 01-neumorphism-refactor]: Explicit bg-[var(--neu-bg)] on component roots required for shadow depth — shorthand tokens (bg-card, bg-background) don't guarantee correct background for Neumorphism shadows

### Pending Todos

None.

### Blockers/Concerns

None.

### Roadmap Evolution

- v1.2 complete: Phase 1 (duration input), Phase 2 (resource types expansion) both shipped
- See ROADMAP.md for full milestone history
- Phase 1 added: Refactor the UI design of the entire project to a Neumorphism Soft UI style with Light and Dark themes

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260319-vxw | Fix 6 failing cleanup-surface.test.ts tests | 2026-03-19 | 03a7ab4 | [260319-vxw-fix-6-failing-cleanup-surface-test-ts-te](./quick/260319-vxw-fix-6-failing-cleanup-surface-test-ts-te/) |
| 260323-106 | Add couch resource type to Zod validation | 2026-03-23 | a0801f6 | [260323-106-add-couch-resource-type](./quick/260323-106-add-couch-resource-type/) |
| 260323-1el | Add 18 niche resource types to RESOURCE_TYPES (horeca/sports/medicine/beauty) | 2026-03-23 | af3e28c | [260323-1el-bulk-resource-types-update](./quick/260323-1el-bulk-resource-types-update/) |
