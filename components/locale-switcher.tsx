"use client"

'use client'

import { useState, useEffect, useTransition } from 'react'
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
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background opacity-0 w-[100px] ${className ?? ''}`}>
        <div className="flex items-center gap-1.5 opacity-50">
          <Globe className="h-4 w-4 shrink-0" />
        </div>
      </div>
    )
  }

  return (
    <Select 
      value={locale} 
      onValueChange={(v) => { 
        if (v) { 
          setLocale(v as Locale); 
          startTransition(() => {
            router.refresh(); 
          });
        } 
      }}
    >
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
