import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createUserClient } from '@/lib/supabase'
import { OrderCertificate } from '@/components/certificate/order-certificate'
import { provisionalCertificateId } from '@/lib/epr/certificate'
import type { PlasticCategory } from '@/lib/epr/constants'

export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  buyer_id: string
  category: PlasticCategory
  qty_kg: number
  created_at: string
  status: string
  recycler: { company_name: string; cpcb_reg_no: string; state: string } | null
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id: orderId } = await params

  const supabase = await createUserClient()

  // Resolve this buyer's brand first so we can prove ownership of the order.
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, gstin, state')
    .single()

  if (!brand) redirect('/onboarding/buyer')

  // Fetch the order joined to public recycler fields. RLS already restricts
  // visibility to the buyer/recycler; the explicit buyer_id filter ensures the
  // recycler (who can also read the row) cannot view the buyer's certificate.
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, category, qty_kg, created_at, status, recycler:recyclers(company_name, cpcb_reg_no, state)')
    .eq('id', orderId)
    .eq('buyer_id', brand.id)
    .maybeSingle<OrderRow>()

  if (!order) redirect('/dashboard/exchange')

  // Compliance impact: total liability target vs. acquired credits (this buyer).
  const [{ data: liabilities }, { data: orders }] = await Promise.all([
    supabase.from('liabilities').select('liability_kg'),
    supabase.from('orders').select('qty_kg, status').in('status', ['pending', 'transferred']),
  ])

  const targetKg   = (liabilities ?? []).reduce((s, r) => s + Number(r.liability_kg), 0)
  const acquiredKg = (orders ?? []).reduce((s, r) => s + Number(r.qty_kg), 0)
  const pct      = targetKg > 0 ? Math.min(100, Math.round((acquiredKg / targetKg) * 100)) : 0
  const deltaPct = targetKg > 0 ? Math.round((Number(order.qty_kg) / targetKg) * 100) : 0

  const referenceId = provisionalCertificateId(order.category, new Date(order.created_at), order.id)

  return (
    <OrderCertificate
      order={{
        id: order.id,
        category: order.category,
        qty_kg: Number(order.qty_kg),
        created_at: order.created_at,
        status: order.status,
      }}
      recycler={order.recycler}
      brand={{ company_name: brand.company_name, gstin: brand.gstin, state: brand.state }}
      referenceId={referenceId}
      compliance={{ targetKg, acquiredKg, pct, deltaPct }}
    />
  )
}
