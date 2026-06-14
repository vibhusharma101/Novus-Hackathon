'use server'

import { auth } from '@clerk/nextjs/server'
import { createUserClient } from '@/lib/supabase'

export async function getPendoMetadata() {
  const { userId } = await auth()
  if (!userId) return null

  let supabase
  try {
    supabase = await createUserClient()
  } catch {
    // No valid auth token — return minimal metadata
    return { visitorId: userId }
  }

  // Try brand (buyer) profile first
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, gstin, contact_name, phone, email, state, created_at')
    .maybeSingle()

  if (brand) {
    return {
      visitorId: userId,
      contactName: brand.contact_name,
      email: brand.email,
      phone: brand.phone,
      whatsapp: null as string | null,
      accountId: brand.id,
      companyName: brand.company_name,
      gstin: brand.gstin,
      cpcbRegNo: null as string | null,
      state: brand.state,
      capacityMt: null as number | null,
      verified: null as boolean | null,
      createdAt: brand.created_at,
    }
  }

  // Try recycler (seller) profile
  const { data: recycler } = await supabase
    .from('recyclers')
    .select('id, company_name, cpcb_reg_no, state, capacity_mt, whatsapp, verified, created_at, contact_name')
    .maybeSingle()

  if (recycler) {
    return {
      visitorId: userId,
      contactName: recycler.contact_name,
      email: null as string | null,
      phone: null as string | null,
      whatsapp: recycler.whatsapp,
      accountId: recycler.id,
      companyName: recycler.company_name,
      gstin: null as string | null,
      cpcbRegNo: recycler.cpcb_reg_no,
      state: recycler.state,
      capacityMt: recycler.capacity_mt,
      verified: recycler.verified,
      createdAt: recycler.created_at,
    }
  }

  // Authenticated but no profile yet (pre-onboarding)
  return { visitorId: userId }
}
