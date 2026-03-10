import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OmniBook',
  description: 'Universal multi-tenant booking platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
