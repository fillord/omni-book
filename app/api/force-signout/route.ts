import { type NextRequest, NextResponse } from 'next/server'

/**
 * Clears all NextAuth session cookies and redirects to /banned.
 * Used when a banned tenant tries to access the dashboard.
 * Covers both HTTP (dev) and HTTPS (prod) cookie variants.
 *
 * Redirect URL rules:
 * - Prefer X-Forwarded-Host / X-Forwarded-Proto when running behind a proxy.
 * - Fallback to the request URL host/protocol in dev or simple setups.
 * - Never hardcode localhost/ports here.
 */
export async function GET(req: NextRequest) {
  const forwardedHost  = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https'

  const bannedUrl = forwardedHost
    ? new URL('/banned', `${forwardedProto}://${forwardedHost}`)
    : new URL('/banned', req.url)

  const response = NextResponse.redirect(bannedUrl)

  const cookieOptions = { path: '/', maxAge: 0 }
  // HTTP (development)
  response.cookies.set('next-auth.session-token', '', cookieOptions)
  response.cookies.set('next-auth.csrf-token', '', cookieOptions)
  response.cookies.set('next-auth.callback-url', '', cookieOptions)
  // HTTPS (production)
  response.cookies.set('__Secure-next-auth.session-token', '', cookieOptions)
  response.cookies.set('__Host-next-auth.csrf-token', '', cookieOptions)

  return response
}
