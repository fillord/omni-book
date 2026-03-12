import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@omnibook.com'
  const password = process.argv[3] || 'SuperAdmin123!'

  console.log(`Создание чистого SUPERADMIN с email: ${email}`)

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (existing) {
    console.log('Пользователь с таким email уже существует.')
    // Обновим ему роль и отвяжем от тенанта, если нужно
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'SUPERADMIN',
        tenantId: null
      }
    })
    console.log('Пользователь обновлен: установлена роль SUPERADMIN, tenantId = null')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Super Admin',
      passwordHash,
      role: 'SUPERADMIN',
      tenantId: null // Явно указываем отсутствие привязки
    }
  })

  console.log('✅ Чистый суперадмин успешно создан!')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
