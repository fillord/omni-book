---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Client Base
current_plan: Not started
status: executing
last_updated: "2026-04-01T03:24:20.294Z"
last_activity: 2026-04-01
progress:
  total_phases: 8
  completed_phases: 7
  total_plans: 29
  completed_plans: 28
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25 after v1.3 milestone close)

**Core value:** A reliable, correctly-rendered booking experience for tenants and customers — accurate data display, accessible UI across all screen sizes and both themes.
**Current focus:** Phase 09 — online-payment-with-deposit-via-paylink-kz-kaspi

## Current Position

Phase: 09
Plan: 1 of 4
Current Plan: Not started
Status: Executing Phase 09
Last activity: 2026-04-01

Progress: [██████████] 100% (21/21 plans complete)

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

- [Phase 03-01]: isFrozen @default(false) added to Resource and Service — enables selective freeze on subscription expiry without deleting data
- [Phase 03-01]: Freeze keeps oldest-by-createdAt resource/service to preserve tenant's most-established data on downgrade
- [Phase 03-01]: Staff (User) records not frozen — no isFrozen on User model, users retain access
- [Phase 03-01]: 3-day warning uses 2-4 day fuzzy window to tolerate daily cron scheduling drift
- [Phase 03-01]: Subscription cron uses GET handler (Vercel Cron GET-only constraint)

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
- [Phase 02-super-admin-god-mode-and-platform-management]: AnnouncementBanner uses useState(false) + useEffect localStorage check to prevent hydration mismatch
- [Phase 02-super-admin-god-mode-and-platform-management]: Only one announcement active at a time: createAnnouncement deactivates all existing before creating new — simplifies dashboard query to findFirst
- [Phase 03-02]: DialogTrigger uses asChild to properly forward disabled prop to inner Button for invite staff when EXPIRED
- [Phase 03-02]: planStatus passed as optional string (not enum) to StaffManager to avoid cross-layer import coupling
- [Phase 03-03]: renewSubscription sets PRO+PENDING (not ACTIVE directly) — requires super-admin confirmation, same flow as requestProActivation
- [Phase 03-03]: activateSubscription uses basePrisma.$transaction for atomic tenant update + bulk unfreeze of resources and services
- [Phase 03-03]: Two-click confirmation pattern on ActivateSubscriptionForm prevents accidental activation by super-admin
- [Phase 04-client-data-foundation]: Client identity uses (tenantId, phone) composite key — phone always present on bookings; email is optional
- [Phase 04-client-data-foundation]: No direct Booking[] relation on Client — Client is materialized aggregate; adding clientId to Booking would be a breaking change
- [Phase 04-client-data-foundation]: prisma generate run in executor context; prisma db push is a manual step requiring database connection
- [Phase 04-02]: syncClients uses orderBy startsAt desc so clientBookings[0] is most recent — lastVisitAt and name fallback use index 0 without extra sort
- [Phase 04-02]: email resolved via Array.find across all bookings for first non-null email (not just most recent booking)
- [Phase 05-01]: Test scaffold created before implementation — CRM-06 sidebar + CRM-12 translation tests pass immediately; CRM-07 through CRM-11 fail until Plans 02+03 implement the files
- [Phase 05-01]: Sidebar clients entry uses section: 'clients' translation namespace, consistent with existing section-based i18n pattern
- [Phase 05-01]: 27 translation keys per locale covers full client UI surface (table columns, search, Telegram outreach, booking history, sync operations)
- [Phase 05-02]: Date serialization: server component converts Date to ISO string before passing to ClientsTable to satisfy Next.js App Router constraint
- [Phase 05-02]: Client-side search filtering via useMemo — no server round-trip for search, immediate UX
- [Phase 05-02]: useTransition for syncClients — prevents UI lock during sync operation
- [Phase 05-03]: sendTelegramToClient fetches telegramChatId from booking (not Client model) — hasTelegram is boolean-only flag; empty message guard before requireAuth() prevents API 400 errors
- [Phase 05-03]: Telegram send UI section absent (not disabled) for hasTelegram=false clients; cross-tenant access returns 404 via notFound()
- [Phase 06-01]: manageToken is String? (nullable) — existing bookings lack tokens, avoids migration failure on non-empty database
- [Phase 06-01]: @unique constraint on manageToken for indexed fast token lookups in public API routes
- [Phase 06-01]: crypto.randomUUID() used for token generation — built-in Node.js, no extra dependency, v4 UUID is URL-safe
- [Phase 06-01]: prisma generate run in executor context; prisma db push is a manual step requiring live DB connection before deployment
- [Phase 06-02]: basePrisma used for both /manage/[token] page and cancel API route — cross-tenant public lookup, no tenant scoping needed
- [Phase 06-02]: 4-hour rule enforced both server-side (page canManage flag) and in cancel API (prevents stale UI exploitation)
- [Phase 06-02]: Reschedule button shown as disabled placeholder in BookingManagePage — Plan 03 will enable it
- [Phase 06-02]: Date formatting uses Intl.DateTimeFormat with tenant timezone for correct local time display on public page
- [Phase 06-03]: Reschedule updates booking in-place (same id, new startsAt/endsAt) in Serializable transaction — no new booking created
- [Phase 06-03]: SELECT FOR UPDATE on Resource row prevents concurrent reschedule race conditions
- [Phase 06-03]: Collision check excludes current booking by id — allows re-selecting effectively the same slot
- [Phase 06-04]: Management link in Telegram goes to business OWNER notification — owner can access management page directly from notification
- [Phase 06-04]: Email management row and Telegram link are conditionally included only when manageToken truthy — backwards compatible with existing null tokens
- [Phase 06-04]: i18n manage section with 24 keys per locale (ru/kz/en) — covers all UI strings for management page
- [Phase 07]: Wave 0 test-first: wrote failing test scaffold for all 12 CRM-B requirements before any production file exists
- [Phase 07]: CRM-B07 assertion: manageToken explicitly null (not randomUUID) for manual bookings — no token generation
- [Phase 07]: manageToken: null for admin bookings — explicit null prevents inadvertent self-manage link generation
- [Phase 07]: Do NOT call engine's createBooking() for admin bookings — bypasses MAX_ACTIVE_BOOKINGS_PER_PHONE limit intentionally
- [Phase 07]: Use Map<string,BookingRow[]> + string key comparison for timezone-safe day grouping in BookingsDashboard
- [Phase 09-03]: Used requireAuth + requireRole pattern for Server Action PRO+ gate, consistent with billing.ts
- [Phase 09-03]: payment i18n section added as top-level namespace (not nested under booking) for payment-specific keys
- [Phase 09-online-payment-with-deposit-via-paylink-kz-kaspi]: Kaspi webhook sends email+Telegram after PENDING->CONFIRMED only; deposit branch exits before notification block to prevent premature notifications
- [Phase 09-online-payment-with-deposit-via-paylink-kz-kaspi]: vercel.json now has 3 cron entries; Vercel free tier supports 2 — user may need Pro upgrade or fold pending-payments into subscriptions cron

