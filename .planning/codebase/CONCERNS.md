# Codebase Concerns

**Analysis Date:** 2026-03-17

## Tech Debt

**Large Translations File (1609 lines):**
- Issue: `lib/i18n/translations.ts` contains all hardcoded translations for Russian, Kazakh, and English directly in code, making it difficult to maintain and scale.
- Files: `lib/i18n/translations.ts`
- Impact: Adding new languages or updating existing translations requires modifying a 1600+ line file; no separation of concerns; poor for internationalization at scale.
- Fix approach: Move translations to external JSON files or use a translation management service (e.g., i18next, Crowdin, Phrase). Load translations at build/runtime rather than embedding them in TypeScript.

**Component Size and Complexity:**
- Issue: Several components exceed 700+ lines with complex state management, making them hard to test and maintain.
  - `components/booking-form.tsx` (783 lines) - Multi-step form with state for service, resource, date, time, and guest details
  - `components/settings-form.tsx` (708 lines) - Tenant settings with multiple tabs and dynamic fields
  - `components/tenant-public-page.tsx` (699 lines) - Public booking page with embedded booking form
  - `components/booking-calendar.tsx` (611 lines) - Week view calendar with booking display
- Files: `components/booking-form.tsx`, `components/settings-form.tsx`, `components/tenant-public-page.tsx`, `components/booking-calendar.tsx`
- Impact: Difficult to test individual features, increased bug surface area, harder to reuse subcomponents, poor separation of concerns.
- Fix approach: Extract sub-components for steps (ServiceStep, ResourceStep, DateTimeStep, ConfirmStep); create custom hooks for state management; move business logic to utils.

**Unknown Type Casting in Components:**
- Issue: `components/settings-form.tsx` line 54 uses `unknown` type for `socialLinks` field.
- Files: `components/settings-form.tsx`
- Impact: Loss of type safety for social media links; potential runtime errors if structure changes; harder to refactor.
- Fix approach: Define strict types for `socialLinks` (e.g., `{ instagram?: string; whatsapp?: string; telegram?: string }`); import and reuse type instead of `unknown`.

**Production Console Logging:**
- Issue: `app/api/bookings/route.ts` line 145 contains `console.log()` for booking creation which will appear in production logs.
- Files: `app/api/bookings/route.ts`
- Impact: Pollutes production logs; may expose sensitive booking information in logs; performance impact in high-traffic scenarios.
- Fix approach: Use proper logging service (e.g., Winston, Pino, or cloud logging); remove console.log or gate behind environment check.

**Fire-and-Forget Notifications Without Error Tracking:**
- Issue: Email and Telegram notifications in `app/api/bookings/route.ts` lines 164 and 180 use `.catch(console.error)` without proper error handling or retry logic.
- Files: `app/api/bookings/route.ts`
- Impact: Failed notifications are silently lost; customers may not receive booking confirmations; no visibility into notification failures.
- Fix approach: Implement retry logic with exponential backoff; store failed notifications in queue; log to external service; consider using background job processor (e.g., Bull, RabbitMQ).

**Unimplemented API Endpoints:**
- Issue: Several API endpoints are TODO stubs with no implementation: webhook signature verification, tenant listing, tenant creation, resource listing, resource creation.
- Files: `app/api/webhooks/route.ts`, `app/api/tenants/route.ts`, `app/api/resources/route.ts`
- Impact: Incomplete API contracts; missing registration flow; no webhook signature verification for payments (security risk).
- Fix approach: Implement webhook signature validation before processing; implement superadmin tenant listing and registration flow; implement resource CRUD endpoints.

**Unimplemented Book Page:**
- Issue: `app/book/page.tsx` contains only a TODO comment for the booking wizard.
- Files: `app/book/page.tsx`
- Impact: Public booking page is not functional; customers cannot book without a custom integration.
- Fix approach: Implement public booking page using BookingForm component or create public-facing wrapper.

