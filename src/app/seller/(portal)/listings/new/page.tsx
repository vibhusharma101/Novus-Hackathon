import { redirect } from 'next/navigation'
import { sellerAuth } from '@/lib/seller-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateListingForm } from '@/components/seller/create-listing-form'
import { COST_RANGE, PLASTIC_CATEGORIES } from '@/lib/epr/constants'
import type { PlasticCategory } from '@/lib/epr/constants'

export const dynamic = 'force-dynamic'

export type MarketStat = { floor: number; avg: number; count: number }

export default async function NewListingPage() {
  const session = await sellerAuth()
  if (!session) redirect('/seller/sign-in')

  const [{ data: recycler }, { data: active }] = await Promise.all([
    supabaseAdmin
      .from('recyclers')
      .select('company_name, state, verified')
      .eq('id', session.recyclerId)
      .single(),
    supabaseAdmin
      .from('listings')
      .select('category, price_per_kg')
      .eq('status', 'active'),
  ])

  if (!recycler) redirect('/seller/sign-in')

  const stats = {} as Record<PlasticCategory, MarketStat>
  for (const cat of PLASTIC_CATEGORIES) {
    const prices = (active ?? [])
      .filter(l => l.category === cat)
      .map(l => Number(l.price_per_kg))
    if (prices.length > 0) {
      const floor = Math.min(...prices)
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length
      stats[cat] = { floor, avg, count: prices.length }
    } else {
      const mid = (COST_RANGE[cat].min + COST_RANGE[cat].max) / 2
      stats[cat] = { floor: COST_RANGE[cat].min, avg: mid, count: 0 }
    }
  }

  return (
    <CreateListingForm
      companyName={recycler.company_name}
      state={recycler.state}
      verified={recycler.verified}
      marketStats={stats}
    />
  )
}
