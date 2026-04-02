import { basePrisma } from '@/lib/db'
import { PlanEditorClient } from './plan-editor-client'

export default async function AdminPlansPage() {
  const plans = await basePrisma.subscriptionPlan.findMany({
    orderBy: { plan: 'asc' },
  })

  // Serialize dates to ISO strings for client component
  const serializedPlans = plans.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Тарифы</h1>
      <PlanEditorClient plans={serializedPlans} />
    </div>
  )
}
