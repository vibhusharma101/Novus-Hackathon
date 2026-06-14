'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Singleton browser client for realtime subscriptions in client components.
// Call getSupabaseBrowserClient() inside useEffect or event handlers, not at module level.
export function getSupabaseBrowserClient(token: string | null) {
  if (client) return client
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    }
  )
  return client
}
