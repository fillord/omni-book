"use client"

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Menu, LogOut, ExternalLink,
  LayoutDashboard, CalendarDays, Wrench, Scissors, Settings, BarChart3,
  Zap, Clock, Users, CreditCard, LifeBuoy
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useI18n } from '@/lib/i18n/context'
import { LocaleSwitcher } from '@/components/locale-switcher'
import type { NicheConfig } from '@/lib/niche/config'
import { useState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notification-bell'

// ---- types -----------------------------------------------------------------

type Props = {
  nicheConfig:      NicheConfig
  tenantName:       string
  tenantSlug:       string
  tenantPlan:       string
  tenantPlanStatus: string
  userName:         string
  userEmail:        string
  userRole:         string
  tenantId?:        string
  unreadCount?:     number
  notifications?:   { id: string; message: string; read: boolean; createdAt: Date | string }[]
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

function SidebarContent({ nicheConfig, tenantName, tenantSlug, tenantPlan, tenantPlanStatus, userName, userEmail, userRole, tenantId, unreadCount, notifications }: Props) {
  const pathname = usePathname()
  const { t }    = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const color    = nicheConfig.color ?? 'blue'
  const active   = ACTIVE_LINK[color] ?? ACTIVE_LINK.blue
  const badge    = BADGE_CLS[color]   ?? BADGE_CLS.blue

  const items = [
    { href: '/dashboard',                    section: 'dashboard', tKey: 'overview',  icon: LayoutDashboard, exact: true  },
    { href: '/dashboard/resources',          section: 'niche',     tKey: nicheConfig.resourceLabelPlural, icon: Wrench,       exact: false },
    { href: '/dashboard/services',           section: 'dashboard', tKey: 'services',  icon: Scissors,        exact: false },
    { href: '/dashboard/bookings',           section: 'dashboard', tKey: 'bookings',  icon: CalendarDays,    exact: false },
    { href: '/dashboard/clients',            section: 'clients',   tKey: 'title',     icon: Users,           exact: false },
    { href: '/dashboard/analytics',          section: 'dashboard', tKey: 'analytics', icon: BarChart3,        exact: false },
    { href: '/dashboard/settings',           section: 'dashboard', tKey: 'settings',  icon: Settings,        exact: true  },
    { href: '/dashboard/settings/billing',  section: 'dashboard', tKey: 'billing',   icon: CreditCard,      exact: false },
    { href: '/dashboard/support',           section: 'dashboard', tKey: 'support',   icon: LifeBuoy,        exact: false },
  ]

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">

      {/* Owner avatar */}
      <div className="px-4 py-4 border-b flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs font-medium">
            {initials(userName || userEmail)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate leading-tight">{userName || userEmail}</p>
          {userName && (
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          )}
        </div>
        {tenantId && (
          <NotificationBell
            tenantId={tenantId}
            initialUnreadCount={unreadCount ?? 0}
            initialNotifications={notifications ?? []}
          />
        )}
      </div>

      {/* Tenant + niche & plan */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs font-semibold text-foreground truncate" title={tenantName}>
          {tenantName}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className={`inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${badge} min-w-[50px] uppercase`}>
            {mounted ? t('niche', nicheConfig.label) : <span className="h-2.5 w-8 bg-current/20 rounded-sm animate-pulse" />}
          </span>
          <span className="inline-flex items-center justify-center rounded border border-border bg-muted text-foreground px-1.5 py-0.5 text-[10px] font-bold leading-none uppercase">
            {tenantPlan}
          </span>
        </div>
      </div>

      {/* Navigation (scrollable middle section) */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {items.map(({ href, section, tKey, icon: Icon, exact }) => {
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
              {mounted ? t(section, tKey) : <span className="h-3.5 w-20 bg-current/20 rounded-sm animate-pulse" />}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade Banner & Footer links (pinned to bottom) */}
      <div className="mt-auto px-4 py-4 bg-sidebar border-t border-sidebar-border space-y-1 z-10">
        {tenantPlan === 'FREE' && tenantPlanStatus !== 'PENDING' && (
          <Link
            href="/dashboard/settings/billing"
            className="group flex items-center justify-between gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all shadow-sm mb-2"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0 fill-indigo-500 text-indigo-500 group-hover:scale-110 transition-transform" />
              Upgrade to PRO
            </span>
          </Link>
        )}

        {tenantPlanStatus === 'PENDING' && (
          <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 mb-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Ожидает активации
          </div>
        )}

        {userRole === 'SUPERADMIN' && (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-sidebar-accent-foreground bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors mb-2"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-400" />
            Панель администратора
          </Link>
        )}

        <a
          href={`/${tenantSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {mounted ? t('dashboard', 'publicPage') : <span className="h-3.5 w-28 bg-current/20 rounded-sm animate-pulse" />}
        </a>

        {/* Language switcher */}
        <div className="px-1 py-1">
          <LocaleSwitcher className="w-full h-8 text-xs" />
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {mounted ? t('common', 'logout') : <span className="h-3.5 w-16 bg-current/20 rounded-sm animate-pulse" />}
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
      <aside className="hidden md:flex w-64 shrink-0 h-full">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile burger → Sheet */}
      <div className="md:hidden">
        {/* Quick access theme toggle (avoid opening sidebar) */}
        <div className="fixed top-3 right-3 z-40">
          <ThemeToggle iconOnly />
        </div>
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
