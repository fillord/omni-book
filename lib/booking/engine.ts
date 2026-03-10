/**
 * Core booking engine: availability checks, conflict detection, booking creation.
 * All functions receive an explicit tenantId — never read it from global state here.
 */

export interface TimeSlot {
  start: Date
  end: Date
}

/**
 * Returns true if two time slots overlap.
 */
export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.start < b.end && b.start < a.end
}

// TODO: implement getAvailableSlots, createBooking, cancelBooking
