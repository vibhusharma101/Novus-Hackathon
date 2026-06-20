import type { PlasticCategory, PlasticSubcategory } from '@/lib/epr/constants'

export type OrderStatus = 'pending' | 'transferred' | 'declined' | 'expired'
export type ListingStatus = 'active' | 'partial' | 'sold'

export interface Brand {
  id: string
  clerk_user_id: string
  company_name: string
  gstin: string
  contact_name: string
  phone: string
  email: string
  state: string
  created_at: string
}

export interface Recycler {
  id: string
  clerk_user_id: string
  company_name: string
  cpcb_reg_no: string
  state: string
  capacity_mt: number
  whatsapp: string
  doc_url: string | null
  verified: boolean
  created_at: string
}

export interface PublicRecycler {
  id: string
  company_name: string
  state: string
  cpcb_reg_no: string
  capacity_mt: number
  verified: boolean
}

export interface Liability {
  id: string
  brand_id: string
  category: PlasticCategory
  subcategory: PlasticSubcategory
  market_kg: number
  target_pct: number
  liability_kg: number
}

export interface Listing {
  id: string
  recycler_id: string
  category: PlasticCategory
  subcategory: PlasticSubcategory | null
  credit_type: 'recycling' | 'eol'
  qty_kg: number
  price_per_kg: number
  status: ListingStatus
  created_at: string
  // joined from public_recyclers when fetching order book
  recycler?: PublicRecycler
}

export interface Order {
  id: string
  buyer_id: string
  recycler_id: string
  listing_id: string
  category: PlasticCategory
  subcategory: PlasticSubcategory | null
  qty_kg: number
  price_per_kg: number
  credits_cost: number
  platform_fee: number
  total: number
  // Denormalized from brands at order time so the recycler can display buyer
  // identity + GSTIN without reading the buyer's RLS-protected brands row.
  buyer_gstin: string | null
  buyer_company_name: string | null
  status: OrderStatus
  expires_at: string
  created_at: string
}

export interface Certificate {
  id: string
  order_id: string
  reference_id: string
  issued_at: string
}
