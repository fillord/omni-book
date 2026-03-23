# Phase 2: Super-Admin "God Mode" & Platform Management - Research

**Researched:** 2026-03-23
**Domain:** Next.js 15 / Prisma / NextAuth — super-admin panel, analytics, notifications, audit logging
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Module 1 — Financial & Platform Analytics Dashboard (GOD-01)**
- Add a high-level metrics view to the super-admin panel
- Display MRR — calculated from tenant plan data
- Show breakdown of tenant counts per plan tier: Free, Pro, Enterprise
- Display as stat cards (neu-raised) + a simple bar or summary table
- Placement: top section of `/admin` or a dedicated `/admin/analytics` route

**Module 2 — Tenant Drill-Down / Deep View (GOD-02)**
- Each tenant row in the existing `/admin/tenants` table must be clickable
- Route: `/admin/tenants/[tenantId]` — read-only mode
- Must show: Services (name, duration, price), Resources (name, type), Staff/Masters (name, role)
- Data fetched server-side via existing Supabase/Prisma queries
- Layout: tabbed interface (Services | Resources | Staff) or stacked sections

**Module 3 — Global Announcement Banners (GOD-03)**
- Super-admin creates banner (title + body) via form in `/admin`
- Banner stored in new `announcements` table
- Active banners appear at top of ALL tenant dashboards
- Dismissible per-session via localStorage; re-appears on new session
- Only one active banner at a time (show latest active)
- Super-admin can deactivate/delete banners

**Module 4 — Targeted In-App Notifications (GOD-04)**
- Bell icon added to tenant dashboard navbar (DashboardSidebar component)
- Super-admin sends notification from `/admin/tenants/[tenantId]`
- New `notifications` table: (tenant_id, message, read, created_at)
- Tenant sees unread count badge on Bell icon
- Clicking Bell opens dropdown/sheet with read/unread state
- Marking as read updates `read` column

**Module 5 — Audit & Activity Logs (GOD-05)**
- New `audit_logs` table: (tenant_id, event_type, details, created_at)
- Records: user login, plan upgrade, plan downgrade, deletion of critical data (services, resources, staff)
- Super-admin views logs at `/admin/audit-logs` — filterable by tenant, event type, date range
- Read-only view

**Neumorphism Design Adherence (GOD-06)**
- All new pages, cards, tables, modals, forms MUST use var(--neu-bg), .neu-raised, .neu-inset
- No hard borders — depth via shadow only
- Charts/stats: wrap chart containers in `.neu-raised` div

### Claude's Discretion
- Exact database schema column names and types (use Supabase/Postgres conventions)
- Chart library choice for analytics (Recharts is already used — confirmed by research)
- Pagination strategy for audit logs (cursor-based or offset, whichever matches existing patterns)
- Whether to use modal or full page for tenant drill-down (full page preferred, modal acceptable)
- RLS policies for new tables — super-admin read/write, tenants read-only on their own records

### Deferred Ideas (OUT OF SCOPE)
- Email notifications beyond in-app Bell
- Tenant suspension / force-logout from super-admin
- Bulk announcement targeting (send to only Pro tenants)
- Exportable audit log CSV download
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GOD-01 | Financial & Platform Analytics Dashboard — MRR display and breakdown of active tenants per plan tier (Free / Pro / Enterprise) | `Tenant.plan` enum exists (FREE/PRO/ENTERPRISE). Fixed MRR values: Free=$0, Pro=$29, Enterprise=$99. Pattern: extend existing `/admin` page or add `/admin/analytics`. Recharts BarChart already used in analytics-dashboard.tsx. |
| GOD-02 | Tenant Drill-Down (Deep View) — clickable tenant row opens read-only view of Services, Resources, Staff | Route `/admin/tenants/[tenantId]` (new dynamic segment). `basePrisma.service/resource/user.findMany({where:{tenantId}})` pattern confirmed in existing actions. Tabs component exists in `components/ui/tabs.tsx`. |
| GOD-03 | Global Announcement Banners — super-admin creates banners that appear at the top of ALL tenant dashboards | New `announcements` Prisma model needed. Banner rendered in `app/dashboard/layout.tsx` (server component — already fetches tenant data). localStorage dismiss pattern is client-side — requires a client wrapper component. |
| GOD-04 | Targeted In-App Notifications — Bell icon notification system | New `notifications` Prisma model needed. Bell injected into `DashboardSidebar` (client component). Unread count requires server-side data prop passed from dashboard layout. DropdownMenu component exists. |
| GOD-05 | Audit & Activity Logs — records tenant logins, plan changes, data deletions | New `audit_logs` Prisma model needed. Log writes hooking into: auth config `authorize()` (login), `updateTenantPlan()` action (upgrade/downgrade), `deleteService/Resource/Staff` actions. View at `/admin/audit-logs`. |
| GOD-06 | Neumorphism Design Adherence — all new UI uses var(--neu-bg), .neu-raised, .neu-inset | Fully documented — class definitions in globals.css confirmed. Pattern: explicit `bg-[var(--neu-bg)]` required alongside .neu-raised/.neu-inset. No `border-border` on new components. |
</phase_requirements>

