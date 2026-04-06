# Omni-Book Full Project Technical Audit

**Generated:** 2026-04-06  
**Milestone:** v1.5 — Payments Pivot (Phase 12 complete)  
**Total source lines:** ~25,400 (app/ + components/ + lib/ *.ts/*.tsx)

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Database Architecture](#2-database-architecture)
3. [API Routes](#3-api-routes)
4. [Server Actions](#4-server-actions)
5. [UI Components Inventory](#5-ui-components-inventory)
6. [App Router Pages](#6-app-router-pages)
7. [Feature Audit](#7-feature-audit)
8. [i18n Status](#8-i18n-status)
9. [Code Health](#9-code-health)
10. [ESLint / Build Health](#10-eslint--build-health)
11. [Security & Environment Variables](#11-security--environment-variables)
12. [Summary & Recommendations](#12-summary--recommendations)

---

## 1. Tech Stack

### Runtime / Framework

| Package | Version | Role |
|---------|---------|------|
| next | 15.5.12 | App framework (App Router, Server Components, Server Actions) |
| react | ^19.0.0 | UI library |
| react-dom | ^19.0.0 | DOM renderer |
| typescript | ^5 | Type safety |
| node | 20 (types) | Runtime |

### Database / ORM

| Package | Version | Role |
|---------|---------|------|
| @prisma/client | ^6.7.0 | Database ORM client |
| prisma | ^6.7.0 | Prisma CLI (devDependency) |
| PostgreSQL | (Docker: postgres latest) | Database engine |

**Schema sync strategy:** `prisma db push` (no migration files — schema state sync only). Docker Compose in `db/docker-compose.yml` runs Postgres locally.

### Auth

| Package | Version | Role |
|---------|---------|------|
| next-auth | ^4.24.11 | Session management (JWT strategy) |
| bcryptjs | ^3.0.3 | Password hashing |

### Forms / Validation

| Package | Version | Role |
|---------|---------|------|
| react-hook-form | ^7.71.2 | Form state management |
| @hookform/resolvers | ^5.2.2 | Zod integration for RHF |
| zod | ^4.3.6 | Schema validation |

### Styling

| Package | Version | Role |
|---------|---------|------|
| tailwindcss | ^4.2.1 | Utility CSS (PostCSS plugin mode) |
| @tailwindcss/postcss | ^4.2.1 | PostCSS integration |
| tw-animate-css | ^1.4.0 | Animation utilities |
| next-themes | ^0.4.6 | Dark/light theme |
| class-variance-authority | ^0.7.1 | CVA for component variants |
| tailwind-merge | ^3.5.0 | Class conflict resolution |
| clsx | ^2.1.1 | Conditional class names |

**Design system:** Full Neumorphic UI. Custom `--neu-bg`, `--neu-shadow-dark`, `--neu-shadow-light`, `--neu-accent` CSS variables. `.neu-raised` / `.neu-inset` utility classes in `@layer utilities`. Shadcn component library integrated; components remapped to Neumorphic tokens.

### UI Component Libraries

| Package | Version | Role |
|---------|---------|------|
| @radix-ui/react-label | ^2.1.8 | Accessible label |
| @radix-ui/react-slot | ^1.2.4 | Slot primitive for Shadcn |
| @radix-ui/react-tabs | ^1.1.13 | Tabs primitive |
| @base-ui/react | ^1.2.0 | Base UI (additional primitives) |
| lucide-react | ^0.577.0 | Icon set |
| recharts | ^3.8.0 | Charts for analytics |
| sonner | ^2.0.7 | Toast notifications |

### Email / Notifications

| Package | Version | Role |
|---------|---------|------|
| resend | ^6.9.3 | Transactional email |
| date-fns | ^4.1.0 | Date utilities |
| date-fns-tz | ^3.2.0 | Timezone-aware date formatting |

### Testing

| Package | Version | Role |
|---------|---------|------|
| jest | ^29 | Test runner |
| ts-jest | ^29 | TypeScript transform for Jest |
| @types/jest | ^29 | Jest types |
| @playwright/test | ^1.58.2 | E2E testing (configured, not yet actively used) |

**Test strategy:** Static surface assertions (file existence + regex). All tests live in `__tests__/`. Jest configured to run only `__tests__/**/*.test.ts` (no TSX test files). Module alias `@/` → project root.

### Build / Config

| File | Purpose |
|------|---------|
| `next.config.ts` | Image remote patterns allow all HTTP/HTTPS hosts |
| `tsconfig.json` | ES2017 target, strict mode, `@/*` alias |
| `postcss.config.mjs` | `@tailwindcss/postcss` only |
| `jest.config.ts` | ts-jest preset, `@/` alias, node test env |
| `vercel.json` | 2 cron jobs (reminders + subscriptions) |

---

## 2. Database Architecture

**Provider:** PostgreSQL. **ORM:** Prisma 6.7.  
**Connection:** `DATABASE_URL` env var.  
**Sync:** `prisma db push` (no migration history files — `prisma/migrations/` directory exists but is empty).

### Models

#### Tenant
Central business entity. One tenant = one business on the platform.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| slug | String | @unique — used for subdomain routing |
| name | String | Business name |
| niche | String? | beauty / horeca / sports / medicine |
| plan | Plan (enum) | FREE / PRO / ENTERPRISE. @default(FREE) |
| planStatus | PlanStatus (enum) | ACTIVE / PENDING / EXPIRED / BANNED / CANCELED |
| maxResources | Int | @default(1) |
| subscriptionExpiresAt | DateTime? | null = never expires (FREE) |
| isActive | Boolean | @default(true) |
| timezone | String | @default("Asia/Almaty") |
| address, city, coverUrl, description, email, logoUrl, phone, website, workingHours | String? | Profile fields |
| socialLinks | Json | @default("{}") |
| translations | Json | @default("{}") — niche-specific label overrides |
| bookingWindowDays | Int | @default(14) |
| telegramChatId | String? | Notification channel |
| Relations | Booking[], Resource[], Service[], User[], Notification[], AuditLog[], Client[], PlatformPayment[] | |

#### User
Staff and admin accounts. NOT used for customers booking (customers are guests).

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| tenantId | String? | nullable — SUPERADMIN has no tenant |
| email | String | @unique |
| name | String? | |
| phone | String? | |
| passwordHash | String? | |
| lastIpAddress | String? | |
| role | Role (enum) | SUPERADMIN / OWNER / STAFF / CUSTOMER. @default(CUSTOMER) |
| emailVerified | DateTime? | |
| activeSessionId | String? | Session invalidation support |

**Indexes:** `[tenantId]`, `[email]`

#### Resource
A bookable entity (doctor, room, table, court, etc.).

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| tenantId | String | FK → Tenant (Cascade) |
| name | String | |
| type | String | From niche config (e.g., "doctor", "master", "table") |
| description | String? | |
| capacity | Int? | |
| attributes | Json | Niche-specific metadata (specialization, equipment, etc.) |
| translations | Json | @default("{}") |
| lunchStart, lunchEnd | String? | Time string (HH:MM) for lunch break exclusion |
| isActive | Boolean | @default(true) |
| isFrozen | Boolean | @default(false) — set on subscription expiry |
| Relations | Booking[], ResourceService[], Schedule[] | |

**Indexes:** `[tenantId]`, `[tenantId, type]`

#### Schedule
Working hours per day-of-week for a resource.

| Field | Type | Notes |
|-------|------|-------|
| resourceId | String | FK → Resource (Cascade) |
| dayOfWeek | Int | 0=Sun, 1=Mon, ... 6=Sat |
| startTime, endTime | String | HH:MM |
| isActive | Boolean | @default(true) |

**Unique:** `[resourceId, dayOfWeek]`

#### Service
A bookable service with a duration and optional price.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| tenantId | String | FK → Tenant (Cascade) |
| name | String | |
| durationMin | Int | Duration in minutes |
| price | Int? | Optional price in KZT |
| currency | String | @default("KZT") |
| translations | Json | |
| isActive | Boolean | @default(true) |
| isFrozen | Boolean | @default(false) |

#### ResourceService (junction)
Many-to-many between Resource and Service.

| Field | Notes |
|-------|-------|
| `@@id([resourceId, serviceId])` | Composite PK |

#### Booking

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| tenantId | String | FK → Tenant |
| resourceId | String | FK → Resource (Cascade) |
| serviceId | String? | Optional FK → Service |
| userId | String? | FK → User (nullable — guest bookings) |
| guestName, guestPhone, guestEmail | String? | Guest booking fields |
| startsAt, endsAt | DateTime | Booking window |
| status | BookingStatus | PENDING / CONFIRMED / CANCELLED / COMPLETED / NO_SHOW. @default(CONFIRMED) |
| notes | String? | |
| reminder24hSentAt, reminder2hSentAt, reminder1hSentAt | DateTime? | Dedup flags for reminder cron |
| telegramChatId | String? | Customer's Telegram ID for notifications |
| manageToken | String? | @unique — tokenized self-service link (cancel/reschedule). null for admin-created bookings |

**Indexes:** `[tenantId]`, `[tenantId, resourceId, startsAt]`, `[tenantId, status]`, `[userId]`, `[startsAt, reminderXhSentAt]` (3 indexes)

#### Client
Materialized aggregate — built from booking history by `syncClients()`.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| tenantId | String | FK → Tenant (Cascade) |
| phone | String | Customer phone (identity key) |
| name | String | |
| email | String? | |
| totalVisits | Int | @default(0) |
| totalRevenue | Int | @default(0) |
| lastVisitAt | DateTime? | |
| hasTelegram | Boolean | @default(false) — flag only; chatId stored on Booking |

**Unique:** `[tenantId, phone]` — identity key

**Note:** No direct `Booking[]` relation on Client — Client is a computed aggregate. clientId not stored on Booking (avoiding breaking change).

#### Announcement
Platform-wide banner (no tenantId — global).

| Field | Notes |
|-------|-------|
| isActive | Only one active at a time (createAnnouncement deactivates all before insert) |
| `@@index([isActive])` | |

#### OtpCode
Email OTP for registration/login 2FA.

| Field | Notes |
|-------|-------|
| `@@unique([email, code])` | Dedup constraint |

#### SubscriptionPlan
Platform plan catalog (editable by super-admin).

| Field | Notes |
|-------|-------|
| plan | Plan @unique |
| maxResources, priceMonthly, priceYearly, pricePerResource | Pricing fields |
| features | String[] |

#### PlatformPayment
Tracks subscription purchase payments via Paylink.kz.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK; used as Paylink orderId |
| tenantId | String | FK → Tenant (Cascade) |
| amount | Int | KZT |
| planTarget | Plan | Which plan is being purchased |
| status | PaymentStatus | PENDING / PAID / FAILED / EXPIRED |
| paylinkOrderId | String? | External order ID from Paylink response |
| paylinkUrl | String? | Redirect URL for checkout |
| expiresAt | DateTime | 24-hour payment window |
| paidAt | DateTime? | |

**Indexes:** `[tenantId]`, `[status, expiresAt]`, `[tenantId, status]`

**Note (Phase 12):** `mockQrCode` and `kaspiApiKey` fields removed; `paylinkOrderId`/`paylinkUrl` added in their place. `paymentExpiresAt` also removed — PENDING bookings now block slots unconditionally.

### Enums

| Enum | Values |
|------|--------|
| Role | SUPERADMIN, OWNER, STAFF, CUSTOMER |
| BookingStatus | PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW |
| Plan | FREE, PRO, ENTERPRISE |
| PlanStatus | ACTIVE, PENDING, EXPIRED, BANNED, CANCELED |
| PaymentStatus | PENDING, PAID, FAILED, EXPIRED |

---

## 3. API Routes

All routes under `app/api/`. Routes without explicit Server Component auth use middleware or in-route guards.

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js handler (login, session, OAuth callbacks) |
| `/api/auth/register` | POST | New tenant/owner registration |
| `/api/auth/check-session` | GET | Validate active session / detect forced sign-out |
| `/api/bookings` | GET, POST | List/create bookings (public booking flow creates via POST) |
| `/api/bookings/busy` | GET | Return busy time ranges for a resource (calendar blocking) |
| `/api/bookings/calendar` | GET | Calendar view data for dashboard |
| `/api/bookings/slots` | GET | Available time slot generation for booking wizard |
| `/api/bookings/[id]/status` | PATCH | Update booking status (confirm/cancel/complete/no-show) |
| `/api/cron/reminders` | GET | Vercel Cron — send 24h/2h/1h reminders via email + Telegram |
| `/api/cron/subscriptions` | GET | Vercel Cron — subscription lifecycle (warn, expire, freeze) |
| `/api/force-signout` | GET | Invalidate active session (triggered when activeSessionId mismatch detected) |
| `/api/manage/[token]/cancel` | GET, POST | GET = validate token; POST = cancel booking (public, no auth) |
| `/api/manage/[token]/reschedule` | GET, POST | GET = validate token; POST = reschedule booking (Serializable tx with SELECT FOR UPDATE) |
| `/api/resources` | GET, POST | List/create resources (middleware-guarded: OWNER+) |
| `/api/support/send` | POST | Send support email via Resend |
| `/api/telegram/webhook` | POST | Telegram Bot webhook (inbound messages) |
| `/api/tenants` | GET, POST | List/create tenants (TODO stubs — middleware-guarded) |
| `/api/upload/logo` | POST | Logo image upload |
| `/api/webhooks/meta` | GET, POST | Meta (WhatsApp Business) webhook — GET for verification, POST for events (TODO handler) |
| `/api/webhooks/paylink` | POST | Paylink.kz payment webhook — verifies HMAC signature, updates PlatformPayment, activates subscription |
| `/api/webhooks/route` | POST | Generic webhook stub (TODO) |
| `/api/webhooks/telegram` | POST | Telegram Bot webhook (alternative endpoint) |

**Cron schedule** (vercel.json):
- `/api/cron/reminders` — every 30 minutes (`0,30 * * * *`)
- `/api/cron/subscriptions` — daily at 02:00 UTC (`0 2 * * *`)

---

## 4. Server Actions

All files in `lib/actions/` use `'use server'` directive. Auth guards (`requireAuth`, `requireRole`, `ensureSuperAdmin`) are applied consistently.

### account.ts
- `changePassword(data)` — change logged-in user's password (bcrypt)

### admin-plans.ts (SUPERADMIN only)
- `updateSubscriptionPlan(data)` — edit plan pricing and features in SubscriptionPlan table

### admin.ts (SUPERADMIN only)
- `updateTenantPlan(tenantId, plan, planStatus)` — manually change plan
- `updateTenantMaxResources(tenantId, maxResources)` — adjust resource limit
- `activateSubscription(tenantId, plan?)` — atomic: set ACTIVE + bulk unfreeze resources/services ($transaction)
- `banTenant(tenantId)` — set planStatus = BANNED
- `deleteTenant(tenantId)` — delete tenant + cascade
- `triggerSubscriptionCron()` — manually invoke cron (super-admin debug)

### analytics.ts (OWNER+)
- `getAnalytics(period)` — returns AnalyticsResult with bookings, revenue, client, resource stats

### announcements.ts (SUPERADMIN only)
- `createAnnouncement(title, body)` — deactivates all existing before creating new
- `deactivateAnnouncement(id)` / `activateAnnouncement(id)` / `deleteAnnouncement(id)`
- `getAnnouncements()`

### audit-log.ts
- `createAuditLog(tenantId, eventType, details)` — internal; called by other actions

### auth-session.ts
- `clearActiveSession()` — set activeSessionId = null (logout all devices)

### billing.ts (OWNER+, PRO gate)
- `requestProActivation()` — free-to-PRO request; sets PENDING status, notifies super-admin
- `initiateSubscriptionPayment(plan?)` — creates PlatformPayment + calls Paylink.kz → returns paymentUrl
- `requestEnterpriseInquiry(message)` — sends enterprise contact request
- `renewSubscription()` — renew sets PRO+PENDING (requires super-admin confirmation)

### bookings.ts (OWNER/STAFF)
- `createManualBooking(data)` — admin creates booking without engine limits; manageToken = null explicitly

### clients.ts (OWNER+)
- `syncClients()` — materializes Client aggregates from booking history
- `getClients(tenantId)` — fetch all clients for tenant
- `sendTelegramToClient(clientId, message)` — sends Telegram message using chatId from bookings

### notifications.ts
- `sendNotification(tenantId, message)` — create Notification record
- `getNotifications(tenantId)` / `markNotificationRead(id)` / `markAllNotificationsRead(tenantId)`

### otp.ts
- `verifyRegistrationOtp(email, code)` — OTP validation during registration
- `resendRegistrationOtp(email)` — resend OTP
- `checkLoginIp(email, password)` — check credentials before OTP step
- `verifyLoginOtp(email, code)` — final login OTP verification

### payment-settings.ts (OWNER, PRO+)
- `updatePaymentSettings()` — **stub** (no-op since Kaspi removal). Returns `{ success: true }` after auth check.

### resources.ts (OWNER+)
- `getResources()` / `createResource(data)` / `updateResource(data)` / `deleteResource(id)` / `toggleResourceActive(id, isActive)`

### services.ts (OWNER+)
- `getServices()` / `createService(data)` / `updateService(data)` / `deleteService(id)` / `toggleServiceActive(id, isActive)`

### staff.ts (OWNER+)
- `getStaffMembers()` / `inviteStaff(data)` / `removeStaff(userId)` / `updateStaffRole(userId, role)`

### tenant-settings.ts (OWNER+)
- `getTenantSettings()` / `updateTenantSettings(data)`

---

## 5. UI Components Inventory

### Root-level components/

| Component | Type | Purpose |
|-----------|------|---------|
| analytics-dashboard.tsx | Client | Recharts-based analytics (BarChart, AreaChart, PieChart) with period picker |
| announcement-banner.tsx | Client | Platform-wide announcement bar (useState + localStorage dedup for hydration) |
| banned-actions.tsx | Client | UI shown to banned tenants |
| billing-limit-alert.tsx | Client | Alert when resource limit reached |
| booking-calendar.tsx | Client | Calendar grid for the booking wizard |
| booking-form.tsx | Client | Multi-step booking wizard (select resource → service → slot → confirm) + WhatsApp prepayment button in SuccessScreen |
| booking-manage-page.tsx | Client | Public booking self-management page (cancel/reschedule) |
| bookings-dashboard.tsx | Client | CRM dashboard: day-grouped calendar, manual booking sheet, status filters |
| booking-status-badge.tsx | Client | Badge with color coding per BookingStatus |
| change-password-form.tsx | Client | Password change form |
| client-detail.tsx | Client | Single client detail: booking history table + Telegram outreach |
| clients-table.tsx | Client | Client list: search, sync, click → detail |
| dashboard-sidebar.tsx | Client | Navigation sidebar with tenant plan status |
| locale-switcher.tsx | Client | RU/KZ/EN language picker (sets `omnibook-locale` cookie) |
| manual-booking-sheet.tsx | Client | Admin manual booking creation (Sheet drawer) |
| notification-bell.tsx | Client | Bell icon + unread count + dropdown list |
| providers.tsx | Client | SessionProvider + ThemeProvider + I18nProvider |
| public-sections-tabs.tsx | Client | Tabs on tenant public page |
| public-theme-toggle.tsx | Client | Theme toggle for public booking page |
| resource-form.tsx | Client | Resource create/edit form (niche attribute fields) |
| resources-manager.tsx | Client | Resource CRUD list |
| service-form.tsx | Client | Service create/edit form |
| services-manager.tsx | Client | Service CRUD list |
| session-monitor.tsx | Client | Polls /api/auth/check-session; redirects on forced sign-out |
| settings-form.tsx | Client | Tenant settings form (profile, social links, Telegram config) |
| sign-out-button.tsx | Client | Sign-out button with confirmation |
| staff-manager.tsx | Client | Staff CRUD (invite, role change, remove) |
| tenant-public-page.tsx | Client | Full public booking page (hero, specialists, services, booking form) |
| theme-providers.tsx | Client | next-themes ThemeProvider wrapper |
| theme-toggle.tsx | Client | Dashboard theme toggle |

### components/ui/ (Shadcn primitives — Neumorphic-styled)
avatar, badge, button, card, dialog, dropdown-menu, form, input, label, phone-input, radio-group, select, separator, sheet, skeleton, sonner, table, tabs

### components/dashboard/
- `activity-timeline.tsx` — recent events list
- `analytics-overview.tsx` — summary stat cards for dashboard home
- `count-up.tsx` — animated number counter
- `dashboard-client.tsx` — client-side dashboard wrapper
- `support-buttons.tsx` — WhatsApp + Telegram support quick links

### components/landing/
- `DemoSection.tsx` — interactive demo section
- `FadeIn.tsx` — scroll-triggered fade animation
- `FeaturesGrid.tsx` — feature cards grid
- `Footer.tsx` — marketing footer with legal links
- `HeroSection.tsx` — landing hero with CTA
- `Navbar.tsx` — marketing nav
- `NicheCards.tsx` — niche showcase cards
- `PricingCards.tsx` — pricing table
- `StatsCounter.tsx` — platform stats
- `Testimonials.tsx` — testimonial section

### components/shared/
- `client-only.tsx` — renders children only on client (SSR gate)

### components/support/
- `SupportForm.tsx` — support contact form

---

## 6. App Router Pages

### Public / Marketing (no auth required)
| Route | Page | Notes |
|-------|------|-------|
| `/` | `app/(marketing)/page.tsx` | Landing page |
| `/about` | `app/(marketing)/about/page.tsx` | About/contacts (has `id="contacts"` for footer anchor) |
| `/docs` | `app/(marketing)/docs/page.tsx` | Documentation index (links to sub-pages not yet built) |
| `/oferta` | `app/(marketing)/oferta/page.tsx` | Public offer agreement |
| `/privacy` | `app/(marketing)/privacy/page.tsx` | Privacy policy |
| `/refund` | `app/(marketing)/refund/page.tsx` | Refund policy |
| `/support` | `app/(marketing)/support/page.tsx` | Public support form |
| `/book` | `app/book/page.tsx` | **STUB** — "TODO: booking wizard" placeholder |
| `/banned` | `app/banned/page.tsx` | Shown to banned accounts |

### Tenant Public Page (no auth)
| Route | Notes |
|-------|-------|
| `/{slug}` | `app/(tenant)/[slug]/page.tsx` → `TenantPublicPage` component |
| `/clinic` | `app/(tenant)/clinic/page.tsx` — hardcoded demo clinic (likely legacy) |

### Auth Pages (redirect to /dashboard if logged in)
| Route | Notes |
|-------|-------|
| `/login` | Email + password with OTP 2FA |
| `/register` | Registration with OTP email verification |
| `/verify-otp` | OTP code entry |

### Dashboard (requires auth: OWNER / STAFF / SUPERADMIN)
| Route | Notes |
|-------|-------|
| `/dashboard` | Overview: stats, activity, analytics summary |
| `/dashboard/bookings` | Bookings dashboard CRM (day view, manual booking) |
| `/dashboard/clients` | Client list with sync and search |
| `/dashboard/clients/[clientId]` | Client detail page |
| `/dashboard/resources` | Resource management |
| `/dashboard/services` | Service management |
| `/dashboard/staff` | Staff management |
| `/dashboard/analytics` | Full analytics dashboard (bar/area/pie charts) |
| `/dashboard/settings` | General tenant settings |
| `/dashboard/settings/billing` | Subscription plan, payment, upgrade |
| `/dashboard/support` | Support form (dashboard context) |

### Booking Self-Management (public, token-gated)
| Route | Notes |
|-------|-------|
| `/manage/[token]` | Cancel or reschedule own booking via emailed link. 4-hour cancel rule enforced server + API. |

### Super Admin (SUPERADMIN role only)
| Route | Notes |
|-------|-------|
| `/admin` | Admin dashboard home |
| `/admin/tenants` | Tenant list with plan management |
| `/admin/tenants/[tenantId]` | Individual tenant detail + activate/ban/delete |
| `/admin/analytics` | Platform-wide analytics (MRR, plan distribution) |
| `/admin/announcements` | Platform announcements management |
| `/admin/audit-logs` | Audit log viewer |
| `/admin/plans` | SubscriptionPlan pricing editor |

---

## 7. Feature Audit

| Feature | Status | Key Files |
|---------|--------|-----------|
| **Booking flow (public)** | Fully implemented | `components/booking-form.tsx`, `components/booking-calendar.tsx`, `app/api/bookings/slots/route.ts`, `lib/booking/engine.ts` |
| **Booking engine** | Fully implemented | `lib/booking/engine.ts` — slot generation, collision check (SELECT FOR UPDATE), BookingConflictError, DayOffError, BookingLimitError (max 2 active per phone) |
| **Bookings Dashboard (CRM)** | Fully implemented | `components/bookings-dashboard.tsx`, `components/manual-booking-sheet.tsx`, `lib/actions/bookings.ts` |
| **Client CRM** | Fully implemented | `components/clients-table.tsx`, `components/client-detail.tsx`, `lib/actions/clients.ts` — sync, search, Telegram outreach |
| **Tokenized booking management** | Fully implemented | `app/manage/[token]/page.tsx`, `components/booking-manage-page.tsx`, `app/api/manage/[token]/cancel/route.ts`, `app/api/manage/[token]/reschedule/route.ts` |
| **Paylink.kz subscription payment** | Fully implemented | `lib/payments/paylink.ts`, `lib/platform-payment.ts`, `app/api/webhooks/paylink/route.ts`, `lib/actions/billing.ts` |
| **WhatsApp prepayment button** | Fully implemented | `components/booking-form.tsx` — `buildWhatsAppPrepaymentUrl()` in SuccessScreen; `app/api/webhooks/meta/route.ts` (Meta webhook verification stub) |
| **Subscription lifecycle** | Fully implemented | `lib/subscription-lifecycle.ts`, `app/api/cron/subscriptions/route.ts`, vercel.json cron |
| **Freeze/unfreeze on expiry** | Fully implemented | `lib/subscription-lifecycle.ts` + `lib/actions/admin.ts::activateSubscription()` (bulk unfreeze in $transaction) |
| **Email reminders** | Fully implemented | `lib/email/reminders.ts`, `app/api/cron/reminders/route.ts` — 24h/2h/1h with dedup via `reminderXhSentAt` |
| **Telegram notifications** | Fully implemented | `lib/telegram.ts`, `app/api/telegram/webhook/route.ts` — booking confirmations, management links, reminders |
| **Analytics dashboard** | Fully implemented | `components/analytics-dashboard.tsx`, `lib/actions/analytics.ts` — per-period (7d/30d/90d) charts |
| **Super Admin / God Mode** | Fully implemented | `app/admin/` — tenant management, plan editor, announcements, audit logs, platform analytics |
| **i18n (RU/KZ/EN)** | Fully implemented | `lib/i18n/translations.ts`, `lib/i18n/server.ts`, `lib/i18n/context.tsx` — cookie-based locale, middleware propagation |
| **Neumorphic UI** | Fully implemented | CSS custom properties in global styles, `.neu-raised`/`.neu-inset` utility classes, all Shadcn components remapped |
| **Niche system** | Fully implemented | `lib/niche/config.ts` — medicine, beauty, horeca, sports; per-niche resource types and attribute fields |
| **Legal pages** | Fully implemented | `app/(marketing)/oferta/`, `privacy/`, `refund/`, `about/`, `support/` |
| **Support form** | Fully implemented | `components/support/SupportForm.tsx`, `app/api/support/send/route.ts` — Resend email |
| **Multi-tenant isolation** | Fully implemented | `lib/tenant/prisma-tenant.ts` — getTenantDB() auto-injects tenantId; middleware propagates `x-tenant-slug` header |
| **Rate limiting** | Partially implemented | `lib/rate-limit.ts` — in-memory sliding window. Works on single instance; ineffective on multi-instance serverless |
| **OTP 2FA** | Fully implemented | `lib/auth/otp.ts`, `lib/actions/otp.ts` — registration + login OTP via Resend email |
| **Session security** | Fully implemented | `activeSessionId` on User; `session-monitor.tsx` polls for invalidation; `force-signout` route |
| **Docs pages** | Stub | `app/(marketing)/docs/page.tsx` — index only; linked sub-pages (`/docs/getting-started`, `/docs/branch-setup`, `/docs/billing`) do not exist |
| **`/book` page** | Stub | `app/book/page.tsx` — just "TODO: booking wizard" comment; the actual booking entry is via `/{slug}` tenant pages |
| **`/api/tenants`** | Stub | GET and POST handlers are TODO comments only |
| **`/api/resources`** | Stub | GET and POST handlers are TODO comments only (actual resource management via Server Actions) |
| **`/api/webhooks/route.ts`** | Stub | Generic webhook stub, TODO only |
| **Meta / WhatsApp Business API** | Skeleton | `app/api/webhooks/meta/route.ts` — GET verification implemented; POST handler receives events but contains only TODO comment for event processing |

---

## 8. i18n Status

**Architecture:** Single-file translations at `lib/i18n/translations.ts` (2,343 lines). Locale stored in `omnibook-locale` cookie. Server utilities in `lib/i18n/server.ts` read locale from `x-omnibook-locale` header (set by middleware). Client-side: `lib/i18n/context.tsx` provides `useI18n()` hook.

### Locales Summary

| Locale | Key Count | Coverage |
|--------|-----------|----------|
| RU (Russian) | 659 | Full |
| KZ (Kazakh) | 660 | Full |
| EN (English) | 661 | Full |

Key counts are nearly identical across all three locales — no missing translation gaps detected.

### Namespaces (23 per locale)

| Namespace | Contents |
|-----------|----------|
| `common` | Global UI labels (save, cancel, delete, search, etc.) |
| `landing` | Landing page copy (hero, features, pricing, testimonials) |
| `auth` | Login, register, OTP, password fields |
| `booking` | Public booking flow (steps, confirmation, WhatsApp) |
| `dashboard` | Dashboard navigation and section titles |
| `status` | BookingStatus display labels |
| `actions` | Action button labels |
| `settings` | Tenant settings form |
| `form` | Form validation messages |
| `analytics` | Analytics dashboard labels |
| `public` | Tenant public page labels |
| `niche` | Niche-specific labels (resource types, attributes) |
| `subscription` | Plan names, limits, upgrade prompts |
| `days` | Day-of-week names |
| `clients` | CRM client list and outreach |
| `manage` | Tokenized booking management page |
| `payment` | Payment flow, WhatsApp prepayment |
| `billing` | Billing settings page |
| `legal` | Legal pages shared keys |
| `oferta` | Public offer agreement content |
| `privacy` | Privacy policy content |
| `refund` | Refund policy content |
| `about` | About/contacts page content |

### Potential Issues

1. **Kaspi references in translations:** The `payment`, `oferta`, `privacy`, and `refund` namespaces contain references to "Kaspi Pay" in all three locales (e.g., `waitingInstructions`, `payWithKaspi`, `section4Title: "Deposit Refunds via Kaspi Pay"`). These are now outdated since the payment processor switched to Paylink.kz. The UI does not appear to render these specific keys currently (Kaspi payment flow removed), but the legal/refund content may need updating.

2. **Docs page content:** All docs copy is hardcoded Russian text in the JSX (not in translations). The docs index page mentions "Kaspi Pay" in its billing section description — stale content post-Phase 12.

---

## 9. Code Health

### Ghost Code — Kaspi Remnants

Phase 12 removed the Kaspi deposit payment flow. Most removal is complete. Remaining references:

| File | Type | Description |
|------|------|-------------|
| `lib/payment-lifecycle.ts` | Intentional no-op | `cancelExpiredPendingBookings()` returns `{ cancelled: 0 }` — kept for API compatibility but effectively dead code. No cron calls this (vercel.json has no `/payment-lifecycle` endpoint). |
| `lib/actions/payment-settings.ts` | Intentional stub | `updatePaymentSettings()` is a no-op returning success — Kaspi settings form removed, Paylink settings not yet surfaced in UI |
| `lib/actions/bookings.ts:13` | Comment | `// TODO(12-02): cancelExpiredBooking removed — Kaspi deposit flow removed in Phase 12` |
| `lib/i18n/translations.ts` | Stale content | `payWithKaspi`, `waitingInstructions` (Kaspi instructions), legal page sections mentioning Kaspi Pay — translations exist but are unused in current UI flows |
| `app/dashboard/layout.tsx:79` | Stale comment | `{/* TODO: Replace with your actual payment link, e.g., Kaspi Pay */}` — the link now correctly goes to `/dashboard/settings/billing`, the comment is misleading |
| `app/(marketing)/docs/page.tsx` | Stale content | Docs billing section mentions "Kaspi Pay" and "Basic" plan (which doesn't exist — plans are FREE/PRO/ENTERPRISE) |

### TODO / FIXME / HACK Survey

| File | Line | Type | Description |
|------|------|------|-------------|
| `app/api/webhooks/meta/route.ts` | 27 | TODO | "handle specific event types" — Meta webhook event processing not implemented |
| `app/api/webhooks/route.ts` | 4 | TODO | "verify signature, route to handler" — generic webhook stub |
| `app/api/tenants/route.ts` | 4, 9 | TODO | GET (list tenants) and POST (create tenant) both stub — registration goes through `/api/auth/register` |
| `app/api/resources/route.ts` | 4, 9 | TODO | GET/POST handlers are stubs — actual management via Server Actions |
| `app/dashboard/layout.tsx` | 79 | TODO | Stale Kaspi Pay comment (see above) |
| `app/book/page.tsx` | 5 | TODO | `/book` page placeholder ("booking wizard") |

### ESLint Suppressions

| File | Suppressed Rule | Reason |
|------|----------------|--------|
| `components/tenant-public-page.tsx` (×2) | `@next/next/no-img-element` | Using `<img>` intentionally for external avatar/cover images |
| `components/settings-form.tsx` | `@next/next/no-img-element` | Logo preview uses `<img>` |
| `lib/payments/paylink.ts` | `@typescript-eslint/no-require-imports` | Dynamic require in HMAC verification |
| `lib/tenant/guard.ts` (×2) | `@typescript-eslint/no-explicit-any` | Next.js params type before Promise generic support |

### Stub Tracking

| Stub | File | Impact |
|------|------|--------|
| `updatePaymentSettings()` returns success without doing anything | `lib/actions/payment-settings.ts` | Low — no UI exposes Paylink settings yet; future plan will add Paylink configuration form |
| `cancelExpiredPendingBookings()` returns `{ cancelled: 0 }` | `lib/payment-lifecycle.ts` | Low — function not called by any cron; retained for API shape compatibility |
| `/book` page | `app/book/page.tsx` | Low — actual booking is via `/{slug}` tenant pages |
| `/api/tenants` GET/POST | `app/api/tenants/route.ts` | Low — tenant creation via `/api/auth/register`, management via Server Actions |
| `/api/resources` GET/POST | `app/api/resources/route.ts` | Low — resource management via Server Actions |
| Meta webhook event processing | `app/api/webhooks/meta/route.ts` | Low — WhatsApp Business API not used for inbound messages yet |

### Rate Limiting

`lib/rate-limit.ts` implements an in-memory sliding-window limiter. **Caveat:** Each serverless function instance maintains independent state. Effective rate limit is `max × instance count`. Appropriate for abuse prevention in current scale; would need Redis upgrade for strict enforcement at scale.

---

## 10. ESLint / Build Health

**Command run:** `npx next lint --quiet`  
**Result:** `No ESLint warnings or errors`

**Note:** `next lint` itself is deprecated in Next.js 16 (currently on 15.5.12). Migration to `npx eslint` CLI recommended before upgrading to Next.js 16.

**TypeScript:** Strict mode enabled. `noEmit: true`. No build errors observed during audit (full `next build` not run to avoid disrupting environment).

---

## 11. Security & Environment Variables

### Environment Variables Inventory

| Variable | Where Used | Required | Notes |
|----------|-----------|---------|-------|
| `DATABASE_URL` | `prisma/schema.prisma` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `middleware.ts`, `lib/auth/config.ts` | Yes | JWT signing secret — must be cryptographically random |
| `NEXTAUTH_URL` | NextAuth internals | Yes | Full app URL for auth callbacks |
| `NODE_ENV` | `lib/db/index.ts` | Auto | development/production |
| `NEXT_PUBLIC_APP_URL` | `lib/platform-payment.ts`, `app/api/webhooks/paylink/route.ts` | Yes | Full app URL for payment callbacks and webhooks |
| `PAYLINK_API_KEY` | `lib/payments/paylink.ts`, `lib/platform-payment.ts` | Yes (PRO features) | Paylink.kz merchant API key; dev fallback to mock URL when absent |
| `PAYLINK_API_URL` | `lib/payments/paylink.ts`, `lib/platform-payment.ts` | No | Defaults to `https://api.paylink.kz` |
| `PAYLINK_WEBHOOK_SECRET` | `app/api/webhooks/paylink/route.ts` | Yes (PRO features) | HMAC secret for webhook signature verification |
| `TELEGRAM_BOT_TOKEN` | `lib/telegram.ts` | Yes | BotFather token |
| `ADMIN_TELEGRAM_CHAT_ID` | `lib/telegram.ts` | Yes | Super-admin chat ID for admin alerts |
| `TELEGRAM_WEBHOOK_SECRET` | `app/api/telegram/webhook/route.ts` | Yes | Webhook signature verification |
| `RESEND_API_KEY` | `lib/email/resend.ts` | Yes | Transactional email |
| `CRON_SECRET` | `app/api/cron/reminders/route.ts`, `app/api/cron/subscriptions/route.ts` | Yes | Bearer token for Vercel Cron authorization |
| `META_WEBHOOK_VERIFY_TOKEN` | `app/api/webhooks/meta/route.ts` | No | Meta webhook verification (feature stub) |
| `GOOGLE_CLIENT_ID` | `lib/auth/config.ts` | No | Google OAuth (optional, feature-flagged) |
| `GOOGLE_CLIENT_SECRET` | `lib/auth/config.ts` | No | Google OAuth (optional, feature-flagged) |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | `lib/auth/config.ts` | No | Feature flag for Google OAuth provider |
| `ROOT_DOMAIN` | `middleware.ts` | No | Defaults to `omnibook.com` — used for subdomain extraction |

