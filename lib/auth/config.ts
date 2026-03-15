import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { basePrisma } from '@/lib/db'

// Ensure type augmentations are loaded
import '@/lib/auth/types'

export const authConfig: NextAuthOptions = {
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    // ------------------------------------------------------------------
    // Credentials — email + password
    // ------------------------------------------------------------------
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await basePrisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { tenant: { select: { slug: true, isActive: true } } },
        })

        if (!user || !user.passwordHash) return null

        const passwordOk = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!passwordOk) return null

        // Enforce IP verification
        const { headers } = await import('next/headers')
        const { getIpAddress } = await import('@/lib/auth/otp')
        const reqHeaders = await headers()
        const currentIp = getIpAddress(reqHeaders)

        if (user.lastIpAddress && user.lastIpAddress !== currentIp) {
          throw new Error('Упс, ваш IP изменился. Требуется OTP подтверждение.')
        }

        // SUPERADMIN (tenantId = null) is always allowed through
        if (user.tenantId !== null) {
          if (!user.tenant?.isActive) return null
        }

        // --- Concurrent Session Control ---
        // Generate new session ID and overwrite it in the DB
        const newSessionId = crypto.randomUUID()
        await basePrisma.user.update({
          where: { id: user.id },
          data: { activeSessionId: newSessionId }
        })

        return {
          id:              user.id,
          email:           user.email,
          name:            user.name,
          role:            user.role,
          tenantId:        user.tenantId,
          tenantSlug:      user.tenant?.slug ?? null,
          activeSessionId: newSessionId,
        }
      },
    }),

    // ------------------------------------------------------------------
    // Google OAuth — requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env
    // ------------------------------------------------------------------
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    // ------------------------------------------------------------------
    // signIn — Google: upsert user, link to tenant from x-tenant-slug cookie
    // ------------------------------------------------------------------
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true

      const email = user.email
      if (!email) return false

      const existing = await basePrisma.user.findUnique({ where: { email } })

      const newSessionId = crypto.randomUUID()

      if (!existing) {
        // New Google user — create as CUSTOMER without tenant
        // A tenant OWNER can invite them via the admin panel later
        await basePrisma.user.create({
          data: {
            email,
            name:            user.name,
            role:            'CUSTOMER',
            emailVerified:   new Date(),
            activeSessionId: newSessionId,
          },
        })
      } else {
        // Existing user, just update their activeSessionId
        await basePrisma.user.update({
          where: { id: existing.id },
          data: { activeSessionId: newSessionId }
        })
      }

      // We attach it to the user object so the JWT callback picks it up
      user.activeSessionId = newSessionId

      return true
    },

    // ------------------------------------------------------------------
    // JWT — persist custom fields in the token on first sign-in
    // ------------------------------------------------------------------
    async jwt({ token, user, account }) {
      // `user` is only defined on the first sign-in event
      if (user) {
        token.id              = user.id
        token.role            = user.role
        token.tenantId        = user.tenantId
        token.tenantSlug      = user.tenantSlug
        token.activeSessionId = user.activeSessionId
      }

      // For Google OAuth: user object from signIn callback doesn't carry our
      // custom fields — fetch them from DB on first JWT creation
      if (account?.provider === 'google' && !token.role) {
        const dbUser = await basePrisma.user.findUnique({
          where: { email: token.email! },
          include: { tenant: { select: { slug: true } } },
        })
        if (dbUser) {
          token.id         = dbUser.id
          token.role       = dbUser.role
          token.tenantId   = dbUser.tenantId
          token.tenantSlug = dbUser.tenant?.slug ?? null
        }
      }

      return token
    },

    // ------------------------------------------------------------------
    // Redirect — always resolve relative URLs against baseUrl
    // ------------------------------------------------------------------
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/dashboard`
    },

    // ------------------------------------------------------------------
    // Session — expose custom fields to client-side session
    // ------------------------------------------------------------------
    async session({ session, token }) {
      session.user.id         = token.id
      session.user.role       = token.role
      session.user.tenantId   = token.tenantId
      session.user.tenantSlug = token.tenantSlug
      return session
    },
  },
}
