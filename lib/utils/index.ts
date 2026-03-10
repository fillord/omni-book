/** Formats a Date to a locale-aware short date string. */
export function formatDate(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, { dateStyle: 'medium' })
}

/** Formats a Date to a locale-aware time string. */
export function formatTime(date: Date, locale = 'en-US'): string {
  return date.toLocaleTimeString(locale, { timeStyle: 'short' })
}

/** Returns true if value is a non-empty string. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
