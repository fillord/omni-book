import { randomInt } from 'crypto'

/**
 * Generates a 6-digit secure random numeric OTP string.
 */
export function generateOtp(): string {
  // Generates exactly 6 digits, e.g. "049382"
  const val = randomInt(0, 1000000)
  return val.toString().padStart(6, '0')
}

/**
 * Extracts the user's IP address from a Request or Headers object.
 * Checks various headers since Next.js can be behind proxies.
 */
export function getIpAddress(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((ip) => ip.trim())
    if (ips.length > 0) return ips[0]
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp

  return '127.0.0.1' // fallback
}
