# OMNI-BOOK — Полное руководство по проекту

> **Статус:** Production-ready SaaS платформа для онлайн-бронирования
> **Дата:** 2026-03-13
> **Версия стека:** Next.js 15.5 / React 19 / Prisma 6.7 / PostgreSQL 16

---

## СОДЕРЖАНИЕ

1. [Обзор проекта](#1-обзор-проекта)
2. [Быстрый старт](#2-быстрый-старт)
3. [Структура файлов](#3-структура-файлов)
4. [База данных (Prisma)](#4-база-данных-prisma)
5. [Мультитенантность](#5-мультитенантность)
6. [Аутентификация (NextAuth)](#6-аутентификация-nextauth)
7. [Middleware и routing](#7-middleware-и-routing)
8. [Движок бронирования](#8-движок-бронирования)
9. [Система ниш](#9-система-ниш)
10. [Интернационализация (i18n)](#10-интернационализация-i18n)
11. [API маршруты](#11-api-маршруты)
12. [Server Actions](#12-server-actions)
13. [Компоненты](#13-компоненты)
14. [Страницы (Pages)](#14-страницы-pages)
15. [Admin Panel и Billing](#15-admin-panel-и-billing)
16. [Аналитика](#16-аналитика)
17. [Email (Resend)](#17-email-resend)
18. [Telegram интеграция](#18-telegram-интеграция)
19. [Валидации (Zod)](#19-валидации-zod)
20. [Утилиты](#20-утилиты)
21. [Скрипты](#21-скрипты)
22. [Тесты](#22-тесты)
23. [Конфигурация](#23-конфигурация)
24. [Переменные окружения](#24-переменные-окружения)
25. [Тестовые аккаунты и данные](#25-тестовые-аккаунты-и-данные)
26. [Критические правила разработки](#26-критические-правила-разработки)
27. [Деплой и CRON](#27-деплой-и-cron)

---

## 1. Обзор проекта

**Omni-Book** — универсальная мультитенантная SaaS платформа для онлайн-бронирования, охватывающая 4 ниши:

| Ниша | Тип бизнеса | Тип ресурса |
|------|-------------|-------------|
| `medicine` | Клиники, психологи, юристы | Специалисты, кабинеты |
| `beauty` | Парикмахеры, барберы, тату | Мастера |
| `horeca` | Кафе, рестораны, антикафе | Столы, залы |
| `sports` | Корты, фото-студии, лофты | Корты, площадки |

Каждый бизнес — отдельный **тенант**, изолированный по `tenantId`. Ниша влияет только на UI (шаблон страницы, названия, атрибуты ресурсов) — не на бизнес-логику.

---

## 2. Быстрый старт

### Требования
- Node.js 20+
- Docker (для PostgreSQL)
- npm

### Установка и запуск

```bash
# 1. Запустить PostgreSQL
docker compose up -d

# 2. Установить зависимости
npm install

# 3. Синхронизировать схему БД
npx prisma db push

# 4. Заполнить тестовыми данными (5 тенантов)
npx prisma db seed

# 5. Создать суперадмина
npx ts-node scripts/create-admin.ts admin@omnibook.com yourpassword

# 6. Запустить production-сервер через PM2 на порту 3050
pm2 start npm --name "omni-book" -- start -- -p 3050

# > ⚠️ ПОРТ 3050 — основной порт приложения.
# > База данных PostgreSQL проброшена на нестандартный порт 5434 для безопасности.

```

> ⚠️ **ПОРТ 3030** — не 3000! В WSL порт 3000 обычно занят.
> `NEXTAUTH_URL` должен быть `http://localhost:3030`

### Полезные команды

```bash
npx tsc --noEmit                   # Проверка типов
npx prisma db push --force-reset   # Сброс и пересоздание схемы
npx prisma studio                  # GUI для БД на :5555
npx prisma db seed                 # Пересев данных
npm run build                      # Production build
```

---

## 3. Структура файлов

```
omni-book/
│
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Layout-группа: страницы авторизации
│   │   ├── login/page.tsx         # Страница входа
│   │   └── register/page.tsx      # Страница регистрации
│   │
│   ├── (marketing)/               # Layout-группа: маркетинг
│   │   └── page.tsx               # Landing page (главная)
│   │
│   ├── (tenant)/                  # Layout-группа: публичные страницы
│   │   ├── [slug]/page.tsx        # Динамическая страница тенанта /[slug]
│   │   └── clinic/page.tsx        # Legacy редирект → city-polyclinic
│   │
│   ├── admin/                     # Admin panel (только SUPERADMIN)
│   │   ├── page.tsx               # Admin overview
│   │   └── tenants/
│   │       ├── page.tsx           # Список всех тенантов
│   │       └── admin-tenant-row.tsx  # Компонент строки таблицы
│   │
│   ├── api/                       # API routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   └── register/route.ts  # POST регистрация
│   │   ├── bookings/
│   │   │   ├── route.ts           # GET список / POST создать
│   │   │   ├── [id]/status/route.ts  # PATCH изменить статус
│   │   │   ├── slots/route.ts     # GET доступные слоты
│   │   │   ├── calendar/route.ts  # GET неделя по ресурсам
│   │   │   └── busy/route.ts      # GET занятые окна
│   │   ├── resources/route.ts     # (legacy/internal)
│   │   ├── tenants/route.ts       # (legacy/internal)
│   │   ├── cron/reminders/route.ts # GET крон-напоминания
│   │   ├── force-signout/route.ts # GET редирект при бане
│   │   ├── telegram/webhook/route.ts  # POST Telegram webhook
│   │   └── webhooks/route.ts      # POST внешние вебхуки (TODO)
│   │
│   ├── banned/page.tsx            # Страница для забаненных
│   ├── dashboard/                 # Dashboard (OWNER, STAFF, SUPERADMIN)
│   │   ├── layout.tsx             # Layout с сайдбаром
│   │   ├── page.tsx               # Обзор: stats + upcoming
│   │   ├── resources/page.tsx     # Управление ресурсами
│   │   ├── services/page.tsx      # Управление услугами
│   │   ├── bookings/page.tsx      # Управление бронированиями
│   │   ├── analytics/page.tsx     # Аналитика
│   │   └── settings/
│   │       ├── page.tsx           # Настройки тенанта
│   │       └── billing/
│   │           ├── page.tsx
│   │           └── billing-content.tsx  # Биллинг UI
│   │
│   ├── globals.css                # Глобальные стили Tailwind
│   └── layout.tsx                 # Root layout (I18nProvider + fonts)
│
├── components/                    # React компоненты
│   ├── ui/                        # shadcn/ui примитивы
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── sonner.tsx             # Toast провайдер
│   │   ├── phone-input.tsx        # Кастомный input телефона
│   │   └── ...
│   ├── booking-form.tsx           # Многоэтапная форма бронирования
│   ├── booking-calendar.tsx       # Недельный calendar view
│   ├── booking-status-badge.tsx   # Бейдж статуса бронирования
│   ├── bookings-dashboard.tsx     # Таблица + calendar бронирований
│   ├── resources-manager.tsx      # CRUD ресурсов
│   ├── resource-form.tsx          # Форма ресурса (нишевые поля)
│   ├── services-manager.tsx       # CRUD услуг
│   ├── service-form.tsx           # Форма услуги
│   ├── settings-form.tsx          # Форма настроек тенанта
│   ├── analytics-dashboard.tsx    # Графики (Recharts)
│   ├── dashboard-sidebar.tsx      # Сайдбар навигации
│   ├── tenant-public-page.tsx     # Публичная страница тенанта
│   └── locale-switcher.tsx        # Переключатель языка
│
├── lib/                           # Бизнес-логика и утилиты
│   ├── db/
│   │   └── index.ts               # basePrisma + getTenantDB()
│   ├── auth/
│   │   ├── config.ts              # NextAuth конфиг
│   │   ├── guards.ts              # requireAuth, requireRole, requireTenant
│   │   └── types.ts               # NextAuth type augmentations
│   ├── tenant/
│   │   ├── context.ts             # AsyncLocalStorage для tenantId
│   │   ├── prisma-tenant.ts       # Prisma $allOperations extension
│   │   └── resolve.ts             # resolveTenant(request)
│   ├── booking/
│   │   └── engine.ts              # getAvailableSlots + createBooking
│   ├── niche/
│   │   └── config.ts              # NICHE_CONFIG, getNicheConfig()
│   ├── i18n/
│   │   ├── translations.ts        # Все переводы RU/KZ/EN (~72KB)
│   │   ├── context.tsx            # I18nProvider + useI18n()
│   │   ├── server.ts              # getServerT() для Server Components
│   │   └── db-translations.ts     # getDbTranslation() из БД
│   ├── email/
│   │   └── resend.ts              # Email-уведомления
│   ├── telegram.ts                # sendTelegramMessage()
│   ├── actions/
│   │   ├── resources.ts           # Server Actions: ресурсы
│   │   ├── services.ts            # Server Actions: услуги
│   │   ├── tenant-settings.ts     # Server Actions: настройки
│   │   ├── analytics.ts           # Server Actions: аналитика
│   │   ├── admin.ts               # Server Actions: управление тенантами
│   │   └── billing.ts             # Server Actions: биллинг
│   ├── validations/
│   │   ├── resource.ts            # Zod схемы ресурса
│   │   ├── service.ts             # Zod схемы услуги
│   │   └── tenant-settings.ts     # Zod схемы настроек
│   └── utils/
│       ├── phone.ts               # formatPhone + normalizePhone
│       └── utils.ts               # cn() (clsx + tailwind-merge)
│
├── prisma/
│   ├── schema.prisma              # Схема БД
│   └── seed.ts                    # Seed 5 тестовых тенантов
│
├── scripts/
│   ├── create-admin.ts            # Создать SUPERADMIN
│   └── seed-demos.ts              # Расширенный seed с демо-бронированиями
│
├── __tests__/                     # Jest тесты
│   └── lib/tenant/                # Тесты мультитенантности (30 тестов)
│
├── public/                        # Статические файлы
├── middleware.ts                  # JWT проверка + route protection
├── CLAUDE.md                      # Инструкции для Claude Code
├── docker-compose.yml             # PostgreSQL контейнер
├── vercel.json                    # CRON jobs конфиг
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. База данных (Prisma)

### Схема: `/prisma/schema.prisma`

#### Модель `Tenant`

```prisma
model Tenant {
  id          String     @id @default(cuid())
  slug        String     @unique          // URL: /[slug]
  name        String
  niche       String?                     // medicine|beauty|horeca|sports
  isActive    Boolean    @default(true)
  plan        Plan       @default(FREE)   // FREE|PRO|ENTERPRISE
  planStatus  PlanStatus @default(ACTIVE) // ACTIVE|PENDING|EXPIRED|BANNED
  maxResources Int       @default(1)      // Лимит ресурсов по тарифу
  timezone    String     @default("Asia/Almaty")

  // Контактные данные
  address     String?
  city        String?
  email       String?
  phone       String?
  website     String?
  workingHours String?
  logoUrl     String?
  coverUrl    String?
  description String?

  // JSON поля
  socialLinks Json       @default("{}")   // { instagram, whatsapp, telegram }
  translations Json      @default("{}")   // { kz: {name, desc}, en: {name, desc} }

  // Telegram
  telegramChatId String?

  // Биллинг
  subscriptionExpiresAt DateTime?

  // Relations
  bookings    Booking[]
  resources   Resource[]
  services    Service[]
  users       User[]
}
```

#### Модель `User`

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  phone        String?
  passwordHash String?
  role         Role      @default(CUSTOMER)  // SUPERADMIN|OWNER|STAFF|CUSTOMER
  tenantId     String?                        // null для SUPERADMIN
  emailVerified DateTime?

  tenant       Tenant?   @relation(...)
  bookings     Booking[]
}
```

Роль `SUPERADMIN` имеет `tenantId = null` — не привязан ни к одному бизнесу.

#### Модель `Resource`

Ресурс — это то, что бронируют. В зависимости от ниши это может быть:
- Врач / мастер / специалист (medicine, beauty)
- Стол / кабинет / зал (horeca)
- Корт / площадка / студия (sports)

```prisma
model Resource {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  type        String   // staff|room|court|table|equipment|other
  description String?
  capacity    Int?     // Для столов, залов
  attributes  Json     @default("{}")  // Динамические атрибуты (зависят от ниши)
  translations Json    @default("{}")  // { kz: {name, desc}, en: {name, desc} }
  isActive    Boolean  @default(true)

  bookings    Booking[]
  services    ResourceService[]
  schedules   Schedule[]
  tenant      Tenant   @relation(...)
}
```

**Атрибуты по нишам:**

| Ниша | Атрибуты |
|------|----------|
| medicine | specialization, license, experience_years, languages, equipment |
| beauty | specialization, experience_years, skills |
| horeca | capacity, location, features |
| sports | surface, indoor, capacity, equipment_included |

#### Модель `Schedule`

График работы ресурса по дням недели:

```prisma
model Schedule {
  id          String   @id @default(cuid())
  resourceId  String
  dayOfWeek   Int      // 0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб
  startTime   String   // "HH:MM"
  endTime     String   // "HH:MM"
  isActive    Boolean  @default(true)

  @@unique([resourceId, dayOfWeek])
}
```

**Дефолтные расписания при создании ресурса:**

| Ниша | Дни | Время |
|------|-----|-------|
| medicine | Пн-Пт (1-5) | 09:00-18:00 |
| beauty | Пн-Сб (1-6) | 09:00-19:00 |
| horeca | Ежедневно (0-6) | 10:00-23:00 |
| sports | Ежедневно (0-6) | 07:00-22:00 |

> ⚠️ Если у ресурса нет записи Schedule на день — считается выходным ("Не работает").

#### Модель `Service`

```prisma
model Service {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  durationMin Int      // Длительность в минутах
  price       Int?     // В ТИЙИНАХ (× 100). 5000 тенге = 500000 тийин
  currency    String   @default("KZT")
  translations Json    @default("{}")
  isActive    Boolean  @default(true)

  bookings    Booking[]
  resources   ResourceService[]  // M2M: какие ресурсы оказывают эту услугу
  tenant      Tenant   @relation(...)
}
```

> ⚠️ Цены хранятся в **тийинах** (минорные единицы). 1 тенге = 100 тийин.

#### Модель `ResourceService` (M2M)

```prisma
model ResourceService {
  resourceId String
  serviceId  String

  @@id([resourceId, serviceId])
}
```

#### Модель `Booking`

```prisma
model Booking {
  id          String        @id @default(cuid())
  tenantId    String        // Обязателен!
  resourceId  String
  serviceId   String?
  userId      String?       // Если авторизованный пользователь

  guestName   String?
  guestPhone  String?       // Хранится нормализованный: +77011112233
  guestEmail  String?

  startsAt    DateTime      // UTC
  endsAt      DateTime      // UTC
  status      BookingStatus @default(PENDING)
  notes       String?
  reminderSentAt DateTime?  // Когда отправлено email-напоминание

  @@index([tenantId, resourceId, startsAt])
  @@index([tenantId, status])
  @@index([startsAt, reminderSentAt])
}
```

**Статусная машина бронирования:**

```
PENDING ──► CONFIRMED ──► COMPLETED
  │              │              (финальный)
  ▼              ▼
CANCELLED    CANCELLED
(финальный)  (финальный)
                 │
                 ▼
              NO_SHOW
             (финальный)
```

Для **прошедших** бронирований (`endsAt < now`): `CONFIRMED → COMPLETED | NO_SHOW` только.

#### Перечисления (Enums)

```prisma
enum Role        { SUPERADMIN  OWNER  STAFF  CUSTOMER }
enum Plan        { FREE  PRO  ENTERPRISE }
enum PlanStatus  { ACTIVE  PENDING  EXPIRED  BANNED }
enum BookingStatus { PENDING  CONFIRMED  CANCELLED  COMPLETED  NO_SHOW }
```

---

## 5. Мультитенантность

### Как работает изоляция

**Файл:** `lib/db/index.ts`

Экспортирует два клиента:

```typescript
// 1. Чистый Prisma без расширений — для admin-операций и cross-tenant запросов
export const basePrisma = new PrismaClient()

// 2. Тенант-изолированный клиент
export function getTenantDB(tenantId: string): ExtendedPrismaClient
```

**Prisma Extension** (`lib/tenant/prisma-tenant.ts`) автоматически:
- Добавляет `where: { tenantId }` к любому `findMany`, `count`, `update`, `delete`
- Добавляет `data: { tenantId }` к `create`, `createMany`
- Post-валидирует `findUnique`/`findFirst` (если результат есть, но tenantId не совпадает — возвращает null)

**Модели с тенант-изоляцией:**

```typescript
const TENANT_SCOPED = ['user', 'resource', 'service', 'booking']
```

> ⚠️ `ResourceService` (M2M) **НЕ** в TENANT_SCOPED. Для него всегда используй `basePrisma`.

### Правило получения tenantId

**В Dashboard (Server Actions):**
```typescript
const session = await requireAuth()
const tenantId = session.user.tenantId  // ← из JWT сессии
```

**В API routes:**
```typescript
const tenant = await resolveTenant(req)
// resolveTenant читает x-tenant-slug header (устанавливается middleware)
// или query param ?tenantSlug=...
```

> ⚠️ **НИКОГДА** не читай tenantId из тела запроса от клиента — только из сессии или header.

### Перед удалением/обновлением — проверка владения

```typescript
// Перед update или delete убедись что запись принадлежит тенанту:
const resource = await basePrisma.resource.findFirst({
  where: { id, tenantId }
})
if (!resource) throw new Error('Not found')
```

---

## 6. Аутентификация (NextAuth)

### Конфигурация: `lib/auth/config.ts`

**Стратегия:** JWT (без DB adapter — faster, stateless)

**Providers:**
1. **Credentials** (email + bcryptjs password, 12 rounds)
2. **Google OAuth** (если `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` в .env)

**JWT содержит:** `id`, `role`, `tenantId`, `tenantSlug`

**Session содержит:** `id`, `email`, `name`, `role`, `tenantId`, `tenantSlug`

### Type augmentations: `lib/auth/types.ts`

```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role           // SUPERADMIN|OWNER|STAFF|CUSTOMER
      tenantId: string | null
      tenantSlug: string | null
    }
  }
}
```

### Guards: `lib/auth/guards.ts`

```typescript
requireAuth()                          // throws 401 если нет сессии
requireRole(session, ['OWNER'])        // throws 403 если роль не совпадает
requireTenant(session, tenantId)       // throws 403 если тенант не совпадает
```

### Доступ по ролям

| Раздел | SUPERADMIN | OWNER | STAFF | CUSTOMER |
|--------|-----------|-------|-------|----------|
| `/dashboard` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard/resources` | ✅ | ✅ | 👁️ read-only | ❌ |
| `/dashboard/bookings` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard/settings` | ✅ | ✅ | 👁️ read-only | ❌ |
| `/admin` | ✅ | ❌ | ❌ | ❌ |

---

## 7. Middleware и routing

**Файл:** `middleware.ts`

Выполняется на каждый запрос (кроме `_next/static`, `_next/image`, `favicon.ico`).

**Что делает:**

1. **Subdomain extraction** — для продакшена:
   - `myshop.omnibook.com` → устанавливает заголовок `x-tenant-slug: myshop`

2. **JWT validation** — читает NextAuth cookie, проверяет token

3. **Route protection:**
   - `/dashboard/*` → требует авторизацию, роль OWNER|STAFF|SUPERADMIN
   - `/admin/*` → требует роль SUPERADMIN
   - `/login`, `/register` → редирект на `/dashboard` если уже авторизован

4. **Locale propagation** — из cookie `omnibook-locale` → заголовок `x-omnibook-locale`

### URL структура

```
/                     # Landing (маркетинг)
/login                # Страница входа
/register             # Страница регистрации
/[slug]               # Публичная страница тенанта (booking form)
/dashboard            # Dashboard обзор
/dashboard/resources  # Управление ресурсами
/dashboard/services   # Управление услугами
/dashboard/bookings   # Управление бронированиями
/dashboard/analytics  # Аналитика
/dashboard/settings   # Настройки бизнеса
/dashboard/settings/billing  # Биллинг и тарифы
/admin                # Admin panel (SUPERADMIN only)
/admin/tenants        # Управление всеми тенантами
/banned               # Страница для заблокированных
```

---

## 8. Движок бронирования

**Файл:** `lib/booking/engine.ts`

### `getAvailableSlots(params)` — доступные слоты

```typescript
getAvailableSlots({
  tenantId: string,
  resourceId: string,
  date: string,        // "YYYY-MM-DD"
  serviceId: string,
}): Promise<SlotResult[]>
```

**Алгоритм:**
1. Определить день недели из `date`
2. Найти `Schedule` для ресурса на этот день → если нет или `isActive=false` → `DayOffError`
3. Загрузить существующие `PENDING|CONFIRMED` бронирования ресурса на день
4. Найти `Service.durationMin`
5. Генерировать слоты с шагом `durationMin` от `startTime` до `endTime`
6. Каждый слот пометить `available: false` если пересекается с существующим бронированием
7. Форматировать в timezone тенанта

**Возвращает:**
```typescript
{
  time: string,       // "10:30"
  startsAt: string,   // ISO UTC "2025-01-15T04:30:00.000Z"
  endsAt: string,
  available: boolean,
}[]
```

### `createBooking(params)` — атомное создание

```typescript
createBooking({
  tenantId, resourceId, serviceId,
  startsAt,       // ISO UTC string
  guestName, guestPhone, guestEmail?,
  userId?,
}): Promise<Booking>
```

**Алгоритм (внутри `$transaction` с Serializable isolation):**
1. `SELECT id FROM Resource WHERE id = ? FOR UPDATE` — блокировка ресурса
2. Проверить что Resource и Service принадлежат тенанту
3. **Anti-spam:** `SELECT COUNT(*) WHERE guestPhone = normalizedPhone AND status IN (PENDING, CONFIRMED) AND endsAt > now()` — max 2 активных записи
4. **Collision detection:** проверить пересечение `[startsAt, endsAt)` с существующими бронированиями
5. Если всё ок — создать `Booking` со статусом `PENDING`

**Exceptions:**
- `BookingConflictError` — время занято (409)
- `BookingLimitError` — превышен лимит по телефону (429)
- `ResourceNotFoundError` — ресурс не найден (404)
- `ServiceNotFoundError` — услуга не найдена (404)

---

## 9. Система ниш

**Файл:** `lib/niche/config.ts`

### Структура конфига

```typescript
interface NicheConfig {
  label: string              // "Медицина"
  icon: string               // "🏥"
  color: string              // "blue"
  accentClass: string        // "text-blue-600"

  resourceTypes: { value: string; label: string }[]
  resourceLabel: string      // "Специалист"
  resourceLabelPlural: string // "Специалисты"
  serviceLabel: string       // "Услуга"
  bookingLabel: string       // "Записаться"

  attributeFields: AttributeField[]  // Динамические поля

  heroTitle: string
  heroSubtitle: string
}
```

### Динамические поля атрибутов

```typescript
interface AttributeField {
  key: string              // "specialization"
  label: string            // "Специализация"
  type: 'text' | 'number' | 'boolean' | 'select'
  options?: string[]       // Для type='select'
  forTypes?: string[]      // Показывать только для этих resourceTypes
  showInTable?: boolean    // Показывать в таблице и публичной странице
}
```

### Использование

```typescript
const nicheConfig = getNicheConfig(tenant.niche)  // fallback на 'medicine'

// В форме ресурса — динамические поля:
nicheConfig.attributeFields.forEach(field => {
  if (!field.forTypes || field.forTypes.includes(resourceType)) {
    renderField(field)
  }
})

// В публичной странице — атрибуты в карточках:
nicheConfig.attributeFields
  .filter(f => f.showInTable)
  .forEach(f => renderAttribute(resource.attributes[f.key]))
```

---

## 10. Интернационализация (i18n)

### Поддерживаемые локали
- `ru` — русский (основной, fallback)
- `kz` — казахский
- `en` — английский

### Структура переводов: `lib/i18n/translations.ts`

```typescript
translations = {
  ru: {
    common: { loading: "Загрузка...", save: "Сохранить", ... },
    landing: { hero: "Умная запись...", ... },
    auth: { login: "Войти", register: "Регистрация", ... },
    dashboard: { bookings: "Бронирования", resources: "Ресурсы", ... },
    niche: { medicine: "Медицина", ... },
    booking: { stepService: "Услуга", ... },
    days: { mon: "Пн", tue: "Вт", ... },
    settings: { ... },
    form: { ... },
  },
  kz: { /* то же самое на казахском */ },
  en: { /* то же самое на английском */ },
}
```

### В Server Components: `getServerT()`

```typescript
// Читает заголовок x-omnibook-locale (из middleware)
const t = await getServerT()
const label = t('booking', 'stepService')  // → "Услуга" | "Қызмет" | "Service"
```

### В Client Components: `useI18n()`

```typescript
const { t, locale, setLocale } = useI18n()
const label = t('common', 'save')
```

### Переводы из БД: `getDbTranslation()`

Для переводов полей `name` и `description` сущностей (Resource, Service, Tenant), хранящихся в JSON-поле `translations`:

```typescript
getDbTranslation(resource, 'name', 'kz')
// 1. Если locale='ru' → resource.name
// 2. Если resource.translations.kz.name существует → возвращает его
// 3. Fallback → resource.name
```

---

## 11. API маршруты

### POST `/api/auth/register`

Создание аккаунта + тенанта.

**Body:**
```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "secret123",
  "tenantName": "Моя клиника",
  "slug": "my-clinic",
  "niche": "medicine"
}
```

**Валидация slug:** `/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/`

**Ответы:** `201` (tenantSlug, userId), `409` (slug или email занят), `422` (ошибки валидации)

---

### GET `/api/bookings`

Список бронирований тенанта.

**Query params:**
```
tenantSlug=city-polyclinic  (обязательный)
status=PENDING,CONFIRMED    (опционально, через запятую)
dateFrom=2025-01-01         (YYYY-MM-DD)
dateTo=2025-01-31
resourceId=clx123...
page=1
limit=20
```

**Ответ:**
```json
{
  "data": [...],
  "total": 45,
  "page": 1,
  "totalPages": 3,
  "limit": 20
}
```

---

### POST `/api/bookings`

Создание бронирования (публичная форма на сайте тенанта).

**Query:** `?tenantSlug=city-polyclinic`

**Body:**
```json
{
  "serviceId": "clx...",
  "resourceId": "clx...",
  "startsAt": "2025-01-15T06:00:00.000Z",
  "guestName": "Мария Петрова",
  "guestPhone": "+77011112233",
  "guestEmail": "maria@example.com"
}
```

**Ответы:** `201` (booking), `409` (время занято), `422` (валидация), `429` (лимит)

---

### PATCH `/api/bookings/[id]/status`

Изменить статус бронирования (требует авторизации OWNER|STAFF|SUPERADMIN).

**Body:** `{ "status": "CONFIRMED" }`

**Ответы:** `200` (booking), `401`, `403`, `404`, `422` (недопустимый переход)

---

### GET `/api/bookings/slots`

Доступные слоты на конкретный день.

**Query:**
```
tenantSlug=city-polyclinic
resourceId=clx...
serviceId=clx...
date=2025-01-15
```

**Ответ:**
```json
{
  "slots": [
    { "time": "09:00", "startsAt": "...", "endsAt": "...", "available": true },
    { "time": "09:30", "startsAt": "...", "endsAt": "...", "available": false }
  ],
  "dayOff": false
}
```

---

### GET `/api/bookings/calendar`

Недельное представление для calendar view.

**Query:** `tenantSlug`, `weekStart=YYYY-MM-DD`, `resourceIds=id1,id2`

**Ответ:**
```json
{
  "resourceId1": {
    "resourceName": "Dr. Petrov",
    "resourceType": "staff",
    "bookings": [{ "id", "startsAt", "endsAt", "status", ... }]
  }
}
```

---

### GET `/api/bookings/busy`

Занятые окна для упрощённого отображения.

**Query:** `tenantSlug`, `resourceId`, `date=YYYY-MM-DD`

---

### GET `/api/cron/reminders`

Отправка email-напоминаний. Вызывается Vercel CRON каждый час.

**Заголовок:** `Authorization: Bearer {CRON_SECRET}`

**Логика:** находит бронирования, у которых `startsAt` в диапазоне `[now+23h, now+25h]` и `reminderSentAt IS NULL`, отправляет email и ставит `reminderSentAt = now`.

---

### POST `/api/telegram/webhook`

Обработчик Telegram bot команд.

**Поддерживаемые команды:**
```
/add_superadmin email password    # Создать SUPERADMIN пользователя
```

**Защита:** `x-telegram-bot-api-secret-token` header.

---

## 12. Server Actions

Все Actions используют `'use server'` и работают с NextAuth сессией.

### Resources: `lib/actions/resources.ts`

```typescript
getResources(): Promise<ResourceWithRelations[]>

createResource(data, scheduleData?): Promise<ResourceWithRelations>
// Проверяет: session, tenantId, лимит maxResources
// Создаёт ресурс + Schedule entries (дефолтные если scheduleData не передан)

updateResource(id, data, scheduleData?): Promise<ResourceWithRelations>
// Проверяет принадлежность ресурса тенанту

deleteResource(id): Promise<void>
// Проверяет: нет ли PENDING|CONFIRMED бронирований в будущем
// Throws: "FUTURE_BOOKINGS:N" если есть

toggleResourceActive(id): Promise<ResourceWithRelations>
```

### Services: `lib/actions/services.ts`

```typescript
getServices(): Promise<ServiceWithRelations[]>

createService(data): Promise<ServiceWithRelations>
// Создаёт Service + ResourceService записи (M2M)
// Использует basePrisma.resourceService.createMany (не в TENANT_SCOPED!)

updateService(id, data): Promise<ServiceWithRelations>
// Удаляет старые ResourceService + создаёт новые

deleteService(id): Promise<void>  // Soft delete (isActive = false)
toggleServiceActive(id): Promise<ServiceWithRelations>
```

### Tenant Settings: `lib/actions/tenant-settings.ts`

```typescript
getTenantSettings(): Promise<Tenant>

updateTenantSettings(data): Promise<void>
// Сохраняет: name, description, phone, email, address, city
//            website, logoUrl, coverUrl, workingHours
//            timezone, socialLinks, telegramChatId
//            translations (merge с существующими)
```

### Analytics: `lib/actions/analytics.ts`

```typescript
getAnalytics(period: '7d' | '30d' | '90d'): Promise<AnalyticsData>
// Возвращает:
// - bookingsChart: [{ date, label, total, confirmed, cancelled, revenue }]
// - resourceChart: [{ name, bookings }]
// - servicesChart: [{ name, bookings, revenue }]
// - summary: { totalBookings, totalRevenue, completionRate, cancelRate }
```

### Admin: `lib/actions/admin.ts` (только SUPERADMIN)

```typescript
updateTenantPlan(tenantId, plan, planStatus): Promise<{success} | {error}>
// При смене плана автоматически меняет maxResources:
// FREE=1, PRO=20, ENTERPRISE=100

updateTenantMaxResources(tenantId, maxResources): Promise<{success} | {error}>
banTenant(tenantId): Promise<{success} | {error}>
deleteTenant(tenantId): Promise<{success} | {error}>
// Каскадное удаление: Users, Resources, Services, Bookings
```

### Billing: `lib/actions/billing.ts` (только OWNER)

```typescript
requestProActivation(): Promise<{success} | {success: false, error}>
// Ставит planStatus = PENDING
// Отправляет Telegram уведомление ADMIN_TELEGRAM_CHAT_ID
```

---

## 13. Компоненты

### `BookingForm` (`components/booking-form.tsx`)

Многошаговая форма бронирования для публичной страницы тенанта.

**Шаги:**
1. **Service** — выбор услуги (radio группа с ценой и длительностью)
2. **Resource** — выбор специалиста/ресурса (фильтрованный по serviceIds)
3. **DateTime** — выбор даты + слота времени (реальный fetch слотов)
4. **Confirm** — ввод имени, телефона, email → submit

**Props:**
```typescript
{
  tenantSlug: string
  services: ServiceOption[]
  resources: ResourceOption[]
  bookingLabel?: string     // Текст кнопки ("Записаться", "Забронировать")
  resourceLabel?: string    // "Специалист", "Стол", "Корт"
  nicheColor?: string       // "blue"|"pink"|"orange"|"green"
}
```

**После успеха:** экран подтверждения с деталями + кнопка скачать `.ics` файл

---

### `BookingsDashboard` (`components/bookings-dashboard.tsx`)

Управление бронированиями в dashboard.

**Режимы:** таблица (список) + calendar (неделя)

**Возможности:**
- Фильтры: статус (мульти), ресурс, дата
- Pagination
- Изменение статуса прямо из таблицы/календаря
- Оптимистичные обновления с rollback при ошибке

---

### `BookingCalendar` (`components/booking-calendar.tsx`)

Недельный calendar view.

**Особенности:**
- CSS Grid: 7 колонок (дни) × часы (8:00-20:00)
- Абсолютное позиционирование бронирований (top/height в px)
- Визуализация перекрывающихся бронирований (track layout)
- Цветовая палитра по ресурсам (7 цветов в ротации)
- Текущая линия времени (обновляется каждую минуту)
- Click → Dialog с деталями и кнопками смены статуса

---

### `ResourcesManager` (`components/resources-manager.tsx`)

CRUD интерфейс для ресурсов.

- Таблица с фильтрами (тип, статус)
- Кнопки: Edit, Toggle active/inactive, Delete
- Диалоги для создания/редактирования (через `ResourceForm`)
- Mobile: карточки вместо таблицы
- Проверка future bookings перед удалением (показывает кол-во)

---

### `ResourceForm` (`components/resource-form.tsx`)

Форма создания/редактирования ресурса.

- Динамические поля атрибутов (зависят от `niche`)
- Schedule editor (7 дней, включение/выключение, time picker)
- Tabs для переводов RU/KZ/EN
- react-hook-form + zodResolver

---

### `SettingsForm` (`components/settings-form.tsx`)

Форма настроек тенанта.

**Секции:**
1. Основное (название, описание, переводы)
2. Контакты (телефон, email, адрес, сайт)
3. Брендинг (логотип URL, обложка URL)
4. График работы (текстовое поле)
5. Социальные сети (Instagram, WhatsApp, Telegram)
6. Telegram Chat ID (для уведомлений)
7. Часовой пояс (select)

---

### `DashboardSidebar` (`components/dashboard-sidebar.tsx`)

Client Component (использует `usePathname`).

**На мобильном:** Sheet (drawer)
**На десктопе:** Фиксированный aside

**Содержит:**
- Логотип + название тенанта
- Навигация (нишевые названия пунктов)
- Плашка текущего плана (FREE/PRO/ENTERPRISE)
- Аватар пользователя + email + кнопка Sign Out
- Переключатель языка

---

### `TenantPublicPage` (`components/tenant-public-page.tsx`)

Server Component — публичная страница тенанта.

**Секции:**
1. Hero (нишевый цвет, название, описание)
2. Список ресурсов с атрибутами (specialization, etc.)
3. Список услуг с ценами
4. Социальные ссылки
5. Форма бронирования (`BookingForm`)

---

### `AnalyticsDashboard` (`components/analytics-dashboard.tsx`)

Recharts-based дашборд аналитики.

**Графики:**
- Bar chart: бронирования по дням
- Area chart: доход по дням
- Pie chart: популярность услуг
- Горизонтальный Bar: загрузка ресурсов

**Period switcher:** 7 дней / 30 дней / 90 дней

---

## 14. Страницы (Pages)

### Landing: `app/(marketing)/page.tsx`

Маркетинговая страница. Секции:
- Hero с CTA "Создать бесплатно"
- NicheCards (4 ниши с иконками)
- Features / How it works
- Pricing table (FREE / PRO / ENTERPRISE)

---

### Dashboard Overview: `app/dashboard/page.tsx`

Server Component. Показывает:
- Stat cards: всего бронирований, ожидающих, сегодня, на этой неделе
- Ближайшие бронирования (таблица/список)

---

### Admin: `app/admin/tenants/page.tsx`

Server Component (только SUPERADMIN).

Показывает таблицу всех тенантов с:
- Инфо: название, slug, email, дата регистрации
- Управление: план (select), статус (select), maxResources (input)
- Кнопки: Ban, Delete
- Счётчик ресурсов (`_count.resources`)

---

## 15. Admin Panel и Billing

### Тарифные планы

| План | maxResources | Цена |
|------|-------------|------|
| FREE | 1 | Бесплатно |
| PRO | 20 | Платно |
| ENTERPRISE | 100 | Платно |

### Статусы тенантов

| Статус | Описание |
|--------|----------|
| `ACTIVE` | Нормальная работа |
| `PENDING` | Заявка на апгрейд подана, ожидает ручной активации |
| `EXPIRED` | Подписка истекла |
| `BANNED` | Заблокирован → редирект на `/banned` |

### Биллинг flow (ручной)

1. Владелец нажимает "Upgrade to PRO" в `/dashboard/settings/billing`
2. `requestProActivation()` → `planStatus = PENDING` + Telegram уведомление SUPERADMIN
3. SUPERADMIN вручную подтверждает оплату через Admin Panel
4. `updateTenantPlan(tenantId, 'PRO', 'ACTIVE')` → `plan = PRO`, `maxResources = 20`, `planStatus = ACTIVE`

### Проверка лимита ресурсов

В `createResource()`:
```typescript
const currentCount = await db.resource.count({ where: { tenantId } })
const maxRes = tenant.maxResources || 1
if (currentCount >= maxRes) {
  throw new Error('Лимит ресурсов исчерпан...')
}
```

---

## 16. Аналитика

**Server Action:** `lib/actions/analytics.ts`

```typescript
const analytics = await getAnalytics('30d')

analytics.summary = {
  totalBookings: 145,
  totalRevenue: 725000,    // В тийинах (тенге × 100)
  completionRate: 78.5,    // %
  cancelRate: 12.3,        // %
}

analytics.bookingsChart = [
  { date: "2025-01-01", label: "1 янв", total: 5, confirmed: 3, cancelled: 1, revenue: 25000 },
  ...
]
```

**Компонент:** `components/analytics-dashboard.tsx` использует **Recharts** (BarChart, AreaChart, PieChart, ResponsiveContainer).

---

## 17. Email (Resend)

**Файл:** `lib/email/resend.ts`

**Требует:** `RESEND_API_KEY` в `.env`. Если не задан — функции работают как no-op (без ошибок).

### Типы писем

```typescript
// Подтверждение бронирования
sendBookingConfirmation({
  guestName, guestEmail, tenantName,
  serviceName, resourceName, startsAt, timezone
})

// Напоминание (за 23-25 ч до записи, через CRON)
sendBookingReminder({
  guestName, guestEmail, tenantName,
  serviceName, resourceName, startsAt, timezone
})

// Отмена бронирования
sendBookingCancellation({
  guestName, guestEmail, tenantName,
  serviceName, resourceName, startsAt
})
```

Все функции fire-and-forget: вызываются с `.catch(console.error)` и не блокируют ответ API.

---

## 18. Telegram интеграция

### Уведомления владельцу бизнеса

При создании бронирования (`POST /api/bookings`):
- Если у тенанта задан `telegramChatId` → отправляется сообщение
- Формат: "🔔 Новая запись! 👤 Клиент: ... 📅 Дата: ... ⏰ Время: ..."

### Уведомления SUPERADMIN

При запросе апгрейда (`requestProActivation()`):
- Если задан `ADMIN_TELEGRAM_CHAT_ID` → сообщение "💰 Новая заявка на оплату!"

### Telegram Bot команды

Webhook: `POST /api/telegram/webhook`

```
/add_superadmin email password   # Создать SUPERADMIN пользователя
```

Защита: `TELEGRAM_WEBHOOK_SECRET` должен совпадать с `x-telegram-bot-api-secret-token` заголовком.

### Настройка Telegram Chat ID

1. Создать бота через @BotFather, получить `TELEGRAM_BOT_TOKEN`
2. Написать боту, получить `chat_id` через `getUpdates`
3. Вставить `chat_id` в настройки тенанта (Settings → Telegram Chat ID)
4. Для SUPERADMIN — в `ADMIN_TELEGRAM_CHAT_ID` env variable

---

## 19. Валидации (Zod)

### Resource: `lib/validations/resource.ts`

```typescript
createResourceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['staff','room','court','table','equipment','other']),
  description: z.string().max(500).optional(),
  capacity: z.number().int().min(1).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  translations: z.record(z.string(), z.record(z.string(), z.string())).optional(),
})
```

### Service: `lib/validations/service.ts`

```typescript
createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  durationMin: z.number().int().min(5),  // Минимум 5 минут
  price: z.number().min(0).optional(),   // В тенге (form), в БД × 100
  currency: z.enum(['KZT','RUB','USD','EUR']).default('KZT'),
  resourceIds: z.array(z.string()),
  translations: z.record(...).optional(),
})
```

**Доступные длительности:**
`5, 10, 15, 20, 30, 40, 45, 60, 90, 120, 180` минут

### Tenant Settings: `lib/validations/tenant-settings.ts`

```typescript
tenantSettingsSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  coverUrl: z.string().url().optional().or(z.literal('')),
  workingHours: z.string().optional(),
  timezone: z.string(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    whatsapp: z.string().optional(),
    telegram: z.string().optional(),
  }).optional(),
  translations: z.record(...).optional(),
  telegramChatId: z.string().optional(),
})
```

---

## 20. Утилиты

### Phone: `lib/utils/phone.ts`

```typescript
// Форматирование для отображения
formatPhone("+77011112233")  // → "+7 (701) 111 22 33"
formatPhone("87011112233")   // → "+7 (701) 111 22 33"

// Нормализация для БД и сравнений
normalizePhone("+7 (701) 111-22-33")  // → "+77011112233"
normalizePhone("87011112233")          // → "+77011112233"
```

### Utils: `lib/utils.ts`

```typescript
// Объединение CSS классов (clsx + tailwind-merge)
cn("flex gap-2", condition && "bg-red-500", "px-4")
```

---

## 21. Скрипты

### `scripts/create-admin.ts`

Создать или обновить SUPERADMIN пользователя:

```bash
npx ts-node scripts/create-admin.ts email@example.com password123
# По умолчанию: admin@omnibook.com / SuperAdmin123!
```

Если пользователь с таким email уже существует — обновляет его до SUPERADMIN и обнуляет tenantId.

### `scripts/seed-demos.ts`

Расширенный seed с демо-бронированиями. Безопасен для повторного запуска (idempotent).

```bash
npx ts-node scripts/seed-demos.ts
```

### `prisma/seed.ts`

Основной seed (запускается через `npx prisma db seed`):
- 5 тенантов (medicine×2, beauty, horeca, sports)
- Ресурсы + услуги + расписания для каждого
- 5 владельцев с паролем `password123`

---

## 22. Тесты

**Директория:** `__tests__/lib/tenant/`

**Тест-runner:** Jest + ts-node

**Покрытие:** 30 тестов для системы мультитенантности

```bash
npm test
```

**Что тестируется:**
- Prisma extension: инъекция tenantId
- Изоляция между тенантами
- Guards: requireAuth, requireRole
- resolveTenant() из запроса

---

## 23. Конфигурация

### `next.config.ts`

```typescript
// Разрешены внешние изображения с любых хостов
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**' },
    { protocol: 'http', hostname: '**' },
  ]
}
```

### `vercel.json`

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }]
}
```

CRON запускается каждый час для отправки email-напоминаний.

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

### `tailwind.config.ts`

Tailwind v4. **Важно:** нельзя использовать template literals для классов:
```typescript
// ❌ Неправильно — Tailwind не может статически анализировать
`bg-${color}-600`

// ✅ Правильно — статические строки
const COLORS = { blue: 'bg-blue-600', pink: 'bg-pink-600' }
COLORS[color]
```

### `eslint.config.mjs`

Включает `@typescript-eslint/no-explicit-any` как ошибку. Вместо `any` использовать:
- `unknown` + `instanceof Error`
- `as unknown as SpecificType`
- Конкретные интерфейсы
- `Record<string, string>` для объектов со строковыми значениями

---

## 24. Переменные окружения

**Файл:** `.env` (создать из `.env.example`)

### Обязательные

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/omni_book"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
# URL должен точно совпадать с тем, где крутится PM2 (или Tailscale IP)
NEXTAUTH_URL="http://100.114.227.13:3050"
```

> ⚠️ `NEXTAUTH_URL` должен быть точно `http://localhost:3030`. Несоответствие вызывает redirect на неправильный сервер в WSL.

### Опциональные

```env
# Домен для subdomains в production
ROOT_DOMAIN="omnibook.com"

# Email уведомления (отключены если не задан)
RESEND_API_KEY=""

# Telegram бот
TELEGRAM_BOT_TOKEN=""
ADMIN_TELEGRAM_CHAT_ID=""        # Куда слать заявки на апгрейд
TELEGRAM_WEBHOOK_SECRET=""       # Защита webhook эндпоинта

# CRON защита
CRON_SECRET=""

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## 25. Тестовые аккаунты и данные

**Пароль для всех:** `password123`

| Email | Тенант (slug) | Ниша | Роль |
|-------|---------------|------|------|
| clinic-owner@test.com | city-polyclinic | medicine | OWNER |
| zdorovie@test.com | zdorovie-med | medicine | OWNER |
| salon-owner@test.com | beauty-studio | beauty | OWNER |
| bistro-owner@test.com | bistro-central | horeca | OWNER |
| sport-owner@test.com | sport-arena | sports | OWNER |

### Публичные страницы

| URL | Описание |
|-----|----------|
| http://localhost:3030/city-polyclinic | Клиника (medicine) |
| http://localhost:3030/zdorovie-med | Здоровье (medicine) |
| http://localhost:3030/beauty-studio | Бьюти салон |
| http://localhost:3030/bistro-central | Бистро (horeca) |
| http://localhost:3030/sport-arena | Спорт арена |

### SUPERADMIN

```bash
# Создать:
npx ts-node scripts/create-admin.ts admin@omnibook.com yourpassword

# Вход: admin@omnibook.com / yourpassword
# Dashboard: /admin/tenants
```

---

## 26. Критические правила разработки

### 1. Тенант-изоляция — САМОЕ ВАЖНОЕ

```typescript
// ✅ Правильно
const db = getTenantDB(session.user.tenantId)
const resources = await db.resource.findMany()  // tenantId добавляется автоматически

// ✅ Правильно для cross-tenant или admin
const tenant = await basePrisma.tenant.findUnique({ where: { id } })

// ✅ Правильно — верификация владения перед изменением
const resource = await basePrisma.resource.findFirst({
  where: { id, tenantId }
})
if (!resource) throw new Error('Not found')

// ❌ Неправильно — tenantId из body
const tenantId = req.body.tenantId  // НИКОГДА!
```

### 2. ResourceService — использовать basePrisma

```typescript
// ✅ Правильно — ResourceService не в TENANT_SCOPED
await basePrisma.resourceService.createMany({
  data: resourceIds.map(resourceId => ({ resourceId, serviceId }))
})

// ❌ Неправильно
const db = getTenantDB(tenantId)
await db.resourceService.createMany(...)  // Сломает типы и логику!
```

### 3. Цены — тенге vs тийины

```typescript
// Form input → tenge (тенге): 5000
// DB storage → tiyins (тийины): 500000

function toMinorUnits(tenge: number): number {
  return Math.round(tenge * 100)  // 5000 → 500000
}

// Display:
new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT' })
  .format(priceInTiyins / 100)
```

### 4. Дата и время

```typescript
// API принимает: "YYYY-MM-DD"
// Санитизация: date.substring(0, 10) (защита от ":1" суффикса)
// DB хранит: UTC DateTime
// Отображение: конвертация через date-fns-tz + tenant.timezone
```

### 5. Tailwind — только статические классы

```typescript
// ❌ Неправильно
className={`bg-${color}-600`}

// ✅ Правильно
const COLORS: Record<string, string> = {
  blue: 'bg-blue-600',
  pink: 'bg-pink-600',
  orange: 'bg-orange-600',
  green: 'bg-green-600',
}
className={COLORS[color]}
```

### 6. Schedule при создании ресурса

```typescript
// ВСЕГДА создавать Schedule при создании ресурса!
// Без Schedule → "Не работает" для ВСЕХ дней → нет слотов → нельзя забронировать

await upsertSchedule(resource.id, getDefaultSchedule(tenant.niche))
```

### 7. Формы — manual safeParse

```typescript
// ✅ Правильно (проектный паттерн)
const result = schema.safeParse(formData)
if (!result.success) { /* показать ошибки */ return }
await action(result.data)

// ❌ Избегать zodResolver (проблема с TypeScript dual-types)
```

### 8. Mobile-first UI

```typescript
// Таблицы:
<table className="hidden sm:table">...</table>
<div className="sm:hidden">/* карточки */</div>

// FAB кнопка:
<button className="fixed bottom-6 right-6 sm:hidden">+</button>

// Сайдбар:
<Sheet>/* mobile drawer */</Sheet>
<aside className="hidden md:flex">/* desktop */</aside>

### 9. Docker Volumes и Git
Папка `db/data/` (или любая другая, куда PostgreSQL монтирует свои файлы) СТРОГО должна быть в `.gitignore`.
**Никогда** не делай `git add .` на сервере без проверки `.gitignore`. Данные базы принадлежат пользователю `root` (Docker), и попытка их закоммитить вызовет `Permission denied` и раздует репозиторий.

```

---

## 27. Деплой и CRON

### Vercel (рекомендуется)

1. Подключить репозиторий к Vercel
2. Настроить переменные окружения (все из раздела 24)
3. Добавить PostgreSQL (Vercel Postgres или Neon)
4. `NEXTAUTH_URL` = `https://your-domain.com`
5. CRON будет работать автоматически (`vercel.json`)

### CRON расписание

**Каждый час** запускается `/api/cron/reminders`:
- Ищет бронирования с `startsAt IN [now+23h, now+25h]`
- Отправляет email-напоминание каждому гостю
- Ставит `reminderSentAt = now()` чтобы не отправить повторно

**Защита:** заголовок `Authorization: Bearer {CRON_SECRET}`

### Self-Hosted Деплой (Ubuntu + PM2)

1. Клонируем репозиторий и устанавливаем зависимости (`npm install`).
2. Генерируем Prisma клиент: `npx prisma generate`.
3. Собираем билд: `npm run build`.
4. Запускаем через PM2: `pm2 start npm --name "omni-book" -- start -- -p 3050`.
5. Сохраняем в автозагрузку: `pm2 save` и `pm2 startup`.

### CRON расписание (Linux)
Так как мы не используем Vercel, API эндпоинт `/api/cron/reminders` нужно дергать через системный `cron` или планировщик PM2.

Для системного cron (`crontab -e`):
`0 * * * * curl -X GET http://localhost:3050/api/cron/reminders -H "Authorization: Bearer {CRON_SECRET}"`


### Docker (локальная разработка)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: omni_book
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

```bash
docker compose up -d    # Запустить
docker compose down     # Остановить
```

---

*Документация составлена на основе полного анализа исходного кода проекта omni-book.*
