import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { createSellerSession } from '@/lib/seller-auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const { data: cred } = await supabaseAdmin
    .from('seller_credentials')
    .select('recycler_id, password_hash, recyclers(company_name)')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!cred) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, cred.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const companyName = (cred.recyclers as unknown as { company_name: string } | null)?.company_name ?? 'Seller'

  await createSellerSession({ recyclerId: cred.recycler_id, companyName })

  return NextResponse.json({ ok: true })
}
