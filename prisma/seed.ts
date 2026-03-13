import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createSchedule(resourceId: string, days: number[], start: string, end: string) {
  for (const d of days) {
    await prisma.schedule.upsert({
      where: { resourceId_dayOfWeek: { resourceId, dayOfWeek: d } },
      update: { startTime: start, endTime: end, isActive: true },
      create: { resourceId, dayOfWeek: d, startTime: start, endTime: end, isActive: true },
    });
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.resourceService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const hash = await bcrypt.hash("password123", 10);
  const weekdays = [1, 2, 3, 4, 5];
  const everyday = [0, 1, 2, 3, 4, 5, 6];
  const monToSat = [1, 2, 3, 4, 5, 6];

  // ===== MEDICINE =====
  const clinic = await prisma.tenant.create({
    data: {
      slug: "city-polyclinic", name: "Городская поликлиника №1", niche: "medicine", plan: "PRO", timezone: "Asia/Almaty",
      description: "Многопрофильная поликлиника с опытными специалистами. Современное оборудование, внимательный персонал.",
      phone: "+7 727 123 45 67",
      email: "info@polyclinic.kz",
      address: "ул. Абая 52",
      city: "Алматы",
      workingHours: "Пн-Пт: 09:00-18:00",
      socialLinks: { instagram: "@citypolyclinic", whatsapp: "+77271234567" },
    },
  });
  await prisma.user.create({
    data: { tenantId: clinic.id, email: "clinic-owner@test.com", name: "Алия Нурланова", passwordHash: hash, role: "OWNER" },
  });
  const drPetrov = await prisma.resource.create({
    data: { tenantId: clinic.id, name: "Петров Дмитрий", type: "staff", attributes: { specialization: "Терапевт", experience_years: 10, license: "KZ-MED-001" } },
  });
  const drGulnara = await prisma.resource.create({
    data: { tenantId: clinic.id, name: "Сейтқали Гүлнара", type: "staff", attributes: { specialization: "Кардиолог", experience_years: 8, license: "KZ-MED-002" } },
  });
  const sConsult = await prisma.service.create({
    data: { tenantId: clinic.id, name: "Первичная консультация", durationMin: 30, price: 500000 },
  });
  const sECG = await prisma.service.create({
    data: { tenantId: clinic.id, name: "ЭКГ", durationMin: 20, price: 300000 },
  });
  await prisma.resourceService.createMany({
    data: [
      { resourceId: drPetrov.id, serviceId: sConsult.id },
      { resourceId: drPetrov.id, serviceId: sECG.id },
      { resourceId: drGulnara.id, serviceId: sConsult.id },
      { resourceId: drGulnara.id, serviceId: sECG.id },
    ],
  });
  await createSchedule(drPetrov.id, weekdays, "09:00", "17:00");
  await createSchedule(drGulnara.id, [1, 2, 3], "10:00", "18:00");
  console.log(`✅ Medicine: ${clinic.name}`);

  // ===== MEDICINE #2 =====
  const clinic2 = await prisma.tenant.create({
    data: {
      slug: "zdorovie-med", name: 'Медцентр "Здоровье"', niche: "medicine", plan: "FREE", timezone: "Asia/Almaty",
      description: "Медицинский центр для всей семьи. Неврология, терапия, диагностика.",
      phone: "+7 727 987 65 43",
      address: "пр. Аль-Фараби 17",
      city: "Алматы",
      workingHours: "Пн-Пт: 09:00-16:00",
      socialLinks: { telegram: "@zdorovie_med" },
    },
  });
  await prisma.user.create({ data: { tenantId: clinic2.id, email: "zdorovie@test.com", name: "Бауыржан Сатыбалдиев", passwordHash: hash, role: "OWNER" } });
  const drAsel = await prisma.resource.create({ data: { tenantId: clinic2.id, name: "Асель Маратова", type: "staff", attributes: { specialization: "Невролог", experience_years: 6, license: "KZ-MED-100" } } });
  const sNeuro = await prisma.service.create({ data: { tenantId: clinic2.id, name: "Консультация невролога", durationMin: 40, price: 700000 } });
  await prisma.resourceService.createMany({ data: [{ resourceId: drAsel.id, serviceId: sNeuro.id }] });
  await createSchedule(drAsel.id, [1, 2, 3, 4, 5], "09:00", "16:00");
  console.log(`✅ Medicine #2: ${clinic2.name}`);

  // ===== BEAUTY =====
  const salon = await prisma.tenant.create({
    data: {
      slug: "beauty-studio", name: "Beauty Studio Almaty", niche: "beauty", plan: "PRO", timezone: "Asia/Almaty",
      description: "Студия красоты в центре города. Стрижки, окрашивание, уход за лицом и телом.",
      phone: "+7 701 555 00 11",
      address: "пр. Достык 89",
      city: "Алматы",
      workingHours: "Пн-Сб: 09:00-19:00",
      socialLinks: { instagram: "@beautystudio.almaty", telegram: "@beautystudio" },
    },
  });
  await prisma.user.create({
    data: { tenantId: salon.id, email: "salon-owner@test.com", name: "Мария Иванова", passwordHash: hash, role: "OWNER" },
  });
  const mAnna = await prisma.resource.create({
    data: { tenantId: salon.id, name: "Анна Ким", type: "staff", attributes: { specialization: "Парикмахер", experience_years: 5 } },
  });
  const mDana = await prisma.resource.create({
    data: { tenantId: salon.id, name: "Дана Серик", type: "staff", attributes: { specialization: "Косметолог", experience_years: 3 } },
  });
  const sHaircut = await prisma.service.create({
    data: { tenantId: salon.id, name: "Стрижка женская", durationMin: 45, price: 500000 },
  });
  const sFacial = await prisma.service.create({
    data: { tenantId: salon.id, name: "Чистка лица", durationMin: 60, price: 800000 },
  });
  await prisma.resourceService.createMany({
    data: [
      { resourceId: mAnna.id, serviceId: sHaircut.id },
      { resourceId: mDana.id, serviceId: sFacial.id },
    ],
  });
  await createSchedule(mAnna.id, monToSat, "09:00", "19:00");
  await createSchedule(mDana.id, weekdays, "10:00", "18:00");
  console.log(`✅ Beauty: ${salon.name}`);

  // ===== HORECA =====
  const bistro = await prisma.tenant.create({
    data: {
      slug: "bistro-central", name: "Bistro Central", niche: "horeca", plan: "PRO", timezone: "Asia/Almaty",
      description: "Уютное бистро в центре Алматы. Европейская кухня, живая музыка по выходным, банкетный зал.",
      phone: "+7 727 300 10 20",
      email: "reserve@bistro-central.kz",
      address: "ул. Панфилова 41",
      city: "Алматы",
      workingHours: "Ежедневно: 10:00-23:00",
      socialLinks: { instagram: "@bistrocentral_almaty", whatsapp: "+77273001020" },
    },
  });
  await prisma.user.create({
    data: { tenantId: bistro.id, email: "bistro-owner@test.com", name: "Алексей Попов", passwordHash: hash, role: "OWNER" },
  });
  const tWindow = await prisma.resource.create({
    data: { tenantId: bistro.id, name: "У окна #1", type: "table", attributes: { capacity: 4, location: "У окна" } },
  });
  const tVIP = await prisma.resource.create({
    data: { tenantId: bistro.id, name: "VIP-зал", type: "room", attributes: { capacity: 12, location: "VIP" } },
  });
  const sTable = await prisma.service.create({
    data: { tenantId: bistro.id, name: "Столик на 2–4", durationMin: 120, price: 0 },
  });
  const sVIP = await prisma.service.create({
    data: { tenantId: bistro.id, name: "VIP-зал (банкет)", durationMin: 180, price: 1500000 },
  });
  await prisma.resourceService.createMany({
    data: [
      { resourceId: tWindow.id, serviceId: sTable.id },
      { resourceId: tVIP.id, serviceId: sVIP.id },
    ],
  });
  await createSchedule(tWindow.id, everyday, "10:00", "23:00");
  await createSchedule(tVIP.id, everyday, "10:00", "23:00");
  console.log(`✅ HoReCa: ${bistro.name}`);

  // ===== SPORTS =====
  const sport = await prisma.tenant.create({
    data: {
      slug: "sport-arena", name: "Sport Arena", niche: "sports", plan: "FREE", timezone: "Asia/Almaty",
      description: "Теннисные корты для любителей и профессионалов. Грунтовые и хард-покрытия, прокат инвентаря.",
      phone: "+7 705 222 33 44",
      address: "ул. Тимирязева 28",
      city: "Алматы",
      workingHours: "Ежедневно: 07:00-22:00",
      socialLinks: { instagram: "@sportarena_almaty", telegram: "@sportarena" },
    },
  });
  await prisma.user.create({
    data: { tenantId: sport.id, email: "sport-owner@test.com", name: "Тимур Касымов", passwordHash: hash, role: "OWNER" },
  });
  const court1 = await prisma.resource.create({
    data: { tenantId: sport.id, name: "Корт #1 (грунт)", type: "court", attributes: { surface: "Грунт", indoor: false } },
  });
  const court2 = await prisma.resource.create({
    data: { tenantId: sport.id, name: "Корт #2 (хард)", type: "court", attributes: { surface: "Хард", indoor: true } },
  });
  const sHour = await prisma.service.create({
    data: { tenantId: sport.id, name: "Аренда 1 час", durationMin: 60, price: 300000 },
  });
  await prisma.resourceService.createMany({
    data: [
      { resourceId: court1.id, serviceId: sHour.id },
      { resourceId: court2.id, serviceId: sHour.id },
    ],
  });
  await createSchedule(court1.id, everyday, "07:00", "22:00");
  await createSchedule(court2.id, everyday, "07:00", "22:00");
  console.log(`✅ Sports: ${sport.name}`);

  console.log("\n✅ Seed complete: 5 tenants (medicine x2, beauty, horeca, sports)");
  console.log("\nTest accounts (password: password123):");
  console.log("  clinic-owner@test.com  → /city-polyclinic");
  console.log("  zdorovie@test.com      → /zdorovie-med");
  console.log("  salon-owner@test.com   → /beauty-studio");
  console.log("  bistro-owner@test.com  → /bistro-central");
  console.log("  sport-owner@test.com   → /sport-arena");
}

main().catch(console.error).finally(() => prisma.$disconnect());
