import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth/config'
import { StaffManager } from '@/components/staff-manager'

export default async function StaffPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.tenantId) redirect('/login')

  // Only OWNER / SUPERADMIN can access
  if (session.user.role !== 'OWNER' && session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <StaffManager />
    </div>
  )
}
