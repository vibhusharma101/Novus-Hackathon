import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Admin client — bypasses RLS. Use ONLY for background jobs or admin operations.
// Never use this for user-scoped data queries.
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// User-scoped server client — respects RLS. Use in server actions + route handlers.
// Uses native Clerk→Supabase auth (no JWT template needed).
export async function createUserClient() {
  const { getToken } = await auth()
  const token = await getToken()

  return createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  )
}
