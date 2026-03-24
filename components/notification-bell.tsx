'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications'

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: Date | string
}

interface NotificationBellProps {
  tenantId: string
  initialUnreadCount: number
  initialNotifications: Notification[]
}

export function NotificationBell({ tenantId, initialUnreadCount, initialNotifications }: NotificationBellProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    router.refresh()
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(tenantId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 neu-raised bg-[var(--neu-bg)]">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold text-foreground">Уведомления</p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-neu-accent hover:underline"
            >
              Прочитать все
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Нет уведомлений
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`px-3 py-2 cursor-pointer ${!n.read ? 'bg-muted/50' : ''}`}
                onClick={() => !n.read && handleMarkRead(n.id)}
              >
                <div className="flex items-start gap-2 w-full">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-neu-accent shrink-0 mt-1.5" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
