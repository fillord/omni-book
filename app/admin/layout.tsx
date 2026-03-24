import { authConfig } from '@/lib/auth/config'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Users, LayoutDashboard, LogOut, BarChart3, FileText, Megaphone } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { AdminThemeProvider } from '@/components/theme-providers'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authConfig)

  if (!session?.user) {
    redirect('/login')
  }

  const isSuperAdmin = session.user.role === 'SUPERADMIN' || session.user.email === 'admin@omnibook.com'
  if (!isSuperAdmin) {
    redirect('/dashboard')
  }

  return (
    <AdminThemeProvider>
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 neu-raised bg-[var(--neu-bg)] text-foreground flex-shrink-0 flex flex-col">
        <div className="p-6">
          <Link href="/admin/tenants" className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="text-neu-accent" />
            <span className="tracking-tight">OmniAdmin</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:neu-inset hover:bg-[var(--neu-bg)] transition-all"
          >
            <LayoutDashboard size={18} />
            Обзор
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:neu-inset hover:bg-[var(--neu-bg)] transition-all"
          >
            <BarChart3 size={18} />
            Аналитика
          </Link>
          <Link
            href="/admin/tenants"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg neu-inset bg-[var(--neu-bg)] text-neu-accent font-medium transition-all"
          >
            <Users size={18} />
            Компании
          </Link>
          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:neu-inset hover:bg-[var(--neu-bg)] transition-all"
          >
            <FileText size={18} />
            Логи действий
          </Link>
          {session.user.tenantId && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:neu-inset hover:bg-[var(--neu-bg)] transition-all"
            >
              <LayoutDashboard size={18} />
              В панель бизнеса
            </Link>
          )}
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full neu-raised bg-[var(--neu-bg)] flex items-center justify-center shrink-0">
              <span className="text-neu-accent font-medium text-sm">
                {session.user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            </div>
            <ThemeToggle iconOnly className="shrink-0" />
          </div>
          <SignOutButton
            redirectTo="/login"
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:neu-inset hover:bg-[var(--neu-bg)] transition-all text-sm"
          >
            <LogOut size={16} />
            Выйти
          </SignOutButton>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto neu-inset bg-[var(--neu-bg)]">
        {children}
      </main>
    </div>
    </AdminThemeProvider>
  )
}
