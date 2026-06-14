'use server'

import { auth } from '@clerk/nextjs/server'
import { createUserClient } from '@/lib/supabase'

export async function getPendoProfile() {
  const { userId } = await auth()
  if (!userId) return null

  let supabase
  try {
    supabase = await createUserClient()
  } catch {
    // Token may not be available yet (e.g. during initial sign-up)
    return { clerkUserId: userId }
  }

  // Try buyer (brand) profile
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, contact_name, email, phone, state, gstin, created_at')
    .maybeSingle()

  if (brand) {
    return {
      clerkUserId: userId,
      contactName: brand.contact_name as string | undefined,
      email: brand.email as string | undefined,
      phone: brand.phone as string | undefined,
      state: brand.state as string | undefined,
      createdAt: brand.created_at as string | undefined,
      accountId: brand.id as string,
      companyName: brand.company_name as string | undefined,
      gstin: brand.gstin as string | undefined,
    }
  }

  // Try seller (recycler) profile
  const { data: recycler } = await supabase
    .from('recyclers')
    .select('id, company_name, contact_name, state, cpcb_reg_no, capacity_mt, verified, created_at')
    .maybeSingle()

  if (recycler) {
    return {
      clerkUserId: userId,
      contactName: recycler.contact_name as string | undefined,
      state: recycler.state as string | undefined,
      createdAt: recycler.created_at as string | undefined,
      accountId: recycler.id as string,
      companyName: recycler.company_name as string | undefined,
      cpcbRegNo: recycler.cpcb_reg_no as string | undefined,
      capacityMt: recycler.capacity_mt as number | undefined,
      verified: recycler.verified as boolean | undefined,
    }
  }

  // Authenticated but not onboarded yet
  return { clerkUserId: userId }
}
