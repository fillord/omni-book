/**
 * seed-demos.ts
 *
 * Fills the 4 demo tenants with resources, services and sample bookings.
 * Safe to run multiple times — clears and re-creates demo data each time.
 *
 * Usage:
 *   npx tsx scripts/seed-demos.ts
 */

import { PrismaClient, BookingStatus } from "@prisma/client"
import { fromZonedTime } from "date-fns-tz"
import { addDays, format } from "date-fns"

const prisma = new PrismaClient()
const TZ = "Asia/Almaty"

// Build a UTC Date from a local Almaty date + hour:minute
function almatySlot(localDate: Date, hour: number, minute = 0): Date {
  const dateStr = format(localDate, "yyyy-MM-dd")
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
  return fromZonedTime(new Date(`${dateStr}T${timeStr}`), TZ)
}

async function upsertSchedule(
  resourceId: string,
  days: number[],
  startTime: string,
  endTime: string
) {
  for (const dayOfWeek of days) {
    await prisma.schedule.upsert({
      where: { resourceId_dayOfWeek: { resourceId, dayOfWeek } },
      update: { startTime, endTime, isActive: true },
      create: { resourceId, dayOfWeek, startTime, endTime, isActive: true },
    })
  }
}

async function clearTenantDemoData(tenantId: string) {
  await prisma.booking.deleteMany({ where: { tenantId } })
  await prisma.resource.deleteMany({ where: { tenantId } }) // cascades Schedule + ResourceService
  await prisma.service.deleteMany({ where: { tenantId } })
}

async function requireTenant(slug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) {
    console.error(`❌  Tenant "${slug}" not found. Run: npx prisma db seed`)
    process.exit(1)
  }
  return tenant
}

// ---------------------------------------------------------------------------

async function seedClinic() {
  const tenant = await requireTenant("city-polyclinic")
  await clearTenantDemoData(tenant.id)

  const weekdays = [1, 2, 3, 4, 5]
  const tomorrow  = addDays(new Date(), 1)
  const dayAfter  = addDays(new Date(), 2)

  // --- Resources ---
  const therapist = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "Терапевт (Каб. 204)",
      type: "staff",
      isActive: true,
      attributes: { specialization: "Терапевт", experience_years: 10, license: "KZ-MED-001" },
    },
  })
  const surgeon = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "Хирург (Каб. 105)",
      type: "staff",
      isActive: true,
      attributes: { specialization: "Хирург", experience_years: 15, license: "KZ-MED-002" },
    },
  })

  // --- Services ---
  const sExam = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Первичный осмотр", durationMin: 30, price: 500000, currency: "KZT" },
  })
  const sDressing = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Перевязка раны", durationMin: 20, price: 300000, currency: "KZT" },
  })

  await prisma.resourceService.createMany({
    data: [
      { resourceId: therapist.id, serviceId: sExam.id },
      { resourceId: therapist.id, serviceId: sDressing.id },
      { resourceId: surgeon.id,   serviceId: sExam.id },
      { resourceId: surgeon.id,   serviceId: sDressing.id },
    ],
  })

  await upsertSchedule(therapist.id, weekdays, "09:00", "18:00")
  await upsertSchedule(surgeon.id,   weekdays, "09:00", "17:00")

  // --- Bookings ---
  type BookingRow = {
    resource: typeof therapist
    service: typeof sExam
    day: Date; hour: number
    name: string; phone: string
    status: BookingStatus
  }
  const rows: BookingRow[] = [
    { resource: therapist, service: sExam,     day: tomorrow, hour: 10, name: "Иванова Светлана",  phone: "+77011234567", status: BookingStatus.CONFIRMED },
    { resource: therapist, service: sExam,     day: tomorrow, hour: 11, name: "Петров Андрей",     phone: "+77012345678", status: BookingStatus.CONFIRMED },
    { resource: surgeon,   service: sDressing, day: tomorrow, hour: 14, name: "Ахметов Серик",     phone: "+77013456789", status: BookingStatus.PENDING },
    { resource: therapist, service: sExam,     day: dayAfter, hour: 10, name: "Нурланова Айгерим", phone: "+77014567890", status: BookingStatus.CONFIRMED },
    { resource: surgeon,   service: sExam,     day: dayAfter, hour: 15, name: "Джаксыбеков Олег",  phone: "+77015678901", status: BookingStatus.CONFIRMED },
  ]
  for (const r of rows) {
    const startsAt = almatySlot(r.day, r.hour)
    const endsAt   = new Date(startsAt.getTime() + r.service.durationMin * 60_000)
    await prisma.booking.create({
      data: { tenantId: tenant.id, resourceId: r.resource.id, serviceId: r.service.id, startsAt, endsAt, guestName: r.name, guestPhone: r.phone, status: r.status },
    })
  }

  console.log(`✅  city-polyclinic — 2 ресурса, 2 услуги, ${rows.length} бронирований`)
}

