# Technology Stack

**Analysis Date:** 2026-03-17

## Languages

**Primary:**
- TypeScript 5.x - Application code, React components, API routes, backend utilities
- JavaScript (ES2017+) - Build configuration, utilities

**Secondary:**
- SQL - Prisma schema, database queries (PostgreSQL)
- CSS 4 - Global styles with OKLch color model

## Runtime

**Environment:**
- Node.js (specified in package.json - no .nvmrc file)
- Next.js 15.5.12 - Full-stack React framework with App Router

**Package Manager:**
- npm (implied, no lockfile extension specified in package.json)
- Lockfile: `package-lock.json` (expected)

## Frameworks

**Core:**
- Next.js 15.5.12 - Full-stack web framework with React 19, server components, API routes
- React 19.0.0 - UI library
- React DOM 19.0.0 - React rendering engine

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- @tailwindcss/postcss 4.2.1 - PostCSS plugin for Tailwind
- PostCSS 8.5.8 - CSS transformation pipeline
- tw-animate-css 1.4.0 - Animation utilities for Tailwind
- shadcn 4.0.2 - Unstyled component library
- Lucide React 0.577.0 - Icon library

**UI Components:**
- @base-ui/react 1.2.0 - Low-level, unstyled component primitives
- @radix-ui/react-label 2.1.8 - Accessible label component
- @radix-ui/react-slot 1.2.4 - Radix slot component
- @radix-ui/react-tabs 1.1.13 - Accessible tabs component
- recharts 3.8.0 - React charting library

**Forms & Validation:**
- react-hook-form 7.71.2 - Performant form handling
- @hookform/resolvers 5.2.2 - Validation resolvers for react-hook-form
- Zod 4.3.6 - TypeScript-first schema validation

**Authentication:**
- next-auth 4.24.11 - Authentication library for Next.js (JWT sessions, OAuth providers)
- bcryptjs 3.0.3 - Password hashing

**Database:**
- @prisma/client 6.7.0 - Prisma ORM client
- prisma 6.7.0 - Prisma CLI and migrations

**Notifications & Email:**
- resend 6.9.3 - Email sending service SDK

**Utilities:**
- date-fns 4.1.0 - Date manipulation library
- date-fns-tz 3.2.0 - Timezone support for date-fns
- clsx 2.1.1 - Conditional class names
- class-variance-authority 0.7.1 - CSS class variants
- tailwind-merge 3.5.0 - Merge Tailwind classes intelligently
- sonner 2.0.7 - Toast notifications
- next-themes 0.4.6 - Dark mode management

## Testing

**Runner:**
- Jest 29.x - Test framework
- ts-jest 29.x - Jest transformer for TypeScript

**Browser Testing:**
- @playwright/test 1.58.2 - End-to-end testing framework

## Build & Development

**Build Tool:**
- Next.js built-in (webpack-based)

**TypeScript:**
- TypeScript 5.x - Language compiler

**Code Quality:**
- ESLint 9.x - Linting
- eslint-config-next 15.5.12 - Next.js ESLint preset

**Development Utilities:**
- tsx 4.21.0 - Run TypeScript directly (for Prisma seed scripts)
- ts-node 10.9.2 - Node.js TypeScript execution

**Types:**
- @types/node 20.x
- @types/react 19.x
- @types/react-dom 19.x
- @types/jest 29.x
- @types/bcryptjs 2.4.6

## Database

**Primary:**
- PostgreSQL (specified via DATABASE_URL)
- Prisma ORM 6.7.0 - Database client and migration tool

**Schema Location:** `prisma/schema.prisma`

**Migration Scripts:** `prisma/migrations/`

**Seed Script:** Uses tsx to run `prisma/seed.ts`

## Configuration Files

**TypeScript:**
- `tsconfig.json` - Target: ES2017, moduleResolution: bundler, strict mode enabled
- Path alias: `@/*` → root directory

**Next.js:**
- `next.config.ts - Allows remote image patterns (https://* and http://*)

**PostCSS:**
- `postcss.config.mjs` - Configured with Tailwind CSS PostCSS plugin

**Styling:**
- `app/globals.css` - Global styles with OKLch color scheme, imports Tailwind, tw-animate-css, shadcn

**Linting:**
- `.eslintrc.json` - Extends next/core-web-vitals and next/typescript

**Testing:**
- `jest.config.ts` - Preset: ts-jest, testEnvironment: node, test pattern: `__tests__/**/*.test.ts`

## Environment Configuration

**Required env vars:**
- `NODE_ENV` - development/production
- `NEXTAUTH_URL` - NextAuth callback URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Session encryption secret
- `ROOT_DOMAIN` - Application root domain (e.g., omnibook.com)
- `DATABASE_URL` - PostgreSQL connection string (postgresql://user:pass@host:port/db)
- `REDIS_URL` - (Optional) Redis connection for session store/job queue
- `RESEND_API_KEY` - Email service API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `ADMIN_TELEGRAM_CHAT_ID` - Admin's Telegram chat ID for webhooks
- `TELEGRAM_WEBHOOK_SECRET` - Secret token for Telegram webhook validation

**Secrets location:**
- `.env` file (local development) - contains sensitive config
- `.env.example` file (checked in) - template showing required variables

## Public Environment Variables

**Exposed to client:**
- `NEXT_PUBLIC_GOOGLE_ENABLED` - Boolean flag to enable/disable Google OAuth on frontend

## Scripts

```bash
npm run dev        # Start dev server on port 3030
npm run build      # Build for production
npm start          # Run production server
npm run lint       # Run ESLint
npm test           # Run Jest tests
npx prisma seed   # Seed database (via tsx)
npx prisma migrate dev  # Create and apply migrations
```

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- PostgreSQL database
- Redis (optional, for session store)

**Production:**
- Node.js runtime
- PostgreSQL database (production-grade)
- Redis (recommended for session management)
- Email service credentials (Resend API key)
- Telegram bot token (for notifications)
- Google OAuth credentials (optional)

---

*Stack analysis: 2026-03-17*
