"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { basePrisma } from "@/lib/db"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z
    .string()
    .min(8, "Новый пароль должен быть не короче 8 символов")
    .regex(/[A-Za-zА-Яа-я]/, "Пароль должен содержать хотя бы одну букву")
    .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export type ChangePasswordResult =
  | { success: true }
  | {
      success: false
      fieldErrors?: Partial<Record<keyof ChangePasswordInput, string>>
      error?: string
    }

export async function changePassword(data: ChangePasswordInput): Promise<ChangePasswordResult> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) {
    return { success: false, error: "Требуется авторизация" }
  }

  const parsed = changePasswordSchema.safeParse(data)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ChangePasswordInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ChangePasswordInput | undefined
      if (key) fieldErrors[key] = issue.message
    }
    return { success: false, fieldErrors }
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await basePrisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  })

  if (!user || !user.passwordHash) {
    return { success: false, error: "Для этого аккаунта нельзя изменить пароль" }
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) {
    return {
      success: false,
      fieldErrors: { currentPassword: "Неверный текущий пароль" },
    }
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await basePrisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return { success: true }
}

