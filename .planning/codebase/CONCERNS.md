# Codebase Concerns

**Analysis Date:** 2026-04-01

## Tech Debt

### 1. Kaspi Pay — Mock Implementation

**Severity:** High (business-critical)
**Files:** `lib/payments/kaspi.ts`, `app/api/webhooks/kaspi/route.ts`

`createKaspiInvoice` returns a synthetic `invoiceId` and logs intent only. `verifyKaspiWebhook` accepts all webhooks without HMAC-SHA256 verification.

```typescript
// Phase 9: mock — accepts all webhooks (no real signature check)
// Phase 9b: real HMAC-SHA256 verification against KASPI_WEBHOOK_SECRET
```

**Risk:** No real payment processing. Webhooks from anyone are accepted.

---

### 2. Stub API Routes

**Severity:** Medium
**Files:** `app/api/tenants/route.ts`, `app/api/resources/route.ts`, `app/api/webhooks/route.ts`

These routes contain only TODO comments and return 200 with empty bodies:

```typescript
// TODO: list tenants (superadmin only)
// TODO: create tenant (registration flow)
// TODO: list resources for tenant
// TODO: create resource
// TODO: verify signature, route to handler (payments, etc.)
```

**Risk:** Documented surface area that does nothing; could be confused for working endpoints.

---

### 3. Meta / WhatsApp Integration — Placeholder

**Severity:** Low (future feature)
**File:** `app/api/webhooks/meta/route.ts`

Webhook handler exists but doesn't route to any handler — only a TODO comment.

---

### 4. Book Page Wizard Missing

**Severity:** Medium
**File:** `app/book/page.tsx`

```typescript
{/* TODO: booking wizard */}
```

There's a standalone `/book` route that is a stub. Public booking currently only works via `/(tenant)/[slug]`.

---

### 5. Payment Link in Dashboard Layout Hardcoded

**Severity:** Low
**File:** `app/dashboard/layout.tsx:79`

Billing upgrade CTA has a placeholder payment link (TODO comment).

---

## Security Concerns

### 1. Webhook Signature Verification — Missing on Multiple Endpoints

- **Kaspi webhooks:** No HMAC verification (mock implementation)
- **Meta webhooks:** Unimplemented handler
- **Generic webhook route (`app/api/webhooks/route.ts`):** No signature check

Anyone can POST to these endpoints.

### 2. Rate Limiting — In-Memory Only

**File:** `lib/rate-limit.ts`

Rate limiting is in-memory. In a multi-process or serverless deployment (Vercel), each instance has separate state. Rate limits are not enforced globally across instances.

**Risk:** Brute-force attacks on auth endpoints could succeed by hitting different instances.

### 3. Image Proxy — Wildcard Remote Patterns

**File:** `next.config.ts`

```typescript
remotePatterns: [
  { protocol: 'https', hostname: '**' },
  { protocol: 'http',  hostname: '**' },
]
```

Next.js image optimization accepts any hostname. Could be abused as an open proxy.

### 4. OTP / IP Verification Proxy Dependency

IP change detection in auth callback requires the real client IP to be correctly propagated via headers. Misconfigured reverse proxy could break this or allow bypass.

---

## Performance Concerns

### 1. No Query Pagination on Dashboard Lists

Dashboard pages (bookings, clients, resources) may load all records for a tenant. No evidence of cursor-based or offset pagination in Server Actions (`lib/actions/`).

### 2. No Caching Layer

Redis is optional and not used for caching. All reads go directly to PostgreSQL, including `resolveTenant()` on every API request.

### 3. Tenant Resolution on Every API Request

`resolveTenant()` does a DB lookup (`basePrisma.tenant.findUnique`) on every API request. No memoization or cache.

---

## Fragile Areas

### 1. Prisma Extension Post-Validation for Unique Ops

`getTenantPrisma` cannot inject `tenantId` into `findUnique` WHERE (Prisma constraint: unique ops only allow unique-constraint fields). Instead it post-validates the result's `tenantId`. This is correct but non-obvious — developers using `findUnique` must be aware.

**File:** `lib/tenant/prisma-tenant.ts`

### 2. `session.user.tenantId!` Non-Null Assertions

Server Actions use `session.user.tenantId!` throughout. Safe for `OWNER`/`STAFF` post-`requireAuth()`, but `SUPERADMIN` accounts may not have a `tenantId`. Cross-tenant admin operations must use `basePrisma` directly.

### 3. i18n Header Dependency

`getServerT()` reads `x-omnibook-locale` header set by middleware. If middleware doesn't run (API routes, some edge cases), the header is absent and locale silently falls back to `ru`. No explicit locale selection for API responses.

### 4. Email / Telegram — Fire and Forget

Some `sendTelegramMessage` and Resend calls use `.catch(console.error)` or aren't awaited in all paths. Notification failures are silent — no retry, no alerting.

---

## Missing Infrastructure

| Feature | Status |
|---------|--------|
| Real payment processing (Kaspi) | TODO Phase 9b/10 |
| WhatsApp integration | TODO future |
| Global rate limiting (Redis-backed) | Not implemented |
| E2E test suite (Playwright) | Config present, no tests written |
| Server Action unit tests | None |
| API route handler tests | None |
| Error monitoring (Sentry, etc.) | Not present |
| Structured logging | Not present (console.log only) |
| CI/CD pipeline config | Not found in repo |
