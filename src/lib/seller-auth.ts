import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.SELLER_SESSION_SECRET ?? 'eprx-seller-dev-secret-change-in-prod'
)
const COOKIE = 'seller_session'
const TTL = 60 * 60 * 24 * 7 // 7 days

export type SellerSession = {
  recyclerId: string
  companyName: string
}

export async function createSellerSession(session: SellerSession) {
  const token = await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${TTL}s`)
    .sign(SECRET)

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TTL,
    path: '/',
  })
}

export async function sellerAuth(): Promise<SellerSession | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SellerSession
  } catch {
    return null
  }
}

export async function clearSellerSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
