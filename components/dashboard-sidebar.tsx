'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NicheConfig } from '@/lib/niche/config'

// ---- types -----------------------------------------------------------------

type Props = {
  nicheConfig: NicheConfig
  tenantName: string
  tenantSlug: string
}

// ---- nav items -------------------------------------------------------------

function navItems(nc: NicheConfig) {
  return [
    { href: '/dashboard',          label: 'Обзор',                    exact: true  },
    { href: '/dashboard/resources', label: nc.resourceLabelPlural,     exact: false },
    { href: '/dashboard/services',  label: 'Услуги',                   exact: false },
    { href: '/dashboard/bookings',  label: 'Бронирования',             exact: false },
  ]
}

// ---- component -------------------------------------------------------------

export function DashboardSidebar({ nicheConfig, tenantName, tenantSlug }: Props) {
  const pathname = usePathname()
  const items    = navItems(nicheConfig)

  return (
    <aside className="w-56 shrink-0 border-r bg-card min-h-screen flex flex-col">
      {/* Tenant identity */}
      <div className="px-4 py-5 border-b">
        <p className="font-semibold text-sm truncate" title={tenantName}>{tenantName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{nicheConfig.label}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {items.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t space-y-2">
        <a
          href={`/${tenantSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Публичная страница ↗
        </a>
        <p className="text-xs text-muted-foreground">OmniBook</p>
      </div>
    </aside>
  )
}
