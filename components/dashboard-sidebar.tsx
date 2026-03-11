'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Menu, LogOut, ExternalLink,
  LayoutDashboard, CalendarDays, Wrench, Scissors, Settings,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { NicheConfig } from '@/lib/niche/config'

// ---- types -----------------------------------------------------------------

type Props = {
  nicheConfig: NicheConfig
  tenantName: string
  tenantSlug: string
  userName: string
  userEmail: string
}

// ---- static color maps (Tailwind requires static strings) ------------------

const ACTIVE_LINK: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-700 font-medium dark:bg-blue-950/40 dark:text-blue-300',
  pink:   'bg-pink-50 text-pink-700 font-medium dark:bg-pink-950/40 dark:text-pink-300',
  orange: 'bg-orange-50 text-orange-700 font-medium dark:bg-orange-950/40 dark:text-orange-300',
  green:  'bg-green-50 text-green-700 font-medium dark:bg-green-950/40 dark:text-green-300',
}

const BADGE_CLS: Record<string, string> = {
  blue:   'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
  pink:   'border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300',
  orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300',
  green:  'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300',
}

// ---- nav -------------------------------------------------------------------

function navItems(nc: NicheConfig) {
  return [
    { href: '/dashboard',           label: 'Обзор',              icon: LayoutDashboard, exact: true  },
    { href: '/dashboard/resources', label: nc.resourceLabelPlural, icon: Wrench,          exact: false },
    { href: '/dashboard/services',  label: 'Услуги',             icon: Scissors,        exact: false },
    { href: '/dashboard/bookings',  label: 'Бронирования',       icon: CalendarDays,    exact: false },
    { href: '/dashboard/settings',  label: 'Настройки',          icon: Settings,        exact: false },
  ]
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

// ---- inner content (shared between desktop aside and Sheet) ----------------

function SidebarContent({ nicheConfig, tenantName, tenantSlug, userName, userEmail }: Props) {
  const pathname = usePathname()
  const items    = navItems(nicheConfig)
  const color    = nicheConfig.color ?? 'blue'
  const active   = ACTIVE_LINK[color]  ?? ACTIVE_LINK.blue
  const badge    = BADGE_CLS[color]    ?? BADGE_CLS.blue

  return (
    <div className="flex flex-col h-full min-h-screen">

      {/* Owner avatar */}
      <div className="px-4 py-4 border-b flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs font-medium">
            {initials(userName || userEmail)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{userName || userEmail}</p>
          {userName && (
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          )}
        </div>
      </div>

      {/* Tenant + niche */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs font-semibold text-foreground truncate" title={tenantName}>
          {tenantName}
        </p>
        <span className={`mt-1.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${badge}`}>
          {nicheConfig.label}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? active
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 py-4 border-t space-y-0.5">
        <a
          href={`/${tenantSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Публичная страница
        </a>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Выйти
        </button>
      </div>
    </div>
  )
}

// ---- exported component ----------------------------------------------------

export function DashboardSidebar(props: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r bg-card flex-col">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile burger → Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            className="fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-md border bg-background/90 backdrop-blur shadow-sm hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
