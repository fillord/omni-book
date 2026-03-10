import { prisma } from '@/lib/db'
import { getTenantSlug } from './context'

/**
 * Returns a Prisma transaction-style helper that automatically scopes
 * every query to the current tenant's ID.
 *
 * Usage:
 *   const db = await tenantDb()
 *   const bookings = await db.booking.findMany()  // always filtered by tenantId
 */
export async function tenantDb() {
  const slug = await getTenantSlug()

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug } })
  const tenantId = tenant.id

  return {
    booking: {
      findMany: (args?: object) =>
        prisma.booking.findMany({ ...args, where: { ...(args as any)?.where, tenantId } }),
      create: (args: { data: object }) =>
        prisma.booking.create({ ...args, data: { ...(args.data as any), tenantId } }),
    },
    resource: {
      findMany: (args?: object) =>
        prisma.resource.findMany({ ...args, where: { ...(args as any)?.where, tenantId } }),
      create: (args: { data: object }) =>
        prisma.resource.create({ ...args, data: { ...(args.data as any), tenantId } }),
    },
  }
}
