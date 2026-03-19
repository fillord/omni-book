import { z } from 'zod'

export const CURRENCIES = ['KZT', 'RUB', 'USD', 'EUR'] as const

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  description: z.string().optional(),
  durationMin: z.number().int().min(1, 'Минимум 1 мин').max(1440, 'Максимум 1440 мин'),
  price: z.number().int().min(0, 'Не может быть отрицательным').optional(),
  currency: z.string().default('KZT'),
  resourceIds: z.array(z.string()).min(1, 'Выберите хотя бы один ресурс'),
  translations: z.record(z.string(), z.record(z.string(), z.string())).optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
