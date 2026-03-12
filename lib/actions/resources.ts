'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { basePrisma, getTenantDB } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import {
  createResourceSchema,
  updateResourceSchema,
  type CreateResourceInput,
  type UpdateResourceInput,
} from '@/lib/validations/resource'

// ---- types -----------------------------------------------------------------

const RESOURCE_INCLUDE = {
  schedules: true,
  services: {
    include: { service: { select: { id: true, name: true } } },
  },
} as const

export type ResourceWithRelations = Prisma.ResourceGetPayload<{
  include: typeof RESOURCE_INCLUDE
}>

export type ScheduleEntry = {
  dayOfWeek: number   // 0=Sun … 6=Sat
  startTime: string   // "HH:MM"
  endTime:   string   // "HH:MM"
  isActive:  boolean
}

// ---- helpers ---------------------------------------------------------------

async function getSession(requireOwner = false) {
  const session = await requireAuth()
  if (!session.user.tenantId) redirect('/login')
  if (requireOwner) requireRole(session, ['OWNER', 'SUPERADMIN'])
  return session as typeof session & { user: { tenantId: string } }
}

/** Find a resource that belongs to this tenant — ownership check */
async function findOwned(id: string, tenantId: string) {
  const db = getTenantDB(tenantId)
  const resource = await db.resource.findUnique({ where: { id } })
  if (!resource) throw new Error('Ресурс не найден')
  return resource
}

/** Default schedule entries by niche */
function getDefaultSchedule(niche: string | null | undefined): ScheduleEntry[] {
  let days: number[]
  let startTime: string
  let endTime: string

  switch (niche) {
    case 'beauty':  days = [1,2,3,4,5,6];     startTime = '09:00'; endTime = '19:00'; break
    case 'horeca':  days = [0,1,2,3,4,5,6];   startTime = '10:00'; endTime = '23:00'; break
    case 'sports':  days = [0,1,2,3,4,5,6];   startTime = '07:00'; endTime = '22:00'; break
    case 'medicine':
    default:        days = [1,2,3,4,5];        startTime = '09:00'; endTime = '18:00'; break
  }

  return days.map((dayOfWeek) => ({ dayOfWeek, startTime, endTime, isActive: true }))
}

/** Upsert all schedule entries for a resource */
async function upsertSchedule(resourceId: string, entries: ScheduleEntry[]) {
  for (const entry of entries) {
    await basePrisma.schedule.upsert({
      where: { resourceId_dayOfWeek: { resourceId, dayOfWeek: entry.dayOfWeek } },
      update: { startTime: entry.startTime, endTime: entry.endTime, isActive: entry.isActive },
      create: { resourceId, dayOfWeek: entry.dayOfWeek, startTime: entry.startTime, endTime: entry.endTime, isActive: entry.isActive },
    })
  }
}

// ---- actions ---------------------------------------------------------------

export async function getResources(): Promise<ResourceWithRelations[]> {
  const session = await getSession()
  const db = getTenantDB(session.user.tenantId)
  return db.resource.findMany({
    include: RESOURCE_INCLUDE,
    orderBy: { name: 'asc' },
  }) as Promise<ResourceWithRelations[]>
}

export async function createResource(
  data: CreateResourceInput,
  scheduleData?: ScheduleEntry[]
): Promise<ResourceWithRelations> {
  const session  = await getSession(true)
  const parsed   = createResourceSchema.parse(data)
  const tenantId = session.user.tenantId
  const db       = getTenantDB(tenantId)

  const tenantObj = await basePrisma.tenant.findUnique({
    where: { id: tenantId },
  })
  
  if (!tenantObj) throw new Error('Бизнес не найден')

  const currentResourceCount = await db.resource.count({
    where: { tenantId }
  })

  // Используем каст к any чтобы обойти временный кэш типов TS-сервера (мы только что сделали db push)
  const maxRes = (tenantObj as any).maxResources || 1

  if (currentResourceCount >= maxRes) {
    throw new Error('Лимит ресурсов исчерпан. Пожалуйста, обновите тарифный план или обратитесь в поддержку.')
  }

  const resource = await db.resource.create({
    data: {
      name:        parsed.name,
      type:        parsed.type,
      description: parsed.description,
      capacity:    parsed.capacity,
      attributes:  (parsed.attributes ?? {}) as Prisma.InputJsonValue,
      translations: (parsed.translations ?? {}) as Prisma.InputJsonValue,
    },
  })

  // Use provided schedule or fall back to niche defaults
  let entries = scheduleData
  if (!entries || entries.length === 0) {
    entries = getDefaultSchedule(tenantObj.niche)
  }
  await upsertSchedule(resource.id, entries)

  const result = await db.resource.findUnique({
    where: { id: resource.id },
    include: RESOURCE_INCLUDE,
  })

  revalidatePath('/dashboard/resources')
  return result as ResourceWithRelations
}

export async function updateResource(
  id: string,
  data: UpdateResourceInput,
  scheduleData?: ScheduleEntry[]
): Promise<ResourceWithRelations> {
  const session  = await getSession(true)
  const parsed   = updateResourceSchema.parse(data)
  const tenantId = session.user.tenantId

  await findOwned(id, tenantId)

  const updateData: Prisma.ResourceUpdateInput = {}
  if (parsed.name !== undefined)       updateData.name        = parsed.name
  if (parsed.type !== undefined)       updateData.type        = parsed.type
  if ('description' in parsed)         updateData.description = parsed.description ?? null
  if ('capacity' in parsed)            updateData.capacity    = parsed.capacity ?? null
  if (parsed.attributes !== undefined) updateData.attributes  = parsed.attributes as Prisma.InputJsonValue

  if (parsed.translations !== undefined) {
    const existing = await findOwned(id, tenantId)
    const existingTranslations = (existing.translations as Record<string, any>) || {}
    updateData.translations = Object.entries(parsed.translations).reduce((acc, [lang, dict]) => {
      acc[lang] = { ...(acc[lang] || {}), ...dict }
      return acc
    }, { ...existingTranslations }) as Prisma.InputJsonValue
  }

  const db = getTenantDB(tenantId)
  await db.resource.update({ where: { id }, data: updateData })

  if (scheduleData && scheduleData.length > 0) {
    await upsertSchedule(id, scheduleData)
  }

  const resource = await db.resource.findUnique({
    where: { id },
    include: RESOURCE_INCLUDE,
  })

  revalidatePath('/dashboard/resources')
  return resource as ResourceWithRelations
}

export async function deleteResource(id: string): Promise<void> {
  const session  = await getSession(true)
  const tenantId = session.user.tenantId

  await findOwned(id, tenantId)

  const db = getTenantDB(tenantId)
  const futureCount = await db.booking.count({
    where: {
      resourceId: id,
      startsAt: { gt: new Date() },
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
  })

  if (futureCount > 0) throw new Error(`FUTURE_BOOKINGS:${futureCount}`)

  await db.resource.update({ where: { id }, data: { isActive: false } })

  revalidatePath('/dashboard/resources')
}

export async function toggleResourceActive(
  id: string
): Promise<ResourceWithRelations> {
  const session  = await getSession(true)
  const tenantId = session.user.tenantId
  const db       = getTenantDB(tenantId)

  const existing = await findOwned(id, tenantId)

  const resource = await db.resource.update({
    where: { id },
    data:  { isActive: !existing.isActive },
    include: RESOURCE_INCLUDE,
  })

  revalidatePath('/dashboard/resources')
  return resource as ResourceWithRelations
}
