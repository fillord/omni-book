import type { Metadata } from 'next'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { headers, cookies } from 'next/headers'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/translations'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'OmniBook',
  description: 'Universal multi-tenant booking platform',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers()
  const cookieStore = await cookies()
  const localeHeader = reqHeaders.get('x-omnibook-locale') as Locale | null
  const localeCookie = cookieStore.get('omnibook-locale')?.value as Locale | undefined
  const locale = localeHeader || localeCookie || DEFAULT_LOCALE

  return (
    <html lang={locale} className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body><Providers initialLocale={locale}>{children}</Providers></body>
    </html>
  )
}
