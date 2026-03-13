"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { basePrisma } from "@/lib/db"
import { tenantSettingsSchema, type TenantSettingsInput } from "@/lib/validations/tenant-settings"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export async function getTenantSettings() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  return basePrisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      id:          true,
      name:        true,
      slug:        true,
      niche:       true,
      plan:        true,
      description: true,
      phone:       true,
      email:       true,
      address:     true,
      city:        true,
      website:     true,
      logoUrl:     true,
      coverUrl:    true,
      workingHours:   true,
      timezone:       true,
      socialLinks:    true,
      translations:   true,
      telegramChatId: true,
    },
  })
}

export async function updateTenantSettings(data: TenantSettingsInput) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) throw new Error("Unauthorized")
  if (session.user.role !== "OWNER" && session.user.role !== "SUPERADMIN") {
    throw new Error("Только владелец может менять настройки")
  }

  const validated = tenantSettingsSchema.parse(data)

  // Fetch existing translations to merge them
  const existingTenant = await basePrisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { translations: true },
  })
  const existingTranslations = (existingTenant?.translations as Record<string, any>) || {}
  
  const mergedTranslations = validated.translations
    ? Object.entries(validated.translations).reduce((acc, [lang, dict]) => {
        acc[lang] = { ...(acc[lang] || {}), ...dict }
        return acc
      }, { ...existingTranslations })
    : existingTranslations

  await basePrisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      name:         validated.name,
      description:  validated.description  || null,
      phone:        validated.phone        || null,
      email:        validated.email        || null,
      address:      validated.address      || null,
      city:         validated.city         || null,
      website:      validated.website      || null,
      logoUrl:      validated.logoUrl      || null,
      coverUrl:     validated.coverUrl     || null,
      workingHours: validated.workingHours || null,
      timezone:     validated.timezone,
      socialLinks:    validated.socialLinks  ?? {},
      translations:   mergedTranslations as Prisma.InputJsonValue,
      telegramChatId: validated.telegramChatId || null,
    },
  })

  revalidatePath("/dashboard/settings")
  revalidatePath(`/${session.user.tenantSlug}`)
  return { success: true }
}
