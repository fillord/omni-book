# omni-book — Technical Context Report

> Generated: 2026-03-11. Based on actual source files.

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.5.12 |
| Runtime | React | 19.0.0 |
| Language | TypeScript | ^5 |
| ORM | Prisma | 6.7.0 |
| Database | PostgreSQL | 16-alpine (Docker) |
| CSS | Tailwind CSS | 4.2.1 |
| UI Components | shadcn/ui | 4.0.2 (New York, Zinc) |
| Forms | react-hook-form + Zod | 7.71.2 / 4.3.6 |
| Auth | NextAuth | 4.24.11 |
| Icons | lucide-react | 0.577.0 |
| Testing | jest + ts-jest | ^29 |
| Email | Resend | 6.9.3 |
| Passwords | bcryptjs | — |
| Toasts | sonner | — |
| Date/TZ | date-fns + date-fns-tz | — |
| Package manager | npm | — |
| Dev server port | **3030** (not 3000) | — |

---

## 2. Project Structure

```
app/
├── (marketing)/
│   ├── layout.tsx
│   └── page.tsx                    # Landing page /
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
├── (tenant)/
│   ├── layout.tsx
│   ├── [slug]/page.tsx             # Public tenant page /beauty-studio etc.
│   └── clinic/page.tsx             # Legacy redirect → city-polyclinic
├── dashboard/
│   ├── layout.tsx                  # Reads tenant from session, provides nicheConfig
│   ├── page.tsx                    # Stats + upcoming bookings
│   ├── bookings/page.tsx           # Bookings table + calendar tabs
│   ├── resources/page.tsx          # Resources CRUD
│   ├── services/page.tsx           # Services CRUD
│   ├── settings/page.tsx           # Tenant settings
│   └── staff/page.tsx              # Staff management (placeholder)
├── book/
│   ├── layout.tsx
│   └── page.tsx                    # Public booking wizard demo
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── auth/register/route.ts
│   ├── bookings/route.ts           # GET (list) + POST (create)
│   ├── bookings/slots/route.ts     # GET available time slots
│   ├── bookings/calendar/route.ts  # GET week view data
│   ├── bookings/busy/route.ts      # GET busy slots
│   ├── bookings/[id]/status/route.ts # PATCH status change
│   ├── resources/route.ts
│   ├── tenants/route.ts
│   └── webhooks/route.ts
├── layout.tsx                      # Root layout
└── middleware.ts                   # Subdomain→header + auth protection

components/
├── ui/                             # shadcn/ui (button, card, input, select, ...)
│   └── phone-input.tsx             # Custom controlled phone input with formatting
├── landing/                        # Marketing page sections
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── NicheCards.tsx
│   ├── FeaturesGrid.tsx
│   ├── DemoSection.tsx
│   ├── PricingCards.tsx
│   ├── Footer.tsx
│   └── FadeIn.tsx
├── booking-form.tsx                # 4-step booking wizard (resource→service→slot→guest)
├── booking-calendar.tsx            # Week-view calendar (CSS Grid + absolute positioning)
├── bookings-dashboard.tsx          # Bookings table + calendar tabs + status updates
├── booking-status-badge.tsx        # Badge component for booking statuses
├── resource-form.tsx               # Niche-aware dynamic resource form
├── resources-manager.tsx           # Resources CRUD table + dialogs + mobile cards
├── service-form.tsx                # Service form with resource assignment
├── services-manager.tsx            # Services CRUD table + dialogs + mobile cards
├── settings-form.tsx               # Tenant settings (6 sections, STAFF read-only)
├── dashboard-sidebar.tsx           # Mobile Sheet + desktop sidebar, niche-colored
├── tenant-public-page.tsx          # Shared Server Component for public tenant page
└── providers.tsx                   # Client layout wrapper (SessionProvider + ThemeProvider)

lib/
├── db/index.ts                     # basePrisma (raw) + prisma (tenant-extended via $extends)
├── tenant/
│   ├── context.ts                  # setTenantContext / getTenantId (AsyncLocalStorage)
│   ├── resolve.ts                  # resolveTenant(request) — x-tenant-slug header
│   ├── prisma-tenant.ts            # $allOperations extension — auto-injects tenantId
│   ├── guard.ts
│   └── index.ts
├── auth/
│   ├── config.ts                   # NextAuth options (Credentials + Google)
│   ├── guards.ts                   # requireAuth / requireRole / requireTenant
│   ├── types.ts                    # Session/JWT type augmentation
│   └── index.ts
├── booking/engine.ts               # getAvailableSlots + createBooking (FOR UPDATE lock)
├── email/resend.ts                 # sendBookingConfirmation / sendBookingCancellation
├── niche/config.ts                 # Central niche definitions (single source of truth)
├── actions/
│   ├── resources.ts                # Server Actions: getResources, createResource, ...
│   ├── services.ts                 # Server Actions: getServices, createService, ...
│   └── tenant-settings.ts         # Server Actions: getTenantSettings, updateTenantSettings
├── validations/
│   ├── resource.ts                 # createResourceSchema, updateResourceSchema
│   ├── service.ts                  # createServiceSchema, updateServiceSchema
│   └── tenant-settings.ts         # tenantSettingsSchema
├── utils/
│   ├── phone.ts                    # formatPhone(), normalizePhone()
│   └── index.ts
├── resources/types.ts              # ResourceWithRelations type
└── utils.ts                        # cn() helper

prisma/
├── schema.prisma
├── seed.ts                         # 5 tenants × resources, services, bookings
└── migrations/ (auto)
```