### Pending Todos

None.

### Blockers/Concerns

None.

### Roadmap Evolution

- v1.2 complete: Phase 1 (duration input), Phase 2 (resource types expansion) both shipped
- v1.3 complete: Phase 1 (Neumorphism), Phase 2 (God Mode), Phase 3 (Subscription Lifecycle) all shipped
- Phase 7 added: Bookings Dashboard CRM Overhaul and Manual Booking Creation
- v1.4 roadmap defined: Phase 4 (Client Data Foundation), Phase 5 (Client UI, Outreach & Polish)
- Phase 6 added: Implement tokenized booking management for clients (cancel/reschedule) via email and Telegram links
- See ROADMAP.md for full milestone history

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260319-vxw | Fix 6 failing cleanup-surface.test.ts tests | 2026-03-19 | 03a7ab4 | [260319-vxw-fix-6-failing-cleanup-surface-test-ts-te](./quick/260319-vxw-fix-6-failing-cleanup-surface-test-ts-te/) |
| 260323-106 | Add couch resource type to Zod validation | 2026-03-23 | a0801f6 | [260323-106-add-couch-resource-type](./quick/260323-106-add-couch-resource-type/) |
| 260323-1el | Add 18 niche resource types to RESOURCE_TYPES (horeca/sports/medicine/beauty) | 2026-03-23 | af3e28c | [260323-1el-bulk-resource-types-update](./quick/260323-1el-bulk-resource-types-update/) |
| 260401-bx1 | Fix 3 UI bugs: invisible toggle in service form, obsolete deposit fields in billing, sidebar double-highlight | 2026-04-01 | 548bf47 | [260401-bx1-fix-3-ui-bugs-invisible-toggle-in-servic](./quick/260401-bx1-fix-3-ui-bugs-invisible-toggle-in-servic/) |
