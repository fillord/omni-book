# Roadmap: omni-book

## Milestones

- ✅ **v1.0 Dark Mode** — Phases 0-4 (shipped 2026-03-19)
- ✅ **v1.1 Critical Bug Fixes** — Phases 6-7 (shipped 2026-03-19)
- ✅ **v1.2 Advanced Customization & Niche Expansion** — Phases 1-2 (shipped 2026-03-20)
- ✅ **v1.3 Neumorphism UI, God Mode & Subscription Lifecycle** — Phases 1-3 (shipped 2026-03-24)
- 🔄 **v1.4 Client Base (Mini-CRM)** — Phases 4-5 (in progress)

## Phases

<details>
<summary>✅ v1.0 Dark Mode (Phases 0-4) — SHIPPED 2026-03-19</summary>

Full-stack dark mode fix — 66 files updated, 26 requirements delivered, hardcoded Tailwind color classes replaced with semantic shadcn/ui CSS variable tokens across all surfaces. See `.planning/milestones/v1.0-ROADMAP.md` for full details.

- [x] Phase 0: Infrastructure Validation (1/1 plans) — completed 2026-03-17
- [x] Phase 1: Landing / Marketing Surface (4/4 plans) — completed 2026-03-17
- [x] Phase 2: Tenant Public Booking Surface (3/3 plans) — completed 2026-03-18
- [x] Phase 3: Dashboard + Auth Surface (4/4 plans) — completed 2026-03-18
- [x] Phase 4: Cleanup Sweep (3/3 plans) — completed 2026-03-18

</details>

<details>
<summary>✅ v1.1 Critical Bug Fixes (Phases 6-7) — SHIPPED 2026-03-19</summary>

Three classes of user-visible defects eliminated — opt_* ID leakage in data display, mobile card overflow in the dashboard, and mobile theme toggle occlusion on the public booking page. See `.planning/milestones/v1.1-ROADMAP.md` for full details.

- [x] Phase 6: Data Display Correctness (1/1 plans) — completed 2026-03-19
- [x] Phase 7: Mobile UI Fixes (1/1 plans) — completed 2026-03-19

</details>

<details>
<summary>✅ v1.2 Advanced Customization & Niche Expansion (Phases 1-2) — SHIPPED 2026-03-20</summary>

Custom service duration input (1-1440 min) replacing fixed dropdown, 19 new niche resource types with trilingual translations across 4 verticals. See `.planning/milestones/v1.2-ROADMAP.md` for full details.

- [x] Phase 1: Replace fixed duration dropdown with free-text number input (1/1 plans) — completed 2026-03-19
- [x] Phase 2: Expand resource types and specialties for Clinic, Restaurant, Sports, and Beauty (1/1 plans) — completed 2026-03-20

</details>

<details>
<summary>✅ v1.3 Neumorphism UI, God Mode & Subscription Lifecycle (Phases 1-3) — SHIPPED 2026-03-24</summary>

Full Neumorphism Soft UI visual system, Super-Admin "God Mode" management panel, and 30-day subscription lifecycle with automated resource freezing. See v1.3 milestone in `.planning/MILESTONES.md` for full details.

- [x] Phase 1: Neumorphism Soft UI (4/4 plans) — completed 2026-03-22
- [x] Phase 2: Super-Admin God Mode & Platform Management (5/5 plans) — completed 2026-03-23
- [x] Phase 3: Subscription Lifecycle and Automated Resource Freezing (3/3 plans) — completed 2026-03-24

</details>

### v1.4 Client Base (Mini-CRM)

