'use client'

import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/translations'

export function Providers({ children, initialLocale }: { children: React.ReactNode, initialLocale?: Locale }) {
  return (
    <SessionProvider>
      <I18nProvider initialLocale={initialLocale}>
        {children}
      </I18nProvider>
    </SessionProvider>
  )
}
