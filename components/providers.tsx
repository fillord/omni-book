'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/translations'

export function Providers({ children, initialLocale }: { children: React.ReactNode, initialLocale?: Locale }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <I18nProvider initialLocale={initialLocale}>
          {children}
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
