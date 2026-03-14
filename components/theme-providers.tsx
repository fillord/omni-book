'use client'

import { ThemeProvider } from 'next-themes'

const commonProps = {
  attribute: 'class' as const,
  defaultTheme: 'system' as const,
  enableSystem: true,
  disableTransitionOnChange: false,
}

export function BookingThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="booking-theme" {...commonProps}>
      {children}
    </ThemeProvider>
  )
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="admin-theme" {...commonProps}>
      {children}
    </ThemeProvider>
  )
}
