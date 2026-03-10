import { PrismaClient, Role, BookingStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ---------------------------------------------------------------------------
  // Tenant
  // ---------------------------------------------------------------------------
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'city-polyclinic' },
    update: {},
    create: {
      slug: 'city-polyclinic',
      name: 'City Polyclinic',
      niche: 'medicine',
      plan: 'pro',
      isActive: true,
    },
  })
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`)

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@city-polyclinic.kz' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@city-polyclinic.kz',
      name: 'Алия Нурланова',
      phone: '+77001234567',
      passwordHash: '$2b$10$placeholder_hash_for_seed_only',
      role: Role.OWNER,
    },
  })
  console.log(`✅ Admin: ${admin.name} (${admin.email})`)

  const staff1 = await prisma.user.upsert({
    where: { email: 'petrov@city-polyclinic.kz' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'petrov@city-polyclinic.kz',
      name: 'Дмитрий Петров',
      phone: '+77009876543',
      role: Role.STAFF,
    },
  })

  const staff2 = await prisma.user.upsert({
    where: { email: 'seitkali@city-polyclinic.kz' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'seitkali@city-polyclinic.kz',
      name: 'Гүлнара Сейтқали',
      phone: '+77007654321',
      role: Role.STAFF,
    },
  })
  console.log(`✅ Staff: ${staff1.name}, ${staff2.name}`)

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------
  const [sConsultation, sECG, sUltrasound, sBloodTest] = await Promise.all([
    prisma.service.upsert({
      where: { id: 'svc-consultation' },
      update: {},
      create: {
        id: 'svc-consultation',
        tenantId: tenant.id,
        name: 'Первичная консультация',
        description: 'Осмотр и консультация врача-терапевта',
        durationMin: 30,
        price: 500000, // 5 000 KZT в тиынах
        currency: 'KZT',
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-ecg' },
      update: {},
      create: {
        id: 'svc-ecg',
        tenantId: tenant.id,
        name: 'ЭКГ',
        description: 'Электрокардиограмма с расшифровкой',
        durationMin: 20,
        price: 300000,
        currency: 'KZT',
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-ultrasound' },
      update: {},
      create: {
        id: 'svc-ultrasound',
        tenantId: tenant.id,
        name: 'УЗИ брюшной полости',
        description: 'Ультразвуковое исследование органов брюшной полости',
        durationMin: 40,
        price: 800000,
        currency: 'KZT',
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-blood-test' },
      update: {},
      create: {
        id: 'svc-blood-test',
        tenantId: tenant.id,
        name: 'Общий анализ крови',
        description: 'Клинический анализ крови (КАК)',
        durationMin: 10,
        price: 200000,
        currency: 'KZT',
      },
    }),
  ])
  console.log(`✅ Services: 4 created`)

  // ---------------------------------------------------------------------------
  // Resources (врачи и кабинет)
  // ---------------------------------------------------------------------------
  const doctor1 = await prisma.resource.upsert({
    where: { id: 'res-doctor-petrov' },
    update: {},
    create: {
      id: 'res-doctor-petrov',
      tenantId: tenant.id,
      name: 'Петров Дмитрий',
      type: 'staff',
      description: 'Врач-терапевт высшей категории',
      capacity: 1,
      attributes: {
        specialization: 'therapist',
        license: 'KZ-MED-00123',
        experience_years: 12,
        languages: ['ru', 'kz'],
        working_hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-17:00' },
      },
    },
  })

  const doctor2 = await prisma.resource.upsert({
    where: { id: 'res-doctor-seitkali' },
    update: {},
    create: {
      id: 'res-doctor-seitkali',
      tenantId: tenant.id,
      name: 'Сейтқали Гүлнара',
      type: 'staff',
      description: 'Кардиолог, УЗИ-специалист',
      capacity: 1,
      attributes: {
        specialization: 'cardiologist',
        license: 'KZ-MED-00456',
        experience_years: 8,
        languages: ['ru', 'kz', 'en'],
        equipment: ['ECG-1200', 'Ultrasound-Mindray'],
        working_hours: { mon: '10:00-19:00', tue: '10:00-19:00', wed: 'day_off', thu: '10:00-19:00', fri: '10:00-18:00' },
      },
    },
  })

  const cabinet = await prisma.resource.upsert({
    where: { id: 'res-cabinet-101' },
    update: {},
    create: {
      id: 'res-cabinet-101',
      tenantId: tenant.id,
      name: 'Кабинет №101',
      type: 'room',
      description: 'Процедурный кабинет (анализы, ЭКГ)',
      capacity: 2,
      attributes: {
        floor: 1,
        area_m2: 18,
        equipment: ['ECG-machine', 'blood-sampler'],
        wheelchair_accessible: true,
      },
    },
  })
  console.log(`✅ Resources: ${doctor1.name}, ${doctor2.name}, ${cabinet.name}`)

  // ---------------------------------------------------------------------------
  // ResourceService links
  // ---------------------------------------------------------------------------
  await Promise.all([
    // Петров → консультация, анализ крови
    prisma.resourceService.upsert({
      where: { resourceId_serviceId: { resourceId: doctor1.id, serviceId: sConsultation.id } },
      update: {},
      create: { resourceId: doctor1.id, serviceId: sConsultation.id },
    }),
    prisma.resourceService.upsert({
      where: { resourceId_serviceId: { resourceId: doctor1.id, serviceId: sBloodTest.id } },
      update: {},
      create: { resourceId: doctor1.id, serviceId: sBloodTest.id },
    }),
    // Сейтқали → ЭКГ, УЗИ, консультация
    prisma.resourceService.upsert({
      where: { resourceId_serviceId: { resourceId: doctor2.id, serviceId: sECG.id } },
      update: {},
      create: { resourceId: doctor2.id, serviceId: sECG.id },
    }),
    prisma.resourceService.upsert({
      where: { resourceId_serviceId: { resourceId: doctor2.id, serviceId: sUltrasound.id } },
      update: {},
      create: { resourceId: doctor2.id, serviceId: sUltrasound.id },
    }),
    prisma.resourceService.upsert({
      where: { resourceId_serviceId: { resourceId: doctor2.id, serviceId: sConsultation.id } },
      update: {},
      create: { resourceId: doctor2.id, serviceId: sConsultation.id },
    }),
    // Кабинет → ЭКГ, анализ крови
    prisma.resourceService.upsert({
      where: { resourceId_serviceId: { resourceId: cabinet.id, serviceId: sECG.id } },
      update: {},
      create: { resourceId: cabinet.id, serviceId: sECG.id },
    }),
    prisma.resourceService.upsert({
      where: { resourceId_serviceId: { resourceId: cabinet.id, serviceId: sBloodTest.id } },
      update: {},
      create: { resourceId: cabinet.id, serviceId: sBloodTest.id },
    }),
  ])
  console.log(`✅ ResourceService links created`)

  // ---------------------------------------------------------------------------
  // Sample bookings
  // ---------------------------------------------------------------------------
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const booking1Start = new Date(tomorrow)
  const booking1End = new Date(tomorrow)
  booking1End.setMinutes(30)

  await prisma.booking.upsert({
    where: { id: 'bkg-001' },
    update: {},
    create: {
      id: 'bkg-001',
      tenantId: tenant.id,
      resourceId: doctor1.id,
      serviceId: sConsultation.id,
      guestName: 'Иван Иванов',
      guestPhone: '+77021112233',
      guestEmail: 'ivanov@example.com',
      startsAt: booking1Start,
      endsAt: booking1End,
      status: BookingStatus.CONFIRMED,
      notes: 'Первичный приём, жалобы на давление',
    },
  })

  const booking2Start = new Date(tomorrow)
  booking2Start.setHours(14, 0, 0, 0)
  const booking2End = new Date(booking2Start)
  booking2End.setMinutes(booking2End.getMinutes() + 40)

  await prisma.booking.upsert({
    where: { id: 'bkg-002' },
    update: {},
    create: {
      id: 'bkg-002',
      tenantId: tenant.id,
      resourceId: doctor2.id,
      serviceId: sUltrasound.id,
      guestName: 'Сауле Бекова',
      guestPhone: '+77033334455',
      startsAt: booking2Start,
      endsAt: booking2End,
      status: BookingStatus.CONFIRMED,
    },
  })
  console.log(`✅ Bookings: 2 sample bookings created`)

  console.log('\n🎉 Seed complete!')
  console.log(`   Tenant:    ${tenant.name}  [${tenant.slug}]`)
  console.log(`   Users:     3  (1 owner, 2 staff)`)
  console.log(`   Resources: 3  (2 doctors, 1 cabinet)`)
  console.log(`   Services:  4`)
  console.log(`   Bookings:  2`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