---

## 3. Database Schema

### Tenant
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | PK |
| slug | String (unique) | Subdomain identifier |
| name | String | Business display name |
| niche | String | beauty \| horeca \| sports \| medicine |
| plan | String | free \| pro \| enterprise |
| isActive | Boolean | default true |
| timezone | String | IANA tz, default Asia/Almaty |
| description | String? | Public description |
| phone | String? | Contact phone |
| email | String? | Contact email |
| address | String? | Street address |
| city | String? | City |
| website | String? | Website URL |
| logoUrl | String? | Logo image URL |
| coverUrl | String? | Hero cover image URL |
| workingHours | String? | e.g. "Пн-Пт: 09-18" |
| socialLinks | Json | `{ instagram, whatsapp, telegram }` |
| createdAt | DateTime | auto |

### User
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | PK |
| tenantId | String? | NULL for SUPERADMIN |
| email | String (unique) | |
| name | String? | |
| passwordHash | String? | bcrypt |
| role | Enum | SUPERADMIN \| OWNER \| STAFF \| CUSTOMER |
| createdAt | DateTime | auto |

### Resource
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | PK |
| tenantId | String | FK, mandatory |
| name | String | |
| type | String | staff \| room \| court \| table \| equipment \| other |
| description | String? | |
| capacity | Int? | |
| attributes | Json | Niche-specific fields |
| isActive | Boolean | default true |
| createdAt | DateTime | auto |

Index: `(tenantId, type)`

### Schedule
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | PK |
| resourceId | String | FK |
| dayOfWeek | Int | 0=Sun … 6=Sat |
| startTime | String | HH:MM |
| endTime | String | HH:MM |
| isActive | Boolean | default true |

Unique: `(resourceId, dayOfWeek)`. **No schedule = unbookable resource.**

### Service
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | PK |
| tenantId | String | FK, mandatory |
| name | String | |
| description | String? | |
| durationMin | Int | minutes |
| price | Int? | In minor units (tiyins = 1/100 tenge) |
| currency | String | default KZT |
| isActive | Boolean | default true |
| createdAt | DateTime | auto |

### ResourceService (M2M)
| Column | Type | Notes |
|--------|------|-------|
| resourceId | String | Composite PK |
| serviceId | String | Composite PK |

Note: NOT in tenant-scoped extension — verified manually in actions.

