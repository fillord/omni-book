# Roadmap: omni-book

## Milestones

- ✅ **v1.0 Dark Mode** — Phases 0-4 (shipped 2026-03-19)
- ✅ **v1.1 Critical Bug Fixes** — Phases 6-7 (shipped 2026-03-19)
- ✅ **v1.2 Advanced Customization & Niche Expansion** — Phases 1-2 (shipped 2026-03-20)
- ✅ **v1.3 Neumorphism UI, God Mode & Subscription Lifecycle** — Phases 1-3 (shipped 2026-03-24)
- 🔄 **v1.4 Client Base (Mini-CRM)** — Phases 4-5 (in progress)
- ⏳ **v1.5 Payments Integration** — Phase 9 (planned)

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
- [x] **Phase 5: Client UI, Outreach & Polish** — Clients table page, detail page, Telegram send action, Neumorphism design, RU/EN/KZ i18n (completed 2026-03-25)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Infrastructure Validation | v1.0 | 1/1 | Complete | 2026-03-17 |
| 1. Replace Duration Dropdown | v1.2 | 1/1 | Complete | 2026-03-19 |
| 2. Expand Resource Types | v1.2 | 1/1 | Complete | 2026-03-20 |
| 3. Dashboard + Auth Surface | v1.3 | 3/3 | Complete | 2026-03-24 |
| 4. Cleanup Sweep | 2/2 | Complete   | 2026-03-25 | 2026-03-18 |
| 6. Data Display Correctness | 4/4 | Complete   | 2026-03-28 | 2026-03-19 |
| 7. Mobile UI Fixes | v1.1 | 4/4 | Complete   | 2026-04-01 |
| 4. Client Data Foundation | v1.4 | 2/2 | Complete | 2026-03-25 |
| 5. Client UI, Outreach & Polish | 3/3 | Complete   | 2026-03-25 | - |
| 6. Tokenized Booking Management | v1.4 | 0/4 | In Progress | - |

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
**Plans:** 3/3 plans complete

Plans:
- [ ] 05-01-PLAN.md — Test scaffold + i18n translations + sidebar link
- [ ] 05-02-PLAN.md — Clients list page + table component with search
- [ ] 05-03-PLAN.md — Client detail page + Telegram outreach action

### Phase 6: Implement tokenized booking management for clients (cancel/reschedule) via email and Telegram links

**Goal:** Clients receive a unique, tokenized management link in their booking confirmation (email and Telegram). Clicking the link opens a public page at /manage/[token] where they can cancel or reschedule their booking subject to a 4-hour cutoff rule. The tenant owner is notified via Telegram when a reschedule occurs. No login required.
**Requirements:** [TOK-01, TOK-02, TOK-03, TOK-04, TOK-05, TOK-06, TOK-07]
**Depends on:** Phase 5
**Plans:** 4/4 plans complete

Plans:
- [ ] 06-01-PLAN.md — Test scaffold + Prisma schema (manageToken field) + token generation in createBooking
- [ ] 06-02-PLAN.md — Public /manage/[token] page + Cancel API route + 4-hour rule UI
- [ ] 06-03-PLAN.md — Reschedule API route + RescheduleCalendar UI + Telegram owner notification
- [ ] 06-04-PLAN.md — Update email/Telegram confirmation templates + i18n keys

Requirements:
- TOK-01: manageToken field — unique URL-safe token on Booking model, generated at booking creation
- TOK-02: Public management page — /manage/[token] renders booking details with Neumorphism UI, no auth
- TOK-03: 4-hour cutoff rule — cancel/reschedule disabled within 4 hours of booking start, Russian message + business phone shown
- TOK-04: Cancel flow — sets booking status to CANCELLED, server-side 4-hour re-check, confirmation UI
- TOK-05: Reschedule flow — slot picker for same service/resource, updates startsAt/endsAt in place, collision detection
- TOK-06: Telegram notification — tenant owner notified via Telegram with old/new time on reschedule
- TOK-07: Confirmation template updates — email and Telegram booking confirmations include management link

### Phase 7: Bookings Dashboard CRM Overhaul and Manual Booking Creation

