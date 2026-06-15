import { redirect } from 'next/navigation'
import { sellerAuth } from '@/lib/seller-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { OrderHandshake } from '@/components/seller/order-handshake'
import type { PlasticCategory } from '@/lib/epr/constants'

export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  recycler_id: string
  category: PlasticCategory
  qty_kg: number
  price_per_kg: number
  credits_cost: number
  platform_fee: number
  total: number
  buyer_gstin: string | null
  buyer_company_name: string | null
  status: string
  expires_at: string
  created_at: string
}

export default async function OrderHandshakePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await sellerAuth()
  if (!session) redirect('/seller/sign-in')

  const { id: orderId } = await params

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(
      'id, recycler_id, category, qty_kg, price_per_kg, credits_cost, platform_fee, total, buyer_gstin, buyer_company_name, status, expires_at, created_at',
    )
    .eq('id', orderId)
    .eq('recycler_id', session.recyclerId)
    .maybeSingle<OrderRow>()

  if (!order) redirect('/seller/vault')

  return (
    <OrderHandshake
      order={{
        id: order.id,
        category: order.category,
        qtyKg: Number(order.qty_kg),
        pricePerKg: Number(order.price_per_kg),
        creditsCost: Number(order.credits_cost),
        platformFee: Number(order.platform_fee),
        total: Number(order.total),
        buyerGstin: order.buyer_gstin,
        buyerCompanyName: order.buyer_company_name,
        status: order.status,
        expiresAt: order.expires_at,
      }}
    />
  )
}
