import { z } from "zod"

export const tenantSettingsSchema = z.object({
  name:         z.string().min(2, "Минимум 2 символа").max(100),
  description:  z.string().max(500, "Максимум 500 символов").optional().or(z.literal("")),
  phone:        z.string().max(20).optional().or(z.literal("")),
  email:        z.string().email("Некорректный email").optional().or(z.literal("")),
  address:      z.string().max(200).optional().or(z.literal("")),
  city:         z.string().max(100).optional().or(z.literal("")),
  website:      z.string().url("Некорректный URL").optional().or(z.literal("")),
  logoUrl:      z.string().url("Некорректный URL").optional().or(z.literal("")),
  coverUrl:     z.string().url("Некорректный URL").optional().or(z.literal("")),
  workingHours: z.string().max(200).optional().or(z.literal("")),
  timezone:     z.string().default("Asia/Almaty"),
  socialLinks: z.object({
    instagram: z.string().optional().or(z.literal("")),
    whatsapp:  z.string().optional().or(z.literal("")),
    telegram:  z.string().optional().or(z.literal("")),
  }).optional(),
  translations:      z.record(z.string(), z.record(z.string(), z.string())).optional(),
  telegramChatId:    z.string().max(50).optional().or(z.literal("")),
  bookingWindowDays: z.number().int().min(1, "Минимум 1 день").max(90, "Максимум 90 дней").optional(),
})

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>
