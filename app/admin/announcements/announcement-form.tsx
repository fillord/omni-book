'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncement } from '@/lib/actions/announcements'
import { Megaphone } from 'lucide-react'

export function AnnouncementForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setLoading(true)
    setError('')
    const res = await createAnnouncement(title.trim(), body.trim())
    if (res.error) {
      setError(res.error)
    } else {
      setTitle('')
      setBody('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Заголовок объявления"
        className="w-full neu-inset bg-[var(--neu-bg)] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        disabled={loading}
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Текст объявления..."
        rows={3}
        className="w-full neu-inset bg-[var(--neu-bg)] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
        disabled={loading}
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={loading || !title.trim() || !body.trim()}
        className="neu-raised bg-[var(--neu-bg)] rounded-lg px-4 py-2 text-sm font-medium text-neu-accent hover:text-foreground disabled:opacity-50 transition-all flex items-center gap-1.5"
      >
        <Megaphone className="h-4 w-4" />
        {loading ? 'Создание...' : 'Создать объявление'}
      </button>
    </form>
  )
}
