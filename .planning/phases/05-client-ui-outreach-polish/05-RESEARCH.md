# Phase 5: Client UI, Outreach & Polish - Research

**Researched:** 2026-03-25
**Domain:** Next.js App Router dashboard pages, Neumorphic UI components, i18n (3-locale), Telegram server action outreach
**Confidence:** HIGH

## Summary

Phase 5 is a pure frontend + server action phase that surfaces the `Client` model built in Phase 4. The data layer is complete and tested — `getClients()` exists in `lib/actions/clients.ts`, the `Client` model has all required fields (`name`, `phone`, `email`, `totalVisits`, `totalRevenue`, `lastVisitAt`, `hasTelegram`). Phase 5 adds: one sidebar link entry, two pages (list + detail), one new server action (`sendTelegramToClient`), and i18n strings in all three locales.

The project's Neumorphic design system is fully established. The correct pattern is: table container uses `neu-inset` (the `Table` component from `components/ui/table.tsx` already does this), cards use `neu-raised` via the `Card` component, interactive buttons use `neu-btn`. The project has a `Table` + `TableRow`/`TableCell` component set that's already Neumorphic — use it directly rather than hand-building an `<table>`. Search filtering is done client-side with `useState` + `useMemo` (no server round-trip), matching the existing bookings dashboard pattern.

The Telegram outreach action is a server action in `lib/actions/clients.ts` that calls `sendTelegramMessage(chatId, text)` from `lib/telegram.ts` — the same function already used by `lib/actions/billing.ts` for admin notifications. The client detail page must query bookings by `guestPhone + tenantId` directly (not via a Client relation — the `Client` model intentionally has no `Booking[]` relation).

**Primary recommendation:** Two pages (`app/dashboard/clients/page.tsx` + `app/dashboard/clients/[clientId]/page.tsx`), one client component (`components/clients-table.tsx`) with search, one new server action (`sendTelegramToClient`), plus sidebar link + i18n strings. No new npm packages needed.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRM-06 | Sidebar link "Клиенты" with Users icon navigates to `/dashboard/clients` | Sidebar `items` array in `components/dashboard-sidebar.tsx` — add one entry with `Users` icon from lucide-react; `tKey` points to new `clients.title` translation key |
| CRM-07 | Clients page displays Neumorphic table: Name, Contact, Total Visits, Total Spent, Last Visit, Telegram Status | Use existing `Table`/`TableRow`/`TableCell` components (already `neu-inset`); page fetches via `getClients(tenantId)`; render inside a `Card` (`neu-raised`) |
| CRM-08 | Search bar filters by name or phone | Client component with `useState(query)` + `useMemo` filter over `client.name` and `client.phone` — no server request needed |
| CRM-09 | Client row click opens detail page with booking history (date, service, resource, price, status) | `app/dashboard/clients/[clientId]/page.tsx` — fetches `Client` by id, then `basePrisma.booking.findMany` by `guestPhone + tenantId`; include `service` and `resource` in select |
| CRM-10 | "Send Telegram message" available for clients with active Telegram; absent for those without | New `sendTelegramToClient` server action using `client.hasTelegram` guard; finds a booking with `telegramChatId` for that phone to get the chat ID; detail page shows button only when `hasTelegram === true` |
| CRM-11 | All new UI uses `.neu-raised`/`.neu-inset`/`var(--neu-bg)` Neumorphism patterns | Use `Card` (has `neu-raised`), `Table` (has `neu-inset`), `Button` with `neu-btn` variant; explicit `bg-[var(--neu-bg)]` on component roots |
| CRM-12 | All new strings translated in RU/EN/KZ | New `clients` section in `lib/i18n/translations.ts` for all three locales; server pages use `getServerT()`; client components use `useI18n()` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | existing | `/dashboard/clients` page + `/dashboard/clients/[clientId]/page` | Project standard; all dashboard pages follow this pattern |
| `basePrisma` from `@/lib/db` | existing | Data fetching in server pages | Project-standard Prisma client |
| `sendTelegramMessage` from `@/lib/telegram` | existing | Outreach action sends message to client's chat ID | Already used in `lib/actions/billing.ts`; fire-and-forget pattern established |
| `getClients` from `@/lib/actions/clients` | Phase 4 output | Fetch client list for tenantId | Built in Phase 4, ready to use |
| `useI18n` / `getServerT` from `@/lib/i18n` | existing | i18n in client and server components | Project-standard i18n system |
| lucide-react | existing | `Users` icon for sidebar | All sidebar icons come from lucide-react; `Users` is the standard CRM icon |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Table`, `TableRow`, `TableCell` from `@/components/ui/table` | existing | Neumorphic data table shell | Use for the clients list; already has `neu-inset` container baked in |
| `Card`, `CardHeader`, `CardContent` from `@/components/ui/card` | existing | Page section wrapper | Use for search bar + table wrapper; has `neu-raised` baked in |
| `Badge` from `@/components/ui/badge` | existing | Telegram status chip | `neu-inset` variant for "Connected" / "Not connected" badge |
| `Button` from `@/components/ui/button` | existing | "Send message" CTA + search clear | Use `neu-btn` variant for action buttons |
| `Input` from `@/components/ui/input` | existing | Search bar | Has `neu-inset` styling in project design system |
| `toast` from `sonner` | existing | Success/error feedback on Telegram send | `Toaster` already mounted in dashboard layout |
| `useTransition` from React | built-in | Non-blocking Telegram send | Keeps button responsive during server action |
| `revalidatePath` from `next/cache` | built-in | Invalidate clients page after sync | Already in `syncClients`; not needed for outreach but useful if client data refreshes |

**No new npm packages required.** All dependencies are existing project dependencies.

---

## Architecture Patterns

### Recommended Project Structure
```
app/dashboard/clients/
├── page.tsx                          # Server component: fetch clients, render ClientsTable
└── [clientId]/
    └── page.tsx                      # Server component: fetch client + bookings, render detail

