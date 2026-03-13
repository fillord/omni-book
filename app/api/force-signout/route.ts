import { type NextRequest, NextResponse } from 'next/server'

/**
 * Clears all NextAuth session cookies and redirects to /banned.
 * Used when a banned tenant tries to access the dashboard.
 * Covers both HTTP (dev) and HTTPS (prod) cookie variants.
 */
export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/banned', req.url))

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
