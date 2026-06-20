'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { sellerProfileSchema, type SellerProfileInput } from '@/lib/validators/seller'
import { listingSchema, type ListingInput } from '@/lib/validators/listing'
import { provisionalCertificateId } from '@/lib/epr/certificate'
import { sellerAuth } from '@/lib/seller-auth'
import type { PlasticCategory } from '@/lib/epr/constants'

export type CreateRecyclerResult =
  | { ok: true }
  | { ok: false; error: string }

export async function createRecyclerProfile(
  input: SellerProfileInput,
): Promise<CreateRecyclerResult> {
  const session = await sellerAuth()
  if (!session) return { ok: false, error: 'You must be signed in to continue.' }

  const parsed = sellerProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data.' }
  }

  const { error } = await supabaseAdmin.from('recyclers').update({
    company_name: parsed.data.company_name,
    cpcb_reg_no: parsed.data.cpcb_reg_no,
    state: parsed.data.state,
    capacity_mt: parsed.data.capacity_mt,
    contact_name: parsed.data.contact_name,
    whatsapp: parsed.data.whatsapp,
    verified: true,
  }).eq('id', session.recyclerId)

  if (error) {
    if (error.code === '23505') return { ok: true }
    return { ok: false, error: 'Could not create your facility profile. Please try again.' }
  }

  return { ok: true }
}

// ─── createListing ────────────────────────────────────────────────────────────

export type CreateListingResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string }

export async function createListing(input: ListingInput): Promise<CreateListingResult> {
  const session = await sellerAuth()
  if (!session) return { ok: false, error: 'You must be signed in to continue.' }

  const parsed = listingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid listing data.' }
  }

  const { data: listing, error } = await supabaseAdmin
    .from('listings')
    .insert({
      recycler_id:  session.recyclerId,
      category:     parsed.data.category,
      subcategory:  parsed.data.subcategory ?? 'recycling',
      qty_kg:       parsed.data.qty_kg,
      price_per_kg: parsed.data.price_per_kg,
      credit_type:  parsed.data.credit_type ?? 'recycling',
      status:       'active',
    })
    .select('id')
    .single()

  if (error || !listing) {
    return { ok: false, error: 'Could not publish your listing. Please try again.' }
  }

  return { ok: true, listingId: listing.id }
}

// ─── respondToOrder ───────────────────────────────────────────────────────────

export type RespondOrderResult =
  | { ok: true; status: 'transferred' | 'declined' }
  | { ok: false; error: string }

export async function respondToOrder(input: {
  orderId: string
  action: 'accept' | 'decline'
}): Promise<RespondOrderResult> {
  const session = await sellerAuth()
  if (!session) return { ok: false, error: 'You must be signed in.' }

  const { orderId, action } = input
  if (typeof orderId !== 'string' || orderId.length < 32) {
    return { ok: false, error: 'Invalid order reference.' }
  }
  if (action !== 'accept' && action !== 'decline') {
    return { ok: false, error: 'Invalid action.' }
  }

  // Confirm the order belongs to this recycler before touching it.
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, recycler_id, status, category, created_at, expires_at')
    .eq('id', orderId)
    .maybeSingle<{
      id: string
      recycler_id: string
      status: string
      category: PlasticCategory
      created_at: string
      expires_at: string
    }>()

  if (!order || order.recycler_id !== session.recyclerId) {
    return { ok: false, error: 'Order not found.' }
  }
  if (order.status !== 'pending') {
    return { ok: false, error: 'This order has already been processed.' }
  }
  if (new Date(order.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'This order has expired and can no longer be accepted.' }
  }

  const newStatus = action === 'accept' ? 'transferred' : 'declined'

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (updateErr || !updated) {
    return { ok: false, error: 'Could not update the order. Please try again.' }
  }

  if (action === 'accept') {
    const referenceId = provisionalCertificateId(
      order.category,
      new Date(order.created_at),
      order.id,
    )
    const { error: certErr } = await supabaseAdmin
      .from('certificates')
      .insert({ order_id: order.id, reference_id: referenceId })

    if (certErr && certErr.code !== '23505') {
      return { ok: false, error: 'Order accepted, but the certificate could not be issued.' }
    }
  }

  return { ok: true, status: newStatus }
}