**Missing Payment Integration Implementation:**
- Issue: `app/dashboard/layout.tsx` line notes "TODO: Replace with your actual payment link, e.g., Kaspi Pay" without functional payment system.
- Files: `app/dashboard/layout.tsx`
- Impact: Billing/upgrade flow is incomplete; customers cannot upgrade plans or add subscription.
- Fix approach: Integrate actual payment provider (Kaspi, Stripe, or local alternative); implement webhook handlers for payment events.

---

## Known Bugs

**Potential Race Condition in Slot Generation:**
- Issue: `lib/booking/engine.ts` getAvailableSlots() fetches bookings and compares against slots generated from service duration, but concurrent booking creation between slot fetch and booking creation could cause overlaps.
- Files: `lib/booking/engine.ts` lines 189-199 (fetch existing), 230-232 (overlap check)
- Trigger: Two bookings for the same slot submitted simultaneously from different clients; transaction isolation may prevent but not guaranteed at slot generation time.
- Workaround: Atomic transaction with resource lock in `createBooking()` (lines 282-341) mitigates this, but slot display to user could show occupied slot as available if booking confirms between fetch and display.

**Date Input Validation Gap:**
- Issue: `components/booking-form.tsx` lines 614-615 validate year range (2000-2099) but not month/day validity.
- Files: `components/booking-form.tsx` lines 606-620
- Trigger: User manually enters "2026-02-30" or "2026-13-01" in date input.
- Workaround: Browser date input validates some formats, but custom year validation could be clearer. No explicit handling for invalid dates.

**ICS Calendar File Generation Uses Local Timezone:**
- Issue: `components/booking-form.tsx` generateICS() lines 114-119 generates ICS file using JavaScript Date which is in user's local timezone, not tenant timezone.
- Files: `components/booking-form.tsx` lines 107-132
- Trigger: User in different timezone downloads ICS file; calendar app may display booking in wrong timezone.
- Workaround: Pass timezone to generateICS() and use proper ISO 8601 formatting with timezone info.

---

## Security Considerations

**Missing Webhook Signature Verification:**
- Risk: `app/api/webhooks/route.ts` has TODO for verifying payment webhook signatures; could allow forged payment events.
- Files: `app/api/webhooks/route.ts`
- Current mitigation: Endpoint exists but unimplemented; payment system integration missing.
- Recommendations: Implement HMAC-SHA256 verification of webhook signatures; validate timestamp to prevent replay attacks; only accept whitelisted IPs if provider supports.

**Type Casting Bypasses Type Safety:**
- Risk: `app/api/bookings/route.ts` line 111 casts body to `Record<string, string>` without validation schema, trusting user input.
- Files: `app/api/bookings/route.ts` lines 104-111
- Current mitigation: Manual field checking (lines 113-120) and Zod validation in other endpoints, but POST body lacks formal schema.
- Recommendations: Use Zod schema to validate request body shape and types before casting; define schema at top of file similar to querySchema.

**Missing CSRF Protection on State-Changing Operations:**
- Risk: No explicit CSRF token validation on POST/DELETE operations; relies on SameSite cookie and content-type validation.
- Files: `app/api/bookings/route.ts`, `lib/actions/*.ts`
- Current mitigation: Next.js middleware applies role checks; server actions are compiled; POST endpoints check content-type.
- Recommendations: Add CSRF token validation to sensitive operations; use stricter SameSite=Strict for auth cookies.

**Telegram Chat ID Storage Without Encryption:**
- Risk: `prisma/schema.prisma` line 35 stores `telegramChatId` in plaintext in database.
- Files: `prisma/schema.prisma`, `app/api/bookings/route.ts` line 168
- Current mitigation: Limited to authenticated tenant owners.
- Recommendations: Encrypt sensitive IDs at rest using database column encryption or application-level encryption; rotate keys regularly.

