'use server'

// TODO(12-04): updatePaymentSettings will be replaced with Paylink.kz settings action.
// Kaspi fields (kaspiMerchantId, kaspiApiKey) removed from Tenant model in Phase 12-01.

export async function updatePaymentSettings(_data: Record<string, string | undefined>) {
  return { error: 'Kaspi payment settings removed. Paylink.kz integration coming in Phase 12-03.' }
}
