import { PrismaClient } from '@prisma/client'
import { getTenantPrisma } from '@/lib/tenant/prisma-tenant'

// ---- Singletons (hot-reload safe) ------------------------------------------

type GlobalWithPrisma = typeof globalThis & {
  _basePrisma?: PrismaClient
}

const g = globalThis as GlobalWithPrisma

// Raw client — used by resolveTenant() and transactions (engine.ts)
export const basePrisma: PrismaClient = g._basePrisma ?? new PrismaClient()

// Tenant-scoped client factory — automatically injects tenantId.
// Use this in all feature code (bookings, resources, services, users).
export function getTenantDB(tenantId: string) {
  return getTenantPrisma(basePrisma, tenantId)
}

if (process.env.NODE_ENV !== 'production') {
  g._basePrisma = basePrisma
}
