import { z } from 'zod'

export const RESOURCE_TYPES = ['staff', 'room', 'court', 'table', 'other', 'couch'] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  staff: 'Сотрудник',
  room: 'Кабинет',
  court: 'Корт',
  table: 'Столик',
  other: 'Другое',
  couch: 'Кушетка',
}

export const createResourceSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  type: z.enum(RESOURCE_TYPES),
  description: z.string().optional(),
  capacity: z.number().int().min(1, 'Минимум 1').optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  translations: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  lunchStart: z.string().regex(/^\d{2}:\d{2}$/, 'Формат HH:mm').optional().or(z.literal('')),
  lunchEnd:   z.string().regex(/^\d{2}:\d{2}$/, 'Формат HH:mm').optional().or(z.literal('')),
})

export const updateResourceSchema = createResourceSchema.partial()

export type CreateResourceInput = z.infer<typeof createResourceSchema>
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>
