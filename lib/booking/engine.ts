/**
 * Core booking engine: schedule-based slot generation, atomic booking creation.
 * All functions receive explicit tenantId — never read from global state.
 */

import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { basePrisma, getTenantDB } from "@/lib/db"

// ---- Errors ----------------------------------------------------------------

export class BookingConflictError extends Error {
  readonly statusCode = 409
  constructor() {
    super("Это время уже занято. Пожалуйста, выберите другой слот.")
    this.name = "BookingConflictError"
  }
}

export class ResourceNotFoundError extends Error {
  readonly statusCode = 404
  constructor() {
    super("Ресурс не найден")
    this.name = "ResourceNotFoundError"
  }
}

export class ServiceNotFoundError extends Error {
  readonly statusCode = 404
  constructor() {
    super("Услуга не найдена")
    this.name = "ServiceNotFoundError"
  }
}

export class DayOffError extends Error {
  readonly statusCode = 422
  constructor() {
    super("В этот день ресурс не работает")
    this.name = "DayOffError"
  }
}

export class BookingLimitError extends Error {
  readonly statusCode = 429
  constructor() {
    super("Превышен лимит бронирований. У вас уже есть 2 активные записи. Отмените одну из них или дождитесь завершения.")
    this.name = "BookingLimitError"
  }
}

export class PastDateError extends Error {
  readonly statusCode = 422
  constructor() {
    super("Нельзя создать запись в прошлом времени.")
    this.name = "PastDateError"
  }
}

// ---- Types -----------------------------------------------------------------

export interface SlotResult {
  /** Time label in tenant timezone, e.g. "09:00" */
  time: string
  /** Slot start as UTC ISO string */
  startsAt: string
  /** Slot end as UTC ISO string */
  endsAt: string
  available: boolean
}

export interface GetAvailableSlotsParams {
  tenantId: string
  resourceId: string
  /** ISO date string in tenant timezone, e.g. "2026-03-12" */
  date: string
  serviceId: string
}

export interface CreateBookingParams {
  tenantId: string
  resourceId: string
  serviceId: string
  /** UTC ISO string for slot start */
  startsAt: string
  guestName: string
  guestPhone: string
  guestEmail?: string | null
}

// ---- Constants -------------------------------------------------------------

const MAX_ACTIVE_BOOKINGS_PER_PHONE = 2

// ---- Helpers ---------------------------------------------------------------

/** Strip spaces, dashes, and parentheses so "+7 701 111-22-33" === "77011112233" */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "")
}

/** Parse "HH:MM" into { h, m } */
function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map(Number)
  return { h, m }
}