**Email Validation Missing in Guest Booking:**
- Risk: `lib/booking/engine.ts` accepts `guestEmail` without validating email format.
- Files: `lib/booking/engine.ts` line 95, `app/api/bookings/route.ts` line 111
- Current mitigation: Frontend validation in booking form (components/booking-form.tsx uses `type="email"`), but no backend validation.
- Recommendations: Add Zod email validation in POST endpoint body schema; sanitize email before storage.

**Insufficient Rate Limiting on Booking Creation:**
- Risk: No rate limiting on `/api/bookings` POST endpoint; could enable spam or DoS attacks.
- Files: `app/api/bookings/route.ts`
- Current mitigation: `BookingLimitError` limits 2 active bookings per phone number (line 100, 307), but doesn't prevent rapid booking attempts across different phones.
- Recommendations: Add request-level rate limiting (e.g., 10 requests per minute per IP); use middleware or service like Upstash; implement exponential backoff for failed requests.

---

## Performance Bottlenecks

**N+1 Query Pattern in Booking Fetch:**
- Problem: `app/api/bookings/route.ts` includes related resource and service data for every booking; if fetching 100 bookings, requires 101+ queries.
- Files: `app/api/bookings/route.ts` lines 65-74
- Cause: `.include()` loads all related data instead of allowing selective eager loading.
- Improvement path: Add optional query parameters to control included fields (e.g., `?includeResource=true&includeService=true`); implement GraphQL or implement dataloader pattern.

**Slot Generation Loops Without Caching:**
- Problem: `components/booking-form.tsx` fetches available slots on every date/resource/service change with no client-side caching.
- Files: `components/booking-form.tsx` lines 349-370 (useEffect)
- Cause: Each slot fetch is fresh from API; if user navigates back and forth between same date, re-fetches slots.
- Improvement path: Cache slots in state using date+resource+service as key; implement SWR or React Query for automatic cache management; add HTTP caching headers to slot endpoint.

**Large Translation Object Loaded on Every Page:**
- Problem: `lib/i18n/translations.ts` 1609-line object is imported and evaluated on every request.
- Files: `lib/i18n/translations.ts`, `lib/i18n/context.tsx`, `lib/i18n/server.ts`
- Cause: All translations for all languages loaded into memory even if only one is needed.
- Improvement path: Code-split translations by locale; load only active locale at runtime; use lazy loading for translations; compress and serve from CDN.

**Week Calendar Rendering All Bookings Without Virtualization:**
- Problem: `components/booking-calendar.tsx` renders all bookings for a week in DOM; if 100+ bookings, poor performance.
- Files: `components/booking-calendar.tsx`
- Cause: No virtualization or pagination; all DOM nodes created upfront.
- Improvement path: Implement react-window or react-virtualized; render only visible bookings; paginate week view or implement scroll virtualization.

---

## Fragile Areas

**Booking Engine Date/Timezone Handling:**
- Files: `lib/booking/engine.ts`
- Why fragile: Complex timezone conversions with date-fns-tz; multiple date representations (ISO strings, Date objects, time strings); DST edge cases (line 151 uses noon to avoid DST).
- Safe modification: Write comprehensive unit tests for DST transitions, timezone edge cases, and leap seconds; use snapshot tests for slot generation; test with real DST dates.
- Test coverage: Only 3 test files exist (`__tests__/lib/tenant/*`); no tests for booking engine specifically.

**Multi-Step Booking Form State Management:**
- Files: `components/booking-form.tsx`
- Why fragile: 9 independent useState hooks managing form state (service, resource, date, time, name, phone, email, slots, loading, error, success); easy to create inconsistent states (e.g., selectedDate without selectedTime).
- Safe modification: Extract state into custom hook or useReducer; define state machine for valid transitions (service → resource → date → time → confirm); validate state invariants before render.
- Test coverage: Complex component requires unit tests for each step transition, form submission, error handling.