**Not in .env.example but used in code:**
- `NEXTAUTH_SECRET` — not in example (standard NextAuth var)
- `NEXTAUTH_URL` — in example as `NEXTAUTH_URL=http://localhost:3000`
- `CRON_SECRET` — not in .env.example; required for production cron
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `NEXT_PUBLIC_GOOGLE_ENABLED` — not in .env.example
- `META_WEBHOOK_VERIFY_TOKEN` — not in .env.example

### Hardcoded Secrets Scan
**Result:** No hardcoded API keys, passwords, or secrets found in source files.

### Auth Guards Coverage

The following Server Action files use `requireAuth()` and/or `requireRole()`:

- `admin-plans.ts` — ensureSuperAdmin
- `admin.ts` — ensureSuperAdmin
- `announcements.ts` — ensureSuperAdmin
- `billing.ts` — requireAuth + requireRole(['OWNER'])
- `bookings.ts` — requireAuth + requireRole(['OWNER', 'STAFF'])
- `clients.ts` — requireAuth + requireRole(['OWNER'])
- `notifications.ts` — requireAuth (tenant-scoped)
- `payment-settings.ts` — requireAuth + requireRole(['OWNER'])
- `resources.ts` — requireAuth + requireRole(['OWNER'])
- `services.ts` — requireAuth + requireRole(['OWNER'])

