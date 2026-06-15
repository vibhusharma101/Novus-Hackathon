import { redirect } from 'next/navigation'
import { sellerAuth } from '@/lib/seller-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { SellerVault } from '@/components/seller/seller-vault'
import type { Listing, Order } from '@/lib/db/types'

export const dynamic = 'force-dynamic'

export default async function SellerVaultPage() {
  const session = await sellerAuth()
  if (!session) redirect('/seller/sign-in')

  const [{ data: recycler }, { data: listings }, { data: orders }] = await Promise.all([
    supabaseAdmin
      .from('recyclers')
      .select('id, company_name, cpcb_reg_no, verified')
      .eq('id', session.recyclerId)
      .single(),
    supabaseAdmin
      .from('listings')
      .select('*')
      .eq('recycler_id', session.recyclerId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('orders')
      .select('*')
      .eq('recycler_id', session.recyclerId)
      .order('created_at', { ascending: false }),
  ])

  if (!recycler) redirect('/seller/sign-in')

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
