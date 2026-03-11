import { basePrisma } from '@/lib/db'
import { getTenantId } from './context'

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        basePrisma.booking.create({ ...args, data: { ...(args.data as any), tenantId } } as any),
    },
    resource: {
      findMany: (args?: object) =>
        basePrisma.resource.findMany({ ...args, where: { ...(args as { where?: object } | undefined)?.where, tenantId } }),
      create: (args: { data: object }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        basePrisma.resource.create({ ...args, data: { ...(args.data as any), tenantId } } as any),
    },
  }
}