// ---------------------------------------------------------------------------

async function seedBeauty() {
  const tenant = await requireTenant("beauty-studio")
  await clearTenantDemoData(tenant.id)

  const monToSat   = [1, 2, 3, 4, 5, 6]
  const tomorrow   = addDays(new Date(), 1)
  const dayAfter   = addDays(new Date(), 2)

  const aliya = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "Мастер Алия",
      type: "staff",
      isActive: true,
      attributes: { specialization: "Мастер маникюра", experience_years: 4 },
    },
  })
  const nurik = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "Стилист Нурик",
      type: "staff",
      isActive: true,
      attributes: { specialization: "Барбер / стилист", experience_years: 6 },
    },
  })

  const sManicure = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Маникюр + гель-лак", durationMin: 90, price: 700000, currency: "KZT" },
  })
  const sHaircut = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Мужская стрижка", durationMin: 45, price: 400000, currency: "KZT" },
  })

  await prisma.resourceService.createMany({
    data: [
      { resourceId: aliya.id, serviceId: sManicure.id },
      { resourceId: nurik.id, serviceId: sHaircut.id },
    ],
  })

  await upsertSchedule(aliya.id, monToSat, "09:00", "19:00")
  await upsertSchedule(nurik.id, monToSat, "10:00", "20:00")

  type BookingRow = { resource: typeof aliya; service: typeof sManicure; day: Date; hour: number; name: string; phone: string; status: BookingStatus }
  const rows: BookingRow[] = [
    { resource: aliya, service: sManicure, day: tomorrow, hour: 10,  name: "Сейткали Дина",    phone: "+77021112233", status: BookingStatus.CONFIRMED },
    { resource: nurik, service: sHaircut,  day: tomorrow, hour: 12,  name: "Бекенов Азат",     phone: "+77022223344", status: BookingStatus.CONFIRMED },
    { resource: aliya, service: sManicure, day: tomorrow, hour: 13,  name: "Омарова Жанар",    phone: "+77023334455", status: BookingStatus.PENDING },
    { resource: nurik, service: sHaircut,  day: dayAfter, hour: 11,  name: "Султанов Ернар",   phone: "+77024445566", status: BookingStatus.CONFIRMED },
    { resource: aliya, service: sManicure, day: dayAfter, hour: 15,  name: "Касымова Асель",   phone: "+77025556677", status: BookingStatus.CONFIRMED },
  ]
  for (const r of rows) {
    const startsAt = almatySlot(r.day, r.hour)
    const endsAt   = new Date(startsAt.getTime() + r.service.durationMin * 60_000)
    await prisma.booking.create({
      data: { tenantId: tenant.id, resourceId: r.resource.id, serviceId: r.service.id, startsAt, endsAt, guestName: r.name, guestPhone: r.phone, status: r.status },
    })
  }

  console.log(`✅  beauty-studio — 2 ресурса, 2 услуги, ${rows.length} бронирований`)
}

// ---------------------------------------------------------------------------

async function seedBistro() {
  const tenant = await requireTenant("bistro-central")
  await clearTenantDemoData(tenant.id)

  const everyday  = [0, 1, 2, 3, 4, 5, 6]
  const tomorrow  = addDays(new Date(), 1)
  const dayAfter  = addDays(new Date(), 2)

  const tableWindow = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "Столик у окна",
      type: "table",
      isActive: true,
      attributes: { capacity: 4, location: "У окна", window_view: true },
    },
  })
  const vipHall = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "VIP-зал",
      type: "room",
      isActive: true,
      attributes: { capacity: 20, location: "VIP", projector: true },
    },
  })

  const sBookTable = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Бронь стола", durationMin: 120, price: 0, currency: "KZT" },
  })
  const sDegustation = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Дегустационный сет", durationMin: 180, price: 1500000, currency: "KZT" },
  })

  await prisma.resourceService.createMany({
    data: [
      { resourceId: tableWindow.id, serviceId: sBookTable.id },
      { resourceId: tableWindow.id, serviceId: sDegustation.id },
      { resourceId: vipHall.id,     serviceId: sBookTable.id },
      { resourceId: vipHall.id,     serviceId: sDegustation.id },
    ],
  })

  await upsertSchedule(tableWindow.id, everyday, "10:00", "23:00")
  await upsertSchedule(vipHall.id,     everyday, "10:00", "23:00")

  type BookingRow = { resource: typeof tableWindow; service: typeof sBookTable; day: Date; hour: number; minute?: number; name: string; phone: string; status: BookingStatus }
  const rows: BookingRow[] = [
    { resource: tableWindow, service: sBookTable,    day: tomorrow, hour: 12,        name: "Жуков Михаил",     phone: "+77031112233", status: BookingStatus.CONFIRMED },
    { resource: tableWindow, service: sBookTable,    day: tomorrow, hour: 14,        name: "Ахметова Гульнар", phone: "+77032223344", status: BookingStatus.CONFIRMED },
    { resource: vipHall,     service: sDegustation,  day: tomorrow, hour: 19,        name: "Алибеков Данияр",  phone: "+77033334455", status: BookingStatus.PENDING },
    { resource: tableWindow, service: sBookTable,    day: dayAfter, hour: 13,        name: "Попова Елена",     phone: "+77034445566", status: BookingStatus.CONFIRMED },
    { resource: vipHall,     service: sBookTable,    day: dayAfter, hour: 18,        name: "Сейтқали Айдос",   phone: "+77035556677", status: BookingStatus.CONFIRMED },
  ]
  for (const r of rows) {
    const startsAt = almatySlot(r.day, r.hour, r.minute ?? 0)
    const endsAt   = new Date(startsAt.getTime() + r.service.durationMin * 60_000)
    await prisma.booking.create({
      data: { tenantId: tenant.id, resourceId: r.resource.id, serviceId: r.service.id, startsAt, endsAt, guestName: r.name, guestPhone: r.phone, status: r.status },
    })
  }

  console.log(`✅  bistro-central — 2 ресурса, 2 услуги, ${rows.length} бронирований`)
}