**Unguarded Server Actions (intentional):**
- `otp.ts` — pre-auth (used during login/register flow)
- `audit-log.ts` — internal helper; no direct user exposure

**Middleware Route Protection:**
- `/dashboard*` → requires auth token + DASHBOARD_ROLES
- `/admin*` → requires SUPERADMIN role
- `/api/resources*`, `/api/tenants*` → requires OWNER_ROLES (though these are stub routes)

### Security Notes

1. **CRON_SECRET not in .env.example** — developers may miss this. Add it.
2. **In-memory rate limiter** — acceptable for MVP scale; Redis required for strict enforcement at scale.
3. **No CSRF on Server Actions** — Next.js App Router Server Actions have built-in CSRF protection (Origin header check). Not a gap.
4. **Paylink webhook HMAC verification** — implemented in `lib/payments/paylink.ts::verifyPaylinkWebhook()`. Dynamic `require()` used for crypto (eslint suppressed).
5. **Telegram webhook secret** — verified in `app/api/telegram/webhook/route.ts`.
6. **Session invalidation** — `activeSessionId` on User + polling `session-monitor.tsx` allows forced sign-out across devices.

---

## 12. Summary & Recommendations

### What the App Does

Omni-book is a multi-tenant SaaS online booking platform targeting Kazakhstan businesses (primary market). Tenants are businesses (clinics, salons, restaurants, sports clubs) that register with their own subdomain (`{slug}.omnibook.com`). Their customers book via a public page, receive email/Telegram confirmations, and can self-manage (cancel/reschedule) via a tokenized link. Tenants manage everything via a dashboard. The platform uses a FREE/PRO/ENTERPRISE subscription model with payments via Paylink.kz.

