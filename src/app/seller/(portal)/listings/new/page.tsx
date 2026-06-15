import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createUserClient } from '@/lib/supabase'
import { CreateListingForm } from '@/components/seller/create-listing-form'
import { COST_RANGE, PLASTIC_CATEGORIES } from '@/lib/epr/constants'
import type { PlasticCategory } from '@/lib/epr/constants'

export const dynamic = 'force-dynamic'

export type MarketStat = { floor: number; avg: number; count: number }

export default async function NewListingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createUserClient()

  // Own recycler — for the buyer-view preview (location + verified badge).
  const { data: recycler } = await supabase
    .from('recyclers')
    .select('company_name, state, verified')
    .single()

  if (!recycler) redirect('/onboarding/seller')

  // Live active listings drive the pricing assistant. "listings: read active"
  // RLS lets any authed user read active listings across recyclers.
  const { data: active } = await supabase
    .from('listings')
    .select('category, price_per_kg')
    .eq('status', 'active')

  // Per-category floor (min) + average. Fall back to COST_RANGE midpoint when a
  // category has no active listings yet, so the assistant always has a benchmark.
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
