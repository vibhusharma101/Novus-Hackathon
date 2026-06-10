'use server'

import { auth } from '@clerk/nextjs/server'
import { createUserClient } from '@/lib/supabase'
import { buyerProfileSchema, type BuyerProfileInput } from '@/lib/validators/buyer'

export type CreateBrandResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Creates the buyer's `brands` profile row.
 * Security: re-validates input server-side, derives clerk_user_id from the
 * authenticated session (never from the client), and writes under RLS so the
 * row's clerk_user_id must match the JWT subject.
 */
export async function createBrandProfile(input: BuyerProfileInput): Promise<CreateBrandResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'You must be signed in to continue.' }

  // Never trust the client — validate again on the server.
  const parsed = buyerProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data.' }
  }

  const supabase = await createUserClient()
  const { error } = await supabase.from('brands').insert({
    clerk_user_id: userId,
    ...parsed.data,
  })

  if (error) {
    // 23505 = unique_violation. Distinguish which constraint tripped.
    if (error.code === '23505') {
      if (error.message.includes('gstin')) {
        return { ok: false, error: 'This GSTIN is already registered to another account.' }
      }
      // clerk_user_id collision = this user already onboarded; treat as success.
      return { ok: true }
    }
    return { ok: false, error: 'Could not create your profile. Please try again.' }
  }

  return { ok: true }
}
