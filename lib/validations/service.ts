import { z } from 'zod'

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 40, 45, 60, 90, 120, 180] as const
export const CURRENCIES = ['KZT', 'RUB', 'USD', 'EUR'] as const

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  description: z.string().optional(),
  durationMin: z.number().int().min(5, 'Минимум 5 мин').max(480, 'Максимум 480 мин'),
  price: z.number().int().min(0, 'Не может быть отрицательным').optional(),
  currency: z.string().default('KZT'),
  resourceIds: z.array(z.string()).min(1, 'Выберите хотя бы один ресурс'),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
