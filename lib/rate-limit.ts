/**
 * Upstash Redis-backed fixed-window rate limiter.
 *
 * Uses the Upstash REST API so it works in serverless and edge environments
 * (no persistent TCP connection required). Rate limit counters are shared
 * across all function instances — effective in Vercel's serverless deployment.
 *
 * Usage:
 *   const result = await rateLimit(getClientIp(req), 10, 60_000)   // 10 req / min
 *   if (!result.success) return rateLimitResponse(result)
 */

import { Redis } from '@upstash/redis'

/** Lazy-initialized Redis client — avoids errors during build when env vars are absent. */
let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number // Unix ms
}

/**
 * Check and increment the counter for `key` using a fixed-window algorithm.
 * @param key      Unique identifier — typically `"prefix:email"`
 * @param max      Maximum requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const r = getRedis()
  const windowSec = Math.ceil(windowMs / 1000)
  const count = await r.incr(key)
  if (count === 1) {
    await r.expire(key, windowSec)
  }
  const ttl = await r.ttl(key)
  const resetAt = Date.now() + ttl * 1000
  if (count > max) {
    return { success: false, remaining: 0, resetAt }
  }
  return { success: true, remaining: max - count, resetAt }
}

/**
 * Extract the real client IP from standard proxy headers.
 * Falls back to "unknown" when no header is present.
 */
export function getClientIp(req: Request): string {
  const fwd = (req.headers as Headers).get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return 'unknown'
}