**Goal:** Redesign /dashboard/bookings from a raw database table into a CRM scheduling view with day-grouping, default CANCELLED filter exclusion, Neumorphism booking cards with bold time display, and a manual booking creation feature via admin slide-over Sheet with Server Action and collision-detection transaction.
**Requirements:** [CRM-B01, CRM-B02, CRM-B03, CRM-B04, CRM-B05, CRM-B06, CRM-B07, CRM-B08, CRM-B09, CRM-B10, CRM-B11, CRM-B12]
**Depends on:** Phase 6
**Plans:** 4/4 plans complete

Plans:
- [x] 07-01-PLAN.md — Test scaffold (CRM-B01 through CRM-B12 static assertions)
- [x] 07-02-PLAN.md — createManualBooking Server Action + Zod schema + page data extension
- [x] 07-03-PLAN.md — Dashboard CRM overhaul (day-grouping, default filter, Neumorphism cards)
- [x] 07-04-PLAN.md — ManualBookingSheet component + dashboard wiring + i18n translations

### Phase 9: Online Deposit Payments via Kaspi Pay (Direct Invoice)

**Goal:** Allow tenants to require a deposit from clients when booking online using Kaspi Pay's direct invoicing API. When a client books, the server creates a PENDING booking and pushes a payment invoice directly to the client's Kaspi mobile app. The UI shows a "waiting for payment" screen with a countdown — no external redirect. On webhook confirmation, the booking becomes CONFIRMED with email/Telegram notifications sent. Unpaid bookings are auto-cancelled after 10 minutes via cron.
**Requirements:** [PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08]
**Depends on:** Phase 7 (booking creation flow, booking status model)
**Plans:** 4 plans

Requirements:
- PAY-01: Tenant deposit configuration — `requireDeposit Boolean`, `depositAmount Int` (tenge tiyn), `kaspiMerchantId String?`, `kaspiApiKey String?` on Tenant model; configurable in billing/settings page (PRO+ gate)
- PAY-02: Kaspi adapter — `lib/payments/kaspi.ts` with `createKaspiInvoice(phone, amount, bookingId, tenantKeys)` and `verifyKaspiWebhook(payload)`. Phase 9 ships mock implementations; real API wired in Phase 9b/10.
- PAY-03: Booking creation with PENDING + invoice push — POST /api/bookings calls adapter, stamps `paymentInvoiceId` and `paymentExpiresAt` on booking, returns `{ booking, invoiceCreated: true }`
- PAY-04: Waiting-for-payment UI — booking form shows Neumorphic "waiting" screen: "Мы выставили счет в ваше приложение Kaspi. Оплатите в течение 10 минут." with countdown timer. Client pays inside Kaspi app — no redirect.
- PAY-05: Kaspi webhook handler — POST /api/webhooks/kaspi verifies signature (mock for now), updates booking to CONFIRMED, triggers email + Telegram confirmation notifications
- PAY-06: Payment timeout cron — `app/api/cron/pending-payments/route.ts` at `*/5 * * * *`, cancels PENDING bookings where `paymentExpiresAt < now`
- PAY-07: Slot blocking for PENDING — already implemented in collision query (no change needed)
- PAY-08: Neumorphism design adherence — all new UI uses `var(--neu-bg)`, `.neu-raised`, `.neu-inset` patterns

Canonical refs:
- `app/api/bookings/route.ts` — booking creation logic to extend
- `app/api/cron/subscriptions/route.ts` — cron auth pattern to follow
- `lib/subscription-lifecycle.ts` — lifecycle function pattern
- `components/booking-form.tsx` — public booking form to extend (waiting screen)
- `components/tenant-public-page.tsx` — passes tenant deposit config as props
- `app/api/webhooks/meta/route.ts` — webhook handler pattern
- `vercel.json` — add pending-payments cron entry

Plans:
- [x] 09-01-PLAN.md — Test scaffold + Prisma schema extension + Kaspi adapter mock + engine interface
- [x] 09-02-PLAN.md — Booking route deposit branch + webhook handler + cron + vercel.json
- [x] 09-03-PLAN.md — Tenant deposit settings UI + Server Action + i18n keys
- [x] 09-04-PLAN.md — WaitingForPaymentScreen countdown UI + deposit notice + visual verification

### Phase 10: SaaS Monetization, Enterprise Tier & Platform Payments