---

## Summary

The project uses Next.js 15 (App Router), Prisma with PostgreSQL, NextAuth v4 (JWT strategy), and Recharts for charts. The super-admin panel already exists at `app/admin/` with a sidebar layout, tenant list, and basic overview page. The auth system has a clean `Role.SUPERADMIN` enum with `ensureSuperAdmin()` guard pattern used in `lib/actions/admin.ts`. The Neumorphism system is fully implemented in `app/globals.css` with `.neu-raised`, `.neu-inset`, and `.neu-btn` utility classes.

Three new Prisma models must be created: `Announcement`, `Notification`, and `AuditLog`. The dashboard layout (`app/dashboard/layout.tsx`) is the correct injection point for the announcement banner and Bell icon unread count — it already runs server-side and fetches tenant data. The existing `DashboardSidebar` is a client component that receives props from the layout server component, so the Bell icon and unread count can be added as a new prop.

The audit log hook points are: the `authorize()` callback in `lib/auth/config.ts` (login events), the `updateTenantPlan()` action (upgrade/downgrade detection by comparing old vs new plan), and the three delete actions in `resources.ts`, `services.ts`, `staff.ts`. MRR calculation uses fixed tier prices (Free=$0, Pro=$29, Enterprise=$99) multiplied by active tenant counts per plan.

**Primary recommendation:** Build sequentially — database migrations first (Wave 0), then GOD-01/GOD-02 (admin-only surfaces), then GOD-03/GOD-04 (tenant-visible surfaces requiring schema + layout changes), then GOD-05 (audit hooks across multiple existing actions).

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.5.12 | App Router, Server Components, Server Actions | Project foundation |
| @prisma/client | (project version) | Database ORM — new model migrations | Already used everywhere |
| next-auth | ^4.24.11 | JWT session, role enforcement | Already used for SUPERADMIN guard |
| recharts | ^3.8.0 | BarChart, PieChart for analytics | Already used in analytics-dashboard.tsx |
| lucide-react | ^0.577.0 | Bell, Filter icons | Already used — Bell icon available |
| @radix-ui/react-tabs | ^1.1.13 | Tabs for drill-down (Services/Resources/Staff) | Already installed, shadcn tabs.tsx exists |
| @radix-ui/react-dropdown-menu | (via shadcn) | Bell notification dropdown | dropdown-menu.tsx exists in components/ui/ |

### No New Dependencies Required

All required UI primitives (Tabs, DropdownMenu, Sheet, Badge, Card, Dialog) exist in `components/ui/`. No additional npm packages are needed for this phase.

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
app/
├── admin/
│   ├── analytics/
│   │   └── page.tsx              # GOD-01: MRR + plan breakdown (new route)
│   ├── tenants/
│   │   └── [tenantId]/
│   │       └── page.tsx          # GOD-02: Tenant drill-down (new dynamic route)
│   └── audit-logs/
│       └── page.tsx              # GOD-05: Audit log viewer (new route)
└── dashboard/
    └── layout.tsx                # GOD-03/GOD-04: inject banner + unread count

components/
├── announcement-banner.tsx       # GOD-03: client wrapper (localStorage dismiss)
└── notification-bell.tsx         # GOD-04: Bell icon + dropdown