**Tenant Isolation Enforcement:**
- Files: `lib/db.ts`, `lib/tenant/index.ts`, middleware.ts
- Why fragile: Tenant isolation relies on middleware enforcing `tenantId` and code consistently passing it through; no default tenant from context in server actions (by design, but easy to miss).
- Safe modification: Use TypeScript types to enforce tenantId parameter presence; code review all database queries to ensure `where: { tenantId }` filter; add database-level row security policies if using PostgreSQL RLS; add integration tests that verify cross-tenant data isolation.
- Test coverage: Some tenant context tests exist (`__tests__/lib/tenant/*`) but no integration tests for cross-tenant boundary violations.

**Resource Lock in Concurrent Bookings:**
- Files: `lib/booking/engine.ts` line 285-287 (SELECT ... FOR UPDATE)
- Why fragile: PostgreSQL advisory locks; if connection drops, lock is released; no retry logic if lock wait times out.
- Safe modification: Add configurable lock timeout; implement retry with exponential backoff; monitor lock wait times; add integration tests with simulated concurrent bookings.
- Test coverage: No concurrency tests; only single-threaded unit tests possible.

---

## Scaling Limits

**Single Tenant Database with No Sharding:**
- Current capacity: Single PostgreSQL instance handles all tenants; scales to ~1000 concurrent users per instance (rough estimate based on connection pooling).
- Limit: At high traffic, database becomes bottleneck; no horizontal scaling of data layer.
- Scaling path: Implement tenant sharding by slug hash; use database routing layer or application-level routing; implement read replicas for analytics queries; cache frequently accessed data (schedules, services) in Redis.

**Email Sending Without Queue:**
- Current capacity: Fire-and-forget email in request lifecycle (lines 157, 180); can send ~100 emails/sec if Resend handles it.
- Limit: If SMTP/Resend is slow, request handling blocks; failed emails are lost; no retry mechanism.
- Scaling path: Use message queue (BullMQ, RabbitMQ, AWS SQS); implement worker process for email sending; add exponential backoff retries; monitor queue depth.

**Translations Hardcoded in Code:**
- Current capacity: 1609-line translations file; 3 languages supported; bundle size ~50KB uncompressed.
- Limit: Adding 10+ languages makes file unmaintainable; increases initial page load; no A/B testing of copy.
- Scaling path: Move to external service (Crowdin, Phrase, Lokalise); implement lazy loading of locale files; implement feature flags for copy experiments.

**Public Booking Form Without Caching:**
- Current capacity: Each user request to booking form fetches services, resources, schedules fresh from database; no caching.
- Limit: At 100 concurrent users, 100 database queries per page load.
- Scaling path: Cache tenant configuration (services, resources, schedules) for 5-10 minutes; use Redis or in-memory cache; add HTTP caching headers; pre-render booking form with next/image optimization.

---

## Dependencies at Risk

**next-auth with Custom OTP Flow:**
- Risk: `lib/auth/otp.ts` implements custom OTP logic alongside next-auth; potential for auth bypass if implementations diverge; no session storage strategy defined.
- Files: `lib/auth/otp.ts`, `lib/auth/index.ts`, `app/(auth)/verify-otp/page.tsx`
- Impact: Authentication system is critical path; bugs here affect entire platform security.
- Migration plan: Consider using Passkey (WebAuthn) instead of OTP; use standard next-auth providers; implement session storage in Redis for horizontal scaling.

**Resend Email Service with No Fallback:**
- Risk: `lib/email/resend.ts` is sole email provider; if Resend is down, customers receive no booking confirmations.
- Files: `lib/email/resend.ts`
- Impact: Critical customer communication path; no fallback to alternative provider.
- Migration plan: Add provider abstraction layer; implement fallback to SendGrid or AWS SES; add circuit breaker pattern to gracefully degrade.

