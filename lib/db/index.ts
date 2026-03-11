import { PrismaClient } from '@prisma/client'
import { withTenantExtension } from '@/lib/tenant/prisma-tenant'

// ---- Singletons (hot-reload safe) ------------------------------------------

type GlobalWithPrisma = typeof globalThis & {
  _basePrisma?: PrismaClient
  _prisma?: ReturnType<typeof withTenantExtension>
}

const g = globalThis as GlobalWithPrisma

// Raw client — used by resolveTenant() and any platform-level code that must
// query without a tenant context (e.g. looking up Tenant by slug).
export const basePrisma: PrismaClient = g._basePrisma ?? new PrismaClient()

// Tenant-scoped client — automatically injects tenantId from AsyncLocalStorage.
// Use this in all feature code (bookings, resources, services, users).
export const prisma = g._prisma ?? withTenantExtension(basePrisma)

if (process.env.NODE_ENV !== 'production') {
  g._basePrisma = basePrisma
  g._prisma = prisma
}
