'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  className?: string
  /** Compact icon-only mode (for collapsed sidebar) */
  iconOnly?: boolean
}

export function ThemeToggle({ className = '', iconOnly = false }: Props) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className={`h-8 w-8 rounded-md bg-muted animate-pulse ${className}`} />
    )
  }

  const isDark = resolvedTheme === 'dark'

  function toggle() {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (iconOnly) {
    return (
      <button
        onClick={toggle}
        className={`flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${className}`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {isDark ? 'Светлая тема' : 'Тёмная тема'}
    </button>
  )
}
