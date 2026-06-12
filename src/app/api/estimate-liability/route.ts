import { generateObject } from 'ai'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { model } from '@/lib/ai'

export const maxDuration = 30

const bodySchema = z.object({
  description: z.string().trim().min(3).max(2000),
})

// What the model returns: estimated annual plastic *placed on the market* (kg)
// per EPR category — this is the market_kg the calculator's weight step collects.
const estimateSchema = z.object({
  rigid_kg: z.number().describe('Estimated annual RIGID plastic packaging (HDPE/PET/PP bottles, containers) placed on the market, in kg. 0 if not applicable.'),
  flexible_kg: z.number().describe('Estimated annual FLEXIBLE packaging (films, pouches, wrappers) placed on the market, in kg. 0 if not applicable.'),
  mlp_kg: z.number().describe('Estimated annual MULTI-LAYERED PLASTIC (laminated/composite packaging) placed on the market, in kg. 0 if not applicable.'),
  rationale: z.string().describe('One concise sentence explaining the estimate and its key assumptions.'),
})

export type LiabilityEstimate = z.infer<typeof estimateSchema>

const SYSTEM = [
  'You estimate the annual quantity of plastic packaging (in kilograms) that an Indian producer/brand places on the market, broken down by EPR category, from a plain-English business description.',
  'Categories: RIGID (bottles, jars, rigid containers — HDPE/PET/PP), FLEXIBLE (films, pouches, sachets, wrappers — LDPE/LLDPE), MLP (multi-layered laminated packaging, e.g. chip bags, sachets with foil).',
  'Reason from the stated product types, units sold, and packaging. Be realistic and conservative; round to sensible figures. If a category clearly does not apply, return 0 for it.',
  'These are planning estimates, not legal advice.',
].join(' ')

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  let parsed: { description: string }
  try {
    const json = await request.json()
    const result = bodySchema.safeParse(json)
    if (!result.success) return new Response('Bad Request', { status: 400 })
    parsed = result.data
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  try {
    const { object } = await generateObject({
      model,
      schema: estimateSchema,
      system: SYSTEM,
      prompt: parsed.description,
    })

    // Clamp negatives defensively — the model shouldn't, but never trust output.
    return Response.json({
      rigid_kg: Math.max(0, Math.round(object.rigid_kg)),
      flexible_kg: Math.max(0, Math.round(object.flexible_kg)),
      mlp_kg: Math.max(0, Math.round(object.mlp_kg)),
      rationale: object.rationale,
    })
  } catch {
    return new Response('Estimation failed', { status: 502 })
  }
}