### Booking
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | PK |
| tenantId | String | FK, mandatory |
| resourceId | String | FK |
| serviceId | String | FK |
| userId | String? | NULL = guest booking |
| guestName | String | |
| guestPhone | String | Normalized: +7XXXXXXXXXX |
| guestEmail | String? | |
| startsAt | DateTime | UTC |
| endsAt | DateTime | UTC |
| status | Enum | PENDING \| CONFIRMED \| CANCELLED \| COMPLETED \| NO_SHOW |
| createdAt | DateTime | auto |

Indexes: `(tenantId, resourceId, startsAt)`, `(tenantId, status)`

---

## 4. Multi-Tenancy Rules

1. **Every DB query MUST include explicit `where: { tenantId }`** — no exceptions
2. **Use `basePrisma`** (not the extended client) for all queries — AsyncLocalStorage is unreliable in Next.js 15
3. **tenantId sources**:
   - Dashboard: `session.user.tenantId`
   - API: `resolveTenant(req)` (reads `x-tenant-slug` header or `?tenantSlug=` param)
   - Never from client input
4. **Before create/update/delete**: verify record belongs to tenant via `findFirst({ where: { id, tenantId } })`
5. **NEVER hardcode a tenant slug**

### Middleware (`middleware.ts`)

- Extracts subdomain from `Host` header → sets `x-tenant-slug` header
- Protects `/dashboard/*` → requires session + (OWNER | STAFF | SUPERADMIN)
- Protects `/api/resources`, `/api/tenants` → requires OWNER | SUPERADMIN
- Redirects `/login`, `/register` to `/dashboard` if already signed in

---

## 5. Auth

**Strategy**: NextAuth JWT (stateless, Edge-safe, no DB adapter)

**Session fields**: `{ id, email, name, role, tenantId, tenantSlug }`

**Credentials flow**: email + bcryptjs → validate → JWT

**Roles**: SUPERADMIN (tenantId=null, bypasses all checks), OWNER, STAFF, CUSTOMER

**`redirect` callback** in authConfig:
```typescript
async redirect({ url, baseUrl }) {
  if (url.startsWith('/')) return `${baseUrl}${url}`
  if (url.startsWith(baseUrl)) return url
  return `${baseUrl}/dashboard`
}
```

---

## 6. Niche System

**File**: `lib/niche/config.ts` — single source of truth. Never hardcode niche logic elsewhere.

| Niche | Color | resourceLabel | Types |
|-------|-------|--------------|-------|
| medicine | blue | Врач | staff, room, equipment |
| beauty | pink | Мастер | staff, room |
| horeca | orange | Столик | table, room, staff |
| sports | green | Площадка | court, room, staff, equipment |

**AttributeField** structure:
```typescript
{
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multitext' | 'checkbox'
  options?: string[]          // for select
  required?: boolean
  forTypes?: string[]         // limit to specific resource types
  showInTable?: boolean       // show in resources table + public cards
}
```

**Attribute fields by niche**:

- **medicine**: specialization (text, staff), license (text, staff), experience_years (number, staff), languages (multitext, staff), equipment (multitext, room/equipment)
- **beauty**: specialization (select, staff), experience_years (number, staff), skills (multitext, staff)
- **horeca**: capacity (number, table/room, required), location (select, table/room), features (multitext)
- **sports**: surface (select, court), indoor (checkbox, court/room), capacity (number), equipment_included (multitext)

**`getNicheConfig(niche)`**: Fallback to medicine for unknown/null niches.

---

## 7. Booking Engine (`lib/booking/engine.ts`)

### `getAvailableSlots({ tenantId, resourceId, date, serviceId })`

1. Load tenant timezone + resource schedule for `dayOfWeek`
2. Build UTC window for the day using `fromZonedTime()`
3. Query active overlapping bookings (CONFIRMED | PENDING)
4. Generate slots every `durationMin` minutes within schedule window
5. Mark slot `available: false` if collision
6. Format time label in tenant timezone

**Returns**: `SlotResult[]` — `{ time, startsAt, endsAt, available }`

**Errors**: DayOffError (422), ResourceNotFoundError (404), ServiceNotFoundError (404)

### `createBooking({ tenantId, resourceId, serviceId, startsAt, guestName, guestPhone, guestEmail? })`