**Goal:** Move plan pricing and limits from hardcoded constants into a `SubscriptionPlan` DB model with Super Admin UI editor; wire the Enterprise tier with a dynamic Neumorphic pricing calculator (slider-based); and replace the manual "copy card number" payment flow with a mock Kaspi QR / Paylink-style platform payment adapter that auto-activates the subscription on simulated webhook receipt — designed to swap for the real Paylink.kz API once the legal entity is registered.
**Requirements:** [MON-01, MON-02, MON-03, MON-04, MON-05, MON-06, MON-07, MON-08, MON-09]
**Depends on:** Phase 9 (platform is live, Phase 3 subscription lifecycle in place)
**Plans:** 4/4 plans complete

Requirements:
- MON-01: SubscriptionPlan DB model — `plan Plan @unique`, `displayName`, `maxResources`, `priceMonthly Int` (-1 = dynamic), `priceYearly Int`, `pricePerResource Int`, `features String[]`; seeded with FREE/PRO/ENTERPRISE rows matching current hardcoded values
- MON-02: Remove hardcoded pricing — delete `PLAN_DEFAULT_MAX_RESOURCES` from `lib/actions/admin.ts`, remove hardcoded `10 000 ₸` from `billing-content.tsx`; all plan actions fetch from DB
- MON-03: Super Admin plan editor — `/admin/plans` page with inline-edit table; `updateSubscriptionPlan()` Server Action with `ensureSuperAdmin()` guard
- MON-04: Enterprise calculator — interactive Neumorphic slider on billing page; formula `monthly = base + resources × pricePerResource`; yearly = monthly × 10; both prices shown in real-time
- MON-05: Enterprise inquiry flow — "Request Enterprise" CTA sends Telegram notification with resource count + calculated price; sets `planStatus = PENDING`
- MON-06: PlatformPayment model — `tenantId`, `amount Int`, `planTarget Plan`, `status PaymentStatus` (PENDING/PAID/FAILED/EXPIRED), `mockQrCode String?`, `expiresAt DateTime`, `paidAt DateTime?`
- MON-07: Mock payment adapter — `lib/platform-payment.ts` with `createPlatformPayment()` and `processPlatformPayment()`; `initiateSubscriptionPayment()` Server Action replaces `requestProActivation()` in billing-content
- MON-08: Waiting-for-payment modal — two-step flow in billing page: Step 1 (Initiate) → Step 2 (mock QR + countdown + "Simulate Payment" button behind `NEXT_PUBLIC_MOCK_PAYMENTS=true` flag); resume on page refresh if `pendingPayment` exists
- MON-09: Mock webhook/simulate endpoint — `app/api/mock-payment/simulate/route.ts` calls `processPlatformPayment()`: PAID status, activates subscription, sends Telegram admin notification, creates audit log `saas_payment_received`

Plans:
- [x] 10-01-PLAN.md — Test scaffold + Prisma schema (SubscriptionPlan, PlatformPayment) + remove hardcoded pricing
- [x] 10-02-PLAN.md — Mock payment adapter + initiateSubscriptionPayment + simulate endpoint + billing page.tsx data
- [x] 10-03-PLAN.md — Super Admin plan editor (/admin/plans) + nav link
- [x] 10-04-PLAN.md — Enterprise calculator + Enterprise inquiry + payment modal + billing-content refactor + i18n

### Phase 11: Public landing page footer and legal/informational pages for Kaspi Pay compliance

**Goal:** Replace the single-row landing page footer with a multi-column Product/Legal/Company grid layout, and create 4 public legal/informational pages (/oferta, /privacy, /refund, /about) with full RU/KZ/EN i18n and Neumorphism design — satisfying Kaspi Pay merchant compliance requirements for public-facing legal documentation.
**Requirements:** [LAND-F01, LAND-F02, LAND-F03, LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04, LEGAL-05, LEGAL-06, LEGAL-07]
**Depends on:** Phase 10
**Plans:** 2/2 plans complete

Plans:
- [x] 11-01-PLAN.md — Test scaffold + multi-column Footer.tsx rewrite + footer i18n keys
- [x] 11-02-PLAN.md — Legal i18n content (5 namespaces) + 4 legal page components (/oferta, /privacy, /refund, /about)
