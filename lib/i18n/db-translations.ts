import type { Locale } from './translations'

type Translations = Record<string, Record<string, string>>

export function getDbTranslation(
  entity: { name: string; description?: string | null; translations?: Translations | null },
  field: 'name' | 'description',
  locale: Locale | string
): string {
  // 1. If locale is Russian (base), return the original field
  if (locale === 'ru') {
    return entity[field] || ''
  }

  // 2. Safely check if translations object exists and has the requested locale
  const translations = entity.translations
  if (translations && typeof translations === 'object') {
    const localeTranslations = translations[locale]
    if (localeTranslations && typeof localeTranslations === 'object') {
      const translatedString = localeTranslations[field]
      // 3. Return the translated string if valid
      if (typeof translatedString === 'string' && translatedString.trim() !== '') {
        return translatedString
      }
    }
  }

  // 4. Fallback to base (Russian) if no valid translation found
  return entity[field] || ''
}
