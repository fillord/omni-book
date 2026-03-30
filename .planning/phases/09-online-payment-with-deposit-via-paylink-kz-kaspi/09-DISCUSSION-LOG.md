> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-03-30
**Phase:** 09-online-payment-with-deposit-via-paylink-kz-kaspi
**Mode:** assumptions (--auto)
**Areas analyzed:** Prisma Schema Extension, Payment Flow Architecture, Webhook Security, Timeout/Cron Strategy, Tenant Configuration UI

## Assumptions Presented

### Prisma Schema Extension
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Tenant gains `requireDeposit`, `depositAmount`, `paylinkApiKey`; no new Payment model | Likely | `prisma/schema.prisma` flat Tenant config pattern; PAY-01 scope is status-only |
| Booking gains `paymentExpiresAt DateTime?` | Likely | `lib/subscription-lifecycle.ts` stored-expiry pattern |

### Payment Flow Architecture
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| POST /api/bookings conditionally branches; returns `{ booking, checkoutUrl }` | Likely | `components/booking-form.tsx` handleSubmit reads `data.booking.id`; minimal invasive change |
| Slot blocking already works for PENDING — no change needed | Confident | `lib/booking/engine.ts` already includes PENDING in collision query |

### Webhook Security
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Dedicated `app/api/webhooks/paylink/route.ts`; HMAC-SHA256 via env var | Confident | Existing `app/api/webhooks/meta/route.ts` sub-directory pattern; pre-existing TODO in stub |

### Timeout / Cron Strategy
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Dedicated `app/api/cron/pending-payments/route.ts` at `*/10 * * * *` | Likely | `vercel.json` shows `0,30 * * * *` reminders cron exists — sub-daily confirmed; subscriptions cron at 2am is wrong frequency for 30-min payments |

### Tenant Configuration UI
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Deposit settings added to `billing-content.tsx` | Likely | PAY-01 references billing/settings page; existing billing page already handles tenant mutations |

## Corrections Made

No corrections — --auto mode, all assumptions Confident/Likely. Proceeding with defaults.

## External Research (flagged, not yet resolved)

1. Paylink.kz API checkout session creation — endpoint, request/response shape, amount units
2. Paylink.kz webhook payload structure — field names, status enum values
3. Paylink.kz HMAC signing algorithm and string construction
4. Paylink.kz sandbox/test environment availability
5. Vercel plan cron frequency limit — confirmed sub-daily OK via existing reminders cron

**Note for researcher:** Items 1-4 require investigation of Paylink.kz official API documentation before planning can finalize the webhook handler and checkout session creation details.
