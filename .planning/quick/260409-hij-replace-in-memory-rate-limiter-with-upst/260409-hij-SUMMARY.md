---
phase: quick
plan: 260409-hij
subsystem: security/rate-limiting
tags: [rate-limiting, upstash, redis, serverless, otp, security]
dependency_graph:
  requires: []
  provides: [shared-rate-limiting-across-serverless-instances]
  affects: [lib/rate-limit.ts, lib/actions/otp.ts, app/api/auth/register/route.ts, app/api/bookings/route.ts]
tech_stack:
  added: ["@upstash/redis@^1.37.0"]
  patterns: ["lazy-init Redis client", "fixed-window INCR+EXPIRE rate limiting"]
key_files:
  created: []
  modified:
    - lib/rate-limit.ts
    - lib/actions/otp.ts
    - app/api/auth/register/route.ts
    - app/api/bookings/route.ts
    - .env.example
    - package.json
decisions:
  - "Lazy-init Redis client via getRedis() to avoid build errors when env vars absent"
  - "Fixed-window algorithm via INCR+EXPIRE — simpler than sliding window, sufficient for OTP abuse prevention"
  - "All callers awaited (6 call sites total: 4 in otp.ts, 1 in register route, 1 in bookings route)"
metrics:
  duration: "~3 min"
  completed: "2026-04-09"
  tasks_completed: 2
  files_changed: 6
---

# Quick Task 260409-hij: Replace In-Memory Rate Limiter with Upstash Redis Summary

**One-liner:** Replaced per-instance in-memory Map rate limiter with Upstash Redis REST-backed fixed-window limiter shared across all serverless instances.

## What Was Done

The previous `lib/rate-limit.ts` used an in-memory `Map<string, Entry>` which resets on every cold start and is isolated per Vercel function instance — making rate limits effectively useless in production. This task replaced it with a Redis-backed implementation using the Upstash REST API.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Upstash Redis and rewrite rate limiter | 4e6e43e | lib/rate-limit.ts, package.json, package-lock.json |
| 2 | Update callers to await rateLimit + .env.example | 065d6b5 | lib/actions/otp.ts, app/api/auth/register/route.ts, app/api/bookings/route.ts, .env.example |

## Implementation Details

- `lib/rate-limit.ts`: Removed all in-memory code (`Entry` interface, `store` Map, `lastCleanup`, `maybeCleanup`). Added `@upstash/redis` import with lazy-initialized client. Changed `rateLimit()` from synchronous to `async function rateLimit(...): Promise<RateLimitResult>`. RateLimitResult shape and getClientIp helper are unchanged.
- Fixed-window algorithm: `INCR key` → set `EXPIRE` only on first call → read `TTL` for `resetAt` calculation.
- Discovered 2 additional callers beyond otp.ts: `app/api/auth/register/route.ts` and `app/api/bookings/route.ts` — both updated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing callers] Found 2 additional rateLimit callers beyond otp.ts**
- **Found during:** Task 2 (TypeScript compilation revealed Property 'success' does not exist on type 'Promise<RateLimitResult>' errors)
- **Issue:** `app/api/auth/register/route.ts` and `app/api/bookings/route.ts` also import and call `rateLimit()` without await
- **Fix:** Added `await` to both call sites (plan step 2 already asked to search for all callers — found 6 total instead of 4)
- **Files modified:** app/api/auth/register/route.ts, app/api/bookings/route.ts
- **Commit:** 065d6b5

## Verification Results

1. `npx tsc --noEmit` — passes (only pre-existing regex flag errors in test files, unrelated to this task)
2. All 6 `rateLimit(` call sites use `await`
3. `grep "Map" lib/rate-limit.ts` — empty (no in-memory Map)
4. `grep "upstash" lib/rate-limit.ts` — confirms `import { Redis } from '@upstash/redis'`
5. `grep "UPSTASH_REDIS_REST" .env.example` — both env vars documented

## Known Stubs

None — implementation is complete. Env vars `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` must be provisioned in Vercel environment settings pointing to an Upstash database.

## Self-Check: PASSED

- lib/rate-limit.ts: exists, uses Upstash Redis, no Map
- lib/actions/otp.ts: all 4 calls await rateLimit
- app/api/auth/register/route.ts: awaits rateLimit
- app/api/bookings/route.ts: awaits rateLimit
- .env.example: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN documented
- Commits 4e6e43e and 065d6b5 exist in git log
