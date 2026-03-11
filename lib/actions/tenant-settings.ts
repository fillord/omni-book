"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { basePrisma } from "@/lib/db"
import { tenantSettingsSchema, type TenantSettingsInput } from "@/lib/validations/tenant-settings"
import { revalidatePath } from "next/cache"

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
      workingHours: true,
      timezone:    true,
      socialLinks: true,
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
      socialLinks:  validated.socialLinks  ?? {},
    },
  })

  revalidatePath("/dashboard/settings")
  revalidatePath(`/${session.user.tenantSlug}`)
  return { success: true }
}
