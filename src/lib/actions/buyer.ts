'use server'

import { auth } from '@clerk/nextjs/server'
import { createUserClient, supabaseAdmin } from '@/lib/supabase'
import { buyerProfileSchema, type BuyerProfileInput } from '@/lib/validators/buyer'
import { calculateLiability } from '@/lib/epr/liability'
import { TARGET_PCT, PLASTIC_CATEGORIES, PLATFORM_FEE_PCT, ORDER_EXPIRY_HOURS } from '@/lib/epr/constants'
import type { PlasticCategory } from '@/lib/epr/constants'

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

// ─── saveLiabilities ──────────────────────────────────────────────────────────

export type SaveLiabilitiesResult = { ok: true } | { ok: false; error: string }

export async function saveLiabilities(
  items: { category: PlasticCategory; market_kg: number }[]
): Promise<SaveLiabilitiesResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'You must be signed in.' }

  // Server-side validation — never trust the client
  if (!items.length || items.length > PLASTIC_CATEGORIES.length) {
    return { ok: false, error: 'Invalid liability data.' }
  }
  for (const item of items) {
    if (!PLASTIC_CATEGORIES.includes(item.category) || item.market_kg <= 0) {
      return { ok: false, error: 'Invalid liability data.' }
    }
  }

  const supabase = await createUserClient()

  // RLS returns only this user's brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .single()

  if (brandError || !brand) {
    return { ok: false, error: 'Brand profile not found. Please complete onboarding first.' }
  }

  const rows = items.map(item => ({
    brand_id: brand.id,
    category: item.category,
    market_kg: item.market_kg,
    target_pct: TARGET_PCT[item.category],
    liability_kg: calculateLiability(item.category, item.market_kg),
  }))

  const { error } = await supabase
    .from('liabilities')
    .upsert(rows, { onConflict: 'brand_id,category' })

  if (error) return { ok: false, error: 'Could not save liabilities. Please try again.' }

  return { ok: true }
}

// ─── placeOrder ───────────────────────────────────────────────────────────────

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string }

export async function placeOrder(input: {
  listingId: string
  qty_kg: number
}): Promise<PlaceOrderResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'You must be signed in.' }

  const { listingId, qty_kg } = input

  // Server-side validation — never trust the client
  if (typeof listingId !== 'string' || listingId.length < 32) {
    return { ok: false, error: 'Invalid listing reference.' }
  }
  if (!Number.isFinite(qty_kg) || qty_kg <= 0) {
    return { ok: false, error: 'Quantity must be greater than 0.' }
  }

  const supabase = await createUserClient().catch(() => null)
  if (!supabase) return { ok: false, error: 'Session expired. Please refresh the page and try again.' }

  // Derive buyer_id from RLS-scoped query — never from client input
  const { data: brand } = await supabase
    .from('brands')
    .select('id, gstin, company_name')
    .single()

  if (!brand) return { ok: false, error: 'Brand profile not found. Please complete onboarding first.' }

  // Verify listing is still active (admin to bypass RLS and get authoritative state)
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('id, recycler_id, category, qty_kg, price_per_kg, status')
    .eq('id', listingId)
    .eq('status', 'active')
    .single()

  if (!listing) return { ok: false, error: 'This listing is no longer available.' }

  if (qty_kg > listing.qty_kg) {
    return { ok: false, error: `Quantity exceeds available volume (${listing.qty_kg} kg).` }
  }

  const credits_cost = parseFloat((listing.price_per_kg * qty_kg).toFixed(2))
  const platform_fee = parseFloat((credits_cost * PLATFORM_FEE_PCT).toFixed(2))
  const total        = parseFloat((credits_cost + platform_fee).toFixed(2))
  const expires_at   = new Date(Date.now() + ORDER_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

  // Insert under RLS — policy checks buyer_id belongs to the authenticated user
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      buyer_id:     brand.id,
      recycler_id:  listing.recycler_id,
      listing_id:   listing.id,
      category:     listing.category,
      qty_kg,
      price_per_kg: listing.price_per_kg,
      credits_cost,
      platform_fee,
      total,
      buyer_gstin:        brand.gstin,
      buyer_company_name: brand.company_name,
      status:       'pending',
      expires_at,
    })
    .select('id')
    .single()

  if (error || !order) {
    console.error('[placeOrder] Supabase insert failed:', error)
    return { ok: false, error: 'Could not place order. Please try again.' }
  }

  return { ok: true, orderId: order.id }
}