- [x] **Phase 4: Client Data Foundation** — Prisma Client model, aggregation logic, sync from existing bookings (completed 2026-03-25)
- [ ] **Phase 5: Client UI, Outreach & Polish** — Clients table page, detail page, Telegram send action, Neumorphism design, RU/EN/KZ i18n

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Infrastructure Validation | v1.0 | 1/1 | Complete | 2026-03-17 |
| 1. Replace Duration Dropdown | v1.2 | 1/1 | Complete | 2026-03-19 |
| 2. Expand Resource Types | v1.2 | 1/1 | Complete | 2026-03-20 |
| 3. Dashboard + Auth Surface | v1.3 | 3/3 | Complete | 2026-03-24 |
| 4. Cleanup Sweep | 2/2 | Complete   | 2026-03-25 | 2026-03-18 |
| 6. Data Display Correctness | v1.1 | 1/1 | Complete | 2026-03-19 |
| 7. Mobile UI Fixes | v1.1 | 1/1 | Complete | 2026-03-19 |
| 4. Client Data Foundation | v1.4 | 2/2 | Complete | 2026-03-25 |
| 5. Client UI, Outreach & Polish | v1.4 | 0/3 | Not started | - |

## Phase Details

### Phase 1: Refactor the UI design of the entire project to a Neumorphism Soft UI style with Light and Dark themes

**Goal:** Apply a complete Neumorphism (Soft UI) visual system to the entire omni-book application — CSS variable injection with token remapping, .neu-raised/.neu-inset utility classes on all shadcn/ui components, landing page adaptation, and smooth 300ms theme transitions — achieving 100% visual consistency across marketing, auth, dashboard, and booking surfaces in both light and dark themes.
**Requirements:** [NEU-01, NEU-02, NEU-03, NEU-04, NEU-05, NEU-06, NEU-07, NEU-08, NEU-09, NEU-10, NEU-11, NEU-12, NEU-13, NEU-14]
**Depends on:** None (standalone visual refactor)
**Plans:** 4/4 plans complete

Plans:
- [ ] 01-01-PLAN.md — Test scaffold + CSS foundation (variables, token remapping, utility classes, global transition)
- [ ] 01-02-PLAN.md — Core UI components (Button, Input, Card)
- [ ] 01-03-PLAN.md — Popup/overlay components (Dialog, Select, DropdownMenu, Sheet, Badge)
- [ ] 01-04-PLAN.md — Landing page adaptation (HeroSection, Navbar, ThemeToggle) + full regression

### Phase 2: Super-Admin "God Mode" & Platform Management

**Goal:** Build a comprehensive super-admin panel for platform owners to monitor, manage, and communicate with tenants — delivering a Financial Analytics Dashboard (MRR + plan breakdown), per-tenant drill-down with read-only data views (services, resources, staff), Global Announcement Banners visible across all tenant dashboards, targeted in-app notifications (Bell icon) for individual tenant owners, and an Audit & Activity Log for critical tenant actions — all built with strict Neumorphism UI adherence (var(--neu-bg), .neu-raised, .neu-inset).
**Requirements:** [GOD-01, GOD-02, GOD-03, GOD-04, GOD-05, GOD-06]
**Depends on:** Phase 1 (Neumorphism design system)
**Plans:** 1/5 plans executed

Plans:
- [ ] 02-01-PLAN.md — Test scaffold + Prisma schema migration (Announcement, Notification, AuditLog models)
- [ ] 02-02-PLAN.md — Financial Analytics Dashboard (MRR + plan tier breakdown with Recharts)
- [ ] 02-03-PLAN.md — Tenant Drill-Down (read-only Services/Resources/Staff tabs)
- [ ] 02-04-PLAN.md — Announcement Banners + In-App Notifications (Bell icon + dashboard wiring)
- [ ] 02-05-PLAN.md — Audit & Activity Logs (createAuditLog hooks + viewer page)

Requirements:
- GOD-01: Financial & Platform Analytics Dashboard — MRR display and breakdown of active tenants per plan tier (Free / Pro / Enterprise)
- GOD-02: Tenant Drill-Down (Deep View) — clickable tenant row opens read-only view of that tenant's Services, Resources, and Staff/Masters
- GOD-03: Global Announcement Banners — super-admin creates banners that appear at the top of ALL tenant dashboards platform-wide
- GOD-04: Targeted In-App Notifications — Bell icon notification system; super-admin sends custom messages to specific individual tenants
- GOD-05: Audit & Activity Logs — system log table recording tenant logins, plan changes (upgrade/downgrade), and deletion of critical data
- GOD-06: Neumorphism Design Adherence — all new pages, charts, tables, and modals use var(--neu-bg), .neu-raised for cards/buttons, .neu-inset for inputs/table containers

