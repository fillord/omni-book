import { AdminThemeProvider } from '@/components/theme-providers'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>
}
