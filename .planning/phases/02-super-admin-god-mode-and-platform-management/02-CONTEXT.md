# Phase 2: Super-Admin "God Mode" & Platform Management - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Source:** User requirements spec (inline)

<domain>
## Phase Boundary

Build a comprehensive super-admin panel for platform owners. The super-admin can monitor all tenants (businesses), view their internal data in read-only mode, broadcast announcements platform-wide, send targeted notifications to individual tenants, and audit critical tenant activity. All new UI must strictly follow the Neumorphism design system from Phase 1.

This phase does NOT cover:
- Tenant self-management features (already exists)
- Public booking surface changes
- Authentication system changes beyond super-admin role checks

</domain>

<decisions>
## Implementation Decisions

### Module 1 — Financial & Platform Analytics Dashboard (GOD-01)
- Add a high-level metrics view to the super-admin panel
- Display MRR (Monthly Recurring Revenue) — can be calculated from tenant plan data
- Show breakdown of tenant counts per plan tier: Free, Pro, Enterprise
- Display as stat cards (neu-raised) + a simple bar or summary table
- Placement: top section of `/admin` or a dedicated `/admin/analytics` route

### Module 2 — Tenant Drill-Down / Deep View (GOD-02)
- Each tenant row in the existing `/admin/tenants` table must be clickable
- Clicking opens a detailed view (route: `/admin/tenants/[tenantId]`) in read-only mode
- The drill-down must show the tenant's:
  - **Services** — list of service names, durations, prices
  - **Resources** — list of resource names and types (tables/rooms/etc.)
  - **Staff/Masters** — list of staff member names and roles
- Data is fetched server-side using existing Supabase queries (read-only, no edit actions)
- Layout: tabbed interface (Services | Resources | Staff) or stacked sections

### Module 3 — Global Announcement Banners (GOD-03)
- Super-admin creates a banner message (title + body text) via a form in `/admin`
- Banner is stored in database (new table: `announcements`)
- Active banners appear at the top of ALL tenant dashboards (the `/dashboard` route for tenant users)
- Banner can be dismissed per-session by tenants (localStorage flag) but re-appears on new sessions
- Only one active banner at a time (or show latest active)
- Super-admin can deactivate/delete banners

### Module 4 — Targeted In-App Notifications (GOD-04)
- Bell icon in the tenant dashboard navbar (existing Navbar component)
- Super-admin sends a notification message to a specific tenant from `/admin/tenants/[tenantId]`
- Notifications stored in a new database table: `notifications` (tenant_id, message, read, created_at)
- Tenant sees unread count badge on Bell icon
- Clicking Bell opens a dropdown/sheet listing notifications with read/unread state
- Marking as read updates the `read` column

### Module 5 — Audit & Activity Logs (GOD-05)
- New database table: `audit_logs` (tenant_id, event_type, details, created_at)
- Record the following events automatically:
  - User login (tenant owner signs in)
  - Plan upgrade (tenant changes plan to higher tier)
  - Plan downgrade (tenant changes plan to lower tier)
  - Deletion of critical data (services, resources, staff deleted)
- Super-admin views logs in `/admin/audit-logs` — a filterable table (filter by tenant, event type, date range)
- Read-only view, no editing of logs

### Neumorphism Design Adherence (GOD-06)
- All new pages, stat cards, tables, modals, and forms MUST use:
  - `var(--neu-bg)` as background on root containers
  - `.neu-raised` class on cards, buttons, panels
  - `.neu-inset` class on inputs, table containers, notification dropdowns
- No hard borders (`border-border`) on new components — depth via shadow only
- Theme transitions: existing 300ms CSS transition applies automatically via globals.css
- Charts/stats: wrap chart containers in `.neu-raised` div

### Claude's Discretion
- Exact database schema column names and types (use Supabase/Postgres conventions)
- Chart library choice for analytics (Recharts is already likely used — check existing code)
- Pagination strategy for audit logs (cursor-based or offset, whichever matches existing patterns)
- Whether to use a modal or full page for tenant drill-down (full page `/admin/tenants/[tenantId]` preferred per decision above, but modal acceptable if layout constraints arise)
- Row Level Security (RLS) policies for new tables — super-admin role must have read/write, tenants read-only on their own records

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Neumorphism Design System
- `.planning/phases/01-refactor-the-ui-design-of-the-entire-project-to-a-neumorphism-soft-ui-style-with-light-and-dark-themes/01-CONTEXT.md` — Phase 1 design decisions (var(--neu-bg), .neu-raised, .neu-inset rules)
- `app/globals.css` — CSS custom properties and .neu-* utility class definitions

### Existing Admin Panel
- `app/admin/tenants/` — Existing tenant management page and components
- `app/admin/` — Super-admin route layout and existing pages

### Auth & Role Patterns
- `lib/actions/` — Existing server action patterns to follow
- `lib/actions/auth-session.ts` — Auth session helpers

### Translations
- `lib/i18n/translations.ts` — All user-visible strings must be added here (trilingual: EN/RU/UK)

</canonical_refs>

<specifics>
## Specific Ideas

- MRR calculation: `SUM(tenant.plan_price)` across active tenants — if plan prices aren't stored, use fixed values per tier (Free=$0, Pro=$29, Enterprise=$99)
- Announcement banner: render in the tenant dashboard layout file, check for active announcement on page load (server component fetch)
- Bell notification badge: use a red circle with unread count (follow existing badge pattern from Phase 1 Badge component with .neu-inset)
- Audit log events: use string enum for `event_type` column (e.g., `'login'`, `'plan_upgrade'`, `'plan_downgrade'`, `'service_deleted'`, `'resource_deleted'`, `'staff_deleted'`)

</specifics>

<deferred>
## Deferred Ideas

- Email notifications (beyond in-app Bell) — future phase
- Tenant suspension / force-logout from super-admin — future phase
- Bulk announcement targeting (send to only Pro tenants, etc.) — future phase
- Exportable audit log CSV download — future phase

</deferred>

---

*Phase: 02-super-admin-god-mode-and-platform-management*
*Context gathered: 2026-03-23 from user requirements spec*
