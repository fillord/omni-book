'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendNotification } from '@/lib/actions/notifications'
import { Send, CheckCircle2 } from 'lucide-react'

export function SendNotificationForm({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    const res = await sendNotification(tenantId, message.trim())
    if (res.success) {
      setMessage('')
      setSent(true)
      router.refresh()
      setTimeout(() => setSent(false), 3000)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Текст уведомления для владельца..."
        className="flex-1 neu-inset bg-[var(--neu-bg)] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !message.trim()}
        className="neu-raised bg-[var(--neu-bg)] rounded-lg px-4 py-2 text-sm font-medium text-neu-accent hover:neu-inset active:neu-inset disabled:opacity-50 transition-all duration-200 flex items-center gap-1.5"
      >
        {sent ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-500">Отправлено</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Отправить
          </>
        )}
      </button>
    </form>
  )
}
