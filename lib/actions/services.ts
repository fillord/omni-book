'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { basePrisma, getTenantDB } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
} from '@/lib/validations/service'
import { createAuditLog } from '@/lib/actions/audit-log'

// ---- types -----------------------------------------------------------------

interface TenantPlanInfo {
  maxResources?: number
  maxServices?: number
}

const PLAN_SERVICE_LIMITS: Record<string, number> = {
  FREE: 5,
  PRO: 100,
  ENTERPRISE: 9999,
}

export type LimitError = { success: false; error: 'LIMIT_REACHED'; plan: string }

// ---- include shape ---------------------------------------------------------

const SERVICE_INCLUDE = {
  resources: {
    include: { resource: { select: { id: true, name: true, type: true } } },
  },
} as const

export type ServiceWithRelations = Prisma.ServiceGetPayload<{
  include: typeof SERVICE_INCLUDE
}>

// ---- helpers ---------------------------------------------------------------

async function getSession(requireOwner = false) {
  const session = await requireAuth()
  if (!session.user.tenantId) redirect('/login')
  if (requireOwner) requireRole(session, ['OWNER', 'SUPERADMIN'])
  return session as typeof session & { user: { tenantId: string } }
}

/** Find a service that belongs to this tenant — used for ownership checks */
async function findOwned(id: string, tenantId: string) {
  const db = getTenantDB(tenantId)
  const service = await db.service.findUnique({ where: { id } })
  if (!service) throw new Error('Услуга не найдена')
  return service
}

/** price in the form is in major currency units (tenge); DB stores in minor units (tiyins = 1/100) */
function toMinorUnits(price: number | undefined): number | null {
  if (price === undefined || price === null) return null
  return Math.round(price * 100)
}

// ---- actions ---------------------------------------------------------------

export async function getServices(): Promise<ServiceWithRelations[]> {
  const session = await getSession()
  const db = getTenantDB(session.user.tenantId)
  return db.service.findMany({
    include: SERVICE_INCLUDE,
    orderBy: { name: 'asc' },
  }) as Promise<ServiceWithRelations[]>
}

export async function createService(
  data: CreateServiceInput
): Promise<ServiceWithRelations | LimitError> {
  const session  = await getSession(true)
  const parsed   = createServiceSchema.parse(data)
  const tenantId = session.user.tenantId
  const db       = getTenantDB(tenantId)

  const tenant = await basePrisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error('Бизнес не найден')

  const serviceCount = await db.service.count({ where: { tenantId } })
  const maxServices = PLAN_SERVICE_LIMITS[tenant.plan] ?? 5
  if (serviceCount >= maxServices) {
    return { success: false, error: 'LIMIT_REACHED', plan: tenant.plan }
  }

  // Ensure all resources belong to the current tenant
  if (parsed.resourceIds.length > 0) {
    const resources = await db.resource.findMany({
      where: {
        id:       { in: parsed.resourceIds },
        tenantId: tenantId,
      },
      select: { id: true },
    })

    const allowedIds = new Set(resources.map((r) => r.id))
    const invalidIds = parsed.resourceIds.filter((id) => !allowedIds.has(id))

    if (invalidIds.length > 0) {
      throw new Error('Некорректные ресурсы: обнаружены ресурсы, не принадлежащие вашему аккаунту')
    }
  }

  const svc = await db.service.create({
    data: {
      tenantId:       tenantId,
      name:           parsed.name,
      description:    parsed.description,
      durationMin:    parsed.durationMin,
      price:          toMinorUnits(parsed.price),
      currency:       parsed.currency ?? 'KZT',
      translations:   (parsed.translations ?? {}) as Prisma.InputJsonValue,
    },
  })

  if (parsed.resourceIds.length > 0) {
    await basePrisma.resourceService.createMany({
      data: parsed.resourceIds.map((resourceId) => ({
        resourceId,
        serviceId: svc.id,
      })),
      skipDuplicates: true,
    })
  }

  const result = await db.service.findUnique({
    where:   { id: svc.id },
    include: SERVICE_INCLUDE,
  })
  if (!result) throw new Error('Услуга не найдена после создания')

  revalidatePath('/dashboard/services')
  revalidatePath('/dashboard/resources')
  return result as ServiceWithRelations
}