// ---------------------------------------------------------------------------

async function seedSport() {
  const tenant = await requireTenant("sport-arena")
  await clearTenantDemoData(tenant.id)

  const everyday  = [0, 1, 2, 3, 4, 5, 6]
  const tomorrow  = addDays(new Date(), 1)
  const dayAfter  = addDays(new Date(), 2)

  const football = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "Футбольное поле",
      type: "court",
      isActive: true,
      attributes: { surface: "Искусственная трава", indoor: false, capacity: 22 },
    },
  })
  const tennis = await prisma.resource.create({
    data: {
      tenantId: tenant.id,
      name: "Теннисный корт",
      type: "court",
      isActive: true,
      attributes: { surface: "Хард", indoor: true, equipment_included: true },
    },
  })

  const sFieldRent = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Аренда поля (1 час)", durationMin: 60, price: 500000, currency: "KZT" },
  })
  const sCoaching = await prisma.service.create({
    data: { tenantId: tenant.id, name: "Тренировка с коучем", durationMin: 60, price: 800000, currency: "KZT" },
  })

  await prisma.resourceService.createMany({
    data: [
      { resourceId: football.id, serviceId: sFieldRent.id },
      { resourceId: football.id, serviceId: sCoaching.id },
      { resourceId: tennis.id,   serviceId: sFieldRent.id },
      { resourceId: tennis.id,   serviceId: sCoaching.id },
    ],
  })

  await upsertSchedule(football.id, everyday, "07:00", "22:00")
  await upsertSchedule(tennis.id,   everyday, "07:00", "22:00")

  type BookingRow = { resource: typeof football; service: typeof sFieldRent; day: Date; hour: number; name: string; phone: string; status: BookingStatus }
  const rows: BookingRow[] = [
    { resource: football, service: sFieldRent, day: tomorrow, hour:  8,  name: "Оспанов Руслан",   phone: "+77041112233", status: BookingStatus.CONFIRMED },
    { resource: tennis,   service: sFieldRent, day: tomorrow, hour: 10,  name: "Лим Виктор",       phone: "+77042223344", status: BookingStatus.CONFIRMED },
    { resource: football, service: sCoaching,  day: tomorrow, hour: 16,  name: "Джумагали Берик",  phone: "+77043334455", status: BookingStatus.PENDING },
    { resource: tennis,   service: sCoaching,  day: dayAfter, hour:  9,  name: "Козлов Дмитрий",   phone: "+77044445566", status: BookingStatus.CONFIRMED },
    { resource: football, service: sFieldRent, day: dayAfter, hour: 18,  name: "Тулеков Нурлан",   phone: "+77045556677", status: BookingStatus.CONFIRMED },
  ]
  for (const r of rows) {
    const startsAt = almatySlot(r.day, r.hour)
    const endsAt   = new Date(startsAt.getTime() + r.service.durationMin * 60_000)
    await prisma.booking.create({
      data: { tenantId: tenant.id, resourceId: r.resource.id, serviceId: r.service.id, startsAt, endsAt, guestName: r.name, guestPhone: r.phone, status: r.status },
    })
  }

  console.log(`✅  sport-arena — 2 ресурса, 2 услуги, ${rows.length} бронирований`)
}

// ---------------------------------------------------------------------------

async function main() {
  console.log("🎭 Seeding demo data for 4 tenants...\n")

  await seedClinic()
  await seedBeauty()
  await seedBistro()
  await seedSport()

  console.log("\n✅  Done! Data is ready for tomorrow and day after tomorrow.")
  console.log("    Re-run anytime to refresh: npx tsx scripts/seed-demos.ts")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
