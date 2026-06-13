import { streamText } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { model } from '@/lib/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().max(32_000),
    })
  ).min(1).max(50),
})

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (!(await checkRateLimit(userId))) {
    return new Response('Too many requests. Please slow down.', { status: 429 })
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) return new Response('Bad Request', { status: 400 })

  const result = streamText({
    model,
    system: 'You are a helpful assistant.',
    messages: parsed.data.messages,
  })

  return result.toUIMessageStreamResponse()
}