components/
├── clients-table.tsx                 # 'use client' — search state + table render
└── client-detail.tsx                 # 'use client' — Telegram send button + booking history

lib/actions/
└── clients.ts                        # Add sendTelegramToClient() to existing file

__tests__/
└── client-ui-surface.test.ts         # Static file assertions for CRM-06 through CRM-12
```

### Pattern 1: Server Page → Client Component (Standard Dashboard Pattern)
**What:** Server component fetches data, passes as props to a `'use client'` component. Server component owns auth + DB access; client component owns interactive state.

**When to use:** All dashboard pages in this project follow this pattern (bookings, analytics, staff).

**Example (clients list page):**
```typescript
// Source: app/dashboard/bookings/page.tsx pattern
// app/dashboard/clients/page.tsx
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { getClients } from '@/lib/actions/clients'
import { ClientsTable } from '@/components/clients-table'
import { getServerT } from '@/lib/i18n/server'

export default async function ClientsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user.tenantId) redirect('/login')

  const [clients, t] = await Promise.all([
    getClients(session.user.tenantId),
    getServerT(),
  ])

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('clients', 'title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('clients', 'subtitle')}</p>
      </div>
      <ClientsTable clients={clients} />
    </div>
  )
}
```

### Pattern 2: Client Component with Search Filter
**What:** `useState` for search query, `useMemo` for filtered list. No server round-trip — the full client list is small enough to filter in memory.

**When to use:** Any list < ~1000 items with text search. The tenant's client base is bounded by booking volume.

**Example:**
```typescript
// Source: pattern consistent with existing bookings-dashboard.tsx filter approach
'use client'

import { useState, useMemo } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

type Client = {
  id: string; name: string; phone: string; email: string | null
  totalVisits: number; totalRevenue: number; lastVisitAt: Date | null; hasTelegram: boolean
}

