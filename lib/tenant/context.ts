import { headers } from 'next/headers'

/**
 * Reads the tenant slug injected by middleware.
 * Must be called from a Server Component or Route Handler.
 */
export async function getTenantSlug(): Promise<string> {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) throw new Error('Tenant slug not found in request headers')
  return slug
}
