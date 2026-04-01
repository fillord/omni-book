# Technology Stack

**Analysis Date:** 2026-04-01

## Languages & Runtime

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | ^5.x |
| Runtime | Node.js | 20.x |
| Framework | Next.js (App Router) | 15.5.12 |
| UI Library | React | ^19.0.0 |

## Frontend Libraries

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| UI Primitives | Radix UI (label, slot, tabs) | ^2.x / ^1.x | Accessible headless components |
| UI Primitives | Base UI React | ^1.2.0 | Additional headless primitives |
| Component System | shadcn/ui | ^4.0.2 | Pre-built components on Radix |
| Styling | Tailwind CSS v4 | ^4.2.1 | Utility-first CSS |
| Styling | tailwind-merge | ^3.5.0 | Conflict-free Tailwind class merging |
| Styling | clsx | ^2.1.1 | Conditional classnames |
| Styling | class-variance-authority | ^0.7.1 | Component variant API (cva) |
| Styling | tw-animate-css | ^1.4.0 | CSS animation utilities |
| Theme | next-themes | ^0.4.6 | Dark/light mode |
| Icons | lucide-react | ^0.577.0 | Icon set |
| Charts | recharts | ^3.8.0 | Data visualization (dashboard) |
| Toast | sonner | ^2.0.7 | Toast notification system |

## Forms & Validation

| Library | Version | Purpose |
|---------|---------|---------|
| react-hook-form | ^7.71.2 | Form state management |
| @hookform/resolvers | ^5.2.2 | Zod resolver integration |
| zod | ^4.3.6 | Schema validation (forms + API) |

## Date & Time

| Library | Version | Purpose |
|---------|---------|---------|
| date-fns | ^4.1.0 | Date utilities |
| date-fns-tz | ^3.2.0 | Timezone-aware formatting (multi-tenant TZ support) |

## Authentication

| Library | Version | Purpose |
|---------|---------|---------|
| next-auth | ^4.24.11 | Auth framework |
| bcryptjs | ^3.0.3 | Password hashing |

- **Session strategy:** JWT
- **Providers:** Credentials (email + password), Google OAuth (optional)
- **Auth config:** `lib/auth/config.ts`
- **Custom pages:** `/login` (sign in + errors)
- **Security:** IP change detection triggers OTP re-verification; audit log on every login

## Database & ORM

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 16 | Primary relational database |
| Prisma ORM | ^6.7.0 | DB client, migrations, seeding |
| Redis | optional | Session store / job queue (REDIS_URL) |

- **Schema:** `prisma/schema.prisma`
- **DB client:** `lib/db.ts` (exports `basePrisma`)
- **Seed scripts:** `prisma/seed.ts`, `prisma/seed-demo.ts`
- **Migrations:** `prisma/migrations/`

## Email

| Library | Version | Purpose |
|---------|---------|---------|
| resend | ^6.9.3 | Transactional email delivery |

- **Utilities:** `lib/email/resend.ts` (confirmations), `lib/email/reminders.ts`
- **Sender:** `noreply@omni-book.site`
- **Templates:** Inline HTML, Russian locale

## Testing

| Library | Version | Purpose |
|---------|---------|---------|
| jest | ^29 | Unit / integration test runner |
| ts-jest | ^29 | TypeScript transformer for Jest |
| @playwright/test | ^1.58.2 | End-to-end browser tests |

## Dev Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | ^9 | Linting |
| eslint-config-next | 15.5.12 | Next.js lint rules |
| postcss | ^8.5.8 | CSS processing |
| @tailwindcss/postcss | ^4.2.1 | Tailwind PostCSS plugin |
| tsx | ^4.21.0 | Fast TypeScript execution (seeding, scripts) |
| ts-node | ^10.9.2 | TypeScript REPL / scripting |

## Build & Scripts

```json
"dev":   "next dev --port 3030"
"build": "next build"
"start": "next start"
"lint":  "next lint"
"test":  "jest"
"seed":  "tsx prisma/seed.ts"
```

- **Next.js config:** `next.config.ts` — permissive remote image patterns (all HTTP/HTTPS hostnames)

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Auth callback base URL |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `ROOT_DOMAIN` | Yes | Root domain (e.g. `omnibook.com`) |
| `NEXT_PUBLIC_APP_URL` | No | Public app base URL for emails |
| `REDIS_URL` | No | Optional Redis connection |
| `RESEND_API_KEY` | No | Email via Resend |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot notifications |
| `ADMIN_TELEGRAM_CHAT_ID` | No | Admin Telegram chat ID |
| `TELEGRAM_WEBHOOK_SECRET` | No | Telegram webhook verification token |
| `GOOGLE_CLIENT_ID` | No | Google OAuth provider |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth provider |
| `KASPI_WEBHOOK_SECRET` | No | Kaspi Pay webhook HMAC (Phase 9b) |

See `.env.example` for full reference.