export function ClientsTable({ clients }: { clients: Client[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() =>
    clients.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
    ),
    [clients, query]
  )

  return (
    <Card>
      <CardHeader>
        <Input
          placeholder={t('clients', 'searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('clients', 'colName')}</TableHead>
              <TableHead>{t('clients', 'colContact')}</TableHead>
              <TableHead>{t('clients', 'colVisits')}</TableHead>
              <TableHead>{t('clients', 'colSpent')}</TableHead>
              <TableHead>{t('clients', 'colLastVisit')}</TableHead>
              <TableHead>{t('clients', 'colTelegram')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/clients/${c.id}`)}
              >
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone}{c.email && <span className="text-muted-foreground text-xs ml-1">{c.email}</span>}</TableCell>
                <TableCell>{c.totalVisits}</TableCell>
                <TableCell>{c.totalRevenue.toLocaleString()} ₸</TableCell>
                <TableCell>{c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('ru-RU') : '—'}</TableCell>
                <TableCell>
                  {c.hasTelegram
                    ? <Badge variant="outline">{t('clients', 'telegramConnected')}</Badge>
                    : <span className="text-muted-foreground text-xs">{t('clients', 'telegramNone')}</span>
                  }
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t('clients', 'empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### Pattern 3: Client Detail Page — Booking History from Phone+TenantId
**What:** The `Client` model has NO `Booking[]` relation (intentional Phase 4 decision). To get a client's booking history, query bookings by `guestPhone + tenantId`.

**Critical:** This is the correct pattern. Do NOT try to add a `clientId` FK to `Booking`.

**Example:**
```typescript
// Source: Phase 4 RESEARCH.md — "No direct Booking[] relation on Client" decision
// app/dashboard/clients/[clientId]/page.tsx
const client = await basePrisma.client.findUnique({
  where: { id: params.clientId },
})
if (!client || client.tenantId !== tenantId) notFound()

const bookings = await basePrisma.booking.findMany({
  where: { tenantId, guestPhone: client.phone },
  include: {
    service:  { select: { name: true, price: true } },
    resource: { select: { name: true } },
  },
  orderBy: { startsAt: 'desc' },
})
```

### Pattern 4: Telegram Outreach Server Action
**What:** New `sendTelegramToClient` server action in `lib/actions/clients.ts`. Finds the most recent booking with a `telegramChatId` for this phone+tenant, then calls `sendTelegramMessage`.

**Why not store telegramChatId on Client:** The `Client` model intentionally doesn't store it — `hasTelegram` is a boolean flag only. The actual chat ID must be fetched from a booking at send time. This is correct because the Telegram connection is scoped to a booking, not a client identity.

**Example:**
```typescript
// Source: lib/actions/billing.ts sendTelegramMessage pattern
// Append to lib/actions/clients.ts
export async function sendTelegramToClient(clientId: string, message: string) {
  const session = await requireAuth()
  requireRole(session, ['OWNER'])
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Tenant ID missing')

  // Verify client belongs to this tenant
  const client = await basePrisma.client.findUnique({ where: { id: clientId } })
  if (!client || client.tenantId !== tenantId) throw new Error('Client not found')
  if (!client.hasTelegram) return { success: false, error: 'no_telegram' }

  // Find the most recent booking with a telegramChatId for this client's phone
  const booking = await basePrisma.booking.findFirst({
    where: { tenantId, guestPhone: client.phone, telegramChatId: { not: null } },
    orderBy: { startsAt: 'desc' },
    select: { telegramChatId: true },
  })
  if (!booking?.telegramChatId) return { success: false, error: 'no_chat_id' }

  await sendTelegramMessage(booking.telegramChatId, message)
  return { success: true }
}
```

### Pattern 5: Sidebar Link Addition
**What:** Add a new entry to the `items` array in `components/dashboard-sidebar.tsx`. Follow the exact object shape used by existing items.

**Critical details:**
- Import `Users` from `lucide-react` (add to existing import line)
- `section: 'clients'` (matches the new translation section)
- `tKey: 'title'` (matches `clients.title` in translations)
- `exact: false` (so both `/dashboard/clients` and `/dashboard/clients/[id]` are active)

**Example:**
```typescript
// Source: components/dashboard-sidebar.tsx items array (lines 80-87)
// Add to existing import: Users
import { ..., Users } from 'lucide-react'

// Add to items array (after analytics, before settings):
{ href: '/dashboard/clients', section: 'clients', tKey: 'title', icon: Users, exact: false },
```

### Pattern 6: I18n — New `clients` Section in All Three Locales
**What:** Add a `clients` section to the `translations` object in `lib/i18n/translations.ts` for all three locales (`ru`, `kz`, `en`).

**Required keys** (minimum for CRM-12):
```
title           — sidebar label + page header ("Клиенты")
subtitle        — page subheader
searchPlaceholder — search input placeholder
colName         — "Имя"
colContact      — "Контакт"
colVisits       — "Визитов"
colSpent        — "Потрачено"
colLastVisit    — "Последний визит"
colTelegram     — "Telegram"
telegramConnected — badge label for connected clients
telegramNone    — label for clients without Telegram
empty           — empty state message
syncButton      — "Синхронизировать" (triggers syncClients)
synced          — success toast "{n} клиентов синхронизировано"
syncError       — error toast
sendMessage     — "Отправить сообщение"
messagePlaceholder — textarea placeholder
messageSent     — success toast
messageError    — error toast
backToList      — "← Клиенты"
bookingHistory  — "История бронирований"
colDate         — "Дата"
colService      — "Услуга"
colResource     — "Ресурс"
colPrice        — "Сумма"
colStatus       — "Статус"
noBookings      — empty booking history state
```

### Anti-Patterns to Avoid
- **Querying Booking from Client via relation:** `Client` has no `Booking[]`. Query bookings directly by `guestPhone + tenantId`.
- **Storing telegramChatId on Client model:** Do not add this field. Fetch from booking at send time.
- **Using `transition: all` in new components:** The project uses explicit property transitions only — already enforced by `globals.css` global rule.
- **Adding dark: Tailwind overrides:** Neumorphic CSS custom properties handle theming automatically. Remove any `dark:` class variants you might reach for.
- **`bg-transparent` on neu-* elements:** Use `bg-[var(--neu-bg)]` explicitly where needed — `bg-transparent` does not show inset shadow correctly.
- **Forgetting `mounted` guard in sidebar:** `SidebarContent` uses a `mounted` state to prevent hydration mismatch. The new link uses `t()` — it must respect the same `mounted ? t(...) : <skeleton />` pattern already in the items render.
- **Absolute URL in router.push:** Use relative path `/dashboard/clients/${c.id}` not an absolute URL.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Neumorphic table | Custom `<div>` grid | `Table`/`TableRow`/`TableCell` from `@/components/ui/table` | Already has `neu-inset` container, correct spacing, responsive overflow |
| Neumorphic card wrapper | `div` with manual box-shadow | `Card`/`CardHeader`/`CardContent` from `@/components/ui/card` | Already has `neu-raised`, correct radius, gap structure |
| Text search filtering | Debounced API call | `useMemo` over client array | Client list is small; memory filter is instant and avoids server round-trip |
| Telegram send | Custom fetch to Telegram API | `sendTelegramMessage` from `@/lib/telegram` | Already handles token guard, error throwing, HTML parse_mode |
| i18n key lookup | Hardcoded Russian strings | `t('clients', key)` / `getServerT()` | Established system; all 3 locales required |
| Status badge | `div` with color class | `Badge` from `@/components/ui/badge` | Badge already has `neu-inset` outline variant |

**Key insight:** All visual infrastructure is already built. This phase is assembling existing primitives into new pages — not building new design system pieces.

---

## Common Pitfalls

### Pitfall 1: Sidebar items `section` Mismatch with Translation Namespace
**What goes wrong:** The `t(section, tKey)` call in the sidebar uses `section` as the translation namespace. If you add `{ section: 'dashboard', tKey: 'clients' }`, you'd need a `clients` key in the `dashboard` section. If you add `{ section: 'clients', tKey: 'title' }`, you need a `clients` section in translations.

**Why it happens:** The section string is passed directly to `t()` — it's the translation namespace, not a UI category.

**How to avoid:** Use `section: 'clients'` and create the new `clients` section in translations. This is cleaner and more maintainable.

**Warning signs:** Sidebar renders `clients.title` literally (the fallback `${section}.${key}` string) instead of the translated text.

### Pitfall 2: `Client.telegramChatId` Does Not Exist — Fetch from Booking
**What goes wrong:** The `Client` model has `hasTelegram: Boolean` but no `telegramChatId` field. Attempting `client.telegramChatId` in the send action causes a TypeScript type error.

**Why it happens:** Phase 4 decision: Client is a materialized aggregate; Telegram chat IDs live on bookings.

**How to avoid:** Always fetch `telegramChatId` from `basePrisma.booking.findFirst({ where: { guestPhone: client.phone, telegramChatId: { not: null } } })`.

**Warning signs:** TypeScript error "Property 'telegramChatId' does not exist on type 'Client'".

### Pitfall 3: Client Detail Page — tenantId Ownership Check Required
**What goes wrong:** `/dashboard/clients/[clientId]` receives a `clientId` URL param. Without an ownership check, any tenant's owner could access another tenant's client by guessing the ID.

**Why it happens:** CUID-based IDs are not guessable in practice, but the pattern in this codebase always verifies `client.tenantId === session.user.tenantId`.

**How to avoid:** After fetching the `Client` record, verify `client.tenantId === tenantId` before rendering. Use `notFound()` from `next/navigation` if check fails.

**Warning signs:** No ownership check in the page server component.

### Pitfall 4: `Date` Serialization — Server to Client Component
**What goes wrong:** `basePrisma.client.findMany()` returns `lastVisitAt` as a JavaScript `Date` object. Passing a `Date` directly as a prop from a server component to a client component triggers a Next.js serialization warning or error.

**Why it happens:** Next.js App Router serializes server component props to JSON; `Date` is not JSON-serializable.

**How to avoid:** Either convert to ISO string in the server component (`clients.map(c => ({ ...c, lastVisitAt: c.lastVisitAt?.toISOString() ?? null }))`) or use `.toLocaleDateString()` in the server component and pass the formatted string. The latter is simpler for display-only data.

**Warning signs:** Next.js warning "Only plain objects... can be passed to Client Components from Server Components. Date objects are not supported."

### Pitfall 5: `mounted` Guard in Sidebar Required for Hydration Safety
**What goes wrong:** The sidebar renders `{mounted ? t(section, tKey) : <skeleton />}` for all nav items. If the new item bypasses this guard, it will cause hydration mismatch because the server renders using SSR locale but client renders with cookie-based locale.

**Why it happens:** Locale is stored in a cookie read by `I18nProvider` on the client — SSR doesn't have cookie access in the sidebar client component.

**How to avoid:** The new item is rendered by the same `items.map(...)` loop as all existing items — the `mounted` guard is applied automatically. No special handling needed as long as the new item uses the same structure as existing items.

**Warning signs:** Hydration mismatch React error in browser console.

### Pitfall 6: `useRouter().push` on TableRow — Accessibility
**What goes wrong:** Making a `<tr>` clickable with `onClick={() => router.push(...)}` breaks keyboard navigation — rows are not focusable and cannot be activated by keyboard.

**Why it happens:** Common pattern that ignores accessibility.

**How to avoid:** Add `tabIndex={0}` and `onKeyDown={(e) => { if (e.key === 'Enter') router.push(...) }}` to the `TableRow`. This is sufficient for v1 — full screen reader support is future scope.

**Warning signs:** Tab key cannot navigate table rows; Enter does not activate them.

### Pitfall 7: Telegram Message Input — Empty Guard Required
**What goes wrong:** Calling `sendTelegramToClient(id, '')` will send an empty message to the Telegram API, which returns an error ("Bad Request: message text is empty").

**Why it happens:** No front-end validation before calling the server action.

**How to avoid:** Disable the send button when `message.trim() === ''`. Also validate in the server action before calling `sendTelegramMessage`.

**Warning signs:** Telegram API returns 400; `sendTelegramMessage` throws; toast shows generic error.

### Pitfall 8: `getClients` Returns `totalRevenue` as `Int` — Format Correctly
**What goes wrong:** `totalRevenue` is stored as a raw integer (KZT). Displaying `12500` instead of `12 500 ₸` is valid but inconsistent with other numeric displays in the project.

**How to avoid:** Use `c.totalRevenue.toLocaleString('ru-RU')` + ` ₸` for display. This is purely a formatting concern — the data is correct.

---

## Code Examples

### Sidebar Item Addition
```typescript
// Source: components/dashboard-sidebar.tsx lines 8-12 (existing imports) and 80-87 (items array)

// Step 1: Add Users to the existing lucide-react import
import {
  Menu, LogOut, ExternalLink,
  LayoutDashboard, CalendarDays, Wrench, Scissors, Settings, BarChart3,
  Zap, Clock, Users  // <-- add Users here
} from 'lucide-react'

// Step 2: Add to items array (after analytics, before settings)
const items = [
  { href: '/dashboard',           section: 'dashboard', tKey: 'overview',  icon: LayoutDashboard, exact: true  },
  { href: '/dashboard/resources', section: 'niche',     tKey: nicheConfig.resourceLabelPlural, icon: Wrench, exact: false },
  { href: '/dashboard/services',  section: 'dashboard', tKey: 'services',  icon: Scissors,     exact: false },
  { href: '/dashboard/bookings',  section: 'dashboard', tKey: 'bookings',  icon: CalendarDays, exact: false },
  { href: '/dashboard/clients',   section: 'clients',   tKey: 'title',     icon: Users,        exact: false },  // NEW
  { href: '/dashboard/analytics', section: 'dashboard', tKey: 'analytics', icon: BarChart3,    exact: false },
  { href: '/dashboard/settings',  section: 'dashboard', tKey: 'settings',  icon: Settings,     exact: false },
]
```

### Translations Section (RU)
```typescript
// Source: lib/i18n/translations.ts — add to ru: { ... } object
clients: {
  title:              'Клиенты',
  subtitle:           'База клиентов из истории бронирований',
  searchPlaceholder:  'Поиск по имени или телефону',
  colName:            'Имя',
  colContact:         'Контакт',
  colVisits:          'Визитов',
  colSpent:           'Потрачено',
  colLastVisit:       'Последний визит',
  colTelegram:        'Telegram',
  telegramConnected:  'Подключён',
  telegramNone:       'Нет',
  empty:              'Клиенты не найдены. Синхронизируйте базу.',
  syncButton:         'Синхронизировать',
  synced:             'Синхронизировано клиентов: {n}',
  syncError:          'Ошибка синхронизации',
  sendMessage:        'Отправить сообщение',
  messagePlaceholder: 'Текст сообщения для клиента…',
  messageSent:        'Сообщение отправлено',
  messageError:       'Ошибка отправки',
  backToList:         '← Клиенты',
  bookingHistory:     'История бронирований',
  colDate:            'Дата',
  colService:         'Услуга',
  colResource:        'Ресурс',
  colPrice:           'Сумма',
  colStatus:          'Статус',
  noBookings:         'История посещений пуста',
  noTelegram:         'Telegram не подключён',
},
```

### sendTelegramToClient Server Action
```typescript
// Source: lib/actions/clients.ts — append after existing getClients()
// Pattern mirrors lib/actions/billing.ts sendTelegramMessage usage

export async function sendTelegramToClient(clientId: string, message: string) {
  if (!message.trim()) return { success: false, error: 'empty_message' }

  const session = await requireAuth()
  requireRole(session, ['OWNER'])
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Tenant ID missing')

  const client = await basePrisma.client.findUnique({ where: { id: clientId } })
  if (!client || client.tenantId !== tenantId) throw new Error('Client not found')
  if (!client.hasTelegram) return { success: false, error: 'no_telegram' }

  const booking = await basePrisma.booking.findFirst({
    where: { tenantId, guestPhone: client.phone, telegramChatId: { not: null } },
    orderBy: { startsAt: 'desc' },
    select: { telegramChatId: true },
  })
  if (!booking?.telegramChatId) return { success: false, error: 'no_chat_id' }

  await sendTelegramMessage(booking.telegramChatId, message)
  return { success: true }
}
```

### Date Serialization Fix (Server Component)
```typescript
// Source: Next.js App Router serialization constraint
// In the server component, convert dates before passing to client component:
const serializedClients = clients.map(c => ({
  ...c,
  lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
  createdAt:   c.createdAt.toISOString(),
  updatedAt:   c.updatedAt.toISOString(),
}))
// Then: <ClientsTable clients={serializedClients} />
// Type the prop as: lastVisitAt: string | null  (not Date | null)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime Booking aggregation for CRM metrics | Pre-computed `Client` model (Phase 4) | Phase 4 complete | `ClientsPage` does a simple `getClients()` — no JOIN needed |
| No client list in dashboard | Dedicated `/dashboard/clients` page | Phase 5 (this phase) | Tenant owners have a CRM-style client view |
| Telegram only for booking reminders | Telegram also for manual outreach from client detail | Phase 5 (this phase) | `sendTelegramToClient` extends the existing `sendTelegramMessage` utility |

**No deprecated patterns to replace** — this phase extends existing infrastructure.

---

## Open Questions

1. **Should `syncClients` button appear on the Clients page?**
   - What we know: `syncClients()` is already implemented and callable; CRM-07 says "displays a table... populated from real data" which implies sync should happen
   - What's unclear: Whether a manual "sync" button is required or if sync is triggered automatically
   - Recommendation: Add a "Синхронизировать" button on the Clients page header that calls `syncClients()` via `useTransition`. This is the simplest v1 pattern and satisfies the "populated from real data" requirement without adding automation complexity.

2. **Telegram message — free-text or template?**
   - What we know: CRM-10 says "tenant owner can send a Telegram message" — no template specified
   - What's unclear: Whether a `<textarea>` for free-form text is sufficient or if predefined templates are needed
   - Recommendation: Free-text `<textarea>` + Send button. Templates are future scope (CRM-F02 area). Keep it simple for v1.

3. **Client detail page — should it show an "Edit" action for name/email?**
   - What we know: Requirements do not mention editing client data. The phase success criteria only mention viewing booking history and sending a Telegram message.
   - Recommendation: Read-only detail view only. No edit form in Phase 5.

4. **`lastVisitAt` display timezone**
   - What we know: Bookings use `startsAt` in UTC, displayed in tenant timezone on the bookings page. `lastVisitAt` on `Client` is stored in UTC.
   - Recommendation: Use `toLocaleDateString('ru-RU')` without timezone conversion for the client list table (date-only display, no time, no timezone confusion). The detail page shows full booking records which can use the same locale-aware formatting already used in the bookings table.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest __tests__/client-ui-surface.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-06 | `dashboard-sidebar.tsx` contains `Users` icon import | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-06" --no-coverage` | ❌ Wave 0 |
| CRM-06 | `dashboard-sidebar.tsx` contains `/dashboard/clients` href | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-06" --no-coverage` | ❌ Wave 0 |
| CRM-06 | `app/dashboard/clients/page.tsx` exists | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-06" --no-coverage` | ❌ Wave 0 |
| CRM-07 | `components/clients-table.tsx` exists | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-07" --no-coverage` | ❌ Wave 0 |
| CRM-07 | `clients-table.tsx` contains `Table` import | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-07" --no-coverage` | ❌ Wave 0 |
| CRM-07 | `clients-table.tsx` contains `totalVisits` and `totalRevenue` | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-07" --no-coverage` | ❌ Wave 0 |
| CRM-07 | `clients-table.tsx` contains `hasTelegram` | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-07" --no-coverage` | ❌ Wave 0 |
| CRM-08 | `clients-table.tsx` contains `useState` and `useMemo` (search filter) | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-08" --no-coverage` | ❌ Wave 0 |
| CRM-08 | `clients-table.tsx` contains search placeholder or `searchPlaceholder` | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-08" --no-coverage` | ❌ Wave 0 |
| CRM-09 | `app/dashboard/clients/[clientId]/page.tsx` exists | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-09" --no-coverage` | ❌ Wave 0 |
| CRM-09 | Detail page contains `guestPhone` (booking query by phone) | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-09" --no-coverage` | ❌ Wave 0 |
| CRM-10 | `lib/actions/clients.ts` contains `sendTelegramToClient` | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-10" --no-coverage` | ❌ Wave 0 |
| CRM-10 | `clients.ts` `sendTelegramToClient` contains `sendTelegramMessage` call | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-10" --no-coverage` | ❌ Wave 0 |
| CRM-11 | `clients-table.tsx` contains `neu-` (Neumorphism class usage) | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-11" --no-coverage` | ❌ Wave 0 |
| CRM-12 | `translations.ts` contains `clients:` section | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-12" --no-coverage` | ❌ Wave 0 |
| CRM-12 | `translations.ts` clients section exists in all three locales (`ru`, `kz`, `en`) | static file assertion | `npx jest __tests__/client-ui-surface.test.ts -t "CRM-12" --no-coverage` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/client-ui-surface.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/client-ui-surface.test.ts` — covers CRM-06 through CRM-12 static assertions using the `safeRead` pattern established in `client-data-surface.test.ts`

---

## Sources

### Primary (HIGH confidence)
- `/home/yola/projects/sites/omni-book/lib/actions/clients.ts` — Confirmed: `getClients()` and `syncClients()` implemented, auth pattern, `revalidatePath('/dashboard/clients')`
- `/home/yola/projects/sites/omni-book/components/dashboard-sidebar.tsx` — Confirmed: `items` array structure, `t(section, tKey)` pattern, `mounted` guard, lucide-react imports
- `/home/yola/projects/sites/omni-book/components/ui/table.tsx` — Confirmed: `neu-inset bg-[var(--neu-bg)]` on container; `TableRow`/`TableCell` API
- `/home/yola/projects/sites/omni-book/components/ui/card.tsx` — Confirmed: `neu-raised` on Card root; `CardHeader`/`CardContent` structure
- `/home/yola/projects/sites/omni-book/lib/telegram.ts` — Confirmed: `sendTelegramMessage(chatId, text)` signature, no-op if `BOT_TOKEN` absent, fire-and-forget pattern
- `/home/yola/projects/sites/omni-book/lib/actions/billing.ts` — Confirmed: `sendTelegramMessage` fire-and-forget call pattern at production use site
- `/home/yola/projects/sites/omni-book/app/globals.css` — Confirmed: `.neu-raised`, `.neu-inset`, `.neu-btn` class definitions; `--neu-bg`, `--neu-shadow-*` CSS variables
- `/home/yola/projects/sites/omni-book/lib/i18n/translations.ts` — Confirmed: three-locale structure (`ru`/`kz`/`en`), no existing `clients` section, `dashboard` section keys, translation key patterns
- `/home/yola/projects/sites/omni-book/app/dashboard/bookings/page.tsx` — Confirmed: server component pattern (session + DB fetch + pass to client component)
- `/home/yola/projects/sites/omni-book/app/dashboard/layout.tsx` — Confirmed: `DashboardSidebar` props interface
- `/home/yola/projects/sites/omni-book/.planning/phases/04-client-data-foundation/04-RESEARCH.md` — Confirmed: Phase 4 design decisions (no Booking[] on Client, identity key, no telegramChatId on Client)
- `/home/yola/projects/sites/omni-book/__tests__/client-data-surface.test.ts` — Confirmed: `safeRead` pattern, test file structure for this codebase

### Secondary (MEDIUM confidence)
- None — all findings verified against actual source files

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present and in active use
- Architecture (page/component structure): HIGH — mirrors existing dashboard pages exactly
- Telegram outreach pattern: HIGH — `sendTelegramMessage` call site confirmed in `billing.ts`; `telegramChatId` on Booking confirmed in `telegram/route.ts`
- I18n: HIGH — translation structure confirmed; keys designed to match existing section/key patterns
- Pitfalls: HIGH — identified from actual code (sidebar `mounted` guard, Date serialization in App Router, Neumorphic CSS token constraints)
- Validation: HIGH — test framework confirmed, `safeRead` pattern confirmed in two test files

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days — stable Next.js + Prisma + Neumorphic design system)
