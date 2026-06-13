import { streamText, convertToModelMessages, validateUIMessages, type UIMessage } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { createUserClient, supabaseAdmin } from '@/lib/supabase'
import { model } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import type { PlasticCategory } from '@/lib/epr/constants'

export const maxDuration = 30

const CAT_LABELS: Record<PlasticCategory, string> = {
  rigid: 'Rigid Plastic', flexible: 'Flexible Packaging', mlp: 'Multi-Layered Plastic',
}

const intl = new Intl.NumberFormat('en-IN')

// Seller-controlled fields (company_name, state) are interpolated into the system
// prompt. Strip newlines and the [[ ]] marker brackets so a malicious value can't
// break out of its data line or inject a fake buy-button marker. Defense in depth.
const sanitize = (s: string) => s.replace(/[\r\n[\]]/g, ' ').slice(0, 120)

/**
 * Grounded EPR-compliance copilot. Injects the authenticated buyer's liability
 * profile + the live active-listings market into the system prompt so the model
 * recommends specific, real listings. No tools, no writes — advice only.
 */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (!(await checkRateLimit(userId))) {
    return new Response('Too many requests. Please slow down.', { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const raw = (body as { messages?: unknown })?.messages
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 40) {
    return new Response('Bad Request', { status: 400 })
  }

  let messages: UIMessage[]
  try {
    messages = await validateUIMessages({ messages: raw })
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // ── Ground the model in the buyer's own data + the live market ──
  const supabase = await createUserClient()

  const [{ data: brand }, { data: liabilities }] = await Promise.all([
    supabase.from('brands').select('company_name').maybeSingle(),
    supabase.from('liabilities').select('category, liability_kg'),
  ])

  // Active listings with recycler names (admin join — same as the exchange page).
  const { data: listings } = await supabaseAdmin
    .from('listings')
    .select('id, category, qty_kg, price_per_kg, recycler:recyclers(company_name, state)')
    .eq('status', 'active')
    .order('price_per_kg', { ascending: true })
    .limit(24)

  const liabilityLines = (liabilities ?? [])
    .map(l => `- ${CAT_LABELS[l.category as PlasticCategory]}: ${intl.format(Math.round(Number(l.liability_kg)))} kg required`)
    .join('\n') || '- No liability calculated yet (the buyer should run the calculator).'

  const listingLines = (listings ?? [])
    .map((l) => {
      // Supabase types an embedded to-one relation as an array; it's a single row.
      const rel = l.recycler as unknown as { company_name: string; state: string } | { company_name: string; state: string }[] | null
      const r = Array.isArray(rel) ? rel[0] : rel
      return `- id=${l.id} | ${CAT_LABELS[l.category as PlasticCategory]} | ${intl.format(Math.round(Number(l.qty_kg)))} kg | ₹${Number(l.price_per_kg).toFixed(2)}/kg | ${sanitize(r?.company_name ?? 'Unknown')} (${sanitize(r?.state ?? '—')})`
    })
    .join('\n') || '- No active listings in the market right now.'

  const system = [
    `You are the EPRx Copilot, an assistant for ${brand?.company_name ?? 'a buyer'} on an Indian EPR (Extended Producer Responsibility) plastic-credit marketplace.`,
    `Your job: help the buyer close their EPR compliance deficit by recommending specific, real listings from the live market below. Be concise and practical.`,
    ``,
    `BUYER LIABILITY (credits they must acquire, by category):`,
    liabilityLines,
    ``,
    `LIVE ACTIVE LISTINGS (cheapest first):`,
    listingLines,
    ``,
    `RULES:`,
    `- Only recommend listings that appear in the list above. Never invent listings, prices, or recyclers.`,
    `- Prefer the cheapest listings that match the buyer's deficit categories.`,
    `- When you recommend a specific listing, append the marker [[buy:<id>]] using that listing's id so the UI can render a checkout button. Example: "Green Circle has 8,000 kg of rigid at ₹12.40/kg. [[buy:abc-123]]"`,
    `- If the buyer has no liability calculated, suggest they run the Calculator first.`,
    `- Stay on the topic of EPR compliance and this marketplace. Keep answers under ~120 words unless asked for detail.`,
    `- Use ₹ and kg. Do not give legal guarantees.`,
  ].join('\n')

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 800,
  })

  return result.toUIMessageStreamResponse()
}
