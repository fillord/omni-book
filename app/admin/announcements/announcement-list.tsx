'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { activateAnnouncement, deactivateAnnouncement, deleteAnnouncement } from '@/lib/actions/announcements'
import { Trash2, Eye, EyeOff } from 'lucide-react'

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

  const handleToggle = async (id: string, isActive: boolean) => {
    setLoadingId(id)
    if (isActive) {
      await deactivateAnnouncement(id)
    } else {
      await activateAnnouncement(id)
    }
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
          className={`neu-inset bg-[var(--neu-bg)] rounded-lg p-4 flex items-start justify-between gap-3 transition-opacity duration-300 ${!a.isActive ? 'opacity-50' : ''}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{a.title}</p>
              {a.isActive && (
                <span className="neu-raised bg-[var(--neu-bg)] text-emerald-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wide">
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
            <button
              onClick={() => handleToggle(a.id, a.isActive)}
              disabled={loadingId === a.id}
              className="h-8 w-8 rounded-md neu-raised bg-[var(--neu-bg)] flex items-center justify-center disabled:opacity-50 transition-all duration-200 hover:neu-inset active:neu-inset"
              title={a.isActive ? 'Деактивировать' : 'Активировать'}
            >
              {a.isActive
                ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                : <Eye className="h-4 w-4 text-emerald-500" />
              }
            </button>
            <button
              onClick={() => handleDelete(a.id)}
              disabled={loadingId === a.id}
              className="h-8 w-8 rounded-md neu-raised bg-[var(--neu-bg)] flex items-center justify-center text-muted-foreground hover:text-destructive hover:neu-inset active:neu-inset disabled:opacity-50 transition-all duration-200"
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
