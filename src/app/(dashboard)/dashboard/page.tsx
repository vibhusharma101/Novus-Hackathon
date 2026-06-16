import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createUserClient } from '@/lib/supabase'
import { ComplianceDashboard } from '@/components/dashboard/compliance-overview'
import type { PlasticCategory } from '@/lib/epr/constants'

export const metadata: Metadata = {
  title: 'Compliance Dashboard | Recyclink',
  description: 'Monitor your EPR compliance status and credit deficit.',
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = await createUserClient()

  const [{ data: brand }, { data: liabilities }, { data: orders }] = await Promise.all([
    supabase.from('brands').select('company_name').maybeSingle(),
    supabase.from('liabilities').select('category, liability_kg'),
    supabase.from('orders').select('qty_kg, category').eq('status', 'transferred'),
  ])

  const creditsSecured = (orders ?? []).reduce((sum, o) => sum + Number(o.qty_kg), 0)
  const creditsByCategory = (orders ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.category] = (acc[o.category] ?? 0) + Number(o.qty_kg)
    return acc
  }, {})

  const rows = (liabilities ?? []) as { category: PlasticCategory; liability_kg: number }[]

  // Days remaining until June 30 (EPR annual return deadline)
  const now = new Date()
  const deadline = new Date(now.getFullYear(), 5, 30) // June = month index 5
  if (deadline < now) deadline.setFullYear(deadline.getFullYear() + 1)
  const daysRemaining = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <ComplianceDashboard
      companyName={brand?.company_name ?? 'Buyer'}
      liabilities={rows}
      creditsSecured={creditsSecured}
      creditsByCategory={creditsByCategory}
      daysRemaining={daysRemaining}
    />
  )
}