### Phase 3: Subscription Lifecycle and Automated Resource Freezing

**Goal:** Implement a 30-day subscription lifecycle with automated expiry detection via daily cron, resource/service freezing with isFrozen fields, tenant warnings via in-app notifications, frozen state UI in dashboard managers, and super-admin activation with expiry date management and bulk unfreeze — all with Neumorphism design adherence.
**Requirements:** [SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06]
**Depends on:** Phase 2
**Plans:** 3/3 plans complete

Plans:
- [ ] 03-01-PLAN.md — Test scaffold + Prisma schema expansion (isFrozen, CANCELED) + Cron lifecycle route
- [ ] 03-02-PLAN.md — Frozen state UI in dashboard managers (resources, services, staff)
- [ ] 03-03-PLAN.md — Billing page enhancements + renewSubscription + admin activateSubscription + i18n

Requirements:
- SUB-01: Schema expansion — isFrozen Boolean on Resource and Service models, CANCELED added to PlanStatus enum
- SUB-02: Automated lifecycle cron — daily /api/cron/subscriptions route with 3-day warning notifications and expiry-triggered downgrade/freeze
- SUB-03: Frozen state UI — "Заморожен" badges on frozen resources/services, disabled Edit/Delete, staff invite lock when EXPIRED
- SUB-04: Billing page enhancements — expiry date display, EXPIRED alert block, renewSubscription action with Telegram notification
- SUB-05: Super-admin activation — activateSubscription action (PRO/ACTIVE, 30-day expiry, bulk unfreeze), admin tenant detail UI
- SUB-06: Neumorphism design adherence — all new UI uses var(--neu-bg), .neu-raised, .neu-inset patterns

### Phase 4: Client Data Foundation

**Goal:** Tenant owners have a reliable, queryable client record for every unique customer who has completed a booking — with accurate aggregated metrics (visits, revenue, last visit, Telegram status) — so that the UI layer can display real data without runtime computation.
**Depends on:** Phase 3 (existing booking and subscription data structures)
**Requirements:** CRM-01, CRM-02, CRM-03, CRM-04, CRM-05
**Success Criteria** (what must be TRUE):
  1. Running the sync action against existing bookings creates one `Client` record per unique phone/email under the correct tenant, with no duplicates
  2. Each client record correctly reports the count of COMPLETED bookings as total visits
  3. Each client record correctly reports the sum of `price` across COMPLETED bookings as total revenue
  4. Each client record correctly reports the date of the most recent COMPLETED booking as last visit
  5. Each client record correctly reflects whether any related booking carried a `telegramChatId`
**Plans:** 2/2 plans complete

Plans:
- [x] 04-01-PLAN.md — Test scaffold + Prisma Client model schema addition
- [x] 04-02-PLAN.md — syncClients upsert action + getClients query action

### Phase 5: Client UI, Outreach & Polish

**Goal:** Tenant owners can navigate to a dedicated Clients page, see their full customer base in a searchable Neumorphic table, drill into any client to review their booking history, and send a Telegram message to reachable clients — all in RU/EN/KZ.
**Depends on:** Phase 4 (Client model and aggregated metrics)
**Requirements:** CRM-06, CRM-07, CRM-08, CRM-09, CRM-10, CRM-11, CRM-12
**Success Criteria** (what must be TRUE):
  1. Tenant owner can reach the Clients page via a "Клиенты" sidebar link without navigating manually to a URL
  2. The Clients page displays a Neumorphic table with Name, Contact, Total Visits, Total Spent, Last Visit, and Telegram Status columns — all populated from real data
  3. Typing in the search bar immediately filters the client list by name or phone number
  4. Clicking a client row opens a detail page showing that client's full booking history (date, service, resource, price, status)
  5. On the detail page, a "Send Telegram message" action is available and functional for clients with an active Telegram connection, and absent (or disabled) for those without
**Plans:** 3 plans

Plans:
- [ ] 05-01-PLAN.md — Test scaffold + i18n translations + sidebar link
- [ ] 05-02-PLAN.md — Clients list page + table component with search
- [ ] 05-03-PLAN.md — Client detail page + Telegram outreach action
