import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ---- Route rules -----------------------------------------------------------

/** Paths that require an authenticated session */
const PROTECTED_PREFIXES = ['/dashboard']

/** Paths that additionally require OWNER or SUPERADMIN role */
const OWNER_API_PREFIXES = ['/api/resources', '/api/tenants']

/** Superadmin-only paths */
const ADMIN_PREFIXES = ['/admin']

/** Paths where logged-in users should be bounced to /dashboard */
const AUTH_ONLY_PATHS = ['/login', '/register']

const DASHBOARD_ROLES = new Set(['OWNER', 'STAFF', 'SUPERADMIN'])
const OWNER_ROLES     = new Set(['OWNER', 'SUPERADMIN'])

// ---- Helpers ---------------------------------------------------------------

function jsonResponse(message: string, status: number): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function loginRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

// ---- Middleware ------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // ------------------------------------------------------------------
  // 1. JWT token — reads from cookie, no DB round-trip (Edge-safe)
  // ------------------------------------------------------------------
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const role = token?.role as string | undefined

  // ------------------------------------------------------------------
  // 2. Auth-page guard: redirect to /dashboard if already signed in
  // ------------------------------------------------------------------
  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (token) {
      const dashboard = request.nextUrl.clone()
      dashboard.pathname = '/dashboard'
      dashboard.search = ''
      return NextResponse.redirect(dashboard)
    }
  }

  // ------------------------------------------------------------------
  // 3. Dashboard protection
  // ------------------------------------------------------------------
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!token) return loginRedirect(request)
    if (role && !DASHBOARD_ROLES.has(role)) return loginRedirect(request)
  }

  // ------------------------------------------------------------------
  // 4. Protected API routes (resources, tenants management)
  // ------------------------------------------------------------------
  if (OWNER_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!token) return jsonResponse('Authentication required', 401)
    if (!role || !OWNER_ROLES.has(role)) return jsonResponse('Forbidden', 403)
  }

  // ------------------------------------------------------------------
  // 5. Superadmin Protection
  // ------------------------------------------------------------------
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!token) return loginRedirect(request)
    const isSuperAdmin = role === 'SUPERADMIN'
    if (!isSuperAdmin) {
      const dashboard = request.nextUrl.clone()
      dashboard.pathname = '/dashboard'
      return NextResponse.redirect(dashboard)
    }
  }

  // ------------------------------------------------------------------
  // 6. Tenant slug & locale propagation
  // ------------------------------------------------------------------
  const hostname   = request.headers.get('host') || ''
  const rootDomain = process.env.ROOT_DOMAIN || 'omnibook.com'
  const subdomain  = hostname.endsWith(`.${rootDomain}`)
    ? hostname.slice(0, hostname.length - rootDomain.length - 1)
    : ''

  const locale = request.cookies.get('omnibook-locale')?.value || 'ru'

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-omnibook-locale', locale)
  
  if (subdomain) {
    requestHeaders.set('x-tenant-slug', subdomain)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
