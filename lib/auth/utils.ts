/**
 * Masks an email address for privacy.
 * Example rules: username@domain.com -> us.******@domain.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email

  const [local, domain] = email.split('@')
  
  // If the local part is very short, just show 1 char and mask the rest
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }

  // Keep first 2 characters, add a dot, then mask the rest of the local part with asterisks
  const visiblePart = local.slice(0, 2)
  const maskedLocal = visiblePart + '.' + '*'.repeat(Math.max(3, local.length - 2))
  
  return `${maskedLocal}@${domain}`
}
