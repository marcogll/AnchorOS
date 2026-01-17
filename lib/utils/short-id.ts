/**
 * @description Generate collision-safe short ID for public booking references
 * @returns {Promise<string>} 6-character unique alphanumeric ID
 * @example const id = await generateShortId() // Returns "A1B2C3"
 * @audit BUSINESS RULE: Short IDs are public-facing, used in URLs and confirmations
 * @audit SECURITY: IDs are random but not cryptographically secure (public use only)
 * @audit Validate: Generated ID is unique across all existing bookings
 * @audit PERFORMANCE: PostgreSQL function handles collision detection efficiently
 * @audit PERFORMANCE: Maximum 5 retry attempts before throwing error
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function generateShortId(): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('generate_short_id')
  
  if (error) {
    throw new Error(`Failed to generate short_id: ${error.message}`)
  }
  
  return data as string
}
