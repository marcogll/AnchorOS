import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * generateShortId function that generates a unique short ID using Supabase RPC.
 */
export async function generateShortId(): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('generate_short_id')
  
  if (error) {
    throw new Error(`Failed to generate short_id: ${error.message}`)
  }
  
  return data as string
}