lib/
└── actions/
    ├── announcements.ts          # GOD-03: createAnnouncement, deactivateAnnouncement
    ├── notifications.ts          # GOD-04: sendNotification, markNotificationRead, getUnreadCount
    └── audit-log.ts              # GOD-05: createAuditLog helper

prisma/
└── schema.prisma                 # Add Announcement, Notification, AuditLog models
```

### Pattern 1: Server Action with Super-Admin Guard (existing pattern)

**What:** All admin mutations use `ensureSuperAdmin()` at the top, throwing on unauthorized access.

**When to use:** Every server action callable from admin panel pages.

```typescript
// Source: lib/actions/admin.ts (existing)
async function ensureSuperAdmin() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email) throw new Error('Unauthorized')
  if (session.user.role !== 'SUPERADMIN' && session.user.email !== 'admin@omnibook.com') {
    throw new Error('Forbidden: Superadmin only')
  }
}

export async function createAnnouncement(title: string, body: string) {
  try {
    await ensureSuperAdmin()
    await basePrisma.announcement.create({ data: { title, body, isActive: true } })
    revalidatePath('/admin')
    revalidatePath('/dashboard')  // Tenant dashboards must re-fetch
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}
```

### Pattern 2: Admin Layout Nav Link Addition

**What:** New admin routes need nav links added to `app/admin/layout.tsx` sidebar.

**When to use:** GOD-01 (`/admin/analytics`), GOD-05 (`/admin/audit-logs`).

The existing layout uses `<Link href="/admin/..." className="flex items-center gap-3 px-3 py-2.5 rounded-lg ...">` pattern. New links follow identical structure.

### Pattern 3: Server-Side Data Injection into DashboardSidebar

**What:** `app/dashboard/layout.tsx` is a server component that passes props to `DashboardSidebar` (client component). New props for Bell unread count and announcement are fetched at the layout level.

**When to use:** GOD-03 (announcement banner), GOD-04 (Bell unread count).

```typescript
// app/dashboard/layout.tsx — extend existing data fetches
const [tenant, announcement, unreadCount] = await Promise.all([
  basePrisma.tenant.findUnique({ where: { id: session.user.tenantId } }),
  basePrisma.announcement.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
  basePrisma.notification.count({ where: { tenantId: session.user.tenantId, read: false } }),
])
// Pass to layout components
```

### Pattern 4: Audit Log Hook in Existing Actions

**What:** Audit events are written as a side-effect inside existing server actions. Uses a shared `createAuditLog()` helper that is fire-and-forget (no throw on failure).

**When to use:** GOD-05 — delete actions (resources, services, staff) and plan change detection.

```typescript
// lib/actions/audit-log.ts
export async function createAuditLog(
  tenantId: string,
  eventType: 'login' | 'plan_upgrade' | 'plan_downgrade' | 'service_deleted' | 'resource_deleted' | 'staff_deleted',
  details: Record<string, unknown>
) {
  await basePrisma.auditLog.create({
    data: { tenantId, eventType, details: details as Prisma.InputJsonValue, createdAt: new Date() }
  }).catch(() => {}) // Fire-and-forget — never block the main action
}
```

### Pattern 5: Client-Side Dismissible Banner

**What:** Announcement banner checks localStorage before rendering; sets localStorage flag on dismiss.

**When to use:** GOD-03 — the banner must re-appear on new sessions (tab close) but not on navigation.

```typescript
// components/announcement-banner.tsx
'use client'
const STORAGE_KEY = `announcement_dismissed_${announcementId}`

// On mount: if localStorage.getItem(STORAGE_KEY) === 'true', return null
// On dismiss button: localStorage.setItem(STORAGE_KEY, 'true'), hide banner
```

**Critical:** The banner component receives the announcement data as a prop (from server layout), it does NOT fetch — no client-side data fetching needed.

### Pattern 6: MRR Calculation

**What:** Fixed price per plan tier multiplied by active tenant count, grouped by plan.

```typescript
// Prices in USD: FREE=0, PRO=29, ENTERPRISE=99
const PLAN_MRR: Record<Plan, number> = { FREE: 0, PRO: 29, ENTERPRISE: 99 }

const planCounts = await basePrisma.tenant.groupBy({
  by: ['plan'],
  where: { planStatus: 'ACTIVE' },
  _count: { _all: true }
})
const mrr = planCounts.reduce((sum, row) => sum + PLAN_MRR[row.plan] * row._count._all, 0)
```

### Anti-Patterns to Avoid

- **Fetching notifications/announcements in client components:** Always pass as props from server layout — avoids waterfall and keeps data fresh on server render.
- **Using `border-border` on new components:** Neumorphism uses `--border: transparent`. All containers use box-shadow for depth only.
- **Writing `bg-card` instead of `bg-[var(--neu-bg)]`:** `bg-card` resolves correctly but shadcn token remapping is one layer of indirection — the explicit `bg-[var(--neu-bg)]` is required for shadow depth to render correctly (confirmed in STATE.md pitfall log).
- **Throwing inside `createAuditLog`:** Audit logging must never crash the primary action. Always use `.catch(() => {})`.
- **Adding Bell/banner data to `DashboardSidebar`'s own data fetches:** All data must come from layout props, not from inside the sidebar component itself (it's a client component with no async).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tabbed drill-down UI | Custom tab system | `components/ui/tabs.tsx` (@radix-ui/react-tabs) | Already installed and neumorphism-styled |
| Notification dropdown | Custom popup | `components/ui/dropdown-menu.tsx` | Already styled, keyboard accessible |
| Bar charts for plan breakdown | Custom SVG | Recharts `<BarChart>` (already used in analytics-dashboard.tsx) | Existing pattern, correct import paths known |
| Plan-tier color mapping | Custom logic | Follow `NICHE_COLOR` pattern in analytics-dashboard.tsx | Static string maps required by Tailwind |
| Role enforcement | Session checks inline | `ensureSuperAdmin()` in lib/actions/admin.ts | Existing guard — consistent, tested |
| Toast notifications on mutations | Custom toast | `sonner` (`components/ui/sonner.tsx`) | Already used in dashboard |

**Key insight:** Every UI primitive and auth pattern already exists. Phase 2 is almost entirely data modeling + wiring existing components, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: revalidatePath Scope on Banner/Notification Changes

**What goes wrong:** Creating/deactivating an announcement only calls `revalidatePath('/admin')`, leaving tenant dashboards showing stale data.

**Why it happens:** Next.js cache is path-scoped. The announcement is rendered in `/dashboard` (tenant routes) but the action runs in the admin context.

**How to avoid:** Always call `revalidatePath('/dashboard', 'layout')` (or `revalidatePath('/')` if using the layout segment) when mutating `announcements` or `notifications`.

**Warning signs:** Banner disappears from admin but still shows on tenant dashboard.

### Pitfall 2: Missing `bg-[var(--neu-bg)]` Alongside `.neu-raised`

**What goes wrong:** Shadow renders as flat/invisible because the element background doesn't match `--neu-bg`.

**Why it happens:** `.neu-raised` sets `background-color: var(--neu-bg)` in the CSS class, but if another utility overrides it (e.g., `bg-white`, `bg-card` via shadcn), the shadow depth effect breaks.

**How to avoid:** Always pair `.neu-raised` with `bg-[var(--neu-bg)]` explicitly. The explicit Tailwind class takes precedence over the CSS class in case of ordering conflicts.

**Warning signs:** Shadows look "floating" or inconsistent between light/dark themes.

### Pitfall 3: Audit Log Breaking Primary Actions

**What goes wrong:** `createAuditLog()` fails silently OR throws and crashes the delete/login action.

**Why it happens:** DB write error in audit table propagates to the calling action.

**How to avoid:** Wrap `createAuditLog` call in `.catch(() => {})` or `try/catch` with no rethrow. The audit is observational — it must never be on the critical path.

### Pitfall 4: Notification Unread Count Staleness

**What goes wrong:** Tenant marks notification as read, but Bell badge count does not update without full page reload.

**Why it happens:** The unread count is fetched in the server-side layout at request time. Client-side marking via server action calls `revalidatePath('/dashboard')` but the badge count is in the sidebar which is not directly revalidated.

**How to avoid:** After marking notifications as read, call `router.refresh()` on the client side (Next.js 15 App Router pattern) to re-trigger the server layout fetch. Alternatively, manage unread count in local state and decrement on read.

### Pitfall 5: Admin Layout Nav Items Are Hardcoded Strings (not translated)

**What goes wrong:** New admin nav links for Analytics and Audit Logs use untranslated Russian strings inline, inconsistent with intent.

**Why it happens:** The existing admin layout (`app/admin/layout.tsx`) uses inline Russian strings directly (e.g., `Компании`, `Обзор`) — it does NOT use the `useI18n` translation system.

**How to avoid:** Continue the existing pattern — admin panel uses inline Russian strings. Do NOT attempt to wire `useI18n` into the admin layout (it's a server component, and the i18n system uses client-side React context).

### Pitfall 6: Announcement Banner Causes Hydration Mismatch

**What goes wrong:** Banner appears on server render but localStorage check on client causes flash or hydration error.

**Why it happens:** Server renders the banner (no localStorage on server); client checks localStorage and hides it, causing a mismatch.

**How to avoid:** The banner component must be `'use client'` and use `useEffect` + `useState` with an initial hidden state. Pattern: `const [shown, setShown] = useState(false)` — show only after mount if not dismissed.

### Pitfall 7: Drill-Down Page Needs Separate Super-Admin Guard

**What goes wrong:** `/admin/tenants/[tenantId]` page relies on the layout guard but a direct URL access bypasses tenant data ownership check.

**Why it happens:** The admin layout guard in `app/admin/layout.tsx` already checks `SUPERADMIN` role before rendering children, so the page itself is protected. However, the Prisma query must use `basePrisma` (not `getTenantDB`) and explicitly query by the tenantId param — no additional guard needed since the layout already enforces role.

**How to avoid:** Use `basePrisma.service.findMany({ where: { tenantId: params.tenantId } })` directly. No need for `requireAuth` inside the page — the layout handles it.

---

## Code Examples

Verified patterns from existing codebase:

### Recharts BarChart (from components/analytics-dashboard.tsx)
```typescript
// Source: components/analytics-dashboard.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={220}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip />
    <Bar dataKey="count" fill={NICHE_COLOR['blue']} radius={[4,4,0,0]} />
  </BarChart>
</ResponsiveContainer>
```

### Existing Admin KPI Card Pattern (from app/admin/page.tsx)
```typescript
// Source: app/admin/page.tsx
<Card className="neu-raised bg-[var(--neu-bg)]">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Metric Label
    </CardTitle>
    <div className="h-9 w-9 rounded-full neu-raised bg-[var(--neu-bg)] text-neu-accent flex items-center justify-center">
      <Icon className="h-4 w-4" />
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold text-card-foreground">{value}</p>
  </CardContent>
</Card>
```

### Admin Table Pattern (from app/admin/tenants/page.tsx)
```typescript
// Source: app/admin/tenants/page.tsx
<div className="neu-raised bg-[var(--neu-bg)] rounded-xl overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[800px]">
      <thead>
        <tr className="neu-inset bg-[var(--neu-bg)]">
          <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Column</th>
        </tr>
      </thead>
      <tbody>
        {/* rows */}
      </tbody>
    </table>
  </div>
</div>
```

### Prisma groupBy for Plan Counts (pattern from analytics.ts)
```typescript
// Source: lib/actions/analytics.ts (adapted)
const planCounts = await basePrisma.tenant.groupBy({
  by: ['plan'],
  where: { planStatus: 'ACTIVE' },
  _count: { _all: true },
})
```

### Admin Action Pattern (from lib/actions/admin.ts)
```typescript
// Source: lib/actions/admin.ts
export async function createAnnouncement(title: string, body: string) {
  try {
    await ensureSuperAdmin()
    await basePrisma.announcement.create({
      data: { title, body, isActive: true }
    })
    revalidatePath('/admin')
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error' }
  }
}
```

---

## Database Schema (New Models)

All three models need a Prisma migration. Exact schema for planner reference:

### Announcement
```prisma
model Announcement {
  id        String   @id @default(cuid())
  title     String
  body      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive])
}
```

### Notification
```prisma
model Notification {
  id        String   @id @default(cuid())
  tenantId  String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([tenantId, read])
}
```

### AuditLog
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  eventType String   // 'login' | 'plan_upgrade' | 'plan_downgrade' | 'service_deleted' | 'resource_deleted' | 'staff_deleted'
  details   Json     @default("{}")
  createdAt DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([eventType])
  @@index([createdAt])
}
```

