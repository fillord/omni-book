'use client'

import { ThemeToggle } from '@/components/theme-toggle'

interface Props {
  className?: string
}

export function PublicThemeToggle({ className }: Props) {
  return <ThemeToggle className={className} iconOnly />
}

