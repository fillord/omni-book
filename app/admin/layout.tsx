import { authConfig } from '@/lib/auth/config'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Users, LayoutDashboard, LogOut } from 'lucide-react'

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
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 text-white flex-shrink-0 flex flex-col">
        <div className="p-6">
          <Link href="/admin/tenants" className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="text-indigo-400" />
            <span className="tracking-tight">OmniAdmin</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          <Link 
            href="/admin/tenants" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 font-medium transition-colors"
          >
            <Users size={18} />
            Компании
          </Link>
          {session.user.tenantId && (
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <LayoutDashboard size={18} />
              В панель бизнеса
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-zinc-400 font-medium text-sm">
                {session.user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
