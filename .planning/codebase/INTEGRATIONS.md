# External Integrations

**Analysis Date:** 2026-04-01

## APIs & External Services

### 1. Email — Resend

- **Library:** `resend` v6.9.3
- **Config:** `RESEND_API_KEY` env var; no-op if absent
- **Files:** `lib/email/resend.ts`, `lib/email/reminders.ts`
- **Sender address:** `noreply@omni-book.site`
- **Emails sent:**
  - Booking confirmation (`sendBookingConfirmation`)
  - Booking reminder (`lib/email/reminders.ts`)
  - OTP / IP-verification emails (auth flow)
- **Templates:** Inline HTML, Russian locale, responsive

### 2. Telegram Bot API

- **Config:** `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`
- **Files:** `lib/telegram.ts`, `app/api/webhooks/telegram/route.ts`
- **Functions:** `sendTelegramMessage(chatId, html)`, `deleteTelegramMessage(chatId, messageId)`
- **Use cases:**
  - Customer notifications (new booking, cancellations)
  - Admin notifications via `ADMIN_TELEGRAM_CHAT_ID`
  - Webhook handler for inbound Telegram messages
- **Pattern:** Fire-and-forget; silently no-ops if token absent

### 3. Kaspi Pay (Payment Gateway)

- **Status:** Mock implementation (Phase 9 placeholder; real integration deferred to Phase 9b/10)
- **Files:** `lib/payments/kaspi.ts`, `app/api/webhooks/kaspi/route.ts`
- **Per-tenant config:** `kaspiMerchantId`, `kaspiApiKey` stored on Tenant model
- **Functions:**
  - `createKaspiInvoice(phone, amount, bookingId, tenantKeys)` — currently logs intent, returns mock `invoiceId`
  - `verifyKaspiWebhook(payload)` — currently accepts all (no real HMAC-SHA256 yet)
- **Planned:** Real HMAC-SHA256 webhook verification against `KASPI_WEBHOOK_SECRET`

### 4. Meta / WhatsApp

- **Status:** Placeholder (future integration)
- **Files:** `app/api/webhooks/meta/route.ts`
- **Purpose:** Inbound WhatsApp message handling via Meta webhooks

### 5. Google OAuth

- **Library:** `next-auth` GoogleProvider
- **Config:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Status:** Optional — Credentials provider is primary
- **Files:** `lib/auth/config.ts`

## Database

### PostgreSQL

- **Version:** 16
- **ORM:** Prisma 6.7.0
- **Connection:** `DATABASE_URL` env var
- **Schema:** `prisma/schema.prisma`
- **Client:** `lib/db.ts` exports `basePrisma`
- **Key models:** `Tenant`, `User`, `Booking`, `Service`, `Resource`

### Redis (Optional)

- **Config:** `REDIS_URL` env var
- **Purpose:** Session store, job queue
- **Status:** Optional; app runs without it

## Cron Jobs / Scheduled Tasks

All cron routes live under `app/api/cron/`:

| Route | Purpose |
|-------|---------|
| `app/api/cron/pending-payments/` | Process/expire pending payment bookings |
| `app/api/cron/reminders/` | Send booking reminder emails |
| `app/api/cron/subscriptions/` | Handle subscription expiry/renewal |

These are HTTP endpoints intended to be called by an external scheduler (Vercel Cron, cron-job.org, etc.).

## Webhook Endpoints

| Path | Service | Purpose |
|------|---------|---------|
| `app/api/webhooks/telegram/route.ts` | Telegram | Inbound bot messages |
| `app/api/webhooks/kaspi/route.ts` | Kaspi Pay | Payment status updates |
| `app/api/webhooks/meta/route.ts` | Meta/WhatsApp | Future WhatsApp integration |

## Rate Limiting

- **File:** `lib/rate-limit.ts`
- **Purpose:** API endpoint protection (auth, booking APIs)
- **Implementation:** In-memory (no external service required)

## Notifications Architecture

Notifications flow through `lib/notifications/` which orchestrates:
1. Email via Resend (`lib/email/`)
2. Telegram messages (`lib/telegram.ts`)
3. Called from booking lifecycle (`lib/payment-lifecycle.ts`, `lib/subscription-lifecycle.ts`)
