'use server'

import { revalidatePath } from 'next/cache'
import { basePrisma } from '@/lib/db'
import { ensureSuperAdmin } from '@/lib/auth/guards'

export async function updateSubscriptionPlan(
  planId: string,
  data: {
    displayName?: string
    maxResources?: number
    priceMonthly?: number
    priceYearly?: number
    pricePerResource?: number
    features?: string[]
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureSuperAdmin()

    await basePrisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.maxResources !== undefined && { maxResources: data.maxResources }),
        ...(data.priceMonthly !== undefined && { priceMonthly: data.priceMonthly }),
        ...(data.priceYearly !== undefined && { priceYearly: data.priceYearly }),
        ...(data.pricePerResource !== undefined && { pricePerResource: data.pricePerResource }),
        ...(data.features !== undefined && { features: data.features }),
      },
    })

    revalidatePath('/admin/plans')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update plan' }
  }
}
