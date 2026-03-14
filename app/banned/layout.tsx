import { AdminThemeProvider } from '@/components/theme-providers'

export default function BannedLayout({ children }: { children: React.ReactNode }) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>
}