1. `$transaction(serializable)` → `FOR UPDATE` lock on resource row
2. Verify resource + service belong to tenant
3. Anti-spam: count active (PENDING|CONFIRMED) by guestPhone → if ≥2 → BookingLimitError (429)
4. Collision check: overlapping active bookings → BookingConflictError (409)
5. Create booking with status CONFIRMED

---

## 8. API Routes

### `GET /api/bookings`
Query: `{ tenantSlug?, status?, resourceId?, dateFrom?, dateTo?, page, limit }`
Response: `{ data[], total, page, totalPages, limit }`

### `POST /api/bookings`
Body: `{ resourceId, serviceId, startsAt, guestName, guestPhone, guestEmail? }`
Responses: 201 (created), 409 (conflict), 422 (missing fields), 429 (limit exceeded)
Post-creation: fire-and-forget email via `sendBookingConfirmation().catch(console.error)`

### `GET /api/bookings/slots`
Query: `{ resourceId, serviceId, date (YYYY-MM-DD), tenantSlug? }`
Response: `{ slots: SlotResult[] }` or `{ slots: [], dayOff: true }`

### `PATCH /api/bookings/[id]/status`
Body: `{ status: BookingStatus }`
Auth: session required (OWNER | STAFF | SUPERADMIN)
Finite-state transitions: past bookings can only go to COMPLETED | NO_SHOW

### `GET /api/bookings/calendar`
Response: grouped by resource `{ resourceId, resourceName, resourceType, bookings[] }`

### `GET /api/bookings/busy`
Returns busy time windows (used by booking form to disable slots)

---

## 9. Email (`lib/email/resend.ts`)

```typescript
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
```

- **No-op** if `RESEND_API_KEY` is absent (development-safe)
- `sendBookingConfirmation(data)` — HTML email, green header
- `sendBookingCancellation(data)` — HTML email, red header
- Both accept `BookingEmailData { guestName, guestEmail, tenantName, serviceName, resourceName, startsAt, timezone? }`

---

## 10. Phone Utilities (`lib/utils/phone.ts`)

```typescript
formatPhone("+77071234567")            // → "+7 (707) 123 45 67"
normalizePhone("+7 707 123-45-67")     // → "+77071234567"
```

- `normalizePhone` applied in POST /api/bookings before engine call
- `formatPhone` used in UI display (bookings table, dashboard)
- `PhoneInput` component: controlled Input, formats on `onBlur`

---

## 11. Schedule Defaults by Niche (on Resource Creation)

| Niche | Days | Start | End |
|-------|------|-------|-----|
| medicine | Mon–Fri (1–5) | 09:00 | 18:00 |
| beauty | Mon–Sat (1–6) | 09:00 | 19:00 |
| horeca | Every day (0–6) | 10:00 | 23:00 |
| sports | Every day (0–6) | 07:00 | 22:00 |

**Rule**: Creating a resource via Dashboard MUST also create default Schedule entries. Without them, all slots return "Не работает в этот день."

---

## 12. Settings Page (`/dashboard/settings`)

**Server Action** (`lib/actions/tenant-settings.ts`):
- `getTenantSettings()` — returns all public fields + socialLinks
- `updateTenantSettings(data)` — OWNER/SUPERADMIN only, validates with `tenantSettingsSchema`, `revalidatePath` for `/dashboard/settings` and `/:slug`

**Form** (`components/settings-form.tsx`):
- 6 Card sections: slug (read-only), основная информация, контакты, часы работы, брендинг, соцсети
- STAFF → all fields disabled, no Save button
- Live image preview via `<img>` with `onError` hide
- Manual `tenantSettingsSchema.safeParse()` in submit (no zodResolver — project pattern)

---

## 13. Public Tenant Page (`/[slug]`)

**Component**: `components/tenant-public-page.tsx` (Server Component)

**Sections**:
1. **Sticky header** — logo thumbnail + tenant name + "Book" CTA
2. **Hero** — `coverUrl` as CSS background, `logoUrl` avatar, name, description, niche CTA button
3. **Contact bar** — phone (formatted), email, address, city, website (shown only if non-null)
4. **Niche content** — resources (specialists/tables/courts) + services grid
5. **Booking section** — embeds `<BookingForm>` wizard
6. **Social footer** — Instagram, WhatsApp (MessageCircle), Telegram icons → links

