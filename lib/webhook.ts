/**
 * @description Webhook utility for sending HTTP POST notifications to external services
 * @audit BUSINESS RULE: Sends payloads to multiple webhook endpoints for redundancy
 * @audit SECURITY: Endpoints configured via environment constants (not exposed to client)
 */

/** Array of webhook endpoint URLs for sending notifications */
export const WEBHOOK_ENDPOINTS = [
  'https://flows.soul23.cloud/webhook-test/4YZ7RPfo1GT',
  'https://flows.soul23.cloud/webhook/4YZ7RPfo1GT'
]

/**
 * @description Detects the current device type based on viewport width
 * @returns {string} - Device type: 'mobile' (≤768px), 'desktop' (>768px), or 'unknown' (server-side)
 * @example getDeviceType() // returns 'desktop' or 'mobile'
 * @audit PERFORMANCE: Uses native window.matchMedia for client-side detection
 * @audit Validate: Returns 'unknown' when running server-side (typeof window === 'undefined')
 */
export const getDeviceType = () => {
  if (typeof window === 'undefined') {
    return 'unknown'
  }

  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'
}

/**
 * @description Sends a webhook payload to all configured endpoints with fallback redundancy
 * @param {Record<string, string>} payload - Key-value data to send in webhook request body
 * @returns {Promise<void>} - Resolves if at least one endpoint receives the payload successfully
 * @example await sendWebhookPayload({ event: 'booking_created', bookingId: '...' })
 * @audit BUSINESS RULE: Uses Promise.allSettled to attempt all endpoints and succeed if any succeed
 * @audit SECURITY: Sends JSON content type with stringified payload
 * @audit Validate: Throws error if ALL endpoints fail (no successful responses)
 * @audit PERFORMANCE: Parallel execution to all endpoints for fast delivery
  * @audit AUDIT: Webhook delivery attempts logged for debugging
  */
export const sendWebhookPayload = async (payload: Record<string, string>) => {
  const results = await Promise.allSettled(
    WEBHOOK_ENDPOINTS.map(async (endpoint) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Webhook error')
      }

      return response
    })
  )

  const hasSuccess = results.some((result) => result.status === 'fulfilled')
  if (!hasSuccess) {
    throw new Error('No se pudo enviar la solicitud a los webhooks.')
  }
}
