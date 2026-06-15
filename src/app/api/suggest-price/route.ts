import { generateObject } from 'ai'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { sellerAuth } from '@/lib/seller-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { model } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import { COST_RANGE } from '@/lib/epr/constants'
import type { PlasticCategory } from '@/lib/epr/constants'

export const maxDuration = 30

const CAT_LABELS: Record<PlasticCategory, string> = {
  rigid: 'Rigid Plastic', flexible: 'Flexible Packaging', mlp: 'Multi-Layered Plastic',
}

const bodySchema = z.object({
  category: z.enum(['rigid', 'flexible', 'mlp']),
  qty_kg: z.number().nonnegative().max(1_000_000).optional(),
})

const suggestionSchema = z.object({
  suggested_price_per_kg: z.number().describe('Recommended unit price per kg in INR.'),
  sell_speed: z.enum(['fast', 'moderate', 'slow']).describe('Expected sell-through speed at the recommended price.'),
  reasoning: z.string().describe('One or two concise sentences explaining the price vs the live market floor and average.'),
})

export type PriceSuggestion = z.infer<typeof suggestionSchema>

export async function POST(request: Request) {
  const { userId } = await auth()
  const sellerSession = await sellerAuth()
  const rateLimitKey = userId ?? (sellerSession ? `seller:${sellerSession.recyclerId}` : null)
  if (!rateLimitKey) return new Response('Unauthorized', { status: 401 })

  if (!(await checkRateLimit(rateLimitKey))) {
    return new Response('Too many requests. Please slow down.', { status: 429 })
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    const result = bodySchema.safeParse(await request.json())
    if (!result.success) return new Response('Bad Request', { status: 400 })
    parsed = result.data
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { category, qty_kg } = parsed

  const { data: active } = await supabaseAdmin
    .from('listings')
    .select('price_per_kg')
    .eq('status', 'active')
    .eq('category', category)

  const prices = (active ?? []).map(l => Number(l.price_per_kg))
  const hasMarket = prices.length > 0
  const floor = hasMarket ? Math.min(...prices) : COST_RANGE[category].min
  const avg = hasMarket
    ? prices.reduce((s, p) => s + p, 0) / prices.length
    : (COST_RANGE[category].min + COST_RANGE[category].max) / 2

  const marketBlock = hasMarket
    ? `There are ${prices.length} active ${CAT_LABELS[category]} listing(s). Current market floor ₹${floor.toFixed(2)}/kg, average ₹${avg.toFixed(2)}/kg.`
    : `There are no active ${CAT_LABELS[category]} listings yet. CPCB cost guidance for this category is ₹${COST_RANGE[category].min}–₹${COST_RANGE[category].max}/kg.`

  const system = [
    'You are a pricing advisor for a recycler listing EPR plastic credits on an Indian marketplace.',
    'Recommend a single competitive unit price (₹/kg) that balances revenue against sell-through speed.',
    'Pricing at or just below the market floor sells fast but earns less; pricing near/above the average earns more but sells slower.',
    'Base your recommendation only on the market data provided. Keep the reasoning to 1-2 sentences. Do not give legal or financial guarantees.',
  ].join(' ')

  const prompt = [
    `Category: ${CAT_LABELS[category]}.`,
    qty_kg && qty_kg > 0 ? `The seller wants to list ${Math.round(qty_kg)} kg.` : 'The seller has not entered a quantity yet.',
    marketBlock,
    'Recommend an optimal unit price (₹/kg), the expected sell speed, and a brief reason.',
  ].join(' ')

  try {
    const { object } = await generateObject({ model, schema: suggestionSchema, system, prompt })

    // Never trust output blindly — clamp to a sane band around the market.
    const lo = Math.max(0.01, floor * 0.5)
    const hi = Math.max(avg * 2, floor * 1.5, 1)
    const price = Math.min(hi, Math.max(lo, object.suggested_price_per_kg))

    return Response.json({
      suggested_price_per_kg: Math.round(price * 100) / 100,
      sell_speed: object.sell_speed,
      reasoning: object.reasoning,
    })
  } catch {
    return new Response('Suggestion failed', { status: 502 })
  }
}
