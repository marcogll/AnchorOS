import { createClient } from '@supabase/supabase-js'

// Lazy initialization to ensure env vars are available at runtime
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('=== SUPABASE CLIENT INIT ===')
    console.log('SUPABASE_URL available:', !!supabaseUrl)
    console.log('SUPABASE_ANON_KEY available:', !!supabaseAnonKey)
    console.log('SUPABASE_URL value:', supabaseUrl)
    console.log('SUPABASE_ANON_KEY preview:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'null')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseAnonKey}`)
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

    console.log('Supabase client initialized successfully')
  }

  return supabaseInstance
}

// Public Supabase client for client-side operations
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient()
    return client[prop as keyof typeof client]
  }
})

export default supabase