**Tenant model additions** (relations):
```prisma
// Add to existing Tenant model:
notifications  Notification[]
auditLogs      AuditLog[]
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Supabase client (referenced in task description) | Prisma ORM (`basePrisma` from `lib/db`) | All DB queries use Prisma — no raw Supabase SDK calls in this project |
| Custom role middleware | `requireRole()` / `ensureSuperAdmin()` guards in server actions | Centralized, tested pattern |
| Client-side data fetching | Server Components + Server Actions with `revalidatePath` | All admin pages are async Server Components — no SWR/tanstack-query needed |

**Note:** The task description mentions "Supabase" but the project uses Prisma with PostgreSQL directly. There is no `@supabase/supabase-js` in `package.json`. All DB access goes through `basePrisma` from `lib/db.ts`.

---

## Existing Infrastructure Inventory

### What Already Exists (do not duplicate)

| Item | Location | Notes |
|------|----------|-------|
| SUPERADMIN auth guard | `lib/actions/admin.ts` → `ensureSuperAdmin()` | Copy pattern to new actions |
| Admin layout + sidebar | `app/admin/layout.tsx` | Add new nav links for `/admin/analytics` and `/admin/audit-logs` |
| Admin overview with KPI cards | `app/admin/page.tsx` | GOD-01 may extend this page or use new `/admin/analytics` route |
| Tenants table page | `app/admin/tenants/page.tsx` | Add click-to-navigate to `/admin/tenants/[tenantId]` |
| Tenant row component | `app/admin/tenants/admin-tenant-row.tsx` | Add notification send form + drill-down link |
| Recharts (BarChart, PieChart, AreaChart) | `components/analytics-dashboard.tsx` | Import patterns are confirmed |
| Tabs UI | `components/ui/tabs.tsx` | Use for Services/Resources/Staff drill-down |
| DropdownMenu UI | `components/ui/dropdown-menu.tsx` | Use for Bell notification dropdown |
| Sheet UI | `components/ui/sheet.tsx` | Alternative for notification panel (mobile-friendly) |
| Dashboard layout injection point | `app/dashboard/layout.tsx` | Already server component; extend Promise.all fetch |
| DashboardSidebar | `components/dashboard-sidebar.tsx` | Client component; add Bell icon + notification count prop |
| Plan enum | `prisma/schema.prisma` → `enum Plan` | FREE / PRO / ENTERPRISE |
| PlanStatus enum | `prisma/schema.prisma` → `enum PlanStatus` | ACTIVE / PENDING / EXPIRED / BANNED |
| Translation system | `lib/i18n/translations.ts` | Add new keys for all user-visible strings in new tenant-facing components |
| Test framework | `__tests__/` + `jest.config.ts` | Jest + ts-jest, static file assertion pattern |

### What Does NOT Exist (must create)

- `Announcement` model in schema + migration
- `Notification` model in schema + migration
- `AuditLog` model in schema + migration
- `app/admin/analytics/page.tsx`
- `app/admin/tenants/[tenantId]/page.tsx`
- `app/admin/audit-logs/page.tsx`
- `components/announcement-banner.tsx`
- `components/notification-bell.tsx`
- `lib/actions/announcements.ts`
- `lib/actions/notifications.ts`
- `lib/actions/audit-log.ts`

---

## Translation Keys Required

New tenant-facing strings (GOD-03, GOD-04) must be added to `lib/i18n/translations.ts` in all three locales (ru/kz/en):

| Key Path | Value (RU) | Notes |
|----------|-----------|-------|
| `admin.announcement` or `dashboard.announcement` | Объявление | Banner title prefix |
| `dashboard.dismissBanner` | Закрыть | Dismiss button |
| `dashboard.notifications` | Уведомления | Bell dropdown title |
| `dashboard.noNotifications` | Нет уведомлений | Empty state |
| `dashboard.markAllRead` | Отметить всё прочитанным | Action button |

Admin panel strings (GOD-01, GOD-02, GOD-05) use inline Russian strings — consistent with existing admin layout pattern (no i18n in admin panel).

---

## Validation Architecture

nyquist_validation is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest (existing) |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest --testPathPattern="god-mode"` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GOD-01 | MRR card displays correct values + plan breakdown renders | unit (static assertion) | `npx jest --testPathPattern="god-mode"` | ❌ Wave 0 |
| GOD-02 | Drill-down page file exists + uses basePrisma queries | unit (static assertion) | `npx jest --testPathPattern="god-mode"` | ❌ Wave 0 |
| GOD-03 | Announcement model fields exist in schema; banner component uses localStorage | unit (static assertion) | `npx jest --testPathPattern="god-mode"` | ❌ Wave 0 |
| GOD-04 | Notification model fields exist; Bell icon present in DashboardSidebar | unit (static assertion) | `npx jest --testPathPattern="god-mode"` | ❌ Wave 0 |
| GOD-05 | AuditLog model exists; createAuditLog helper exported; audit hooks in delete actions | unit (static assertion) | `npx jest --testPathPattern="god-mode"` | ❌ Wave 0 |
| GOD-06 | New pages/components use neu-raised/neu-inset/var(--neu-bg) | unit (static assertion) | `npx jest --testPathPattern="god-mode"` | ❌ Wave 0 |

