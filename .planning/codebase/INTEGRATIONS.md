# External Integrations

**Analysis Date:** 2026-03-17

## APIs & External Services

**Email Delivery:**
- Resend - Transactional email service
  - SDK/Client: `resend` package (v6.9.3)
  - Auth: `RESEND_API_KEY` environment variable
  - Implementation: `lib/email/resend.ts`
  - Endpoints: Sends from `noreply@omni-book.site`
  - Uses: Booking confirmations, reminders, cancellations, OTP codes, post-visit emails

**Telegram Bot:**
- Telegram Bot API - For push notifications and admin commands
  - SDK/Client: Built-in fetch (no dedicated package)
  - Auth: `TELEGRAM_BOT_TOKEN` environment variable
  - Implementation: `lib/telegram.ts` (sends messages), `app/api/telegram/webhook/route.ts` (receives)
  - Endpoints: Sends to `https://api.telegram.org/bot{TOKEN}/sendMessage`
  - Uses: Booking notifications to customers, admin notifications, superadmin management commands
  - Webhook Security: `TELEGRAM_WEBHOOK_SECRET` header validation

**OAuth/Identity:**
- Google OAuth 2.0 - Optional Google sign-in
  - SDK/Client: `next-auth` (GoogleProvider)
  - Auth: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
  - Optional: Only enabled if both env vars present
  - Implementation: `lib/auth/config.ts` (lines 81-88)
  - Callback Flow: Upserts user on first login via signIn callback

## Data Storage

**Databases:**
- PostgreSQL (primary)
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma ORM v6.7.0
  - Schema: `prisma/schema.prisma`
  - Models: Tenant, User, Resource, Service, Booking, Schedule, ResourceService, OtpCode
  - Indexes: Optimized for booking queries, tenant lookups, reminder scheduling

**Caching:**
- Redis (optional)
  - Connection: `REDIS_URL` environment variable
  - Purpose: Session store, job queue
  - Optional: No hard dependency; Resend API calls are fire-and-forget with no queue

**File Storage:**
- Local filesystem only - URLs stored in database (coverUrl, logoUrl)
- Remote image patterns allowed in Next.js config (https://* and http://*)

## Authentication & Identity

**Auth Provider:**
- NextAuth.js v4.24.11 - Custom implementation
  - Session Strategy: JWT-based
  - Session Secret: `NEXTAUTH_SECRET` environment variable
  - Auth URL: `NEXTAUTH_URL` environment variable

**Authentication Methods:**

1. **Credentials (Email + Password)**
   - Implementation: `lib/auth/config.ts` (CredentialsProvider)
   - Password: Hashed with bcryptjs (cost 12)
   - IP Verification: Required if IP changes (triggers OTP challenge)
   - Session Control: One active session per user (invalidates old sessions)

2. **Google OAuth**
   - Implementation: `lib/auth/config.ts` (GoogleProvider, conditional)
   - Upserts user on first sign-in
   - Auto-creates CUSTOMER role if new user
   - Verification: Marked as verified (emailVerified = now())

3. **Email OTP (One-Time Password)**
   - Implementation: `lib/auth/otp.ts`, `lib/actions/otp.ts`
   - Delivery: Via Resend email service
   - Storage: OtpCode model in database
   - Expiry: 10 minutes
   - Uses: Account verification, IP change verification

**User Roles:**
- SUPERADMIN - System admin (no tenant)
- OWNER - Tenant owner
- STAFF - Tenant staff member
- CUSTOMER - Customer/guest user

**Session Tracking:**
- activeSessionId: UUID per user to enforce concurrent session limits
- lastIpAddress: Stored for IP verification

## Webhooks & Callbacks

**Incoming Webhooks:**
- Telegram Webhook: `POST /api/telegram/webhook`
  - Secret validation via `x-telegram-bot-api-secret-token` header
  - Commands:
    - `/add_superadmin [email] [password]` - Create superadmin user
    - `/delete_admin [email]` - Delete superadmin user
    - `/admins` - List all superadmins
    - `/id` or `/start` - Show admin ID and help

**Outgoing Webhooks/Notifications:**

1. **Email Notifications (Resend):**
   - Booking confirmation: When booking created
   - Booking reminders: 24h, 2h, 1h before appointment
   - Booking cancellation: When booking cancelled
   - Booking completed: Post-visit email
   - No-show: When booking marked as no-show
   - OTP verification: During registration/login

2. **Telegram Notifications:**
   - Booking confirmed: Sent to customer's tenant admin
   - Billing notifications: Sent to admin on plan changes
   - Admin commands: Processed via webhook (add/delete superadmins)

## Integration Patterns

**Email Flow:**
- Trigger: Booking state change (created, confirmed, cancelled, completed)
- Service: `lib/email/resend.ts` - sendBookingConfirmation, sendBookingCancellation, etc.
- Data: Templates formatted with HTML, timezone-aware dates
- Error Handling: No-op if RESEND_API_KEY missing (dev mock)

**Telegram Flow:**
- Outbound: `lib/telegram.ts` - sendTelegramMessage (fire-and-forget with error logging)
- Inbound: `app/api/telegram/webhook/route.ts` - Validates secret, routes commands, executes DB operations
- Admin-only: Commands restricted to ADMIN_TELEGRAM_CHAT_ID

**OAuth Flow:**
- Conditional: Only enabled if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET present
- Callback: signIn callback upserts user, creates session ID
- JWT: Custom fields (id, role, tenantId, tenantSlug, activeSessionId) persisted in token

## Environment Configuration

**Required for Full Features:**
- `NEXTAUTH_URL` - OAuth redirect
- `NEXTAUTH_SECRET` - Session encryption
- `DATABASE_URL` - Postgres connection
- `RESEND_API_KEY` - Email delivery
- `TELEGRAM_BOT_TOKEN` - Telegram notifications
- `TELEGRAM_WEBHOOK_SECRET` - Webhook validation
- `ADMIN_TELEGRAM_CHAT_ID` - Admin notifications

**Optional:**
- `GOOGLE_CLIENT_ID` - Google OAuth (auth fallback to credentials)
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `REDIS_URL` - Session persistence (falls back to in-memory)

**Public Variables:**
- `NEXT_PUBLIC_GOOGLE_ENABLED` - Frontend feature flag (derived from credentials presence)

## Error Handling & Resilience

**Email (Resend):**
- Graceful degradation: Missing API key = no-op (logged for dev)
- Send failures: Not retried (fire-and-forget)

**Telegram:**
- Graceful degradation: Missing token = no-op
- Send failures: Thrown error (should be caught at call site with .catch())

**Database (Prisma):**
- Connection pooling: Managed by Prisma
- Migration strategy: `prisma migrate dev` for dev, `prisma migrate deploy` for production

---

*Integration audit: 2026-03-17*
