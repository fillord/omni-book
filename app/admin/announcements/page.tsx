import { basePrisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { AnnouncementForm } from './announcement-form'
import { AnnouncementList } from './announcement-list'

export default async function AnnouncementsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.email || (session.user.role !== 'SUPERADMIN' && session.user.email !== 'admin@omnibook.com')) {
    redirect('/admin')
  }

  const announcements = await basePrisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Объявления</h1>

      {/* Create announcement form */}
      <div className="neu-raised bg-[var(--neu-bg)] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Новое объявление</h2>
        <AnnouncementForm />
      </div>

      {/* Existing announcements list */}
      <div className="neu-raised bg-[var(--neu-bg)] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Все объявления</h2>
        <AnnouncementList announcements={announcements} />
      </div>
    </div>
  )
}