**Testing approach:** Follow the established pattern from `__tests__/neumorphism-surface.test.ts` — static file assertion tests using `fs.readFileSync` + regex. This project does not use component mounting/rendering tests. All tests check file contents for required class names, pattern strings, and Prisma model definitions.

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="god-mode" --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/god-mode-surface.test.ts` — covers GOD-01 through GOD-06 (static assertions)
- [ ] No new framework config needed — jest.config.ts pattern already supports new test files

---

## Open Questions

1. **MRR currency unit**
   - What we know: Service prices are stored in tiyins (minor units, 1/100 of tenge). Plan MRR would logically be in USD (SaaS convention).
   - What's unclear: Is MRR displayed as USD or KZT? The CONTEXT.md uses `$29`, `$99` suggesting USD.
   - Recommendation: Display in USD with fixed format. No conversion needed — MRR is a platform metric, not derived from booking revenue.

2. **Notification fetch strategy for Bell unread count**
   - What we know: Dashboard layout is a server component. Fetching unread count there is straightforward.
   - What's unclear: Should unread count update in real-time (websocket/polling) or only on page navigation?
   - Recommendation: Server-side fetch on navigation only (no real-time). Call `router.refresh()` after marking as read. This matches the existing project pattern — no websocket infrastructure exists.

3. **Audit log for login events in auth config**
   - What we know: The `authorize()` callback in `lib/auth/config.ts` is where login succeeds. `createAuditLog` there would need `basePrisma`.
   - What's unclear: The auth config is imported as a constant — adding an async write there is safe but increases login latency slightly.
   - Recommendation: Write audit log in `authorize()` after the `newSessionId` update. It's already doing a DB write there, so one more write is acceptable. Use `.catch(() => {})` to keep it non-blocking.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/tenants/page.tsx`, `app/admin/tenants/admin-tenant-row.tsx`, `app/dashboard/layout.tsx`, `components/dashboard-sidebar.tsx`, `lib/actions/admin.ts`, `lib/actions/analytics.ts`, `lib/auth/guards.ts`, `lib/auth/config.ts`, `prisma/schema.prisma`, `app/globals.css`, `components/analytics-dashboard.tsx`, `package.json`
- All findings are direct code inspection — no external docs needed for codebase-specific patterns

### Secondary (MEDIUM confidence)
- Next.js 15 App Router `revalidatePath` with layout segment (`revalidatePath('/dashboard', 'layout')`) — standard Next.js 15 pattern for cache invalidation across nested segments

### Tertiary (LOW confidence)
- None — all critical findings are from direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via package.json and direct import inspection
- Architecture: HIGH — all patterns extracted from existing files
- Database schema: HIGH — verified against prisma/schema.prisma
- Pitfalls: HIGH — most derived from STATE.md accumulated decisions and direct code analysis
- Translation requirements: MEDIUM — pattern confirmed, specific keys are discretionary

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days — stable Next.js/Prisma stack)
