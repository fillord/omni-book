import { authConfig } from '@/lib/auth/config'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, LogOut } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { AdminThemeProvider } from '@/components/theme-providers'
import { ThemeToggle } from '@/components/theme-toggle'
import { AdminNav } from './admin-nav'

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
      <aside className="w-full md:w-64 h-screen sticky top-0 neu-raised bg-[var(--neu-bg)] text-foreground flex-shrink-0 flex flex-col">
        <div className="p-6 flex-shrink-0">
          <Link href="/admin/tenants" className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="text-neu-accent" />
            <span className="tracking-tight">OmniAdmin</span>
          </Link>
        </div>

        <AdminNav hasTenantLink={!!session.user.tenantId} />

        <div className="p-4 flex-shrink-0">
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
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-neu-accent hover:neu-inset hover:bg-[var(--neu-bg)] active:neu-inset active:bg-[var(--neu-bg)] transition-all duration-300 ease-in-out text-sm"
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
