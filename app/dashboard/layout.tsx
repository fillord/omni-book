export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      {/* TODO: sidebar */}
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
