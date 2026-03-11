import { type NextRequest } from 'next/server'
import { basePrisma } from '@/lib/db'

// ---- Custom errors ---------------------------------------------------------

export class TenantNotFoundError extends Error {
  readonly statusCode = 404
  constructor(slug: string) {
    super(`Tenant not found: "${slug}"`)
    this.name = 'TenantNotFoundError'
  }
}

export class TenantInactiveError extends Error {
  readonly statusCode = 403
  constructor(slug: string) {
    super(`Tenant is suspended: "${slug}"`)
    this.name = 'TenantInactiveError'
  }
}

export class TenantSlugMissingError extends Error {
  readonly statusCode = 400
  constructor() {
    super('Tenant slug is missing. Provide x-tenant-slug header or tenantSlug query param.')
    this.name = 'TenantSlugMissingError'
  }
}

// ---- Resolver --------------------------------------------------------------

/**
 * Resolves the current tenant from a NextRequest.
 *
 * Resolution order:
 *  1. x-tenant-slug request header (set by middleware from subdomain)
 *  2. `tenantSlug` query parameter (fallback for localhost/dev)
 *
 * Throws:
 *  - TenantSlugMissingError  (400) — no slug found anywhere
 *  - TenantNotFoundError     (404) — slug not in DB
 *  - TenantInactiveError     (403) — tenant exists but isActive = false
 */
export async function resolveTenant(request: NextRequest) {
  const slug =
    request.headers.get('x-tenant-slug') ??
    request.nextUrl.searchParams.get('tenantSlug') ??
    null

  if (!slug || slug.trim() === '') {
    throw new TenantSlugMissingError()
  }

  // Use basePrisma to bypass the tenant extension (Tenant model has no tenantId)
  const tenant = await basePrisma.tenant.findUnique({ where: { slug: slug.trim() } })

  if (!tenant) throw new TenantNotFoundError(slug)
  if (!tenant.isActive) throw new TenantInactiveError(slug)

  return tenant
}

/**
 * Converts a tenant resolution error into an HTTP status code + message pair.
 * Use in route handlers for uniform error responses.
 */
export function isTenantError(
  err: unknown
): err is TenantNotFoundError | TenantInactiveError | TenantSlugMissingError {
  return (
    err instanceof TenantNotFoundError ||
    err instanceof TenantInactiveError ||
    err instanceof TenantSlugMissingError
  )
}
