/**
 * Kaspi Pay adapter — mock implementation for Phase 9.
 * Real API integration deferred to Phase 9b/10.
 */

export interface KaspiInvoiceResult {
  invoiceId: string
  status: 'created' | 'error'
}

export async function createKaspiInvoice(
  phone: string,
  amount: number,
  bookingId: string,
  tenantKeys: { kaspiMerchantId?: string | null; kaspiApiKey?: string | null }
): Promise<KaspiInvoiceResult> {
  // Phase 9: mock implementation — logs intent, returns synthetic invoiceId
  console.log(`[Kaspi Mock] Would create invoice: phone=${phone} amount=${amount} bookingId=${bookingId}`)
  return { invoiceId: `mock-inv-${bookingId}`, status: 'created' }
}

export function verifyKaspiWebhook(payload: { rawBody: string; signature: string }): boolean {
  // Phase 9: mock — accepts all webhooks (no real signature check)
  // Phase 9b: real HMAC-SHA256 verification against KASPI_WEBHOOK_SECRET
  console.log('[Kaspi Mock] Webhook received, skipping signature verification')
  return true
}
