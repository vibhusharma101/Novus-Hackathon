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
    return { visitorId: userId }
  }

  // Fetch both profiles in parallel — halves latency for sellers who have no brand row.
  const [{ data: brand }, { data: recycler }] = await Promise.all([
    supabase
      .from('brands')
      .select('id, company_name, gstin, state, buyer_type, created_at')
      .maybeSingle(),
    supabase
      .from('recyclers')
      .select('id, company_name, cpcb_reg_no, state, capacity_mt, verified, created_at')
      .maybeSingle(),
  ])

  if (brand) {
    return {
      visitorId: userId,
      accountId: brand.id,
      companyName: brand.company_name,
      gstin: brand.gstin,
      cpcbRegNo: null as string | null,
      state: brand.state,
      buyerType: brand.buyer_type as string | null,
      capacityMt: null as number | null,
      verified: null as boolean | null,
      createdAt: brand.created_at,
    }
  }

  if (recycler) {
    return {
      visitorId: userId,
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

  return { visitorId: userId }
}
