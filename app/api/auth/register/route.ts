import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { basePrisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getServerT } from '@/lib/i18n/server'
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
  const t = await getServerT()
  const errors: Record<string, string> = {}

  if (!name?.trim())  errors.name  = t('auth', 'nameRequiredMsg') ?? 'Имя обязательно'
  if (!email?.trim()) errors.email = t('auth', 'emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t('auth', 'emailInvalid')

  if (!password) {
    errors.password = t('auth', 'passwordRequired')
  } else if (password.length < 8) {
    errors.password = t('auth', 'passwordMin8')
  }

  if (!tenantName?.trim()) errors.tenantName = t('auth', 'businessNameRequired') ?? 'Название бизнеса обязательно'

  if (!slug?.trim()) {
    errors.slug = t('auth', 'slugRequired') ?? 'Slug обязателен'
  } else if (!SLUG_RE.test(slug)) {
    errors.slug = t('auth', 'slugInvalid') ?? 'Slug: только строчные буквы, цифры и дефис'
  }

  const VALID_NICHES = ['medicine', 'beauty', 'horeca', 'sports']
  if (!niche || !VALID_NICHES.includes(niche)) errors.niche = t('auth', 'selectNicheRequired')

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
          plan:  'FREE',
          planStatus: 'ACTIVE',
        } as any,
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
            { errors: { slug: t('auth', 'slugTaken') ?? 'Этот slug уже занят. Попробуйте другой.' } },
            { status: 409 }
          )
        }
        if (target.includes('email')) {
          return NextResponse.json(
            { errors: { email: t('auth', 'emailTaken') ?? 'Этот email уже зарегистрирован.' } },
            { status: 409 }
          )
        }
      }
    }
    console.error('[register] Unexpected error:', err)
    return NextResponse.json({ error: t('auth', 'internalError') ?? 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