### Current Milestone State

**Phase 12 (Payments Pivot) is complete.** Kaspi Pay has been removed; Paylink.kz is the active payment processor for subscription upgrades. WhatsApp prepayment button added for deposit collection outside the platform.

### Technical Debt — Prioritized

| Priority | Item | Effort |
|----------|------|--------|
| High | Update legal page translations to replace "Kaspi Pay" with "Paylink.kz" in `oferta`, `privacy`, `refund` namespaces (all 3 locales) | Low |
| High | Add `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_ENABLED`, `META_WEBHOOK_VERIFY_TOKEN` to `.env.example` | Trivial |
| Medium | Update `docs/page.tsx` to remove Kaspi Pay references and correct plan names (Basic plan mentioned does not exist) | Low |
| Medium | Remove stale comment from `app/dashboard/layout.tsx:79` | Trivial |
| Medium | Decide fate of `lib/payment-lifecycle.ts` — either delete or add a cron endpoint if there is a use case | Low |
| Medium | Build `/docs/getting-started`, `/docs/branch-setup`, `/docs/billing` sub-pages (currently linked but 404) | High |
| Low | Replace in-memory rate limiter with Redis-backed solution before horizontal scale | High |
| Low | Either implement or remove `/api/tenants` and `/api/resources` stub routes (confusion risk) | Low |
| Low | Implement Meta webhook event processing if WhatsApp Business inbound messaging is needed | High |

### Architecture Strengths

- Clean multi-tenant isolation via `getTenantDB()` with auto-injected tenantId
- Consistent Server Action auth guard pattern (`requireAuth` → `requireRole` → feature logic)
- TDD surface tests covering all major features before implementation
- Timezone-correct booking engine (date-fns-tz, Asia/Almaty default)
- Atomic concurrency handling in reschedule (Serializable transaction + SELECT FOR UPDATE)
- No hardcoded secrets in source

### Architecture Considerations

- No migration history (prisma db push) — schema changes are applied directly; rollback requires manual SQL
- Single translations file (2343 lines) will become a maintenance burden beyond ~30 namespaces
- `Client` as a materialized aggregate (no FK from Booking to Client) means sync is required; real-time accuracy depends on sync frequency
- In-memory rate limiting is non-functional in serverless multi-instance deployments

---

*Generated: 2026-04-06 | Milestone: v1.5 — Payments Pivot (Phase 12 complete) | Audited by: automated technical audit (260406-vjz)*
