/**
 * In-memory sliding-window rate limiter.
 *
 * Intentionally simple — no Redis required.
 * In a multi-instance / serverless deployment each instance maintains its own
 * counter, so the effective limit is `max * instanceCount`.  That is acceptable
 * for abuse prevention before a Redis-backed solution is introduced.
 *
 * Usage:
 *   const result = rateLimit(getClientIp(req), 10, 60_000)   // 10 req / min
 *   if (!result.success) return rateLimitResponse(result)
 */

interface Entry {
  count: number
  resetAt: number // Unix ms
}

const store = new Map<string, Entry>()
let lastCleanup = Date.now()

/** Remove expired entries every 5 minutes to prevent unbounded memory growth. */
function maybeCleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60_000) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number // Unix ms
}

/**
 * Check and increment the counter for `key`.
 * @param key      Unique identifier — typically `"prefix:ip"`
 * @param max      Maximum requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  maybeCleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: max - 1, resetAt: now + windowMs }
  }

  if (entry.count >= max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: max - entry.count, resetAt: entry.resetAt }
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