---

## 14. Seed Data (`prisma/seed.ts`)

5 tenants, all with full public fields:

| Tenant | Niche | Plan | Resources | Services |
|--------|-------|------|-----------|----------|
| city-polyclinic | medicine | pro | Dr. Petrov (therapist), Dr. Gulnara (cardiologist) | Консультация (30 min, 5000), ЭКГ (20 min, 3000) |
| zdorovie-med | medicine | free | Dr. Asel (neurologist) | Нейро-консультация (40 min, 7000) |
| beauty-studio | beauty | pro | Anna Kim (hairdresser), Dana Serik (cosmetologist) | Стрижка (45 min, 5000), Уход за лицом (60 min, 8000) |
| bistro-central | horeca | pro | Столик у окна (cap 4), VIP-зал (cap 12) | Обычный столик (120 min, free), VIP (180 min, 15000) |
| sport-arena | sports | free | Корт №1 (clay, outdoor), Корт №2 (hard, indoor) | Аренда (60 min, 3000) |

**Test accounts** (password: `password123`):
- clinic-owner@test.com, zdorovie@test.com, salon-owner@test.com, bistro-owner@test.com, sport-owner@test.com

---

## 15. Dashboard UI

### Sidebar (`components/dashboard-sidebar.tsx`)
- **Desktop**: fixed `<aside>` 64px wide
- **Mobile**: `<Sheet>` (burger button in top bar, `pt-14` clearance on main)
- Niche-colored active nav links (static string records per color — Tailwind 4 constraint)
- Avatar + owner name/email + tenant name + niche badge
- Footer: "Публичная страница" link + "Выйти" button

### Dashboard Home (`app/dashboard/page.tsx`)
- Stat cards: Bookings today, Resources, Confirmed bookings, Guests (with lucide icons)
- "Предстоящие записи" — 5 upcoming PENDING/CONFIRMED bookings from DB

### Mobile Pattern (all CRUD pages)
- Desktop: `<table className="hidden sm:table">`
- Mobile: card list `<div className="sm:hidden">`
- FAB: `<Button className="sm:hidden fixed bottom-6 right-6">`
- Toasts: `toast.success/error()` from sonner (replaced inline state)

---

## 16. Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omni_book"
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3030       # Must match dev server port!
ROOT_DOMAIN=omnibook.com
RESEND_API_KEY=                          # Optional; emails disabled if absent
GOOGLE_CLIENT_ID=                        # Optional
GOOGLE_CLIENT_SECRET=                    # Optional
```

---

## 17. Known Issues & Rules

1. **Schedule required on resource creation** — always create default entries via niche defaults
2. **AsyncLocalStorage unreliable in Next.js 15** — use `basePrisma` + explicit `tenantId` in all queries
3. **`zodResolver` dual-types TS error** — project pattern: use local `FormValues` type + manual `.safeParse()` in submit handler
4. **Tailwind 4 dynamic classes** — must use static string records (COLORS object), never template literals
5. **`SheetTrigger asChild`** — `@base-ui/react` doesn't support `asChild`; use `className` directly on `SheetTrigger`
6. **Date handling** — always YYYY-MM-DD for API, sanitize on server, store UTC in DB
7. **`NEXTAUTH_URL` port** — must be 3030 (not 3000); mismatch causes redirect to wrong server in WSL
8. **Price units** — form input in major units (tenge), stored as minor units (tiyins = ×100)

---

## 18. Key Constraints

| Metric | Value |
|--------|-------|
| Max active bookings per phone per tenant | 2 |
| Max booking list page size | 100 |
| Description max length | 500 chars |
| Default timezone | Asia/Almaty |
| Supported currencies | KZT, RUB, USD, EUR |
| Booking duration range | 5–480 min |
| Resource types | staff, room, court, table, equipment, other |
| Niches | medicine, beauty, horeca, sports |
