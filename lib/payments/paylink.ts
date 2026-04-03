/**
 * Paylink.kz payment adapter.
 * Docs: https://paylink.kz/docs (merchant API)
 *
 * Flow:
 *   1. createPaylinkPayment() → returns { orderId, paymentUrl }
 *   2. Redirect user to paymentUrl
 *   3. Paylink POSTs webhook to /api/webhooks/paylink on payment
 *   4. verifyPaylinkWebhook() → validates signature
 */

export interface PaylinkPaymentResult {
  orderId: string
  paymentUrl: string
}

export interface PaylinkWebhookPayload {
  orderId: string
  status: 'PAID' | 'FAILED' | 'CANCELLED'
  amount: number
  signature: string
}

/**
 * Create a Paylink.kz payment link for a subscription purchase.
 * @param orderId    Internal payment ID (PlatformPayment.id)
 * @param amount     Amount in KZT (tenge, not tiyn)
 * @param description Human-readable description e.g. "Подписка PRO - omni-book"
 * @param backUrl    URL to redirect user after payment (success/cancel)
 */
export async function createPaylinkPayment(
  orderId: string,
  amount: number,
  description: string,
  backUrl: string
): Promise<PaylinkPaymentResult> {
  const apiKey = process.env.PAYLINK_API_KEY
  const apiUrl = process.env.PAYLINK_API_URL ?? 'https://api.paylink.kz'

  if (!apiKey) {
    // Fallback for local dev without credentials
    console.warn('[Paylink] PAYLINK_API_KEY not set — using mock payment URL')
    return {
      orderId,
      paymentUrl: `${backUrl}?mock_payment=1&orderId=${orderId}`,
    }
  }

  const response = await fetch(`${apiUrl}/v1/payments/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      amount,
      currency: 'KZT',
      description,
      back_url: backUrl,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paylink`,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[Paylink] API error ${response.status}: ${errorText}`)
    throw new Error(`Paylink API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    orderId: data.order_id ?? orderId,
    paymentUrl: data.payment_url,
  }
}

/**
 * Verify a Paylink.kz webhook signature.
 * Paylink typically signs with HMAC-SHA256 of the request body using the webhook secret.
 */
export function verifyPaylinkWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYLINK_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[Paylink] PAYLINK_WEBHOOK_SECRET not set — skipping signature verification in dev')
    return true
  }
  // HMAC-SHA256 verification
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return signature === expectedSignature
}
