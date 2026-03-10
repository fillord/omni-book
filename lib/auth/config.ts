import type { NextAuthOptions } from 'next-auth'

export const authConfig: NextAuthOptions = {
  providers: [
    // TODO: add Credentials / OAuth providers
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
