"use client"

'use client'

import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useI18n, LOCALE_LABELS, type Locale } from '@/lib/i18n/context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()
  const router = useRouter()

  return (
    <Select value={locale} onValueChange={(v) => { if (v) { setLocale(v as Locale); router.refresh(); } }}>
      <SelectTrigger className={`w-auto gap-1.5 ${className ?? ''}`}>
        <Globe className="h-4 w-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([key, label]) => (
          <SelectItem key={key} value={key}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