/** Build a Date in the given timezone for a specific date + "HH:MM" */
function zonedDatetime(dateStr: string, timeStr: string, timezone: string): Date {
  const { h, m } = parseTime(timeStr)
  // dateStr is "YYYY-MM-DD" — construct a local wall-clock datetime and convert
  return fromZonedTime(new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`), timezone)
}

// ---- getAvailableSlots -----------------------------------------------------

/**
 * Returns all possible slots for a resource+service on a given date,
 * with `available: false` for slots that overlap existing bookings.
 */
export async function getAvailableSlots(
  params: GetAvailableSlotsParams
): Promise<SlotResult[]> {
  const { tenantId, resourceId, date, serviceId } = params

  const db = getTenantDB(tenantId)

  // Load tenant timezone + resource schedule + service duration in parallel
  const [tenant, schedule, service] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } }),
    db.schedule.findFirst({
      where: {
        resourceId,
        dayOfWeek: new Date(date + "T12:00:00").getDay(), // noon to avoid DST edge
        isActive: true,
      },
    }),
    db.service.findUnique({
      where: { id: serviceId },
      select: { durationMin: true, tenantId: true },
    }),
  ])

  if (!tenant) throw new ResourceNotFoundError()
  if (!service || service.tenantId !== tenantId) throw new ServiceNotFoundError()
  if (!schedule) throw new DayOffError()

  const timezone = tenant.timezone
  const durationMs = service.durationMin * 60 * 1000

  // Build window [dayStart, dayEnd) in UTC
  const dayStart = zonedDatetime(date, schedule.startTime, timezone)
  const dayEnd   = zonedDatetime(date, schedule.endTime, timezone)

  // Fetch all active bookings for this resource on that day
  const existingBookings = await db.booking.findMany({
    where: {
      resourceId,
      status: { in: ["CONFIRMED", "PENDING"] },
      AND: [
        { startsAt: { lt: dayEnd } },
        { endsAt:   { gt: dayStart } },
      ],
    },
    select: { startsAt: true, endsAt: true },
  })

  // Generate slots every `durationMin` minutes
  const slots: SlotResult[] = []
  let cursor = dayStart.getTime()
  const end   = dayEnd.getTime()
  const now   = new Date()

  while (cursor + durationMs <= end) {
    const slotStart = new Date(cursor)
    const slotEnd   = new Date(cursor + durationMs)

    // Skip slots that start in the past (relative to current moment)
    if (slotStart < now) {
      cursor += durationMs
      continue
    }

    // Check overlap with any existing booking
    const busy = existingBookings.some(
      (b) => slotStart < b.endsAt && slotEnd > b.startsAt
    )

    // Format time label in tenant timezone
    const zonedStart = toZonedTime(slotStart, timezone)
    const hh = String(zonedStart.getHours()).padStart(2, "0")
    const mm = String(zonedStart.getMinutes()).padStart(2, "0")

    slots.push({
      time:      `${hh}:${mm}`,
      startsAt:  slotStart.toISOString(),
      endsAt:    slotEnd.toISOString(),
      available: !busy,
    })

    cursor += durationMs
  }

  return slots
}

// ---- createBooking ---------------------------------------------------------

/**
 * Atomically creates a booking, locking the resource row to prevent races.
 * Throws BookingConflictError on overlap.
 */
export async function createBooking(params: CreateBookingParams) {
  const { tenantId, resourceId, serviceId, startsAt, guestName, guestPhone, guestEmail } = params

  const startsAtDate = new Date(startsAt)
  if (isNaN(startsAtDate.getTime())) {
    throw new Error("Invalid startsAt datetime")
  }

  if (startsAtDate.getTime() < Date.now()) {
    throw new PastDateError()
  }

  const normalizedPhone = normalizePhone(guestPhone)

  return basePrisma.$transaction(
    async (tx) => {
      // Lock resource row to prevent concurrent bookings on same resource
      await tx.$queryRaw`
        SELECT id FROM "Resource" WHERE id = ${resourceId} FOR UPDATE
      `

      // Re-verify resource and service belong to tenant
      const [resource, service] = await Promise.all([
        tx.resource.findFirst({ where: { id: resourceId, tenantId } }),
        tx.service.findFirst({ where: { id: serviceId, tenantId } }),
      ])

      if (!resource) throw new ResourceNotFoundError()
      if (!service)  throw new ServiceNotFoundError()

      // Anti-spam: max active bookings per phone per tenant
      const activeCount = await tx.booking.count({
        where: {
          tenantId,
          guestPhone: normalizedPhone,
          status: { in: ["PENDING", "CONFIRMED"] },
          endsAt: { gte: new Date() },
        },
      })
      if (activeCount >= MAX_ACTIVE_BOOKINGS_PER_PHONE) throw new BookingLimitError()

      const endsAtDate = new Date(startsAtDate.getTime() + service.durationMin * 60 * 1000)

      // Collision check inside the transaction
      const collision = await tx.booking.findFirst({
        where: {
          tenantId,
          resourceId,
          status: { in: ["CONFIRMED", "PENDING"] },
          AND: [
            { startsAt: { lt: endsAtDate } },
            { endsAt:   { gt: startsAtDate } },
          ],
        },
      })

      if (collision) throw new BookingConflictError()

      return tx.booking.create({
        data: {
          tenantId,
          resourceId,
          serviceId,
          guestName:  guestName.trim(),
          guestPhone: normalizedPhone,
          guestEmail: guestEmail?.trim() || null,
          startsAt:   startsAtDate,
          endsAt:     endsAtDate,
          status:     "CONFIRMED",
        },
      })
    },
    { isolationLevel: "Serializable" }
  )
}
