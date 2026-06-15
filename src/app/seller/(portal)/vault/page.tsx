import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createUserClient } from '@/lib/supabase'
import { SellerVault } from '@/components/seller/seller-vault'
import type { Listing, Order } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

export default async function SellerVaultPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createUserClient()

  // Own recycler row (public columns are enough for the vault header).
  const { data: recycler } = await supabase
    .from('recyclers')
    .select('id, company_name, cpcb_reg_no, verified')
    .single()

  if (!recycler) redirect('/onboarding/seller')

  // All own listings (any status — "listings: recycler reads own" policy) and all
  // own orders (RLS "orders: buyer or recycler"). Both scoped to this recycler.
  const [{ data: listings }, { data: orders }] = await Promise.all([
    supabase
      .from('listings')
      .select('*')
      .eq('recycler_id', recycler.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*')
      .eq('recycler_id', recycler.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <SellerVault
      recyclerId={recycler.id}
      companyName={recycler.company_name}
      cpcbRegNo={recycler.cpcb_reg_no}
      verified={recycler.verified}
      initialListings={(listings ?? []) as Listing[]}
      initialOrders={(orders ?? []) as Order[]}
    />
  )
}
