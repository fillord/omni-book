import { headers, cookies } from 'next/headers'
import { translations, DEFAULT_LOCALE, type Locale } from './translations'

export async function getServerT() {
  const reqHeaders = await headers()
  const cookieStore = await cookies()
  
  // Prefer header set by middleware, fallback to cookie, then default
  const localeHeader = reqHeaders.get('x-omnibook-locale') as Locale | null
  const localeCookie = cookieStore.get('omnibook-locale')?.value as Locale | undefined
  const locale = localeHeader || localeCookie || DEFAULT_LOCALE

  return (section: string, key: string): string =>
    translations[locale]?.[section]?.[key] ??
    translations[DEFAULT_LOCALE]?.[section]?.[key] ??
    `${section}.${key}`
}
