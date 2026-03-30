import { z } from 'zod'

export const manualBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  resourceId: z.string().min(1, 'Resource required'),
  serviceId: z.string().min(1, 'Service required'),
  startsAt: z.string().min(1, 'Start time required'),
  endsAt: z.string().min(1, 'End time required'),
  clientName: z.string().min(1, 'Client name required').max(100),
  clientPhone: z.string().min(7, 'Phone required'),
})

export type ManualBookingInput = z.infer<typeof manualBookingSchema>