**date-fns-tz Timezone Handling:**
- Risk: Complex timezone conversions with date-fns-tz (fromZonedTime, toZonedTime) in booking engine; library version updates could introduce DST bugs.
- Files: `lib/booking/engine.ts`, `components/booking-form.tsx`
- Impact: Booking slot generation is critical; DST bugs cause missed appointments or double bookings.
- Migration plan: Implement thorough DST test suite; consider Temporal API when available; add timezone-specific test fixtures.

---

## Missing Critical Features

**No Email Delivery Confirmation:**
- Problem: Booking confirmation emails are fire-and-forget; no confirmation of delivery to guest; no retry if email bounces.
- Blocks: Reliable communication with customers; compliance with payment receipt requirements in some jurisdictions.

**No Booking Reminders Implemented:**
- Problem: `lib/email/reminders.ts` exists but not triggered; customers don't receive day-before reminders.
- Blocks: Reducing no-shows; improving customer experience.

**No Payment System:**
- Problem: Billing page exists but no actual payment processing; all bookings are free.
- Blocks: Revenue generation; premium features (multiple resources, advanced analytics).

**No Analytics Dashboard:**
- Problem: `components/analytics-dashboard.tsx` component exists but may be incomplete; no business metrics (revenue, bookings by service, top resources).
- Blocks: Tenant decision-making; growth insights.

**No SMS Notifications:**
- Problem: Only email and Telegram notifications implemented; no SMS to reach customers without email.
- Blocks: Higher delivery rates; better customer communication in regions with low email adoption.

**No Booking Cancellation/Rescheduling:**
- Problem: Bookings can be created but no user-facing cancellation or reschedule flow.
- Blocks: Customer satisfaction; reduce support tickets.

**No Search/Filtering in Bookings List:**
- Problem: `app/api/bookings/route.ts` returns paginated results but UI may not implement full filtering by date, status, resource, service.
- Blocks: Tenant ability to find specific bookings; poor UX with large booking lists.

---

## Test Coverage Gaps

**Booking Engine Not Tested:**
- What's not tested: Core business logic in `lib/booking/engine.ts` (slot generation, conflict detection, booking creation).
- Files: `lib/booking/engine.ts` (342 lines)
- Risk: Critical bugs in timezone handling, DST transitions, concurrent booking conflicts could reach production.
- Priority: **High** - This is core to platform functionality.

**API Endpoint Integration Tests Missing:**
- What's not tested: `/api/bookings` POST/GET with full flow (create booking, verify email sent, verify phone normalization).
- Files: `app/api/bookings/route.ts` (202 lines)
- Risk: API contracts could break; error handling not validated; notification side effects untested.
- Priority: **High** - API is customer-facing.

**Multi-Tenant Isolation Not Tested:**
- What's not tested: Verify booking/resource/service data of tenant A is not visible to tenant B; cross-tenant queries return empty.
- Files: `lib/db.ts`, `lib/tenant/index.ts`
- Risk: Severe security vulnerability; tenant data leakage.
- Priority: **High** - Critical for multi-tenant security.

**Component State Transitions Not Tested:**
- What's not tested: BookingForm step transitions, form validation, error states, success screen.
- Files: `components/booking-form.tsx` (783 lines)
- Risk: UI bugs, broken user flows, form state inconsistencies in production.
- Priority: **Medium** - Complex component needs test coverage.

**Timezone Edge Cases Not Tested:**
- What's not tested: DST transitions, timezone changes mid-booking, midnight crossings in different timezones.
- Files: `lib/booking/engine.ts`, `components/booking-form.tsx`
- Risk: Subtle timezone bugs manifest only during DST transitions (spring forward, fall back).
- Priority: **Medium** - Intermittent bugs hard to debug.

**Auth and Permission Tests Missing:**
- What's not tested: Verify OWNER cannot access STAFF routes; SUPERADMIN can access admin routes; unauthenticated users redirected.
- Files: `middleware.ts`, `lib/auth/guards.ts`
- Risk: Auth bypass; unauthorized access to tenant data.
- Priority: **High** - Security critical.

---

*Concerns audit: 2026-03-17*
