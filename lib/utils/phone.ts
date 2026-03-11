/**
 * Форматирует казахстанский номер в +7 (XXX) XXX XX XX.
 * Принимает любой формат: 7071234567, 87071234567, +77071234567 и т.д.
 * Возвращает исходную строку если не удалось распознать.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ""

  const digits = raw.replace(/\D/g, "")

  let phone10: string
  if (digits.length === 10) {
    phone10 = digits
  } else if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    phone10 = digits.slice(1)
  } else {
    return raw
  }

  const code = phone10.slice(0, 3)
  const p1   = phone10.slice(3, 6)
  const p2   = phone10.slice(6, 8)
  const p3   = phone10.slice(8, 10)

  return `+7 (${code}) ${p1} ${p2} ${p3}`
}

/**
 * Нормализует номер для хранения в БД (+7XXXXXXXXXX).
 * Используется для сравнений и анти-спам проверок.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ""

  const digits = raw.replace(/\D/g, "")

  if (digits.length === 10) return `+7${digits}`
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`
  }
  return raw
}
