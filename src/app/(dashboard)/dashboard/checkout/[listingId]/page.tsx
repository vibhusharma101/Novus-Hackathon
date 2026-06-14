import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin, createUserClient } from '@/lib/supabase'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import type { Listing, PublicRecycler } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { listingId } = await params

  // Fetch listing + recycler via admin (authoritative active-status check)
  const { data: raw } = await supabaseAdmin
    .from('listings')
    .select('*, recycler:recyclers(id, company_name, state, cpcb_reg_no, capacity_mt, verified)')
    .eq('id', listingId)
    .eq('status', 'active')
    .single()

  if (!raw) redirect('/dashboard/exchange')

  const listing = raw as Listing
  const recycler = (raw.recycler as PublicRecycler | null) ?? null

  // Fetch buyer's brand for GSTIN display
  let brand: { company_name: string; gstin: string } | null = null
  let defaultQtyKg = listing.qty_kg

  try {
    const supabase = await createUserClient()
    const [{ data: brandRow }, { data: liabilityRow }] = await Promise.all([
      supabase.from('brands').select('company_name, gstin').single(),
      supabase
        .from('liabilities')
        .select('liability_kg')
        .eq('category', listing.category)
        .maybeSingle(),
    ])

    brand = brandRow ?? null
    if (liabilityRow?.liability_kg) {
      defaultQtyKg = Math.min(liabilityRow.liability_kg, listing.qty_kg)
    }
  } catch {
    // No brand profile yet; show checkout with full listing qty as default
  }

  return (
    <CheckoutForm
      listing={listing}
      recycler={recycler}
      brand={brand}
      defaultQtyKg={defaultQtyKg}
    />
  )
}
