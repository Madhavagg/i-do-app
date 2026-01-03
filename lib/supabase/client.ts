import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build time when env vars aren't available
    // This prevents build errors - the real client is used at runtime
    return null as unknown as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
