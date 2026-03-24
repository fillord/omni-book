'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deactivateAnnouncement, deleteAnnouncement } from '@/lib/actions/announcements'
import { Trash2, EyeOff } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  body: string
  isActive: boolean
  createdAt: Date | string
}

export function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleDeactivate = async (id: string) => {
    setLoadingId(id)
    await deactivateAnnouncement(id)
    router.refresh()
    setLoadingId(null)
  }

  const handleDelete = async (id: string) => {
    setLoadingId(id)
    await deleteAnnouncement(id)
    router.refresh()
    setLoadingId(null)
  }

  if (announcements.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет объявлений</p>
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <div
          key={a.id}
          className={`neu-inset bg-[var(--neu-bg)] rounded-lg p-4 flex items-start justify-between gap-3 ${!a.isActive ? 'opacity-60' : ''}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{a.title}</p>
              {a.isActive && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-500/20 text-green-600">
                  Активно
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{a.body}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(a.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {a.isActive && (
              <button
                onClick={() => handleDeactivate(a.id)}
                disabled={loadingId === a.id}
                className="h-8 w-8 rounded-md neu-raised bg-[var(--neu-bg)] flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50 transition-all"
                title="Деактивировать"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(a.id)}
              disabled={loadingId === a.id}
              className="h-8 w-8 rounded-md neu-raised bg-[var(--neu-bg)] flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-50 transition-all"
              title="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
