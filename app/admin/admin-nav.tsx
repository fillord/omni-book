'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart3, Users, FileText, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/admin', label: 'Обзор', icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/admin/tenants', label: 'Компании', icon: Users },
  { href: '/admin/audit-logs', label: 'Логи действий', icon: FileText },
  { href: '/admin/announcements', label: 'Объявления', icon: Megaphone },
]

export function AdminNav({ hasTenantLink }: { hasTenantLink: boolean }) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
      {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out',
              active
                ? 'neu-inset bg-[var(--neu-bg)] text-neu-accent font-medium'
                : 'text-muted-foreground hover:text-neu-accent hover:neu-inset hover:bg-[var(--neu-bg)] active:neu-inset active:bg-[var(--neu-bg)]'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
      {hasTenantLink && (
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-neu-accent hover:neu-inset hover:bg-[var(--neu-bg)] active:neu-inset active:bg-[var(--neu-bg)] transition-all duration-300 ease-in-out"
        >
          <LayoutDashboard size={18} />
          В панель бизнеса
        </Link>
      )}
    </nav>
  )
}
