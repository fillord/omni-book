import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { basePrisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, password, tenantName, slug, niche } = body as Record<string, string>

  // ---- Validate inputs -----------------------------------------------
  const errors: Record<string, string> = {}

  if (!name?.trim())  errors.name  = 'Имя обязательно'
  if (!email?.trim()) errors.email = 'Email обязателен'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Некорректный email'

  if (!password) {
    errors.password = 'Пароль обязателен'
  } else if (password.length < 8) {
    errors.password = 'Пароль должен содержать минимум 8 символов'
  }

  if (!tenantName?.trim()) errors.tenantName = 'Название бизнеса обязательно'

  if (!slug?.trim()) {
    errors.slug = 'Slug обязателен'
  } else if (!SLUG_RE.test(slug)) {
    errors.slug = 'Slug: только строчные буквы, цифры и дефис (3–50 символов, не начинается/не заканчивается дефисом)'
  }

  const VALID_NICHES = ['medicine', 'beauty', 'horeca', 'sports']
  if (!niche || !VALID_NICHES.includes(niche)) errors.niche = 'Выберите нишу'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  // ---- Create Tenant + User in one transaction -----------------------
  try {
    const passwordHash = await bcrypt.hash(password, 12)

    const result = await basePrisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug:  slug.trim().toLowerCase(),
          name:  tenantName.trim(),
          niche: niche,
          plan:  'free',
        },
      })

      const user = await tx.user.create({
        data: {
          tenantId:     tenant.id,
          email:        email.toLowerCase().trim(),
          name:         name.trim(),
          passwordHash,
          role:         'OWNER',
        },
      })

      return { tenant, user }
    })

    return NextResponse.json(
      { tenantSlug: result.tenant.slug, userId: result.user.id },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[]) ?? []
        if (target.includes('slug')) {
          return NextResponse.json(
            { errors: { slug: 'Этот slug уже занят. Попробуйте другой.' } },
            { status: 409 }
          )
        }
        if (target.includes('email')) {
          return NextResponse.json(
            { errors: { email: 'Этот email уже зарегистрирован.' } },
            { status: 409 }
          )
        }
      }
    }
    console.error('[register] Unexpected error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
