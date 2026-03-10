/**
 * Resource entity schemas and niche-specific config types.
 * Avoid importing Prisma types here — keep this layer pure TypeScript.
 */

export type ResourceType =
  | 'staff_member'   // Beauty / Medicine / Consulting
  | 'room'           // HoReCa, photo studios, lofts
  | 'court'          // Sports
  | 'table'          // Restaurants / cafes

export interface ResourceConfig {
  type: ResourceType
  /** Display name shown to customers */
  name: string
  /** Optional capacity (tables, rooms) */
  capacity?: number
  /** Working hours expressed as cron-like schedule or ISO intervals */
  schedule?: WorkingHours[]
  /** Niche-specific extra fields stored as JSON */
  meta?: Record<string, unknown>
}

export interface WorkingHours {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number
  openTime: string   // "HH:mm"
  closeTime: string  // "HH:mm"
}
