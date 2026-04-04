import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth/config'
import { basePrisma } from '@/lib/db'
import { SupportForm } from '@/components/support/SupportForm'
import { Mail, MessageCircle, Phone } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardSupportPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect('/login')

  const tenant = await basePrisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, phone: true },
  })

  if (!tenant) redirect('/login')

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Поддержка</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Опишите вашу проблему — мы ответим в течение 24 часов.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href="mailto:qz.nursultan@gmail.com"
          className="flex items-center gap-3 rounded-2xl p-4 neu-raised bg-[var(--neu-bg)] text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)]">
            <Mail className="h-4 w-4 text-neu-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Email</p>
            <p className="text-xs">qz.nursultan@gmail.com</p>
          </div>
        </a>

        <a
          href="https://t.me/qzlord"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl p-4 neu-raised bg-[var(--neu-bg)] text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)]">
            <MessageCircle className="h-4 w-4 text-neu-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Telegram</p>
            <p className="text-xs">@qzlord</p>
          </div>
        </a>

        <a
          href="tel:87073436423"
          className="flex items-center gap-3 rounded-2xl p-4 neu-raised bg-[var(--neu-bg)] text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full neu-inset bg-[var(--neu-bg)]">
            <Phone className="h-4 w-4 text-neu-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Телефон</p>
            <p className="text-xs">8 707 343-64-23</p>
          </div>
        </a>
      </div>

      <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Написать в поддержку</h2>
        <SupportForm
          defaultName={session.user.name ?? ''}
          defaultEmail={session.user.email ?? ''}
          defaultPhone={tenant.phone ?? ''}
          defaultBusinessName={tenant.name}
        />
      </div>
    </div>
  )
}
