import { BookingThemeProvider } from '@/components/theme-providers'

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingThemeProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </BookingThemeProvider>
  )
}
