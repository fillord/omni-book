import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.subscriptionPlan.upsert({
    where: { plan: 'FREE' },
    update: {},
    create: {
      plan: 'FREE',
      displayName: 'Бесплатный',
      maxResources: 1,
      priceMonthly: 0,
      priceYearly: 0,
      pricePerResource: 0,
      features: ['1 ресурс', 'Онлайн-запись', 'Email уведомления'],
    },
  })
  await prisma.subscriptionPlan.upsert({
    where: { plan: 'PRO' },
    update: {},
    create: {
      plan: 'PRO',
      displayName: 'PRO',
      maxResources: 20,
      priceMonthly: 10000,
      priceYearly: 100000,
      pricePerResource: 0,
      features: ['До 20 ресурсов', 'Безлимит бронирований', 'Email и СМС уведомления', 'Аналитика', 'Приоритетная поддержка'],
    },
  })
  await prisma.subscriptionPlan.upsert({
    where: { plan: 'ENTERPRISE' },
    update: {},
    create: {
      plan: 'ENTERPRISE',
      displayName: 'Enterprise',
      maxResources: 100,
      priceMonthly: -1,
      priceYearly: -1,
      pricePerResource: 1000,
      features: ['До 100+ ресурсов', 'Индивидуальная цена', 'Выделенная поддержка', 'Кастомизация'],
    },
  })
  console.log('Subscription plans seeded.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
