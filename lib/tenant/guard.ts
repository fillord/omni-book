import { basePrisma } from '@/lib/db'
import { getTenantId } from './context'

type BookingCreateArgs = Parameters<typeof basePrisma.booking.create>[0]
type ResourceCreateArgs = Parameters<typeof basePrisma.resource.create>[0]

/**
 * Returns a Prisma-like helper that automatically scopes queries to the
 * tenant currently set in AsyncLocalStorage.
 *
 * @deprecated Prefer importing `prisma` from `@/lib/db` (the tenant-extended
 * client) and wrapping calls in `setTenantContext()`.
 * This helper is kept for backwards-compatibility during migration.
 */
export async function tenantDb() {
  const tenantId = getTenantId()
  if (!tenantId) throw new Error('[tenantDb] No tenant context. Call setTenantContext() first.')

  return {
    booking: {
      findMany: (args?: object) =>
        basePrisma.booking.findMany({ ...args, where: { ...(args as { where?: object } | undefined)?.where, tenantId } }),
      create: (args: { data: object }) =>
        basePrisma.booking.create({ ...args, data: { ...(args.data as Record<string, unknown>), tenantId } } as BookingCreateArgs),
    },
    resource: {
      findMany: (args?: object) =>
        basePrisma.resource.findMany({ ...args, where: { ...(args as { where?: object } | undefined)?.where, tenantId } }),
      create: (args: { data: object }) =>
        basePrisma.resource.create({ ...args, data: { ...(args.data as Record<string, unknown>), tenantId } } as ResourceCreateArgs),
    },
  }
}
