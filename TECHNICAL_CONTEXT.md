  # omni-book — Технический отчёт о состоянии проекта                                                                                                                                              
                                                                                                                                                                                                   
  **Дата:** 10 марта 2026                                                                                                                                                                          
  **Репозиторий:** `/home/qzyola/projects/omni-book` (git, ветка `main`)
  **Назначение:** универсальная мультитенантная SaaS-платформа онлайн-бронирования, поддерживающая ниши Beauty, HoReCa, Sports & Leisure, Medicine & Consulting.

  ---

  ## 1. Tech Stack

  | Слой | Технология | Версия |
  |---|---|---|
  | Framework | Next.js (App Router) | 15.5.12 |
  | UI Runtime | React | 19.0.0 |
  | Language | TypeScript | ^5 |
  | ORM | Prisma | 6.7.0 |
  | DB Client | @prisma/client | 6.7.0 |
  | Database | PostgreSQL | 16-alpine (Docker) |
  | CSS | Tailwind CSS | 4.2.1 |
  | PostCSS | @tailwindcss/postcss | 4.2.1 |
  | UI Components | shadcn/ui | 4.0.2 (New York style, Zinc theme) |
  | Animation | tw-animate-css | 1.4.0 |
  | Forms | react-hook-form | 7.71.2 |
  | Validation | zod | 4.3.6 |
  | Form resolvers | @hookform/resolvers | 5.2.2 |
  | Auth | next-auth | 4.24.11 |
  | Icons | lucide-react | 0.577.0 |
  | Seed runner | tsx | 4.21.0 |
  | Testing | jest + ts-jest | ^29 |
  | Package manager | npm | (system) |

  ---

  ## 2. Project Structure

  ```
  omni-book/
  ├── app/
  │   ├── layout.tsx                    # Root layout (Geist font, globals.css)
  │   ├── globals.css                   # Tailwind v4 + shadcn CSS-переменные (light/dark)
  │   ├── (marketing)/
  │   │   ├── layout.tsx
  │   │   └── page.tsx                  # Лендинг платформы (заглушка) → /
  │   ├── (tenant)/
  │   │   ├── layout.tsx
  │   │   └── clinic/
  │   │       └── page.tsx              # Публичная страница-визитка тенанта → /clinic
  │   ├── (auth)/
  │   │   ├── layout.tsx
  │   │   ├── login/page.tsx            # Страница входа (заглушка)
  │   │   └── register/page.tsx         # Страница регистрации (заглушка)
  │   ├── dashboard/
  │   │   ├── layout.tsx                # Обёртка дашборда (TODO: sidebar)
  │   │   ├── page.tsx                  # Главная дашборда → /dashboard ✅ READY
  │   │   ├── bookings/page.tsx         # Список бронирований (заглушка)
  │   │   ├── resources/page.tsx        # Ресурсы (заглушка)
  │   │   ├── services/page.tsx         # Услуги (заглушка)
  │   │   ├── staff/page.tsx            # Сотрудники (заглушка)
  │   │   └── settings/page.tsx         # Настройки (заглушка)
  │   ├── book/
  │   │   ├── layout.tsx
  │   │   └── page.tsx                  # Wizard бронирования (заглушка, дублирует /clinic)
  │   └── api/
  │       ├── auth/[...nextauth]/route.ts
  │       ├── bookings/
  │       │   ├── route.ts              # GET + POST /api/bookings ✅ READY
  │       │   └── busy/
  │       │       └── route.ts          # GET /api/bookings/busy ✅ READY
  │       ├── resources/route.ts        # Заглушка
  │       ├── tenants/route.ts          # Заглушка
  │       └── webhooks/route.ts         # Заглушка
  ├── components/
  │   ├── booking-form.tsx              # Клиентский wizard-компонент ✅ READY
  │   └── ui/                           # shadcn/ui компоненты
  │       ├── badge.tsx
  │       ├── button.tsx
  │       ├── card.tsx
  │       ├── dialog.tsx
  │       ├── form.tsx
  │       ├── input.tsx
  │       ├── label.tsx
  │       ├── radio-group.tsx
  │       ├── select.tsx
  │       ├── separator.tsx
  │       └── table.tsx
  ├── lib/
  │   ├── db/index.ts                   # Prisma singleton (globalThis pattern)
  │   ├── utils.ts                      # cn() (clsx + tailwind-merge)
  │   ├── auth/config.ts                # NextAuth options (JWT, провайдеры не добавлены)
  │   ├── booking/engine.ts             # slotsOverlap() util (TODO: getAvailableSlots, createBooking)
  │   ├── resources/types.ts            # Типы ресурсов
  │   └── tenant/
  │       ├── context.ts                # Контекст тенанта
  │       └── guard.ts                  # Guard тенанта
  ├── prisma/
  │   ├── schema.prisma                 # Полная схема БД
  │   └── seed.ts                       # Seed-скрипт (npx prisma db seed)
  ├── scripts/                          # Python-автоматизация (пусто)
  ├── middleware.ts                     # Subdomain → x-tenant-slug header
  ├── docker-compose.yml
  ├── postcss.config.mjs
  ├── next.config.ts
  ├── tsconfig.json
  └── package.json
  ```

  ---

  ## 3. Database Schema

  ```prisma
  // prisma/schema.prisma

  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  model Tenant {
    id        String   @id @default(cuid())
    slug      String   @unique               // субдомен: acme.omnibook.com
    name      String
    niche     String?                        // beauty | horeca | sports | medicine
    plan      String   @default("free")      // free | pro | enterprise
    isActive  Boolean  @default(true)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    users     User[]
    resources Resource[]
    services  Service[]
    bookings  Booking[]
  }

  model User {
    id            String    @id @default(cuid())
    tenantId      String?                         // null → суперадмин платформы
    email         String    @unique
    name          String?
    phone         String?
    passwordHash  String?
    role          Role      @default(CUSTOMER)
    emailVerified DateTime?
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt

    tenant        Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
    bookings      Booking[]

    @@index([tenantId])
    @@index([email])
  }

  enum Role {
    SUPERADMIN
    OWNER
    STAFF
    CUSTOMER
  }

  model Resource {
    id          String    @id @default(cuid())
    tenantId    String
    name        String
    type        String                          // staff | room | court | table | other
    description String?
    capacity    Int?
    attributes  Json      @default("{}")        // нише-специфичные данные (см. ниже)
    isActive    Boolean   @default(true)
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt

    tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
    bookings    Booking[]
    services    ResourceService[]

    @@index([tenantId])
    @@index([tenantId, type])
  }

  // Примеры attributes по нишам:
  // Beauty:   { "services": ["haircut","coloring"], "experience_years": 5 }
  // HoReCa:   { "capacity": 4, "location": "terrace" }
  // Sports:   { "surface": "clay", "indoor": true }
  // Medicine: { "specialization": "cardiologist", "license": "KZ-MED-00456",
  //             "experience_years": 8, "languages": ["ru","kz"],
  //             "equipment": ["ECG-1200"], "working_hours": { "mon": "09:00-18:00" } }

  model Service {
    id          String    @id @default(cuid())
    tenantId    String
    name        String
    description String?
    durationMin Int
    price       Int?                            // в минимальных единицах валюты (тиыны/центы)
    currency    String    @default("KZT")
    isActive    Boolean   @default(true)
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt

    tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
    bookings    Booking[]
    resources   ResourceService[]

    @@index([tenantId])
  }

  model ResourceService {
    resourceId String
    serviceId  String

    resource   Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
    service    Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)

    @@id([resourceId, serviceId])
  }

  model Booking {
    id         String        @id @default(cuid())
    tenantId   String
    resourceId String
    serviceId  String?
    userId     String?                           // null → гостевое бронирование
    guestName  String?
    guestPhone String?
    guestEmail String?
    startsAt   DateTime
    endsAt     DateTime
    status     BookingStatus @default(CONFIRMED)
    notes      String?
    createdAt  DateTime      @default(now())
    updatedAt  DateTime      @updatedAt

    tenant     Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
    resource   Resource      @relation(fields: [resourceId], references: [id])
    service    Service?      @relation(fields: [serviceId], references: [id])
    user       User?         @relation(fields: [userId], references: [id])

    @@index([tenantId])
    @@index([tenantId, resourceId, startsAt])   // индекс для проверки коллизий
    @@index([tenantId, status])
    @@index([userId])
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
    NO_SHOW
  }
  ```

  ---

  ## 4. Multi-tenancy Logic

  Разделение данных реализовано на нескольких уровнях:

  **Уровень данных (DB):**
  Каждая запись в таблицах `User`, `Resource`, `Service`, `Booking` содержит поле `tenantId`. Все запросы через Prisma обязаны включать фильтр `where: { tenantId }`. Cascade-удаление настроено
  через `onDelete: Cascade` на уровне схемы.

  **Уровень API:**
  Все API-роуты принимают `tenantSlug` в теле запроса или query-параметрах, резолвят `tenantId` через `prisma.tenant.findUnique({ where: { slug } })`, после чего все последующие запросы к БД
  scope-ируются этим `tenantId`. Пример из `POST /api/bookings`:
  ```typescript
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id } })
  ```

  **Уровень маршрутизации (Middleware):**
  `middleware.ts` перехватывает все запросы, извлекает субдомен из `Host`-заголовка и прокидывает его как `x-tenant-slug` в response headers. Это позволит в будущем автоматически определять
  тенанта по субдомену (`acme.omnibook.com` → `slug = "acme"`) без явной передачи slug в каждом запросе.

  **Текущее ограничение:**
  Slug тенанта пока хардкодится в серверных компонентах (`'city-polyclinic'`). Следующий шаг — читать slug из заголовка `x-tenant-slug` (проброшенного middleware) или из сессии
  аутентифицированного пользователя.

  ---

  ## 5. API Routes

  ### Реализованные эндпоинты

  | Метод | Путь | Описание | Статусы |
  |---|---|---|---|
  | `GET` | `/api/bookings?tenantSlug=` | Список последних 50 бронирований тенанта (с ресурсом и услугой) | 200, 400 |
  | `POST` | `/api/bookings` | Создать бронирование | 201, 400, 404, 409, 422 |
  | `GET` | `/api/bookings/busy?resourceId=&date=` | Занятые слоты ресурса на дату (`startsAt`, `endsAt`) | 200, 400 |

  ### POST /api/bookings — тело запроса

  ```json
  {
    "tenantSlug": "city-polyclinic",
    "serviceId": "svc-consultation",
    "resourceId": "res-doctor-petrov",
    "date": "2026-03-20",
    "time": "10:00",
    "guestName": "Иван Иванов",
    "guestPhone": "+77011112233",
    "guestEmail": "ivan@example.com"
  }
  ```

  **Логика POST /api/bookings:**
  1. Валидация обязательных полей (422 если отсутствуют)
  2. Резолв тенанта по slug (404 если не найден)
  3. Проверка принадлежности serviceId и resourceId этому тенанту (404)
  4. Построение `startsAt` из `date + time`, вычисление `endsAt = startsAt + service.durationMin`
  5. **Проверка коллизий** — поиск любого `CONFIRMED|PENDING` бронирования того же ресурса с пересекающимся интервалом (409 если занято)
  6. Создание `Booking` со статусом `CONFIRMED`

  ### Заглушки (не реализованы)

  | Метод | Путь | Статус |
  |---|---|---|
  | `GET/POST` | `/api/resources` | Заглушка |
  | `GET/POST` | `/api/tenants` | Заглушка |
  | `POST` | `/api/webhooks` | Заглушка |
  | `GET/POST` | `/api/auth/[...nextauth]` | Настроен, провайдеры не добавлены |

  ---

  ## 6. UI/UX State

  ### Готовые страницы

  #### `/dashboard` — Дашборд тенанта (Server Component)
  - Шапка: название, ниша, тариф, бейдж статуса
  - 4 стат-карточки: Ресурсов / Услуг / Бронирований / Пользователей
  - Таблица ресурсов: название, тип (Badge), специализация из `attributes.specialization`, лицензия, опыт
  - Таблица услуг: название, описание, длительность, цена в KZT через `Intl.NumberFormat`
  - Данные хардкодом берутся для slug `city-polyclinic`

  #### `/clinic` — Публичная страница-визитка (Server Component + Client Form)
  - Sticky header с названием и нишей
  - Hero-секция: название, адрес, часы, телефон, список услуг-бейджами
  - Карточки специалистов с аватаром-инициалом, описанием, специализацией и опытом
  - Секция «Онлайн-запись» с компонентом `BookingForm`

  ### Ключевые компоненты

  #### `components/booking-form.tsx` — 4-шаговый wizard (Client Component)

  **Шаги:**
  1. **Услуга** — RadioGroup карточки с ценой, описанием, длительностью; сброс ресурса при смене услуги
  2. **Специалист** — RadioGroup карточки, фильтрованные по `serviceIds` выбранной услуги; показ специализации и опыта из `attributes`; сброс слота при смене специалиста
  3. **Дата и время** — нативный date picker (min = завтра); сетка 14 тайм-слотов; при выборе ресурса + даты автоматически запрашиваются занятые слоты:
     - `useEffect` → `GET /api/bookings/busy?resourceId=&date=`
     - `AbortController` для отмены устаревших запросов
     - Skeleton (`animate-pulse`) пока грузятся данные
     - Занятые кнопки: `disabled`, `opacity-50`, `cursor-not-allowed`, серый фон
  4. **Подтверждение** — сводка, поля гостя (имя*, телефон*, email); loading spinner; inline-сообщение об ошибке (включая «время занято»)

  **После успешного сабмита** — экран подтверждения с номером брони, деталями и кнопкой «Записаться ещё раз».

  **Состояния формы:** `loading`, `error: string | null`, `successId: string | null`, `busySlots`, `busyLoading`

  ### Установленные shadcn/ui компоненты

  `button`, `input`, `card`, `label`, `select`, `table`, `dialog`, `badge`, `radio-group`, `separator`, `form`

  ---

  ## 7. Infrastructure

  ### Docker (`docker-compose.yml`)

  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      restart: unless-stopped
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: omni_book
      ports:
        - '5432:5432'
      volumes:
        - postgres_data:/var/lib/postgresql/data
      healthcheck:
        test: ['CMD-SHELL', 'pg_isready -U postgres']
        interval: 5s
        timeout: 5s
        retries: 5
  ```

  Запуск: `docker compose up -d`
  Контейнер: `omni-book-postgres-1`
  Данные хранятся в named volume `postgres_data` (персистентно).

  ### .env (без секретных значений)

  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omni_book"
  NEXTAUTH_SECRET=<your-secret>
  NEXTAUTH_URL=http://localhost:3000
  ROOT_DOMAIN=omnibook.com
  ```

  ### Prisma

  ```bash
  npx prisma db push        # синхронизировать схему с БД (без миграций)
  npx prisma db seed        # заполнить тестовыми данными
  npx prisma studio         # визуальный браузер БД на :5555
  ```

  Seed (`prisma/seed.ts`) создаёт:
  - 1 тенант: `City Polyclinic` (slug: `city-polyclinic`, niche: `medicine`, plan: `pro`)
  - 3 пользователя: Алия Нурланова (OWNER), Дмитрий Петров (STAFF), Гүлнара Сейтқали (STAFF)
  - 3 ресурса: Петров Дмитрий (staff/therapist), Сейтқали Гүлнара (staff/cardiologist), Кабинет №101 (room)
  - 4 услуги: Первичная консультация (30 мин, 5000₸), ЭКГ (20 мин, 3000₸), УЗИ (40 мин, 8000₸), Анализ крови (10 мин, 2000₸)
  - 7 связей ResourceService (M2M)
  - 2 тестовых бронирования

  ### Dev Server

  Запуск: `npm run dev`
  Текущий порт: **3030** (порт 3000 занят системным процессом WSL)
  Рекомендация: добавить `"dev": "next dev --port 3030"` в `package.json`.

  ---

  ## 8. Current Progress & Next Steps

  ### Что полностью готово ✅

  - Схема БД, миграции через `db push`, seed с реальными данными
  - Prisma-клиент singleton (hot-reload safe)
  - Middleware для извлечения субдомена в `x-tenant-slug`
  - Dashboard: статистика, таблицы ресурсов и услуг
  - Публичная страница тенанта `/clinic`
  - 4-шаговый wizard бронирования с полным UI
  - `POST /api/bookings` — создание бронирования с проверкой коллизий
  - `GET /api/bookings/busy` — занятые слоты для UX disabled-кнопок
  - Disabled тайм-слоты со skeleton-загрузкой в форме

  ### Что в процессе / заглушки 🔧

  - `lib/booking/engine.ts` — только `slotsOverlap()`, нет `getAvailableSlots()` и `createBooking()`
  - `app/book/page.tsx` — дублирующий роут, не использует новый `BookingForm`
  - Dashboard: `bookings/`, `resources/`, `services/`, `staff/`, `settings/` — заглушки
  - Slug тенанта хардкодится в серверных компонентах вместо чтения из middleware-заголовка

  ### Приоритетные следующие шаги 📋

  1. **Авторизация** — подключить NextAuth провайдеры (Credentials + Google OAuth), реализовать `CredentialsProvider` в `lib/auth/config.ts`, добавить защиту роутов `/dashboard/*` через
  middleware
  2. **Dashboard: раздел бронирований** — таблица всех записей с фильтрацией по дате/статусу/ресурсу, возможность смены статуса (CONFIRMED → CANCELLED/COMPLETED)
  3. **Календарь в дашборде** — week/day view со слотами бронирований по ресурсам, рекомендуется `react-big-calendar` или `@fullcalendar/react`
  4. **Динамический тенант** — убрать хардкод `'city-polyclinic'`, читать slug из `x-tenant-slug` заголовка (middleware) или из JWT-сессии
  5. **Dashboard CRUD** — страницы управления ресурсами (`/dashboard/resources`) и услугами (`/dashboard/services`) с формами создания/редактирования
  6. **Уведомления** — email/SMS подтверждение бронирования (интеграция Resend или Nodemailer в webhook/background job)
  7. **Timezone-safe datetime** — текущая реализация строит `new Date(\`${date}T${time}:00\`)` в локальном времени сервера; нужно передавать timezone клиента или хранить UTC явно
  8. **Мультитенантный routing** — настроить `next.config.ts` для маршрутизации субдоменов на `(tenant)` layout
  9. **Rate limiting** — добавить на `POST /api/bookings` защиту от спама (например, через Upstash Ratelimit)