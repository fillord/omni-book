'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AnnouncementBannerProps {
  id: string
  title: string
  body: string
}

export function AnnouncementBanner({ id, title, body }: AnnouncementBannerProps) {
  const [shown, setShown] = useState(false)
  const STORAGE_KEY = `announcement_dismissed_${id}`

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed !== 'true') {
      setShown(true)
    }
  }, [STORAGE_KEY])

  if (!shown) return null

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShown(false)
  }

  return (
    <div className="mx-4 mt-4 mb-2 rounded-xl neu-raised bg-[var(--neu-bg)] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 h-7 w-7 rounded-md neu-inset bg-[var(--neu-bg)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
