import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin, createUserClient } from '@/lib/supabase'
import { OrderBook } from '@/components/exchange/order-book'
import type { ListingWithRecycler, DeficitRow } from '@/components/exchange/order-book'
import type { Listing, PublicRecycler } from '@/lib/db/types'
import type { PlasticCategory } from '@/lib/epr/constants'

export const dynamic = 'force-dynamic'

export default async function ExchangePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Fetch active listings with recycler join via admin (bypasses RLS for SSR join)
  const { data: rawListings } = await supabaseAdmin
    .from('listings')
    .select('*, recycler:recyclers(id, company_name, state, cpcb_reg_no, capacity_mt, verified)')
    .eq('status', 'active')
    .order('price_per_kg', { ascending: true })

  const listings: ListingWithRecycler[] = ((rawListings ?? []) as (Listing & { recycler: PublicRecycler | null })[]).map(
    ({ recycler, ...rest }) => ({
      ...rest,
      recycler: recycler ?? {
        id: rest.recycler_id,
        company_name: 'Unknown',
        state: '—',
        cpcb_reg_no: '—',
        capacity_mt: 0,
        verified: false,
      },
    })
  )

  // Fetch buyer liabilities for the deficit summary cards
  let liabilities: DeficitRow[] = []
  try {
    const supabase = await createUserClient()
    const { data: rawLiabilities } = await supabase
      .from('liabilities')
      .select('category, liability_kg')
    liabilities = ((rawLiabilities ?? []) as { category: PlasticCategory; liability_kg: number }[])
  } catch {
    // User may not have a brand profile yet; show zero deficits
  }

  return (
    <OrderBook initialListings={listings} liabilities={liabilities} />
  )
}
