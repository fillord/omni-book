import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const rootDomain = process.env.ROOT_DOMAIN || 'omnibook.com'

  // Extract subdomain (e.g. "acme" from "acme.omnibook.com")
  const subdomain = hostname.replace(`.${rootDomain}`, '').replace(rootDomain, '')

  const response = NextResponse.next()

  if (subdomain && subdomain !== hostname) {
    response.headers.set('x-tenant-slug', subdomain)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
