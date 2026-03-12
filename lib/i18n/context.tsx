'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { translations, type Locale, DEFAULT_LOCALE, LOCALE_LABELS } from './translations'

interface I18nContextValue {
  locale:    Locale
  setLocale: (locale: Locale) => void
  t:         (section: string, key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('omnibook-locale') as Locale) || DEFAULT_LOCALE
    }
    return DEFAULT_LOCALE
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('omnibook-locale', newLocale)
      document.cookie = `omnibook-locale=${newLocale};path=/;max-age=${365 * 24 * 3600};SameSite=Lax`
    }
  }, [])

  const t = useCallback((section: string, key: string): string => {
    return (
      translations[locale]?.[section]?.[key] ??
      translations[DEFAULT_LOCALE]?.[section]?.[key] ??
      `${section}.${key}`
    )
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export { LOCALE_LABELS }
export type { Locale }