export async function updateService(
  id: string,
  data: UpdateServiceInput
): Promise<ServiceWithRelations> {
  const session  = await getSession(true)
  const parsed   = updateServiceSchema.parse(data)
  const tenantId = session.user.tenantId

  await findOwned(id, tenantId)

  const updateData: Prisma.ServiceUpdateInput = {}
  if (parsed.name !== undefined)            updateData.name           = parsed.name
  if ('description' in parsed)              updateData.description    = parsed.description ?? null
  if (parsed.durationMin !== undefined)     updateData.durationMin    = parsed.durationMin
  if ('price' in parsed)                    updateData.price          = toMinorUnits(parsed.price)
  if (parsed.currency !== undefined)        updateData.currency       = parsed.currency

  if (parsed.translations !== undefined) {
    const existing = await findOwned(id, tenantId)
    const existingTranslations = (existing.translations as Record<string, Record<string, string>>) || {}
    updateData.translations = Object.entries(parsed.translations).reduce((acc, [lang, dict]) => {
      acc[lang] = { ...(acc[lang] || {}), ...dict }
      return acc
    }, { ...existingTranslations }) as Prisma.InputJsonValue
  }

  const db = getTenantDB(tenantId)
  await db.service.update({ where: { id }, data: updateData })

  if (parsed.resourceIds !== undefined) {
    if (parsed.resourceIds.length > 0) {
      const resources = await db.resource.findMany({
        where: {
          id:       { in: parsed.resourceIds },
          tenantId: tenantId,
        },
        select: { id: true },
      })

      const allowedIds = new Set(resources.map((r) => r.id))
      const invalidIds = parsed.resourceIds.filter((resourceId) => !allowedIds.has(resourceId))

      if (invalidIds.length > 0) {
        throw new Error('Некорректные ресурсы: обнаружены ресурсы, не принадлежащие вашему аккаунту')
      }
    }

    await basePrisma.resourceService.deleteMany({ where: { serviceId: id } })

    if (parsed.resourceIds.length > 0) {
      await basePrisma.resourceService.createMany({
        data: parsed.resourceIds.map((resourceId) => ({ resourceId, serviceId: id })),
        skipDuplicates: true,
      })
    }
  }

  const result = await db.service.findUnique({
    where:   { id },
    include: SERVICE_INCLUDE,
  })
  if (!result) throw new Error('Услуга не найдена после обновления')

  revalidatePath('/dashboard/services')
  revalidatePath('/dashboard/resources')
  return result as ServiceWithRelations
}

export async function deleteService(id: string): Promise<void> {
  const session  = await getSession(true)
  const tenantId = session.user.tenantId

  await findOwned(id, tenantId)

  const db = getTenantDB(tenantId)
  const service = await db.service.findUnique({ where: { id }, select: { name: true, tenantId: true } })
  await db.service.delete({ where: { id } })

  if (service) {
    createAuditLog(service.tenantId, 'service_deleted', { serviceName: service.name, serviceId: id })
  }

  revalidatePath('/dashboard/services')
}

export async function toggleServiceActive(
  id: string
): Promise<ServiceWithRelations> {
  const session  = await getSession(true)
  const tenantId = session.user.tenantId
  const db       = getTenantDB(tenantId)

  const existing = await findOwned(id, tenantId)

  const result = await db.service.update({
    where:   { id },
    data:    { isActive: !existing.isActive },
    include: SERVICE_INCLUDE,
  })

  revalidatePath('/dashboard/services')
  return result as ServiceWithRelations
}
