import { cookies } from 'next/headers'
import { translations, DEFAULT_LOCALE, type Locale } from './translations'

export async function getServerT() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('omnibook-locale')?.value as Locale) || DEFAULT_LOCALE
  return (section: string, key: string): string =>
    translations[locale]?.[section]?.[key] ??
    translations[DEFAULT_LOCALE]?.[section]?.[key] ??
    `${section}.${key}`
}
