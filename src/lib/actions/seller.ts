'use server'

import { auth } from '@clerk/nextjs/server'
import { createUserClient } from '@/lib/supabase'
import { sellerProfileSchema, type SellerProfileInput } from '@/lib/validators/seller'
import { listingSchema, type ListingInput } from '@/lib/validators/listing'

export type CreateRecyclerResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Creates the seller's `recyclers` profile row.
 *
 * Security: re-validates input server-side, derives clerk_user_id from the
 * authenticated session (never from the client), and writes under RLS so the
 * row's clerk_user_id must match the JWT subject.
 *
 * `verified` is set true to simulate CPCB document verification for the demo —
 * this is intentional and happens server-side only (the client cannot set it).
 */
export async function createRecyclerProfile(
  input: SellerProfileInput,
): Promise<CreateRecyclerResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'You must be signed in to continue.' }

  // Never trust the client — validate again on the server.
  const parsed = sellerProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data.' }
  }

  const supabase = await createUserClient()
  const { error } = await supabase.from('recyclers').insert({
    clerk_user_id: userId,
    company_name: parsed.data.company_name,
    cpcb_reg_no: parsed.data.cpcb_reg_no,
    state: parsed.data.state,
    capacity_mt: parsed.data.capacity_mt,
    contact_name: parsed.data.contact_name,
    whatsapp: parsed.data.whatsapp,
    verified: true, // simulated CPCB verification (demo)
  })

  if (error) {
    // 23505 = unique_violation. Distinguish which constraint tripped.
    if (error.code === '23505') {
      if (error.message.includes('cpcb_reg_no')) {
        return { ok: false, error: 'This CPCB registration number is already registered.' }
      }
      // clerk_user_id collision = this user already onboarded; treat as success.
      return { ok: true }
    }
    return { ok: false, error: 'Could not create your facility profile. Please try again.' }
  }

  return { ok: true }
}

// ─── createListing ────────────────────────────────────────────────────────────

export type CreateListingResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string }

/**
 * Publishes a new credit listing for the authenticated recycler.
 *
 * Security: re-validates server-side, derives recycler_id from an RLS-scoped
 * query (never from client input), and inserts under the "listings: recycler
 * writes" policy. The insert is what broadcasts to buyer order books via the
 * `listings` realtime publication.
 */
export async function createListing(input: ListingInput): Promise<CreateListingResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'You must be signed in to continue.' }

  // Never trust the client — validate again on the server.
  const parsed = listingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid listing data.' }
  }

  const supabase = await createUserClient()

  // Derive recycler_id from RLS-scoped query — never from client input.
  const { data: recycler } = await supabase
    .from('recyclers')
    .select('id')
    .single()

  if (!recycler) {
    return { ok: false, error: 'Recycler profile not found. Please complete onboarding first.' }
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      recycler_id:  recycler.id,
      category:     parsed.data.category,
      qty_kg:       parsed.data.qty_kg,
      price_per_kg: parsed.data.price_per_kg,
      status:       'active',
    })
    .select('id')
    .single()

  if (error || !listing) {
    return { ok: false, error: 'Could not publish your listing. Please try again.' }
  }

  return { ok: true, listingId: listing.id }
}
