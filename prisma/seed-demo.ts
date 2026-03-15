import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных (Seeding)...')

  // Хелпер создания дефолтного расписания (Пн-Пт 09:00 - 18:00)
  const defaultSchedules = [1, 2, 3, 4, 5].map((day) => ({
    dayOfWeek: day,
    startTime: '09:00',
    endTime: '18:00',
    isActive: true,
  }))

  const weekendSchedules = [6, 0].map((day) => ({
    dayOfWeek: day,
    startTime: '10:00',
    endTime: '16:00',
    isActive: true,
  }))

  const fullSchedules = [...defaultSchedules, ...weekendSchedules]

  // ==========================================
  // 1. Городская поликлиника (city-polyclinic)
  // ==========================================
  console.log('🏥 Создаем "Городская поликлиника"...')
  const clinic = await prisma.tenant.upsert({
    where: { slug: 'city-polyclinic' },
    update: {},
    create: {
      slug: 'city-polyclinic',
      name: 'Городская поликлиника №1',
      description: 'Многопрофильная поликлиника. Доступная и качественная медицина для всей семьи.',
      niche: 'Медицина',
      plan: 'PRO',
      phone: '+7 701 123 4567',
      address: 'пр. Абая 150, Алматы',
      timezone: 'Asia/Almaty',
      bookingWindowDays: 30,
    },
  })

  // Ресурсы клиники
  const uzyRoom = await prisma.resource.create({
    data: {
      tenantId: clinic.id,
      name: 'Кабинет УЗИ',
      type: 'room',
      capacity: 1,
      lunchStart: '13:00',
      lunchEnd: '14:00',
      schedules: { create: fullSchedules },
    },
  })

  const docErlan = await prisma.resource.create({
    data: {
      tenantId: clinic.id,
      name: 'Врач-терапевт Ерлан',
      type: 'staff',
      description: 'Стаж 15 лет. Врач высшей категории.',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      schedules: { create: defaultSchedules },
    },
  })

  const docDinara = await prisma.resource.create({
    data: {
      tenantId: clinic.id,
      name: 'Стоматолог Динара',
      type: 'staff',
      description: 'Лечение кариеса, чистка, эстетическая стоматология.',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      schedules: { create: fullSchedules },
    },
  })

  // Услуги клиники
  const serviceTherapist = await prisma.service.create({
    data: { tenantId: clinic.id, name: 'Консультация терапевта', durationMin: 30, price: 8000 },
  })
  const serviceUzy = await prisma.service.create({
    data: { tenantId: clinic.id, name: 'УЗИ брюшной полости', durationMin: 20, price: 12000 },
  })
  const serviceEkg = await prisma.service.create({
    data: { tenantId: clinic.id, name: 'ЭКГ (Кардиограмма)', durationMin: 15, price: 4000 },
  })
  const serviceDental = await prisma.service.create({
    data: { tenantId: clinic.id, name: 'Профессиональная чистка зубов', durationMin: 45, price: 15000 },
  })

  // Привязка услуг
  await prisma.resourceService.createMany({
    data: [
      { resourceId: docErlan.id, serviceId: serviceTherapist.id },
      { resourceId: docErlan.id, serviceId: serviceEkg.id },
      { resourceId: docDinara.id, serviceId: serviceDental.id },
      { resourceId: uzyRoom.id, serviceId: serviceUzy.id },
    ],
  })


  // ==========================================
  // 2. Студия красоты (beauty-studio)
  // ==========================================
  console.log('💇‍♀️ Создаем Студия красоты "Элеганс"...')
  const beauty = await prisma.tenant.upsert({
    where: { slug: 'beauty-studio' },
    update: {},
    create: {
      slug: 'beauty-studio',
      name: 'Студия красоты "Элеганс"',
      description: 'Премиальный салон красоты. Подчеркнем вашу естественную красоту.',
      niche: 'Красота',
      plan: 'PRO',
      phone: '+7 705 987 6543',
      address: 'ул. Кунаева 21, Астана',
      timezone: 'Asia/Almaty',
    },
  })

  const stylistAlina = await prisma.resource.create({
    data: {
      tenantId: beauty.id,
      name: 'Топ-стилист Алина',
      type: 'staff',
      lunchStart: '14:00',
      lunchEnd: '15:00',
      schedules: { create: fullSchedules },
    },
  })

  const masterBota = await prisma.resource.create({
    data: {
      tenantId: beauty.id,
      name: 'Мастер маникюра Бота',
      type: 'staff',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      schedules: { create: fullSchedules },
    },
  })

  const makeupArtist = await prisma.resource.create({
    data: {
      tenantId: beauty.id,
      name: 'Визажист Асель',
      type: 'staff',
      lunchStart: '15:00',
      lunchEnd: '16:00',
      schedules: { create: weekendSchedules }, // Работает только на выходных
    },
  })

  const srvHaircut = await prisma.service.create({
    data: { tenantId: beauty.id, name: 'Женская стрижка', description: 'Стрижка любой сложности + укладка', durationMin: 60, price: 12000 },
  })
  const srvAirtouch = await prisma.service.create({
    data: { tenantId: beauty.id, name: 'Окрашивание Airtouch', description: 'Сложное окрашивание, тонирование и уход', durationMin: 240, price: 45000 },
  })
  const srvManicure = await prisma.service.create({
    data: { tenantId: beauty.id, name: 'Маникюр с покрытием гель-лак', description: 'Снятие, аппаратный маникюр, покрытие', durationMin: 90, price: 8000 },
  })
  const srvMakeup = await prisma.service.create({
    data: { tenantId: beauty.id, name: 'Вечерний макияж', description: 'Люксовая косметика, стойкость 24 часа', durationMin: 60, price: 15000 },
  })

  await prisma.resourceService.createMany({
    data: [
      { resourceId: stylistAlina.id, serviceId: srvHaircut.id },
      { resourceId: stylistAlina.id, serviceId: srvAirtouch.id },
      { resourceId: masterBota.id, serviceId: srvManicure.id },
      { resourceId: makeupArtist.id, serviceId: srvMakeup.id },
    ],
  })


  // ==========================================
  // 3. Центральное Бистро (bistro-central)
  // ==========================================
  console.log('🍔 Создаем Центральное Бистро / Антикафе...')
  const bistro = await prisma.tenant.upsert({
    where: { slug: 'bistro-central' },
    update: {},
    create: {
      slug: 'bistro-central',
      name: 'Бронь столов | Центральное Бистро',
      description: 'Уютное антикафе и бистро в самом центре города. PS5, настолки, неаполитанская пицца.',
      niche: 'Рестораны и Кафе',
      plan: 'ENTERPRISE',
      phone: '+7 777 111 2233',
      address: 'ул. Панфилова 100, Алматы',
      timezone: 'Asia/Almaty',
    },
  })

  const lateSchedules = [0,1,2,3,4,5,6].map((day) => ({
    dayOfWeek: day,
    startTime: '12:00',
    endTime: '23:59',
    isActive: true,
  }))

  const vipRoom1 = await prisma.resource.create({
    data: {
      tenantId: bistro.id,
      name: 'VIP Комната №1',
      type: 'room',
      capacity: 6,
      schedules: { create: lateSchedules },
    },
  })

  const vipRoom2 = await prisma.resource.create({
    data: {
      tenantId: bistro.id,
      name: 'VIP Комната №2 (PS5)',
      type: 'room',
      capacity: 8,
      schedules: { create: lateSchedules },
    },
  })

  const table5 = await prisma.resource.create({
    data: {
      tenantId: bistro.id,
      name: 'Столик №5 (У окна)',
      type: 'table',
      capacity: 4,
      schedules: { create: lateSchedules },
    },
  })

  const srvVip1h = await prisma.service.create({
    data: { tenantId: bistro.id, name: 'Аренда VIP-комнаты с PS5 (1 час)', description: 'В стоимость входит чай и приставка', durationMin: 60, price: 5000 },
  })
  const srvTable = await prisma.service.create({
    data: { tenantId: bistro.id, name: 'Бронь столика у окна', description: 'Депозит за стол', durationMin: 120, price: 10000 },
  })
  const srvBday = await prisma.service.create({
    data: { tenantId: bistro.id, name: 'Аренда зала для Дня Рождения (3 часа)', description: 'Закрытие комнаты + скидка на меню', durationMin: 180, price: 25000 },
  })

  await prisma.resourceService.createMany({
    data: [
      { resourceId: vipRoom1.id, serviceId: srvVip1h.id },
      { resourceId: vipRoom2.id, serviceId: srvVip1h.id },
      { resourceId: vipRoom2.id, serviceId: srvBday.id },
      { resourceId: vipRoom1.id, serviceId: srvBday.id },
      { resourceId: table5.id, serviceId: srvTable.id },
    ],
  })


  // ==========================================
  // 4. Спортивная Арена (sport-arena)
  // ==========================================
  console.log('🎾 Создаем Спортивная Арена "Олимп"...')
  const sport = await prisma.tenant.upsert({
    where: { slug: 'sport-arena' },
    update: {},
    create: {
      slug: 'sport-arena',
      name: 'Спортивная Арена "Олимп"',
      description: 'Современный спортивный комплекс. Теннисные корты, мини-футбол и профессиональные тренеры.',
      niche: 'Спорт',
      plan: 'PRO',
      phone: '+7 708 555 4433',
      address: 'ул. Достык 300, Алматы',
      timezone: 'Asia/Almaty',
    },
  })

  const sportSchedules = [0,1,2,3,4,5,6].map((day) => ({
    dayOfWeek: day,
    startTime: '07:00',
    endTime: '23:00',
    isActive: true,
  }))

  const court1 = await prisma.resource.create({
    data: {
      tenantId: sport.id,
      name: 'Корт №1 (Грунт)',
      type: 'venue',
      capacity: 4,
      schedules: { create: sportSchedules },
    },
  })

  const court2 = await prisma.resource.create({
    data: {
      tenantId: sport.id,
      name: 'Корт №2 (Хард)',
      type: 'venue',
      capacity: 4,
      schedules: { create: sportSchedules },
    },
  })

  const footPitch = await prisma.resource.create({
    data: {
      tenantId: sport.id,
      name: 'Мини-футбольное поле №1',
      type: 'venue',
      capacity: 14,
      schedules: { create: sportSchedules },
    },
  })

  const coachDaniyar = await prisma.resource.create({
    data: {
      tenantId: sport.id,
      name: 'Тренер Данияр (Теннис)',
      type: 'staff',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      schedules: { create: fullSchedules },
    },
  })

  const srvTennis = await prisma.service.create({
    data: { tenantId: sport.id, name: 'Аренда теннисного корта (1 час)', durationMin: 60, price: 8000 },
  })
  const srvFoot = await prisma.service.create({
    data: { tenantId: sport.id, name: 'Мини-футбольное поле (1.5 часа)', durationMin: 90, price: 15000 },
  })
  const srvPersonal = await prisma.service.create({
    data: { tenantId: sport.id, name: 'Персональная тренировка по теннису', description: 'С тренером Данияром. Аренда корта оплачивается отдельно.', durationMin: 60, price: 12000 },
  })

  await prisma.resourceService.createMany({
    data: [
      { resourceId: court1.id, serviceId: srvTennis.id },
      { resourceId: court2.id, serviceId: srvTennis.id },
      { resourceId: footPitch.id, serviceId: srvFoot.id },
      { resourceId: coachDaniyar.id, serviceId: srvPersonal.id },
    ],
  })

  console.log('✅ База данных успешно заполнена демонстрационными данными!')
}

main()
  .catch((e) => {
    console.error('Ошибка в seeder:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
