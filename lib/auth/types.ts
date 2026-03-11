import 'next-auth'
import 'next-auth/jwt'
import { type Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
      tenantId: string | null
      tenantSlug: string | null
    }
  }

  // Extends the User object returned by authorize() / OAuth profile
  interface User {
    role: Role
    tenantId: string | null
    tenantSlug: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    tenantId: string | null
    tenantSlug: string | null
  }
}
